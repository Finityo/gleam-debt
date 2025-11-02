import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus, Upload, AlertCircle, Download } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import * as XLSX from 'exceljs';
import { logError } from '@/utils/logger';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { DEMO } from "@/config/demo";

type Strategy = "snowball" | "avalanche";

interface DebtInput {
  id?: string;
  name: string;
  last4?: string;
  balance: number;
  minPayment: number;
  apr: number;
  dueDate?: string | null;
  debtType?: string;
  notes?: string;
}

interface DebtPlanRow {
  index: number;
  label: string;
  name: string;
  last4?: string;
  balance: number;
  minPayment: number;
  apr: number;
  monthlyRate: number;
  totalPayment: number;
  monthsToPayoff: number;
  cumulativeMonths: number;
  dueDate?: string | null;
}

interface MonthlySnapshot {
  month: number;
  debts: Array<{
    name: string;
    last4?: string;
    payment: number;
    interest: number;
    principal: number;
    endBalance: number;
  }>;
  snowballExtra: number;
  totalPaidThisMonth: number;
  totalRemaining: number;
}

interface ComputeResult {
  rows: DebtPlanRow[];
  totals: {
    numDebts: number;
    sumBalance: number;
    sumMinPayment: number;
    strategy: Strategy;
    extraMonthly: number;
    oneTime: number;
    totalMonths: number;
    debtFreeMonth?: number;
  };
  schedule?: MonthlySnapshot[];
  payoffOrder?: string[];
}

