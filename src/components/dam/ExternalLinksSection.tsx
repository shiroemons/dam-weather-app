import { ExternalLink } from "lucide-react";
import { getDamExternalLinks } from "@/lib/externalLinks";

type Props = {
  damId: string;
};

export default function ExternalLinksSection({ damId }: Props) {
  const links = getDamExternalLinks(damId);

  if (links.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">外部リンク</h2>
      <div className="mt-3 divide-y divide-gray-200 rounded-xl bg-white p-4 shadow-sm dark:divide-gray-700 dark:bg-gray-800">
        {links.map((link) => (
          <div key={link.url} className="py-3 first:pt-0 last:pb-0">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-700 transition-colors hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400"
            >
              <span>{link.label}</span>
              <ExternalLink className="size-3 shrink-0" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
