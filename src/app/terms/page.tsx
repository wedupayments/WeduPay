import Link from "next/link";

const termsSections = [
  {
    title: "Using WeduPay",
    body:
      "You agree to provide accurate account information, keep your credentials secure, and use the platform only for lawful payments and transfers.",
  },
  {
    title: "Compliance and verification",
    body:
      "Certain features may require identity verification, transaction review, or temporary holds to satisfy anti-fraud and regulatory obligations.",
  },
  {
    title: "Service availability",
    body:
      "We aim for high reliability, but provider downtime, bank delays, maintenance windows, and regulatory actions can affect availability and settlement timing.",
  },
  {
    title: "Contact",
    body:
      "If you have questions about these terms, contact the WeduPay support team before continuing to use the service.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-3xl">
        <Link href="/auth/login" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          Back to sign in
        </Link>

        <h1 className="mt-6 text-4xl font-bold">Terms of Service</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
          These terms are a short-form placeholder so legal links resolve correctly while the full production terms are prepared.
        </p>

        <div className="mt-10 space-y-8">
          {termsSections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="mt-2 leading-7 text-slate-700 dark:text-slate-300">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