// Helper function to format due date display
const formatDueDate = (dueDate?: string | null): string => {
  if (!dueDate) return '';
  
  // Extract just the day number from the due date
  const day = parseInt(dueDate.trim());
  if (isNaN(day)) return '';
  
  const suffix = (d: number) => {
    if (d >= 11 && d <= 13) return 'th';
    switch (d % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  return `Due ${day}${suffix(day)} of Every Month`;
};

export function DebtCalculator() {
  const navigate = useNavigate();
  const [debts, setDebts] = useState<DebtInput[]>([
    { name: "", last4: "", balance: 0, minPayment: 0, apr: 0, dueDate: "", debtType: "personal", notes: "" }
  ]);
  const [extra, setExtra] = useState<number | string>("");
  const [oneTime, setOneTime] = useState<number | string>("");
  const [strategy, setStrategy] = useState<Strategy>("snowball");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDebtIndices, setSelectedDebtIndices] = useState<Set<number>>(new Set());
  const [isAddDebtDialogOpen, setIsAddDebtDialogOpen] = useState(false);
  const [newDebt, setNewDebt] = useState<DebtInput>({ 
    name: "", 
    last4: "", 
    balance: 0, 
    minPayment: 0, 
    apr: 0, 
    dueDate: "", 
    debtType: "personal", 
    notes: "" 
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialLoadRef = useRef(true);
  const isSortingRef = useRef(false);
  const isDeletingRef = useRef(false);

  // Load saved data on mount
  useEffect(() => {
    loadSavedData();
  }, []);

  // Auto-save debts when they change (but not during initial load, sorting, or deletion)
  useEffect(() => {
    if (isInitialLoadRef.current || isSortingRef.current || isDeletingRef.current) {
      return;
    }
    
    if (debts.length > 0 && debts[0].name !== "") {
      saveDebts();
    }
  }, [debts]);

  // Auto-save settings when they change
  useEffect(() => {
    if (extra !== "" || oneTime !== "" || strategy !== "snowball") {
      saveSettings();
    }
  }, [extra, oneTime, strategy]);
  
  // Re-sort debts when strategy changes
  useEffect(() => {
    if (debts.length > 0 && debts[0].name !== "") {
      const sortedDebts = sortDebts(debts);
      // Only update if order actually changed to avoid infinite loop
      const orderChanged = debts.some((debt, idx) => debt.id !== sortedDebts[idx]?.id);
      if (orderChanged) {
        isSortingRef.current = true;
        setDebts(sortedDebts);
        // Reset sorting flag after state update
        setTimeout(() => {
          isSortingRef.current = false;
        }, 0);
      }
    }
  }, [strategy]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSavedData = async () => {
    if (DEMO) return; // Skip database load in demo mode
    
    try {
      // Load debts
      const { data: debtsData, error: debtsError } = await supabase
        .from('debts')
        .select('*')
        .order('created_at', { ascending: true });

      if (debtsError) throw debtsError;

      if (debtsData && debtsData.length > 0) {
        const mappedDebts = debtsData.map(d => ({
          id: d.id,
          name: d.name,
          last4: d.last4 || '',
          balance: Number(d.balance),
          minPayment: Number(d.min_payment),
          apr: Number(d.apr),
          dueDate: d.due_date || '',
          debtType: d.debt_type || 'personal',
          notes: d.notes || ''
        }));
        
        // Sort loaded debts according to current strategy
        const sortedDebts = sortDebts(mappedDebts);
        setDebts(sortedDebts);
      }

      // Load settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('debt_calculator_settings')
        .select('*')
        .single();

      if (!settingsError && settingsData) {
        setExtra(Number(settingsData.extra_monthly));
        setOneTime(Number(settingsData.one_time));
        // Always default to snowball strategy
      }
      
      // Ensure strategy is always snowball on load
      setStrategy('snowball');
      
      // Mark initial load as complete after a brief delay
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 100);
    } catch (error: any) {
      logError('DebtCalculator - Load Data', error);
    }
  };

  const triggerAutoComputation = async () => {
    if (DEMO) return; // Skip in demo mode
    
    try {
      const { error } = await supabase.functions.invoke('auto-compute-debt-plans');
      if (error) {
        console.error('Auto-compute error:', error);
      }
    } catch (error) {
      console.error('Failed to trigger auto-computation:', error);
    }
  };

  const saveDebts = async () => {
    if (DEMO) return; // Skip database save in demo mode
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete existing debts
      await supabase.from('debts').delete().eq('user_id', user.id);

      // Insert new debts (only non-empty ones)
      const debtsToSave = debts.filter(d => d.name.trim() !== '');
      if (debtsToSave.length > 0) {
        const { error } = await supabase.from('debts').insert(
          debtsToSave.map(d => ({
            user_id: user.id,
            name: d.name,
            last4: d.last4 || null,
            balance: d.balance,
            min_payment: d.minPayment,
            apr: d.apr,
            due_date: d.dueDate || null,
            debt_type: d.debtType || 'personal',
            notes: d.notes || null
          }))
        );

        if (error) throw error;
        
        // Trigger auto-computation after saving debts
        await triggerAutoComputation();
      }
    } catch (error: any) {
      logError('DebtCalculator - Save Debts', error);
    }
  };

  const saveSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('debt_calculator_settings')
        .upsert({
          user_id: user.id,
          extra_monthly: Number(extra) || 0,
          one_time: Number(oneTime) || 0,
          strategy
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    } catch (error: any) {
      logError('DebtCalculator - Save Settings', error);
    }
  };

  const updateDebt = (index: number, field: keyof DebtInput, value: any) => {
    try {
      if (index < 0 || index >= debts.length) {
        console.error('Invalid debt index:', index);
        return;
      }
      const newDebts = [...debts];
      newDebts[index] = { ...newDebts[index], [field]: value };
      setDebts(newDebts);
    } catch (error) {
      logError('DebtCalculator - Update Debt', error);
    }
  };

  const sortDebts = (debtsToSort: DebtInput[]): DebtInput[] => {
    const sorted = [...debtsToSort];
    if (strategy === "snowball") {
      // Snowball: Sort by balance (smallest first)
      sorted.sort((a, b) => a.balance - b.balance);
    } else {
      // Avalanche: Sort by APR (highest first)
      sorted.sort((a, b) => b.apr - a.apr);
    }
    return sorted;
  };

  const addDebt = () => {
    // Validate the new debt
    if (!newDebt.name.trim()) {
      toast({ 
        title: "Error", 
        description: "Please enter a debt name", 
        variant: "destructive" 
      });
      return;
    }
    
    if (newDebt.balance <= 0) {
      toast({ 
        title: "Error", 
        description: "Please enter a valid balance greater than $0", 
        variant: "destructive" 
      });
      return;
    }
    
    if (newDebt.minPayment <= 0) {
      toast({ 
        title: "Error", 
        description: "Please enter a valid minimum payment greater than $0", 
        variant: "destructive" 
      });
      return;
    }
    
    if (newDebt.apr < 0 || newDebt.apr > 100) {
      toast({ 
        title: "Error", 
        description: "APR must be between 0% and 100%", 
        variant: "destructive" 
      });
      return;
    }
    
    // Add the new debt and sort all debts
    const updatedDebts = sortDebts([...debts.filter(d => d.name.trim() !== ''), newDebt]);
    setDebts(updatedDebts);
    
    // Close dialog and reset form
    setIsAddDebtDialogOpen(false);
    setNewDebt({ 
      name: "", 
      last4: "", 
      balance: 0, 
      minPayment: 0, 
      apr: 0, 
      dueDate: "", 
      debtType: "personal", 
      notes: "" 
    });
    
    toast({ 
      title: "Success", 
      description: `Debt added and sorted by ${strategy === "snowball" ? "balance" : "APR"}` 
    });
  };
  
  const openAddDebtDialog = () => {
    setIsAddDebtDialogOpen(true);
  };

  const removeDebt = (index: number) => {
    setDebts(debts.filter((_, i) => i !== index));
  };

  const deleteAllDebts = async () => {
    try {
      isDeletingRef.current = true;
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Clear selections first to avoid stale references
      setSelectedDebtIndices(new Set());
      
      // Delete all debts from database
      await supabase.from('debts').delete().eq('user_id', user.id);
      
      // Reset to single empty debt with all required properties
      setDebts([{ 
        name: "", 
        last4: "", 
        balance: 0, 
        minPayment: 0, 
        apr: 0, 
        dueDate: "", 
        debtType: "personal", 
        notes: "" 
      }]);
      
      // Reset deletion flag after state update completes
      setTimeout(() => {
        isDeletingRef.current = false;
      }, 100);
      
      toast({ title: "Success", description: "All debts deleted" });
    } catch (error: any) {
      logError('DebtCalculator - Delete All Debts', error);
      toast({ title: "Error", description: "Failed to delete debts", variant: "destructive" });
      isDeletingRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSelectedDebts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get the debts to delete (those with IDs in database)
      const debtsToDelete = Array.from(selectedDebtIndices)
        .map(index => debts[index])
        .filter(debt => debt.id);

      // Delete from database if they have IDs
      if (debtsToDelete.length > 0) {
        const idsToDelete = debtsToDelete.map(d => d.id!);
        await supabase.from('debts').delete().in('id', idsToDelete);
      }

      // Remove from local state
      const remainingDebts = debts.filter((_, index) => !selectedDebtIndices.has(index));
      
      // If no debts left, add one empty debt
      if (remainingDebts.length === 0) {
        setDebts([{ name: "", last4: "", balance: 0, minPayment: 0, apr: 0, dueDate: "", debtType: "personal", notes: "" }]);
      } else {
        setDebts(remainingDebts);
      }
      
      // Clear selections
      setSelectedDebtIndices(new Set());
      
      toast({ 
        title: "Success", 
        description: `Deleted ${selectedDebtIndices.size} debt(s)` 
      });
    } catch (error: any) {
      logError('DebtCalculator - Delete Selected Debts', error);
      toast({ title: "Error", description: "Failed to delete debts", variant: "destructive" });
    }
  };


  const toggleDebtSelection = (index: number) => {
    const newSelected = new Set(selectedDebtIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedDebtIndices(newSelected);
  };

  const normalizeName = (name: string): string => {
    return name
      .replace(/\s*[-•]\s*\d{4}$/i, '')
      .replace(/\s*\(.*?\d{4}.*?\)$/i, '')
      .replace(/\s*x+\d{4}$/i, '')
      .toLowerCase()
      .trim();
  };



  const compute = async (useStrategy?: Strategy) => {
    try {
      // Demo mode: Use mock computation results
      if (DEMO) {
        toast({ 
          title: "Demo Mode", 
          description: "Showing sample debt plan calculation",
          duration: 3000
        });
        
        // Create mock results based on current debts
        const validDebts = debts.filter(d => 
          d.name.trim() !== '' && d.balance > 0 && d.minPayment > 0
        );
        
        if (validDebts.length === 0) {
          toast({ 
            title: "No Valid Debts", 
            description: "Please add at least one debt to see the demo plan.",
            variant: "destructive" 
          });
          return;
        }
        
        const mockData: ComputeResult = {
          rows: validDebts.map((d, i) => ({
            index: i,
            label: `${i + 1}`,
            name: d.name,
            last4: d.last4,
            balance: d.balance,
            minPayment: d.minPayment,
            apr: d.apr,
            monthlyRate: d.apr / 12 / 100,
            totalPayment: d.balance + (d.balance * 0.15),
            monthsToPayoff: Math.ceil(d.balance / d.minPayment),
            cumulativeMonths: 0,
            dueDate: d.dueDate
          })),
          totals: {
            numDebts: validDebts.length,
            sumBalance: validDebts.reduce((sum, d) => sum + d.balance, 0),
            sumMinPayment: validDebts.reduce((sum, d) => sum + d.minPayment, 0),
            strategy: useStrategy || strategy,
            extraMonthly: Number(extra) || 0,
            oneTime: Number(oneTime) || 0,
            totalMonths: 24,
            debtFreeMonth: 24
          },
          schedule: [],
          payoffOrder: validDebts.map(d => d.name)
        };
        
        navigate('/debt-plan', {
          state: {
            result: mockData,
            strategy: useStrategy || strategy,
            debts: validDebts,
            extra: Number(extra) || 0,
            oneTime: Number(oneTime) || 0
          }
        });
        return;
      }
      
      // Validate that we have at least one valid debt
      const validDebts = debts.filter(d => 
        d.name.trim() !== '' && d.balance > 0 && d.minPayment > 0
      );
      
      if (validDebts.length === 0) {
        toast({ 
          title: "No Valid Debts", 
          description: "Please add at least one debt with name, balance, and minimum payment.",
          variant: "destructive" 
        });
        return;
      }


      setIsLoading(true);
      const computeStrategy = useStrategy || strategy;
      
      // Prepare debts for computation - convert APR to percentage (0-100) for the API
      const debtsToCompute = validDebts.map(d => {
        // If APR is already in decimal form (< 1), convert to percentage
        // If APR is already a percentage (>= 1), keep it
        const aprForAPI = d.apr < 1 ? d.apr * 100 : d.apr;
        
        console.log(`Debt: ${d.name}, Balance: ${d.balance}, MinPayment: ${d.minPayment}, APR: ${d.apr} -> ${aprForAPI}`);
        
        return {
          ...d,
          apr: aprForAPI
        };
      });
      
      console.log('Sending to compute-debt-plan:', {
        debts: debtsToCompute,
        extraMonthly: Number(extra) || 0,
        oneTime: Number(oneTime) || 0,
        strategy: computeStrategy
      });
      
      const { data, error } = await supabase.functions.invoke('compute-debt-plan', {
        body: {
          debts: debtsToCompute,
          extraMonthly: Number(extra) || 0,
          oneTime: Number(oneTime) || 0,
          strategy: computeStrategy
        }
      });

      if (error) {
        console.error('Compute error:', error);
        throw error;
      }
      
      console.log('Compute result:', data);
      
      toast({ title: "Success", description: "Debt plan calculated successfully" });
      
      // Navigate to the debt plan page with the results
      navigate('/debt-plan', {
        state: {
          result: data,
          strategy: computeStrategy,
          debts: validDebts,
          extra: Number(extra) || 0,
          oneTime: Number(oneTime) || 0
        }
      });
    } catch (error) {
      logError('DebtCalculator - Compute Plan', error);
      toast({ title: "Error", description: "Failed to compute debt plan", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };



  const handleDownloadBlankTemplate = async () => {
    try {
      const workbook = new XLSX.Workbook();
      const worksheet = workbook.addWorksheet('Debts');
      
      // Add header row with styling
      const headerRow = worksheet.addRow(['Name', 'Last4', 'Balance', 'MinPayment', 'APR', 'DueDate']);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // Set column widths
      worksheet.columns = [
        { width: 25 },  // Name
        { width: 10 },  // Last4
        { width: 15 },  // Balance
        { width: 15 },  // MinPayment
        { width: 10 },  // APR
        { width: 12 }   // DueDate
      ];
      
      // Add example row with instructions
      worksheet.addRow([
        'Example Debt',
        '1234',
        '5000',
        '150',
        '18.5',
        '15'
      ]);
      
      // Generate and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Finityo_Debt_Template.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast({ 
        title: "Success", 
        description: "Blank debt template downloaded successfully" 
      });
    } catch (error) {
      logError('DebtCalculator - Download Template', error);
      toast({ 
        title: "Error", 
        description: "Failed to download template", 
        variant: "destructive" 
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new XLSX.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('No worksheet found');
      }

      const importedDebts: DebtInput[] = [];
      
      // Expected columns: Name, Last4, Balance, MinPayment, APR, DueDate
      worksheet.eachRow((row, rowNumber) => {
        // Skip header row
        if (rowNumber === 1) return;
        
        const name = row.getCell(1).value?.toString() || '';
        const last4 = row.getCell(2).value?.toString() || '';
        const balance = parseFloat(row.getCell(3).value?.toString() || '0');
        const minPayment = parseFloat(row.getCell(4).value?.toString() || '0');
        const apr = parseFloat(row.getCell(5).value?.toString() || '0');
        const dueDateRaw = row.getCell(6).value?.toString() || '';
        
        // Extract just the day number from any format (e.g., "15", "15th", "Due by 15", etc.)
        const dayMatch = dueDateRaw.match(/\d+/);
        const dueDate = dayMatch ? dayMatch[0] : '';

        if (name && balance > 0) {
          importedDebts.push({
            name,
            last4,
            balance,
            minPayment,
            apr,
            dueDate,
            debtType: 'personal',
            notes: ''
          });
        }
      });

      if (importedDebts.length === 0) {
        throw new Error('No valid debts found in file');
      }

      setDebts(importedDebts);
      toast({ 
        title: "Success", 
        description: `Imported ${importedDebts.length} debt(s) from Excel file` 
      });
    } catch (error) {
      logError('DebtCalculator - Import File', error);
      toast({ 
        title: "Error", 
        description: "Failed to import Excel file. Please ensure it has columns: Name, Last4, Balance, MinPayment, APR, DueDate", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
      // Reset file input
      if (event.target) event.target.value = '';
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto p-4 space-y-4">
      <h1 className="text-3xl font-bold">Debt Snowball Planner</h1>

      <Card>
        <CardHeader>
          <CardTitle>Configure Your Debts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="extra">Extra Monthly Payment</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="extra"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-7"
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="oneTime">One-time Payment</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="oneTime"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-7"
                  value={oneTime}
                  onChange={(e) => setOneTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="strategy">Method</Label>
              <Select value={strategy} onValueChange={(value: Strategy) => setStrategy(value)}>
                <SelectTrigger id="strategy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="snowball">Snowball</SelectItem>
                  <SelectItem value="avalanche">Avalanche</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Debts</h3>
              </div>
              
              {/* Import & Add Actions */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      const { data, error } = await supabase.functions.invoke('plaid-import-debts');
                      
                      if (error) throw error;
                      
                      if (data && data.debts && data.debts.length > 0) {
                        await loadSavedData(); // Reload to get all debts
                        toast({ 
                          title: "Import Successful", 
                          description: `Imported ${data.debts.length} debt(s) from your bank accounts`, 
                        });
                      } else {
                        toast({ 
                          title: "No Debts Found", 
                          description: "No debts were found in your connected accounts", 
                          variant: "default" 
                        });
                      }
                    } catch (error: any) {
                      logError('DebtCalculator - Import from Plaid', error);
                      toast({ 
                        title: "Error", 
                        description: error.message || "Failed to import debts from bank accounts", 
                        variant: "destructive" 
                      });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  size="sm" 
                  variant="outline"
                  disabled={isLoading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import from Bank
                </Button>
                
                <Button onClick={handleImportClick} size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Excel
                </Button>
                
                <Button onClick={handleDownloadBlankTemplate} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileImport}
                  style={{ display: 'none' }}
                />
                
                <Button onClick={openAddDebtDialog} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Debt
                </Button>
                
                <div className="ml-auto flex gap-2">
                  {selectedDebtIndices.size > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Selected ({selectedDebtIndices.size})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Selected Debts?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete {selectedDebtIndices.size} selected debt(s). The plan will be recalculated with the remaining debts. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={deleteSelectedDebts} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Selected
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete All Debts?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all {debts.filter(d => d.name.trim() !== '').length} debt(s) and clear your plan. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteAllDebts} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>

            <Carousel className="w-full">
              <CarouselContent className="-ml-4">
                {debts.map((debt, index) => (
                  <CarouselItem key={debt.id || `debt-${index}`} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full">
                      <CardContent className="pt-6">
                          <div className="flex gap-4">
                            <div className="flex items-center pt-8">
                              <Checkbox
                                checked={selectedDebtIndices.has(index)}
                                onCheckedChange={() => toggleDebtSelection(index)}
                              />
                            </div>
                            <div className="flex-1 space-y-4">
                              <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                  value={debt.name}
                                  onChange={(e) => updateDebt(index, 'name', e.target.value)}
                                  placeholder="Credit Card"
                                  className="placeholder:text-muted-foreground/50"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Debt Type</Label>
                                <Select 
                                  value={debt.debtType || 'personal'} 
                                  onValueChange={(value) => updateDebt(index, 'debtType', value)}
                                >
                                  <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-popover border-border z-50">
                                    <SelectItem value="personal">Personal</SelectItem>
                                    <SelectItem value="child">Child's Debt</SelectItem>
                                    <SelectItem value="parent">Parent's Debt</SelectItem>
                                    <SelectItem value="spouse">Spouse's Debt</SelectItem>
                                    <SelectItem value="other">Other Family</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Last 4</Label>
                                <Input
                                  value={debt.last4 || ''}
                                  onChange={(e) => updateDebt(index, 'last4', e.target.value)}
                                  maxLength={4}
                                  placeholder="1234"
                                  className="placeholder:text-muted-foreground/50"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Balance</Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    className="pl-7 placeholder:text-muted-foreground/50"
                                    value={debt.balance || ''}
                                    onChange={(e) => updateDebt(index, 'balance', parseFloat(e.target.value) || 0)}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Min Payment</Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    className="pl-7 placeholder:text-muted-foreground/50"
                                    value={debt.minPayment || ''}
                                    onChange={(e) => updateDebt(index, 'minPayment', parseFloat(e.target.value) || 0)}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>APR (%)</Label>
                                 <Input
                                   type="text"
                                   inputMode="decimal"
                                   placeholder="18.99"
                                   className="placeholder:text-muted-foreground/50"
                                   value={debt.apr || ''}
                                   onChange={(e) => {
                                     const value = e.target.value;
                                     if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                                       const numValue = value === '' ? 0 : parseFloat(value);
                                       if (!isNaN(numValue) && numValue <= 100) {
                                         updateDebt(index, 'apr', numValue);
                                       }
                                     }
                                   }}
                                 />
                              </div>
                              <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input
                                  type="text"
                                  placeholder="Due by 15"
                                  className="placeholder:text-muted-foreground/50"
                                  value={debt.dueDate || ''}
                                 onChange={(e) => {
                                    const value = e.target.value.trim();
                                    const dayMatch = value.match(/\d+/);
                                    if (dayMatch) {
                                      const day = parseInt(dayMatch[0]);
                                      if (!isNaN(day) && day >= 1 && day <= 31) {
                                        updateDebt(index, 'dueDate', day.toString());
                                      }
                                    } else {
                                      updateDebt(index, 'dueDate', '');
                                    }
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Notes (Optional)</Label>
                                <Input
                                  value={debt.notes || ''}
                                  onChange={(e) => updateDebt(index, 'notes', e.target.value)}
                                  placeholder="E.g., College tuition for Sarah"
                                  className="placeholder:text-muted-foreground/50"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => removeDebt(index)}
                                  variant="destructive"
                                  size="sm"
                                  disabled={debts.length === 1}
                                  className="w-full"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              {debts.length > 1 && (
                <>
                  <CarouselPrevious className="left-0" />
                  <CarouselNext className="right-0" />
                </>
              )}
            </Carousel>
          </div>

          <Button onClick={() => compute()} disabled={isLoading} className="w-full">
            {isLoading ? 'Computing...' : 'Compute Plan'}
          </Button>
        </CardContent>
      </Card>

      {/* Add Debt Dialog */}
      <Dialog open={isAddDebtDialogOpen} onOpenChange={setIsAddDebtDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Debt</DialogTitle>
            <DialogDescription>
              Enter your debt details. It will be automatically sorted by {strategy === "snowball" ? "balance (smallest first)" : "APR (highest first)"}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={newDebt.name}
                onChange={(e) => setNewDebt({...newDebt, name: e.target.value})}
                placeholder="Credit Card"
                className="placeholder:text-muted-foreground/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Debt Type</Label>
              <Select 
                value={newDebt.debtType || 'personal'} 
                onValueChange={(value) => setNewDebt({...newDebt, debtType: value})}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="child">Child's Debt</SelectItem>
                  <SelectItem value="parent">Parent's Debt</SelectItem>
                  <SelectItem value="spouse">Spouse's Debt</SelectItem>
                  <SelectItem value="other">Other Family</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Last 4</Label>
              <Input
                value={newDebt.last4 || ''}
                onChange={(e) => setNewDebt({...newDebt, last4: e.target.value})}
                maxLength={4}
                placeholder="1234"
                className="placeholder:text-muted-foreground/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Balance *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-7 placeholder:text-muted-foreground/50"
                  value={newDebt.balance || ''}
                  onChange={(e) => setNewDebt({...newDebt, balance: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Min Payment *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-7 placeholder:text-muted-foreground/50"
                  value={newDebt.minPayment || ''}
                  onChange={(e) => setNewDebt({...newDebt, minPayment: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>APR (%)</Label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="18.99"
                className="placeholder:text-muted-foreground/50"
                value={newDebt.apr || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                    const numValue = value === '' ? 0 : parseFloat(value);
                    if (numValue <= 100) {
                      setNewDebt({...newDebt, apr: numValue || 0});
                    }
                  }
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="text"
                placeholder="Due by 15"
                className="placeholder:text-muted-foreground/50"
                value={newDebt.dueDate || ''}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  const dayMatch = value.match(/\d+/);
                  if (dayMatch) {
                    const day = parseInt(dayMatch[0]);
                    if (!isNaN(day) && day >= 1 && day <= 31) {
                      setNewDebt({...newDebt, dueDate: day.toString()});
                    }
                  } else {
                    setNewDebt({...newDebt, dueDate: ''});
                  }
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input
                value={newDebt.notes || ''}
                onChange={(e) => setNewDebt({...newDebt, notes: e.target.value})}
                placeholder="E.g., College tuition for Sarah"
                className="placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddDebtDialogOpen(false);
                setNewDebt({ 
                  name: "", 
                  last4: "", 
                  balance: 0, 
                  minPayment: 0, 
                  apr: 0, 
                  dueDate: "", 
                  debtType: "personal", 
                  notes: "" 
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={addDebt} className="animate-scale-in">
              <Plus className="h-4 w-4 mr-2" />
              Add Debt
            </Button>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
};

export default DebtCalculator;
