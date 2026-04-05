import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Upload } from "lucide-react";
import { useWatchlist } from "@/contexts/WatchlistContext";

type ImportResult = {
  success: boolean;
  error?: string;
  skippedDams: number;
};

export default function WatchlistImportExport() {
  const { exportData, importData, data } = useWatchlist();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    if (result?.success) {
      const timer = setTimeout(() => setResult(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [result]);

  function handleExport() {
    const json = exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `watchlist-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const json = reader.result as string;
      const importResult = importData(json);
      setResult(importResult);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleExport}
          disabled={data.lists.length === 0}
          className="flex items-center gap-1.5 rounded-lg border border-border-primary px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="size-3.5" />
          エクスポート
        </button>
        <button
          type="button"
          onClick={handleImport}
          className="flex items-center gap-1.5 rounded-lg border border-border-primary px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
        >
          <Upload className="size-3.5" />
          インポート
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {result &&
        createPortal(
          <div
            className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 text-sm shadow-lg ${
              result.success
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            }`}
          >
            {result.success ? (
              <div>
                <p>インポートが完了しました</p>
                {result.skippedDams > 0 && (
                  <p className="mt-1 text-xs opacity-80">
                    {result.skippedDams}個の無効なダムIDをスキップしました
                  </p>
                )}
              </div>
            ) : (
              <p>{result.error}</p>
            )}
            <button
              type="button"
              onClick={() => setResult(null)}
              className="mt-2 text-xs underline opacity-70 hover:opacity-100"
            >
              閉じる
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
