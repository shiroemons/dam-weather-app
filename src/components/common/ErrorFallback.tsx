type Props = {
  error?: unknown;
  resetErrorBoundary?: () => void;
};

export default function ErrorFallback({ error, resetErrorBoundary }: Props) {
  const errorMessage = error instanceof Error ? error.message : undefined;

  return (
    <div className="py-12 text-center">
      <p className="text-base font-semibold text-text-primary">データの読み込みに失敗しました</p>
      {errorMessage && <p className="mt-2 text-sm text-text-secondary">{errorMessage}</p>}
      {resetErrorBoundary && (
        <button
          type="button"
          onClick={resetErrorBoundary}
          className="mt-4 rounded-xl bg-accent px-6 py-2 text-sm font-medium text-white transition hover:bg-accent"
        >
          再読み込み
        </button>
      )}
    </div>
  );
}
