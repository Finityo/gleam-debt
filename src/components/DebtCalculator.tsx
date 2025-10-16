import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus, Download, Upload } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import * as XLSX from 'exceljs';

type Strategy = "snowball" | "avalanche";

interface DebtInput {
  id?: string;
  name: string;
  last4?: string;
  balance: number;
  minPayment: number;
  apr: number;
  dueDate?: string | null;
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
  const [debts, setDebts] = useState<DebtInput[]>([
    { name: "", last4: "", balance: 0, minPayment: 0, apr: 0, dueDate: "" }
  ]);
  const [extra, setExtra] = useState<number | string>("");
  const [oneTime, setOneTime] = useState<number | string>("");
  const [strategy, setStrategy] = useState<Strategy>("snowball");
  const [result, setResult] = useState<ComputeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDebtIndices, setSelectedDebtIndices] = useState<Set<number>>(new Set());
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

  const loadSavedData = async () => {
    try {
      // Clear any previous results to start fresh
      setResult(null);
      
      // Load debts
      const { data: debtsData, error: debtsError } = await supabase
        .from('debts')
        .select('*')
        .order('created_at', { ascending: true });

      if (debtsError) throw debtsError;

      if (debtsData && debtsData.length > 0) {
        setDebts(debtsData.map(d => ({
          id: d.id,
          name: d.name,
          last4: d.last4 || '',
          balance: Number(d.balance),
          minPayment: Number(d.min_payment),
          apr: Number(d.apr),
          dueDate: d.due_date || ''
        })));
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
      console.error('Error loading saved data:', error);
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
            due_date: d.dueDate || null
          }))
        );

        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Error saving debts:', error);
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
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error saving settings:', error);
    }
  };

  const updateDebt = (index: number, field: keyof DebtInput, value: any) => {
    const newDebts = [...debts];
    newDebts[index] = { ...newDebts[index], [field]: value };
    setDebts(newDebts);
  };

  const addDebt = () => {
    setDebts([...debts, { name: "", last4: "", balance: 0, minPayment: 0, apr: 0, dueDate: "" }]);
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
      setDebts([{ name: "", last4: "", balance: 0, minPayment: 0, apr: 0, dueDate: "" }]);
      
      // Clear results and selections
      setResult(null);
      setSelectedDebtIndices(new Set());
      
      toast({ title: "Success", description: "All debts deleted" });
    } catch (error: any) {
      console.error('Error deleting all debts:', error);
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
        setDebts([{ name: "", last4: "", balance: 0, minPayment: 0, apr: 0, dueDate: "" }]);
        setResult(null);
      } else {
        setDebts(remainingDebts);
        // Recalculate with remaining debts
        await recalculateWithDebts(remainingDebts);
      }
      
      // Clear selections
      setSelectedDebtIndices(new Set());
      
      toast({ 
        title: "Success", 
        description: `Deleted ${selectedDebtIndices.size} debt(s)` 
      });
    } catch (error: any) {
      console.error('Error deleting selected debts:', error);
      toast({ title: "Error", description: "Failed to delete debts", variant: "destructive" });
    }
  };

  const recalculateWithDebts = async (debtsToUse: DebtInput[]) => {
    // Only recalculate if we have valid debts and previous results
    const validDebts = debtsToUse.filter(d => d.name.trim() !== '' && d.balance > 0);
    if (validDebts.length === 0 || !result) {
      setResult(null);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('compute-debt-plan', {
        body: {
          debts: validDebts.map(d => ({ ...d, apr: d.apr > 1 ? d.apr / 100 : d.apr })),
          extraMonthly: Number(extra) || 0,
          oneTime: Number(oneTime) || 0,
          strategy
        }
      });

      if (error) throw error;
      setResult(data);
    } catch (error) {
      console.error('Error recalculating plan:', error);
      setResult(null);
    } finally {
      setIsLoading(false);
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

  const compute = async (useStrategy?: Strategy) => {
    try {
      // Check for duplicate "last 4" values
      const last4Values = debts
        .filter(d => d.last4 && d.last4.trim() !== '')
        .map(d => d.last4?.trim());
      
      const duplicates = last4Values.filter((value, index) => 
        last4Values.indexOf(value) !== index
      );
      
      if (duplicates.length > 0) {
        toast({ 
          title: "Duplicate Detected", 
          description: `Duplicate "Last 4" found: ${[...new Set(duplicates)].join(', ')}. Please check your debts.`,
          variant: "destructive" 
        });
        return;
      }

      setIsLoading(true);
      const computeStrategy = useStrategy || strategy;
      const { data, error } = await supabase.functions.invoke('compute-debt-plan', {
        body: {
          debts: debts.map(d => ({ ...d, apr: d.apr > 1 ? d.apr / 100 : d.apr })),
          extraMonthly: Number(extra) || 0,
          oneTime: Number(oneTime) || 0,
          strategy: computeStrategy
        }
      });

      if (error) throw error;
      setResult(data);
      toast({ title: "Success", description: "Debt plan calculated successfully" });
    } catch (error) {
      console.error('Error computing plan:', error);
      toast({ title: "Error", description: "Failed to compute debt plan", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStrategyChange = async (newStrategy: Strategy) => {
    setStrategy(newStrategy);
    if (result) {
      await compute(newStrategy);
    }
  };

  const exportCSV = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-debt-csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          debts: debts.map(d => ({ ...d, apr: d.apr > 1 ? d.apr / 100 : d.apr })),
          extraMonthly: Number(extra) || 0,
          oneTime: Number(oneTime) || 0,
          strategy
        })
      });

      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'debt_snowball.csv';
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ title: "Success", description: "CSV exported successfully" });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({ title: "Error", description: "Failed to export CSV", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const exportXLSX = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-debt-xlsx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          debts: debts.map(d => ({ ...d, apr: d.apr > 1 ? d.apr / 100 : d.apr })),
          extraMonthly: Number(extra) || 0,
          oneTime: Number(oneTime) || 0,
          strategy
        })
      });

      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'debt_snowball.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ title: "Success", description: "Excel file exported successfully" });
    } catch (error) {
      console.error('Error exporting XLSX:', error);
      toast({ title: "Error", description: "Failed to export Excel file", variant: "destructive" });
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
            dueDate
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
      console.error('Error importing file:', error);
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
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Debts</h3>
              <div className="flex gap-2">
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
                <Button onClick={addDebt} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Debt
                </Button>
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

            {debts.map((debt, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex items-center pt-8">
                      <Checkbox
                        checked={selectedDebtIndices.has(index)}
                        onCheckedChange={() => toggleDebtSelection(index)}
                      />
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-4">
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
                          // Allow numbers with up to 2 decimal places
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
                          // Extract just the day number from any format
                          const value = e.target.value.trim();
                          const dayMatch = value.match(/\d+/);
                          const day = dayMatch ? parseInt(dayMatch[0]) : '';
                          updateDebt(index, 'dueDate', day.toString());
                        }}
                      />
                    </div>
                      <div className="space-y-2 flex items-end">
                        <Button
                          onClick={() => removeDebt(index)}
                          variant="destructive"
                          size="icon"
                          disabled={debts.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button onClick={() => compute()} disabled={isLoading} className="w-full">
            {isLoading ? 'Computing...' : 'Compute Plan'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Tabs defaultValue="snowball" className="w-full">
          <TabsList className="grid grid-cols-3 h-auto gap-2">
            <TabsTrigger value="snowball">Snowball Plan</TabsTrigger>
            <TabsTrigger value="calendar">Payoff Calendar</TabsTrigger>
            <TabsTrigger value="mobile">Mobile View</TabsTrigger>
            <TabsTrigger value="summary" className="col-start-2">Printable Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="snowball">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <CardTitle>Strategy</CardTitle>
                    <Select value={strategy} onValueChange={(value: Strategy) => handleStrategyChange(value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="snowball">Snowball</SelectItem>
                        <SelectItem value="avalanche">Avalanche</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={exportXLSX} variant="outline" size="sm" disabled={isLoading}>
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Creditor</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">Min Payment</TableHead>
                        <TableHead className="text-right">APR</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Est. Months</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.rows.map((row) => (
                        <TableRow key={row.index}>
                          <TableCell className="font-medium">{row.label}</TableCell>
                          <TableCell className="text-right">${row.balance.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${row.minPayment.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{(row.apr * 100).toFixed(2)}%</TableCell>
                          <TableCell>{formatDueDate(row.dueDate) || 'N/A'}</TableCell>
                          <TableCell className="text-right">{row.monthsToPayoff}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total Months</div>
                      <div className="text-2xl font-bold">{result.totals.totalMonths}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total Debts</div>
                      <div className="text-2xl font-bold">{result.totals.numDebts}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total Balance</div>
                      <div className="text-2xl font-bold">${result.totals.sumBalance.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Min Payments</div>
                      <div className="text-2xl font-bold">${result.totals.sumMinPayment.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Monthly Payoff Calendar</h2>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background z-10">Month</TableHead>
                        <TableHead className="text-center min-w-[120px]">Snowball Total</TableHead>
                        {result.rows.map((debt) => (
                          <TableHead key={debt.index} className="text-center min-w-[200px]">
                            <div className="font-semibold">{debt.name}</div>
                            {debt.last4 && <div className="text-xs text-muted-foreground">({debt.last4})</div>}
                            {debt.dueDate && <div className="text-xs text-muted-foreground mt-1">{formatDueDate(debt.dueDate)}</div>}
                            <div className="text-xs text-muted-foreground mt-1">
                              Bal: ${debt.balance.toFixed(2)} | Min: ${debt.minPayment.toFixed(2)} | APR: {(debt.apr * 100).toFixed(1)}%
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="text-center min-w-[120px]">Remaining</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.schedule && result.schedule.map((snapshot) => (
                        <TableRow key={snapshot.month}>
                          <TableCell className="sticky left-0 bg-background z-10 font-medium">
                            Month {snapshot.month}
                          </TableCell>
                          <TableCell className="text-center font-medium text-primary">
                            ${snapshot.snowballExtra.toFixed(2)}
                          </TableCell>
                          {snapshot.debts.map((debtData, idx) => (
                            <TableCell key={idx} className={`text-center p-2 ${debtData.endBalance === 0 ? 'bg-muted/30' : ''}`}>
                              {debtData.endBalance === 0 && debtData.payment === 0 ? (
                                <div className="text-xs text-muted-foreground">Paid Off</div>
                              ) : (
                                <div className="text-xs space-y-1">
                                  <div className="font-medium text-primary">
                                    ${debtData.payment.toFixed(2)}
                                  </div>
                                  <div className="text-muted-foreground">
                                    Int: ${debtData.interest.toFixed(2)}
                                  </div>
                                  <div className="text-muted-foreground">
                                    Left: ${debtData.endBalance.toFixed(2)}
                                  </div>
                                </div>
                              )}
                            </TableCell>
                          ))}
                          <TableCell className="text-center font-medium">
                            ${snapshot.totalRemaining.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {result.payoffOrder && result.payoffOrder.length > 0 && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Payoff Order</h3>
                    <div className="text-sm">
                      {result.payoffOrder.map((name, idx) => (
                        <span key={idx}>
                          {idx + 1}. {name}
                          {idx < result.payoffOrder!.length - 1 ? ' → ' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Printable Summary</h2>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Creditor</TableHead>
                        <TableHead>Last 4</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">Min Payment</TableHead>
                        <TableHead className="text-right">APR</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Included</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.rows.map((row) => (
                        <TableRow key={row.index}>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell>{row.last4 || 'N/A'}</TableCell>
                          <TableCell className="text-right">${row.balance.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${row.minPayment.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{(row.apr * 100).toFixed(2)}%</TableCell>
                          <TableCell>{formatDueDate(row.dueDate) || 'N/A'}</TableCell>
                          <TableCell>Yes</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-6 print:mt-4">
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <div className="text-sm space-y-1">
                    <p>Strategy: <span className="font-medium">{result.totals.strategy}</span></p>
                    <p>Extra Monthly: <span className="font-medium">${result.totals.extraMonthly.toFixed(2)}</span></p>
                    <p>One-Time Payment: <span className="font-medium">${result.totals.oneTime.toFixed(2)}</span></p>
                    <p>Total Payoff Time: <span className="font-medium">{result.totals.totalMonths} months</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mobile">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Mobile-Friendly Snowball</h2>
                <div className="grid grid-cols-1 gap-4">
                  {result.rows.map((row) => (
                    <div key={row.index} className="bg-accent/50 p-4 rounded-xl shadow-sm">
                      <div className="text-lg font-bold mb-2">{row.label}</div>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Balance:</span>
                          <span className="font-medium">${row.balance.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Min Payment:</span>
                          <span className="font-medium">${row.minPayment.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">APR:</span>
                          <span className="font-medium">{(row.apr * 100).toFixed(2)}%</span>
                        </div>
                        {row.dueDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Due Date:</span>
                            <span className="font-medium">{formatDueDate(row.dueDate)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payoff Months:</span>
                          <span className="font-medium">{row.monthsToPayoff}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
