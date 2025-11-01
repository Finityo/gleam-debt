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
import { Trash2, Plus, Upload, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import * as XLSX from 'exceljs';
import { logError } from '@/utils/logger';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

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
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<Array<{baseName: string; debts: DebtInput[]}>>([]);
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set());
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

  // Load saved data on mount
  useEffect(() => {
    loadSavedData();
  }, []);

  // Auto-save debts when they change
  useEffect(() => {
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
        setDebts(sortedDebts);
      }
    }
  }, [strategy]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSavedData = async () => {
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
    } catch (error: any) {
      logError('DebtCalculator - Load Data', error);
    }
  };

  const saveDebts = async () => {
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
    const newDebts = [...debts];
    newDebts[index] = { ...newDebts[index], [field]: value };
    setDebts(newDebts);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete all debts from database
      await supabase.from('debts').delete().eq('user_id', user.id);
      
      // Reset to single empty debt
      setDebts([{ name: "", last4: "", balance: 0, minPayment: 0, apr: 0, dueDate: "", debtType: "personal", notes: "" }]);
      
      // Clear selections
      setSelectedDebtIndices(new Set());
      
      toast({ title: "Success", description: "All debts deleted" });
    } catch (error: any) {
      logError('DebtCalculator - Delete All Debts', error);
      toast({ title: "Error", description: "Failed to delete debts", variant: "destructive" });
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

  const checkForDuplicates = (debtsToCheck: DebtInput[]): Array<{baseName: string; debts: DebtInput[]}> => {
    const groups = new Map<string, DebtInput[]>();
    
    debtsToCheck.forEach((debt) => {
      if (!debt.last4 || debt.last4.trim() === '') return;
      
      const normalized = normalizeName(debt.name);
      const groupKey = `${normalized}::${debt.last4}`;
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(debt);
    });

    const duplicateGroups: Array<{baseName: string; debts: DebtInput[]}> = [];
    groups.forEach((debts, groupKey) => {
      if (debts.length > 1) {
        const baseName = groupKey.split('::')[0];
        duplicateGroups.push({ baseName, debts });
      }
    });

    return duplicateGroups;
  };

  const handleDuplicateCleanup = async () => {
    if (selectedForDeletion.size === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select debts to remove',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const idsToDelete = Array.from(selectedForDeletion).filter(id => id); // Only IDs that exist in DB
      
      if (idsToDelete.length > 0) {
        await supabase.from('debts').delete().in('id', idsToDelete);
      }

      toast({
        title: 'Cleanup Complete',
        description: `Removed ${selectedForDeletion.size} duplicate entries`,
      });

      setSelectedForDeletion(new Set());
      setIsDuplicateDialogOpen(false);
      await loadSavedData();
    } catch (error: any) {
      logError('DebtCalculator - Cleanup Duplicates', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to clean up duplicates',
        variant: 'destructive',
      });
    }
  };

  const compute = async (useStrategy?: Strategy) => {
    try {
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

      // Check for duplicates (matching last4 + similar name)
      const foundDuplicates = checkForDuplicates(validDebts);
      
      if (foundDuplicates.length > 0) {
        setDuplicateGroups(foundDuplicates);
        setIsDuplicateDialogOpen(true);
        toast({ 
          title: "Duplicates Found", 
          description: `Found ${foundDuplicates.length} duplicate group(s). Please resolve them before computing.`,
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
                        
                        // Check for duplicates after import
                        const { data: allDebts } = await supabase
                          .from('debts')
                          .select('*');
                        
                        if (allDebts) {
                          const mappedDebts = allDebts.map(d => ({
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
                          
                          const foundDuplicates = checkForDuplicates(mappedDebts);
                          
                          if (foundDuplicates.length > 0) {
                            setDuplicateGroups(foundDuplicates);
                            setIsDuplicateDialogOpen(true);
                            toast({ 
                              title: "Import Complete with Duplicates", 
                              description: `Imported ${data.debts.length} debt(s). Found ${foundDuplicates.length} duplicate group(s) - please resolve them.`,
                              variant: "default"
                            });
                          } else {
                            toast({ 
                              title: "Success", 
                              description: `Imported ${data.debts.length} debt(s) from your connected accounts` 
                            });
                          }
                        }
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
                  <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
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
                                      if (numValue <= 100) {
                                        updateDebt(index, 'apr', numValue || 0);
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
                                    const day = dayMatch ? parseInt(dayMatch[0]) : '';
                                    updateDebt(index, 'dueDate', day.toString());
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
                  const day = dayMatch ? parseInt(dayMatch[0]) : '';
                  setNewDebt({...newDebt, dueDate: day.toString()});
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

      {/* Duplicate Resolution Dialog */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Duplicate Debts Detected
            </DialogTitle>
            <DialogDescription>
              Found debts with matching last 4 digits and similar names. Select which ones to remove before computing your plan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {duplicateGroups.map((group, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-2 bg-muted/30">
                <h4 className="font-semibold capitalize text-base">
                  {group.baseName} (Last 4: {group.debts[0]?.last4})
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Select which version(s) to <strong>remove</strong>:
                </p>
                <div className="space-y-2">
                  {group.debts.map((debt) => (
                    <div 
                      key={debt.id || debt.name} 
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-colors ${
                        selectedForDeletion.has(debt.id || '') 
                          ? 'border-destructive bg-destructive/5' 
                          : 'border-border bg-background hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={selectedForDeletion.has(debt.id || '')}
                        onCheckedChange={() => {
                          const newSet = new Set(selectedForDeletion);
                          const debtKey = debt.id || '';
                          if (newSet.has(debtKey)) {
                            newSet.delete(debtKey);
                          } else {
                            newSet.add(debtKey);
                          }
                          setSelectedForDeletion(newSet);
                        }}
                      />
                      <div className="flex-1 text-sm">
                        <div className="font-medium flex items-center gap-2">
                          {debt.name}
                          {debt.last4 && (
                            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-md font-mono">
                              •••• {debt.last4}
                            </span>
                          )}
                        </div>
                        <div className="text-muted-foreground mt-1 space-y-0.5">
                          <div>Balance: <span className="font-semibold">${debt.balance.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
                          <div>APR: {debt.apr}% • Min Payment: ${debt.minPayment.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                          {debt.dueDate && <div>Due: {formatDueDate(debt.dueDate)}</div>}
                          {debt.notes && <div className="text-xs italic">Note: {debt.notes}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-end border-t pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDuplicateDialogOpen(false);
                setSelectedForDeletion(new Set());
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDuplicateCleanup}
              disabled={selectedForDeletion.size === 0}
              variant="destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove {selectedForDeletion.size} Selected
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
