import { CurrencyConverter } from '@/components/fx/CurrencyConverter';

export default function FXConverterPage() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Currency Exchange
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Convert between African and international currencies
          </p>
        </div>

        <CurrencyConverter />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
            <div className="text-primary text-3xl mb-2">💱</div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Real-time Rates
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Get up-to-date exchange rates for accurate conversions
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
            <div className="text-primary text-3xl mb-2">🌍</div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              African Currencies
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Support for major African currencies including ZWL, ZAR, KES, NGN
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
            <div className="text-primary text-3xl mb-2">⚡</div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Instant Conversion
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Convert currencies instantly with transparent fees
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
