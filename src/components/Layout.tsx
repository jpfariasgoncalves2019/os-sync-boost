import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  // Exibe botão de voltar apenas em rotas de detalhe de OS
  const showBack = /^\/os\//.test(location.pathname);
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header with hamburger menu */}
          <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4" />
              {showBack && (
                <button
                  onClick={() => navigate("/")}
                  className="mr-2 p-2 rounded hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent flex items-center"
                  aria-label="Voltar para lista de OS"
                >
                  {/* Ícone de seta para a esquerda (Lucide ou SVG) */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
              )}
              <h1 className="text-lg font-semibold text-foreground">OS Sync Pro</h1>
            </div>
            <ThemeToggle />
          </header>
          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <Toaster />
      <Sonner />
    </SidebarProvider>
  );
}