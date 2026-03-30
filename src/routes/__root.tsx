import { createRootRoute, Outlet } from "@tanstack/react-router";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
