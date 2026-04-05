import type { ReactNode } from "react";

type Props = {
  content: string;
  children: ReactNode;
};

export default function Tooltip({ content, children }: Props) {
  return (
    <span className="group/tooltip relative">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover/tooltip:opacity-100 after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-gray-800">
        {content}
      </span>
    </span>
  );
}
