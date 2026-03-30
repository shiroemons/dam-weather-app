import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h2 className="text-xl font-semibold text-gray-900">トップページ</h2>
      <p className="mt-2 text-gray-600">全国のダムの天気情報を確認できます。</p>
    </div>
  );
}
