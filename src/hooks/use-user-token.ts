import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useUserToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) setToken(data.session?.access_token || null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token || null);
    });
    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  return token;
}
