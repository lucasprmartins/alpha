import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { routeTree } from "./routeTree.gen";
import "./index.css";

const DADOS_FRESCOS = 1000 * 60; // 1 minuto

const queryClient = new QueryClient({
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

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadDelay: 1000,
  defaultStaleTime: DADOS_FRESCOS,
  defaultGcTime: DADOS_FRESCOS * 5,
  defaultViewTransition: false,
  trailingSlash: "never",
  notFoundMode: "fuzzy",
  scrollRestoration: true,
  scrollRestorationBehavior: "instant",
  defaultPendingMs: 300,
  defaultPendingMinMs: 200,
  context: {
    queryClient,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
