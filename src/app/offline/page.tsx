import Image from "next/image";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background-light px-4 py-10 dark:bg-background-dark">
      <section className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl dark:border-primary/10 dark:bg-slate-950">
        <Image src="/logo-slack.png" alt="WeduPay" width={72} height={72} className="mx-auto rounded-2xl" />
        <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">You are offline</h1>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
          WeduPay is installed and ready, but this screen needs a connection before it can refresh secure payment data.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-primary px-4 text-sm font-black text-background-dark"
        >
          Retry
        </Link>
      </section>
    </main>
  );
}
