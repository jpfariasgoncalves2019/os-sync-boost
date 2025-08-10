import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { STATUS_CONFIG, OrdemServico } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

interface StatusDropdownProps {
  osId: string;
  currentStatus: OrdemServico['status'];
  onStatusChange?: (newStatus: OrdemServico['status']) => void;
}

const statusOptions: { value: OrdemServico['status']; label: string }[] = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'aberta', label: 'Aberta' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'cancelada', label: 'Cancelada' },
];

export function StatusDropdown({ osId, currentStatus, onStatusChange }: StatusDropdownProps) {
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: OrdemServico['status']) => {
    if (newStatus === currentStatus) return;

    setUpdating(true);
    try {
      const response = await apiClient.updateOS(osId, { status: newStatus });
      
      if (response.ok) {
        toast({
          title: "Status atualizado",
          description: `Status alterado para ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label}`,
        });
        onStatusChange?.(newStatus);
      } else {
        throw new Error(response.error?.message || "Erro ao atualizar status");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da OS",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const currentStatusConfig = STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.rascunho;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          disabled={updating}
        >
          <Badge variant="secondary" className={currentStatusConfig.color}>
            {currentStatusConfig.label}
          </Badge>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-background border shadow-lg z-50">
        {statusOptions.map((status) => (
          <DropdownMenuItem
            key={status.value}
            onClick={() => handleStatusChange(status.value)}
            disabled={status.value === currentStatus || updating}
          >
            <Badge 
              variant="secondary" 
              className={STATUS_CONFIG[status.value as keyof typeof STATUS_CONFIG]?.color}
            >
              {status.label}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}