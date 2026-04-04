import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-white dark:bg-background-dark border-t border-slate-200 dark:border-primary/20 pt-8 sm:pt-10 md:pt-16 pb-6 sm:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8 md:gap-12 mb-8 sm:mb-10 md:mb-16">
        <div className="col-span-2 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <Image
              src="/logo.svg"
              alt="WeduPay"
              width={164}
              height={48}
              className="h-10 w-auto"
            />
          </div>
          <p className="text-slate-500 max-w-xs mb-6">
            The modern financial infrastructure for cross-border payment routing in Africa.
          </p>
          <div className="flex gap-4">
            <a className="w-10 h-10 rounded-full bg-slate-100 dark:bg-primary/10 flex items-center justify-center text-slate-600 dark:text-primary hover:bg-primary hover:text-background-dark transition-colors" href="#">
              <span className="material-symbols-outlined text-xl">share</span>
            </a>
            <a className="w-10 h-10 rounded-full bg-slate-100 dark:bg-primary/10 flex items-center justify-center text-slate-600 dark:text-primary hover:bg-primary hover:text-background-dark transition-colors" href="#">
              <span className="material-symbols-outlined text-xl">public</span>
            </a>
          </div>
        </div>
        <div>
          <h5 className="font-bold mb-6">Company</h5>
          <ul className="space-y-4 text-slate-500 text-sm">
            <li><Link className="hover:text-primary" href="#">About Us</Link></li>
            <li><Link className="hover:text-primary" href="#">Careers</Link></li>
            <li><Link className="hover:text-primary" href="#">Contact</Link></li>
            <li><Link className="hover:text-primary" href="#">Blog</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="font-bold mb-6">Solutions</h5>
          <ul className="space-y-4 text-slate-500 text-sm">
            <li><Link className="hover:text-primary" href="#">For Merchants</Link></li>
            <li><Link className="hover:text-primary" href="#">For Students</Link></li>
            <li><Link className="hover:text-primary" href="#">API Docs</Link></li>
            <li><Link className="hover:text-primary" href="#">Mobile Wallets</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="font-bold mb-6">Legal</h5>
          <ul className="space-y-4 text-slate-500 text-sm">
            <li><Link className="hover:text-primary" href="#">Privacy Policy</Link></li>
            <li><Link className="hover:text-primary" href="#">Terms of Service</Link></li>
            <li><Link className="hover:text-primary" href="#">Compliance</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 border-t border-slate-200 dark:border-primary/10 text-center text-slate-500 text-xs">
        &copy; {new Date().getFullYear()} WeduPay Inc. All rights reserved. Committed to operating within applicable local regulations.
      </div>
    </footer>
  );
}
