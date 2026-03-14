import { QueryClient } from "@tanstack/react-query";

export const DADOS_FRESCOS = 1000 * 60; // 1 minuto

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DADOS_FRESCOS,
      gcTime: DADOS_FRESCOS * 5,
      refetchOnWindowFocus: true, // Refetch quando volta à aba
      refetchOnReconnect: true, // Refetch quando internet volta
      refetchOnMount: true, // Refetch quando componente monta
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
      structuralSharing: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
