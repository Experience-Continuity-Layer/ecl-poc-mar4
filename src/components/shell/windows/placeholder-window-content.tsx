interface PlaceholderWindowContentProps {
  title: string;
  description: string;
}

export function PlaceholderWindowContent({ title, description }: PlaceholderWindowContentProps) {
  return (
    <section className="flex h-full flex-col justify-between p-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
        <p className="text-sm text-zinc-600">{description}</p>
      </div>
      <p className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
        Placeholder content. Functional channel UI will be added in subsequent phases.
      </p>
    </section>
  );
}
