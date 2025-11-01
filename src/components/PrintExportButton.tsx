import { Button } from '@/components/ui/button';
import { Printer, FileDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface PrintExportButtonProps {
  onPrint: () => void;
  onExportPDF?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export const PrintExportButton = ({ onPrint, onExportPDF, variant = 'outline', className }: PrintExportButtonProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} className={className}>
          <Printer className="w-4 h-4 mr-2" />
          Print / Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background border border-border z-50">
        <DropdownMenuItem onClick={onPrint} className="cursor-pointer">
          <Printer className="w-4 h-4 mr-2" />
          Print Page
        </DropdownMenuItem>
        {onExportPDF && (
          <DropdownMenuItem onClick={onExportPDF} className="cursor-pointer">
            <FileDown className="w-4 h-4 mr-2" />
            Export as PDF
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
