"use client";

export default function SettingsPage() {
  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 lg:pb-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Account Settings</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">Manage your account preferences</p>
      </div>

      <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/10 rounded-xl sm:rounded-2xl divide-y divide-slate-100 dark:divide-primary/10">
        <div className="p-4 sm:p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 text-sm sm:text-base">Profile Information</h3>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-background-dark text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="+263..."
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-background-dark text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 text-sm sm:text-base">Notifications</h3>
          <div className="space-y-2 sm:space-y-3">
            {["Email notifications", "SMS alerts", "Transaction updates"].map((item) => (
              <label key={item} className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="size-4 sm:size-5 rounded border-slate-300 text-primary focus:ring-primary" />
                <span className="text-slate-700 dark:text-slate-300 text-sm">{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 text-sm sm:text-base">Security</h3>
          <div className="space-y-2 sm:space-y-3">
            <button className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-colors flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300 text-sm">Change Password</span>
              <span className="material-symbols-outlined text-slate-400 text-lg sm:text-xl">chevron_right</span>
            </button>
            <button className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-colors flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300 text-sm">Two-Factor Authentication</span>
              <span className="material-symbols-outlined text-slate-400 text-lg sm:text-xl">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <button className="w-full py-2.5 sm:py-3 bg-primary hover:brightness-110 text-background-dark font-bold rounded-xl transition-all text-sm sm:text-base">
        Save Changes
      </button>
    </div>
  );
}
