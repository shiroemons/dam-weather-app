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
      <h2 className="text-lg font-semibold text-text-primary">外部リンク</h2>
      <div className="mt-3 divide-y divide-border-primary rounded-xl bg-surface-primary p-4 shadow-sm">
        {links.map((link) => (
          <div key={link.url} className="py-3 first:pt-0 last:pb-0">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-accent"
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
