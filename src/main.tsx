import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WatchlistProvider } from "@/contexts/WatchlistContext";
import { routeTree } from "./routeTree.gen";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 60 * 1000,
    },
  },
});

const router = createRouter({ routeTree });

router.subscribe("onResolved", ({ toLocation }) => {
  if (typeof window.gtag === "function") {
    window.gtag("event", "page_view", {
      page_path: toLocation.pathname,
    });
  }
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <WatchlistProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </WatchlistProvider>
    </ThemeProvider>
  </StrictMode>,
);

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}
