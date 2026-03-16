import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Image from "next/image";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
<Navbar />
{/* Hero Section */}
<main className="flex-1">
<section className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
<div className="grid lg:grid-cols-2 gap-12 items-center">
<div className="flex flex-col gap-8">
<div className="space-y-4">
<span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                                Cross-Border Fintech
                            </span>
<h1 className="text-4xl lg:text-6xl font-black leading-tight tracking-tight">
                                Secure payment routing for <span className="text-primary">mobile wallets</span> in Africa
                            </h1>
<p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl">
                                Empowering African merchants and students with direct settlement and real-time tracking for seamless cross-border transactions.
                            </p>
</div>
<div className="flex flex-wrap gap-4">
<button className="flex min-w-[160px] items-center justify-center rounded-xl h-14 px-6 bg-primary text-background-dark text-base font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                                Merchant Signup
                            </button>
<button className="flex min-w-[160px] items-center justify-center rounded-xl h-14 px-6 border border-slate-300 dark:border-primary/30 text-base font-bold hover:bg-slate-100 dark:hover:bg-primary/10 transition-colors">
                                Student Portal
                            </button>
</div>
<div className="flex items-center gap-4 pt-4">
<div className="flex -space-x-3">
<div className="relative w-10 h-10 rounded-full border-2 border-background-dark overflow-hidden">
  <Image src="/images/avatar_1.png" alt="User 1" fill className="object-cover" />
</div>
<div className="relative w-10 h-10 rounded-full border-2 border-background-dark overflow-hidden">
  <Image src="/images/avatar_2.png" alt="User 2" fill className="object-cover" />
</div>
<div className="relative w-10 h-10 rounded-full border-2 border-background-dark overflow-hidden">
  <Image src="/images/avatar_3.png" alt="User 3" fill className="object-cover" />
</div>
</div>
<p className="text-sm font-medium text-slate-500">Trusted by 10k+ users across Africa</p>
</div>
</div>
<div className="relative">
<div className="aspect-square rounded-3xl overflow-hidden bg-linear-to-br from-primary/30 to-background-dark border border-primary/20" data-alt="Abstract visualization of digital payment network connecting Africa">
<div className="absolute inset-0 flex items-center justify-center">
<span className="material-symbols-outlined text-[120px] text-primary/40">language</span>
</div>
<div className="absolute bottom-10 left-10 right-10 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
<div className="flex justify-between items-center mb-4">
<span className="text-xs font-bold uppercase tracking-widest text-primary">Live Transaction</span>
<span className="text-xs text-slate-300">Just now</span>
</div>
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-background-dark">
<span className="material-symbols-outlined">check</span>
</div>
<div>
<p className="font-bold text-white">KES 45,000.00</p>
<p className="text-xs text-slate-300">Sent to Lagos, Nigeria</p>
</div>
</div>
</div>
</div>
</div>
</div>
</section>
{/* Benefits Section */}
<section className="bg-slate-100 dark:bg-primary/5 py-20" id="benefits">
<div className="max-w-7xl mx-auto px-6">
<div className="text-center mb-16 space-y-4">
<h2 className="text-3xl lg:text-4xl font-black">Why Choose WeduPay?</h2>
<p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Experience the next generation of payment routing designed specifically for the unique needs of the African market.
                        </p>
</div>
<div className="grid md:grid-cols-3 gap-8">
<div className="p-8 rounded-2xl bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/20 hover:border-primary transition-colors">
<div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6">
<span className="material-symbols-outlined text-3xl">verified_user</span>
</div>
<h3 className="text-xl font-bold mb-3">No Funds Held</h3>
<p className="text-slate-600 dark:text-slate-400">
                                We never hold your money. Funds move directly from sender to receiver for maximum security and peace of mind.
                            </p>
</div>
<div className="p-8 rounded-2xl bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/20 hover:border-primary transition-colors">
<div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6">
<span className="material-symbols-outlined text-3xl">bolt</span>
</div>
<h3 className="text-xl font-bold mb-3">Direct Settlement</h3>
<p className="text-slate-600 dark:text-slate-400">
                                Merchants receive payments instantly into their chosen bank or mobile accounts without middleman delays.
                            </p>
</div>
<div className="p-8 rounded-2xl bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/20 hover:border-primary transition-colors">
<div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6">
<span className="material-symbols-outlined text-3xl">analytics</span>
</div>
<h3 className="text-xl font-bold mb-3">Unique Tracking</h3>
<p className="text-slate-600 dark:text-slate-400">
                                Every transaction is assigned a unique identifier for end-to-end transparency and instant reconciliation.
                            </p>
