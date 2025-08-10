import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/utils/apiClient';
import type { OSListResponse } from '@/types/api';

function useDebounced<T>(value: T, delay = 400): T {
  const { useEffect, useState } = require('react');
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function useOSAPI(params: { query?: string; status?: string; page?: number; size?: number; date_from?: string; date_to?: string; }) {
  const debouncedQuery = useDebounced(params.query || '', 450);
  const cleanParams = useMemo(() => ({ ...params, query: debouncedQuery || undefined }), [params, debouncedQuery]);

  return useQuery<OSListResponse, Error>({
    queryKey: ['os-list', cleanParams],
    queryFn: async () => {
      const res = await apiClient.listOS(cleanParams as any);
      if (!res.ok) throw new Error(res.error?.message || 'Erro ao carregar');
      return res.data as unknown as OSListResponse;
    },
    retry: (failureCount, error: any) => {
      // Retry somente para erros de rede/500
      if (error?.message?.includes('rede') || error?.message?.includes('500')) return failureCount < 2;
      return failureCount < 1;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
