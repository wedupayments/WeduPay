import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WaitlistForm } from "@/components/WaitlistForm";
import Image from "next/image";
import Link from "next/link";

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
<h1 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
                                Secure payment routing for <span className="text-primary">mobile wallets</span> in Africa
                            </h1>
<p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl">
                                Empowering African merchants and students with direct settlement and real-time tracking for seamless cross-border transactions.
                            </p>
</div>
<div className="flex flex-col gap-4 max-w-md">
  <p className="text-sm font-bold text-primary uppercase tracking-wider">Join the Merchant Waitlist</p>
  <WaitlistForm type="MERCHANT" buttonText="Join as Merchant" />
  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
    <span>Are you a student?</span>
    <Link href="#cta" className="text-primary hover:underline italic">Sign up below</Link>
  </div>
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
<p className="text-sm font-medium text-slate-500">Be among the first to experience WeduPay</p>
</div>
</div>
<div className="relative">
<div className="aspect-square rounded-3xl overflow-hidden bg-linear-to-br from-primary/30 to-background-dark border border-primary/20" data-alt="Abstract visualization of digital payment network connecting Africa">
<div className="absolute inset-0 flex items-center justify-center">
<span className="material-symbols-outlined text-[64px] md:text-[120px] text-primary/40">language</span>
</div>
<div className="absolute bottom-10 left-10 right-10 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
<div className="flex justify-between items-center mb-4">
<span className="text-xs font-bold uppercase tracking-widest text-primary">Example Transaction</span>
<span className="text-xs text-slate-300">Demo</span>
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
<p className="text-slate-600 dark:text-slate-400">Our routing engine establishes a secure connection to major mobile wallet providers like EcoCash, M-Pesa, MTN, and Airtel.</p>
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
{/* Network Map Section */}
            <section className="py-16 lg:py-32 bg-slate-50/50 dark:bg-background-dark/30 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-[50%] h-full bg-linear-to-l from-primary/5 to-transparent pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-6 relative">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div className="order-2 lg:order-1 relative">
                            {/* Premium Dot-Grid Map Container */}
                            <div className="relative aspect-square max-w-xl mx-auto group">
                                <div className="absolute inset-0 bg-primary/20 blur-[140px] rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-1000 animate-pulse"></div>
                                <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-[0_20px_50px_rgba(17,212,115,0.15)]">
                                    <defs>
                                        <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
                                            <stop offset="0%" stopColor="#11d473" stopOpacity="0.6" />
                                            <stop offset="100%" stopColor="#11d473" stopOpacity="0" />
                                        </radialGradient>
                                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="3" result="blur" />
                                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                        </filter>
                                        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#11d473" stopOpacity="0" />
                                            <stop offset="50%" stopColor="#11d473" stopOpacity="1" />
                                            <stop offset="100%" stopColor="#11d473" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>

                                    {/* Detailed Africa Contour */}
                                    <path 
                                        d="M75,20 C85,15 100,18 115,25 C125,30 140,35 150,50 C160,65 155,85 145,100 C140,115 145,130 140,145 C135,160 130,175 120,190 C110,210 100,225 90,235 C85,238 75,230 70,220 C65,210 60,195 55,180 C50,165 40,150 30,140 C20,130 15,115 12,100 C10,85 15,70 25,58 C35,45 50,40 65,35 C70,30 72,25 75,20" 
                                        className="fill-slate-200/20 dark:fill-primary/5 stroke-slate-300 dark:stroke-primary/30 stroke-[0.75] transition-all duration-700 group-hover:stroke-primary/50"
                                    />
                                    
                                    {/* Data Stream Tracks */}
                                    <path d="M102 155 Q 60 145 45 105" className="stroke-slate-300 dark:stroke-primary/10 stroke-[0.25] fill-none" />
                                    <path d="M102 155 Q 120 120 138 95" className="stroke-slate-300 dark:stroke-primary/10 stroke-[0.25] fill-none" />
                                    <path d="M102 155 Q 100 190 95 215" className="stroke-slate-300 dark:stroke-primary/10 stroke-[0.25] fill-none" />

                                    {/* Moving Data Packets */}
                                    <circle r="1" className="fill-primary" filter="url(#glow)">
                                        <animateMotion path="M102 155 Q 60 145 45 105" dur="3s" repeatCount="indefinite" />
                                    </circle>
                                    <circle r="1" className="fill-primary" filter="url(#glow)">
                                        <animateMotion path="M102 155 Q 120 120 138 95" dur="4s" repeatCount="indefinite" />
                                    </circle>
                                    <circle r="1" className="fill-primary" filter="url(#glow)">
                                        <animateMotion path="M102 155 Q 100 190 95 215" dur="5s" repeatCount="indefinite" />
                                    </circle>

                                    {/* Zimbabwe (Harare) - THE HEART */}
                                    <g className="cursor-pointer">
                                        <circle cx="102" cy="155" r="20" fill="url(#hubGlow)" className="animate-pulse opacity-40" />
                                        <circle cx="102" cy="155" r="12" className="stroke-primary/20 stroke-[0.5] fill-none animate-ping" />
                                        <circle cx="102" cy="155" r="5" className="fill-primary" filter="url(#glow)" />
                                    </g>

                                    {/* Subsidiary Nodes */}
                                    <circle cx="45" cy="105" r="3" className="fill-slate-400 dark:fill-primary/40" />
                                    <circle cx="138" cy="95" r="3" className="fill-slate-400 dark:fill-primary/40" />
                                    <circle cx="95" cy="215" r="3" className="fill-slate-400 dark:fill-primary/40" />
                                </svg>

                                {/* Floating Hub Info Card - Enhanced Glassmorphism */}
                                <div className="absolute top-[35%] left-[60%] pointer-events-none group-hover:translate-x-4 transition-transform duration-700 ease-out">
                                    <div className="bg-white/40 dark:bg-background-dark/40 backdrop-blur-2xl border border-white/20 dark:border-primary/20 p-6 rounded-4xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_64px_-16px_rgba(17,212,115,0.1)] space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="size-3 rounded-full bg-primary shadow-[0_0_12px_#11d473] animate-pulse"></div>
                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Master Hub</span>
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-xl font-black dark:text-white tracking-tighter">Harare Cluster</h4>
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {['EcoCash', 'Mukuru', 'InnBucks'].map(tag => (
                                                    <span key={tag} className="text-[8px] font-bold px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md uppercase">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <style dangerouslySetInnerHTML={{ __html: `
                                    @keyframes dashSlow { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
                                    .animate-dash-slow { animation: dashSlow 12s linear infinite; }
                                `}} />
                            </div>
                        </div>

                        <div className="space-y-10 lg:pl-10 relative z-10">
                            <div className="space-y-4">
                                <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-[0.3em]">
                                    Continental Architecture
                                </div>
                                <h2 className="text-4xl lg:text-6xl font-black tracking-tighter leading-tight dark:text-white">
                                    Built to be the Fintech <span className="text-primary italic">Backbone</span> of Africa.
                                </h2>
                            </div>
                            
                            <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                We&apos;ve moved beyond simple transfers. WeduPay is a proprietary direct-routing network built for the unique demands of the Zimbabwean and broader African markets.
                            </p>

                            <div className="grid gap-8 pt-4">
                                {[
                                    { title: "Direct Routing", desc: "Native API integration with local wallet providers.", icon: "settings_input_component" },
                                    { title: "Institutional Settlement", desc: "Direct settlement for universities and businesses, with full transaction transparency.", icon: "account_balance" }
                                ].map((item) => (
                                    <div key={item.title} className="flex gap-6 group">
                                        <div className="w-14 h-14 shrink-0 rounded-2xl bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 flex items-center justify-center group-hover:border-primary transition-all shadow-sm">
                                            <span className="material-symbols-outlined text-primary text-3xl group-hover:scale-110 transition-transform">{item.icon}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-lg font-black dark:text-white">{item.title}</h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Indicators */}
            <section className="border-y border-slate-200 dark:border-primary/10 py-12">
<div className="max-w-7xl mx-auto px-6">
<p className="text-center text-sm font-bold text-slate-500 uppercase tracking-widest mb-8">Targeting markets across Africa</p>
<div className="flex flex-wrap justify-center items-center gap-3 md:gap-6 lg:gap-10 grayscale opacity-60">
<div className="text-xs md:text-sm lg:text-base font-black">ZIMBABWE</div>
<div className="text-xs md:text-sm lg:text-base font-black">SOUTH AFRICA</div>
<div className="text-xs md:text-sm lg:text-base font-black">NIGERIA</div>
<div className="text-xs md:text-sm lg:text-base font-black">KENYA</div>
<div className="text-xs md:text-sm lg:text-base font-black">GHANA</div>
<div className="text-xs md:text-sm lg:text-base font-black">RWANDA</div>
<div className="text-xs md:text-sm lg:text-base font-black">UGANDA</div>
<div className="text-xs md:text-sm lg:text-base font-black">TANZANIA</div>
</div>
</div>
</section>
{/* CTA Section */}
<section className="py-20">
<div className="max-w-7xl mx-auto px-6">
<div className="rounded-3xl bg-primary p-6 md:p-8 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 text-background-dark overflow-hidden relative">
<div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
<div className="max-w-2xl relative z-10">
<h2 className="text-2xl md:text-3xl lg:text-5xl font-black mb-4 md:mb-6">Ready to scale your business across Africa?</h2>
<p className="text-lg font-medium opacity-90">
                                Be among the first merchants and students to access WeduPay — built for faster, cheaper, and safer cross-border transactions across Africa.
                            </p>
</div>
<div className="flex flex-col gap-6 w-full lg:w-auto relative z-10" id="cta">
  <div className="bg-background-dark/10 p-6 rounded-2xl border border-background-dark/10 backdrop-blur-sm">
    <p className="text-sm font-bold mb-3 uppercase tracking-widest opacity-80">Students: Get Early Access</p>
    <WaitlistForm type="STUDENT" buttonText="Join Student Waitlist" className="w-full" />
  </div>
</div>
</div>
</div>
</section>
</main>
<Footer />
</div>

  );
}
