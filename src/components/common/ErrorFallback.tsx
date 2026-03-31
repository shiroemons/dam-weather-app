type Props = {
  error?: Error;
  resetErrorBoundary?: () => void;
};

export default function ErrorFallback({ error, resetErrorBoundary }: Props): JSX.Element {
  return (
    <div className="py-12 text-center">
      <p className="text-base font-semibold text-gray-900">データの読み込みに失敗しました</p>
      {error && (
        <p className="mt-2 text-sm text-gray-500">{error.message}</p>
      )}
      {resetErrorBoundary && (
        <button
          type="button"
          onClick={resetErrorBoundary}
          className="mt-4 rounded-xl bg-blue-500 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
        >
          再読み込み
        </button>
      )}
    </div>
  );
}
