import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ListaOS from "./pages/ListaOS";
import NovaOSEdicao from "./pages/NovaOSEdicao";
import DetalheOS from "./pages/DetalheOS";
import Clientes from "./pages/Clientes";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "./contexts/ThemeContext";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
  <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
            <Route index element={<ListaOS />} />
            <Route path="nova-os" element={<NovaOSEdicao />} />
            <Route path="editar-os/:id" element={<NovaOSEdicao />} />
            <Route path="os/:id" element={<DetalheOS />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="configuracoes" element={<Configuracoes />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;