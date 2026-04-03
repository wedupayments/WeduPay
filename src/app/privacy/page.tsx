import Link from "next/link";

const privacySections = [
  {
    title: "What we collect",
    body:
      "We collect account details such as your name, email address, phone number, wallet identifiers, transaction references, and support messages so we can operate the platform safely.",
  },
  {
    title: "How we use it",
    body:
      "Your data is used to authenticate access, route payments, prevent fraud, comply with financial regulations, respond to support requests, and improve product reliability.",
  },
  {
    title: "How we protect it",
    body:
      "We use access controls, encrypted transport, audit logging, and limited staff access to reduce the risk of unauthorized exposure.",
  },
  {
    title: "Your choices",
    body:
      "You can request profile updates, ask for account deletion where legally permitted, and contact support if you need help understanding how your data is handled.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-3xl">
        <Link href="/auth/login" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          Back to sign in
        </Link>

        <h1 className="mt-6 text-4xl font-bold">Privacy Policy</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
          This page gives users a basic summary of how WeduPay handles personal information while the full legal policy is being finalized.
        </p>

        <div className="mt-10 space-y-8">
          {privacySections.map((section) => (
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
