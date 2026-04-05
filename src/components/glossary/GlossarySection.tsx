import type { ReactNode } from "react";

type Props = {
  id: string;
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
};

export default function GlossarySection({ id, icon, title, description, children }: Props) {
  return (
    <section id={id} style={{ scrollMarginTop: "5rem" }} className="mt-10">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
        {icon}
        {title}
      </h2>
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {description}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}
