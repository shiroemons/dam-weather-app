import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$prefectureSlug")({
  component: PrefecturePage,
});

function PrefecturePage() {
  const { prefectureSlug } = Route.useParams();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h2 className="text-xl font-semibold text-gray-900">都道府県ページ</h2>
      <p className="mt-2 text-gray-600">
        スラッグ: {prefectureSlug}
      </p>
    </div>
  );
}
