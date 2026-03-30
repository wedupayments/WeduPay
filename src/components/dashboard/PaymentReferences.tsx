"use client";

interface PaymentReference {
  id: string;
  title: string;
  ref: string;
  icon: string;
}

interface PaymentReferenceCardProps {
  reference: PaymentReference;
}

export function PaymentReferenceCard({ reference }: PaymentReferenceCardProps) {
  return (
    <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/20 p-5 rounded-2xl flex items-center justify-between group hover:border-primary transition-colors cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="size-12 rounded-xl bg-slate-100 dark:bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-primary">{reference.icon}</span>
        </div>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{reference.title}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Ref: {reference.ref}</p>
        </div>
      </div>
      <span className="material-symbols-outlined text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
    </div>
  );
}

interface PaymentReferencesSectionProps {
  references?: PaymentReference[];
}

export function PaymentReferencesSection({ references }: PaymentReferencesSectionProps) {
  const defaultReferences: PaymentReference[] = [
    { id: "1", title: "BYU-Pathway Worldwide", ref: "BYU-2024-88291", icon: "school" },
    { id: "2", title: "Course Materials Fund", ref: "MAT-BK-2024", icon: "menu_book" },
  ];

  const refs = references || defaultReferences;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Active Payment References</h3>
        <button className="text-primary text-sm font-semibold hover:underline">View all</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {refs.map((ref) => (
          <PaymentReferenceCard key={ref.id} reference={ref} />
        ))}
      </div>
    </section>
  );
}
