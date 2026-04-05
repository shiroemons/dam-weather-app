import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";
import { ErrorBoundary } from "react-error-boundary";
import ErrorFallback from "../components/common/ErrorFallback";
import ScrollToTopButton from "../components/common/ScrollToTopButton";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { SITE_NAME, SITE_DESCRIPTION } from "@/config/seo";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { title: SITE_NAME },
      { name: "description", content: SITE_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "ja_JP" },
      { property: "og:site_name", content: SITE_NAME },
      { name: "application-name", content: SITE_NAME },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-secondary font-sans text-text-primary antialiased">
      <HeadContent />
      <Header />
      <main className="flex-1">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}
