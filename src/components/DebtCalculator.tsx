import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import * as XLSX from 'exceljs';
import { logError } from '@/utils/logger';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
          dueDate: d.due_date || '',
          debtType: d.debt_type || 'personal',
          notes: d.notes || ''
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

  const addDebt = () => {
    setDebts([...debts, { name: "", last4: "", balance: 0, minPayment: 0, apr: 0, dueDate: "", debtType: "personal", notes: "" }]);
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

      // Check for duplicate "last 4" values (only among valid debts with last4)
      const last4Values = validDebts
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
      
      // Only send valid debts to the compute function
      const debtsToCompute = validDebts.map(d => ({ 
        ...d, 
        apr: d.apr > 1 ? d.apr / 100 : d.apr 
      }));
      
      const { data, error } = await supabase.functions.invoke('compute-debt-plan', {
        body: {
          debts: debtsToCompute,
          extraMonthly: Number(extra) || 0,
          oneTime: Number(oneTime) || 0,
          strategy: computeStrategy
        }
      });

      if (error) throw error;
      
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

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
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
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Debts</h3>
                <div className="flex gap-2 justify-center flex-wrap">
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
              <div>
                <Button 
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      const { data, error } = await supabase.functions.invoke('plaid-import-debts');
                      
                      if (error) throw error;
                      
                      if (data && data.debts && data.debts.length > 0) {
                        toast({ 
                          title: "Success", 
                          description: `Imported ${data.debts.length} debt(s) from your connected accounts` 
                        });
                        // Reload the data
                        await loadSavedData();
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
              </div>
            </div>

              <div className="relative">
                <div 
                  ref={scrollContainerRef}
                  className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {debts.map((debt, index) => (
                    <Card key={index} className="min-w-[350px] md:min-w-[400px] snap-start shrink-0">
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
                  ))}
                </div>
              
              {debts.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={scrollLeft}
                    className="rounded-full"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={scrollRight}
                    className="rounded-full"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Button onClick={() => compute()} disabled={isLoading} className="w-full">
            {isLoading ? 'Computing...' : 'Compute Plan'}
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}
