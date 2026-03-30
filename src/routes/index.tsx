import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return (
    <div className="min-h-screen bg-white">
      <h1 className="text-2xl font-bold p-8">ダム天気アプリ</h1>
    </div>
  );
}
