import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImportarContatoButtonProps {
  onImport: (dados: { nome?: string; telefone?: string; email?: string }) => void;
  className?: string;
}

export function ImportarContatoButton({ onImport, className }: ImportarContatoButtonProps) {
  const { toast } = useToast();

  const handleImport = async () => {
    const navAny = navigator as any;
    if ('contacts' in navAny && 'select' in navAny.contacts) {
      try {
        const props = ['name', 'tel', 'email'];
        const opts = { multiple: false };
        // @ts-ignore
        const contacts = await navigator.contacts.select(props, opts);
        if (contacts && contacts.length > 0) {
          const contato = contacts[0];
          onImport({
            nome: contato.name?.[0] || '',
            telefone: contato.tel?.[0] || '',
            email: contato.email?.[0] || '',
          });
          toast({
            title: 'Contato importado',
            description: 'Dados preenchidos automaticamente.',
          });
        }
      } catch (err) {
        toast({
          title: 'Erro ao importar',
          description: 'Não foi possível acessar os contatos.',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Importação não suportada',
        description: 'A importação de contatos só está disponível em navegadores e apps que suportam a API de contatos.',
        variant: 'default',
      });
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      className={className}
      onClick={handleImport}
    >
      <User className="w-4 h-4 mr-1" /> Importar da Agenda
    </Button>
  );
}
