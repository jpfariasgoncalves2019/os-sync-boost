import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FileText,
  Users,
  Package,
  Wrench,
  BarChart3,
  HelpCircle,
  Settings,
  Star,
  Menu,
  X,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const menuItems = [
  { title: "Lista de OS", url: "/", icon: FileText, isDefault: true },
  { title: "Nova OS", url: "/nova-os", icon: FileText },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Produtos", url: "/produtos", icon: Package, placeholder: true },
  { title: "Serviços", url: "/servicos", icon: Wrench, placeholder: true },
  { title: "Relatórios (PRO)", url: "/relatorios", icon: BarChart3, placeholder: true, isPro: true },
  // IA
  { title: "Assistente IA", url: "/assistente-ia", icon: HelpCircle },
  { title: "Análise IA", url: "/ia-analise", icon: BarChart3 },
  { title: "Automação IA", url: "/ia-automacao", icon: Wrench },
  { title: "Geração IA", url: "/ia-geracao", icon: FileText },
  { title: "Chatbot", url: "/chatbot", icon: Users },
  { title: "Ajuda e Suporte", url: "/ajuda", icon: HelpCircle },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Avalie este aplicativo", url: "/avaliar", icon: Star, isExternal: true },
];

interface AppSidebarProps {
  companyName?: string;
  userEmail?: string;
}

export function AppSidebar({ companyName = "Oficina do Luis", userEmail = "oficina@example.com" }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handlePlaceholderClick = (title: string) => {
    if (title.includes("Produtos") || title.includes("Serviços")) {
      toast({
        title: "Em breve",
        description: `A funcionalidade ${title} estará disponível em breve.`,
      });
    } else if (title.includes("Relatórios")) {
      toast({
        title: "Em desenvolvimento",
        description: "Os relatórios PRO estão em desenvolvimento.",
      });
    }
  };

  const handleExternalClick = (title: string) => {
    if (title.includes("Avalie")) {
      // Try to open app store review, fallback to toast
      try {
        // This would be platform-specific in a real app
        window.open("https://play.google.com/store", "_blank");
      } catch {
        toast({
          title: "Avaliação",
          description: "Obrigado pelo interesse! Avalie-nos na loja de aplicativos.",
        });
      }
    }
  };

  const handleHelpClick = () => {
    const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent("Olá! Preciso de ajuda com o app de OS.")}`;
    const emailUrl = `mailto:suporte@oficinadoluis.com?subject=${encodeURIComponent("Suporte - App OS")}`;
    
    try {
      // Try WhatsApp first
      window.open(whatsappUrl, "_blank");
    } catch {
      try {
        // Fallback to email
        window.open(emailUrl, "_blank");
      } catch {
        toast({
          title: "Contato",
          description: "WhatsApp: (11) 99999-9999 | Email: suporte@oficinadoluis.com",
        });
      }
    }
  };

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  const getNavClass = (path: string) => {
    return isActive(path) 
      ? "bg-primary text-primary-foreground font-medium" 
      : "hover:bg-muted/50";
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarHeader className="p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                {getInitials(companyName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate">{companyName}</p>
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">PRO</Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {getInitials(companyName)}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {item.placeholder ? (
                      <button
                        onClick={() => handlePlaceholderClick(item.title)}
                        className={`flex items-center w-full ${collapsed ? 'justify-center' : ''} text-muted-foreground hover:bg-muted/50 p-2 rounded-md`}
                      >
                        <item.icon className={`h-4 w-4 ${collapsed ? '' : 'mr-2'}`} />
                        {!collapsed && (
                          <span className="flex items-center gap-1">
                            {item.title}
                            {item.isPro && <Badge variant="secondary" className="text-xs px-1 py-0">PRO</Badge>}
                          </span>
                        )}
                      </button>
                    ) : item.isExternal ? (
                      <button
                        onClick={() => handleExternalClick(item.title)}
                        className={`flex items-center w-full ${collapsed ? 'justify-center' : ''} hover:bg-muted/50 p-2 rounded-md`}
                      >
                        <item.icon className={`h-4 w-4 ${collapsed ? '' : 'mr-2'}`} />
                        {!collapsed && <span>{item.title}</span>}
                      </button>
                    ) : item.url === "/ajuda" ? (
                      <button
                        onClick={handleHelpClick}
                        className={`flex items-center w-full ${collapsed ? 'justify-center' : ''} hover:bg-muted/50 p-2 rounded-md`}
                      >
                        <item.icon className={`h-4 w-4 ${collapsed ? '' : 'mr-2'}`} />
                        {!collapsed && <span>{item.title}</span>}
                      </button>
                    ) : (
                      <NavLink
                        to={item.url}
                        className={({ isActive }) => `flex items-center w-full ${collapsed ? 'justify-center' : ''} ${getNavClass(item.url)} p-2 rounded-md`}
                      >
                        <item.icon className={`h-4 w-4 ${collapsed ? '' : 'mr-2'}`} />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}