</div>
</div>
</div>
</section>
{/* How It Works Section */}
<section className="py-20" id="how-it-works">
<div className="max-w-4xl mx-auto px-6">
<div className="text-center mb-16">
<h2 className="text-3xl lg:text-4xl font-black">How It Works</h2>
</div>
<div className="space-y-0 relative">
{/* Connecting Line */}
<div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-primary/20 hidden md:block"></div>
{/* Step 1 */}
<div className="relative flex items-start gap-8 pb-12">
<div className="z-10 w-12 h-12 shrink-0 rounded-full bg-primary text-background-dark flex items-center justify-center font-bold text-lg border-4 border-background-light dark:border-background-dark">1</div>
<div className="flex-1 pt-1">
<h4 className="text-xl font-bold mb-2">Student Selection</h4>
<p className="text-slate-600 dark:text-slate-400">Students browse verified institutions and choose their preferred payment method via our portal.</p>
</div>
<div className="hidden md:block w-12 h-12 text-primary/30"><span className="material-symbols-outlined text-4xl">person_search</span></div>
</div>
{/* Step 2 */}
<div className="relative flex items-start gap-8 pb-12">
<div className="z-10 w-12 h-12 shrink-0 rounded-full bg-primary text-background-dark flex items-center justify-center font-bold text-lg border-4 border-background-light dark:border-background-dark">2</div>
<div className="flex-1 pt-1">
<h4 className="text-xl font-bold mb-2">Wallet API Integration</h4>
<p className="text-slate-600 dark:text-slate-400">Our routing engine establishes a secure connection to major mobile wallet providers like M-Pesa, MTN, and Airtel.</p>
</div>
<div className="hidden md:block w-12 h-12 text-primary/30"><span className="material-symbols-outlined text-4xl">api</span></div>
</div>
{/* Step 3 */}
<div className="relative flex items-start gap-8 pb-12">
<div className="z-10 w-12 h-12 shrink-0 rounded-full bg-primary text-background-dark flex items-center justify-center font-bold text-lg border-4 border-background-light dark:border-background-dark">3</div>
<div className="flex-1 pt-1">
<h4 className="text-xl font-bold mb-2">Approval Process</h4>
<p className="text-slate-600 dark:text-slate-400">Automated verification systems ensure compliance and quick authorization of the routing request.</p>
</div>
<div className="hidden md:block w-12 h-12 text-primary/30"><span className="material-symbols-outlined text-4xl">verified</span></div>
</div>
{/* Step 4 */}
<div className="relative flex items-start gap-8">
<div className="z-10 w-12 h-12 shrink-0 rounded-full bg-primary text-background-dark flex items-center justify-center font-bold text-lg border-4 border-background-light dark:border-background-dark">4</div>
<div className="flex-1 pt-1">
<h4 className="text-xl font-bold mb-2">Instant Confirmation</h4>
<p className="text-slate-600 dark:text-slate-400">Real-time notification is sent to both the student and the merchant, confirming successful fund routing.</p>
</div>
<div className="hidden md:block w-12 h-12 text-primary/30"><span className="material-symbols-outlined text-4xl">notifications_active</span></div>
</div>
</div>
</div>
</section>
{/* Trust Indicators */}
<section className="border-y border-slate-200 dark:border-primary/10 py-12">
<div className="max-w-7xl mx-auto px-6">
<p className="text-center text-sm font-bold text-slate-500 uppercase tracking-widest mb-8">Powering payments across the continent</p>
<div className="flex flex-wrap justify-center items-center gap-12 grayscale opacity-60">
<div className="text-2xl font-black">NIGERIA</div>
<div className="text-2xl font-black">KENYA</div>
<div className="text-2xl font-black">GHANA</div>
<div className="text-2xl font-black">SOUTH AFRICA</div>
<div className="text-2xl font-black">RWANDA</div>
</div>
</div>
</section>
{/* CTA Section */}
<section className="py-20">
<div className="max-w-7xl mx-auto px-6">
<div className="rounded-3xl bg-primary p-8 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 text-background-dark overflow-hidden relative">
<div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
<div className="max-w-2xl relative z-10">
<h2 className="text-3xl lg:text-5xl font-black mb-6">Ready to scale your business across Africa?</h2>
<p className="text-lg font-medium opacity-90">
                                Join hundreds of merchants and thousands of students already using WeduPay for faster, cheaper, and safer transactions.
                            </p>
</div>
<div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto relative z-10">
<button className="px-8 py-4 bg-background-dark text-primary rounded-xl font-bold text-lg hover:brightness-125 transition-all">
                                Create Account
                            </button>
<button className="px-8 py-4 bg-primary/20 border border-background-dark/20 backdrop-blur-sm rounded-xl font-bold text-lg hover:bg-primary/30 transition-all">
                                Contact Sales
                            </button>
</div>
</div>
</div>
</section>
</main>
<Footer />
</div>

  );
}
