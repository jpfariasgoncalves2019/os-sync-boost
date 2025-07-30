import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/types";

interface ItemListProps<T> {
  items: T[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: keyof T, value: any) => void;
  children: (item: T, index: number, updateField: (field: keyof T, value: any) => void) => ReactNode;
  addButtonText: string;
  emptyMessage: string;
}

export function ItemList<T>({
  items,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  children,
  addButtonText,
  emptyMessage,
}: ItemListProps<T>) {
  const updateField = (index: number) => (field: keyof T, value: any) => {
    onUpdateItem(index, field, value);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Itens</h3>
        <Button onClick={onAddItem} size="sm" className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {addButtonText}
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {emptyMessage}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex gap-4 items-start">
                  <div className="flex-1 grid gap-4">
                    {children(item, index, updateField(index))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface MoneyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MoneyInput({ label, value, onChange, placeholder, disabled }: MoneyInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const stringValue = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
    const numValue = parseFloat(stringValue) || 0;
    onChange(numValue);
  };

  const displayValue = value > 0 ? formatCurrency(value).replace('R$ ', '') : '';

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          R$
        </span>
        <Input
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10"
        />
      </div>
    </div>
  );
}