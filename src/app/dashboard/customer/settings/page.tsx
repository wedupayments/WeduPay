"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/auth-service";

const countryOptions = [
  { code: "ZW", label: "Zimbabwe" },
  { code: "KE", label: "Kenya" },
  { code: "NG", label: "Nigeria" },
  { code: "GH", label: "Ghana" },
  { code: "UG", label: "Uganda" },
  { code: "TZ", label: "Tanzania" },
];

type NotificationTypes = {
  transferConfirmation: boolean;
  transferCompleted: boolean;
  transferFailed: boolean;
  securityAlert: boolean;
  marketing: boolean;
  lowBalanceAlert: boolean;
};

export default function SettingsPage() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [country, setCountry] = useState("ZW");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [notificationTypes, setNotificationTypes] = useState<NotificationTypes>({
    transferConfirmation: true,
    transferCompleted: true,
    transferFailed: true,
    securityAlert: true,
    marketing: false,
    lowBalanceAlert: true,
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [profileResponse, preferencesResponse] = await Promise.all([
          fetch("/api/auth/user"),
          fetch("/api/v1/notifications/preferences"),
        ]);

        const profileData = await profileResponse.json();
        const preferencesData = await preferencesResponse.json();

        if (!profileResponse.ok || !profileData.success) {
          throw new Error(profileData.error || "Failed to load profile");
        }

        if (!preferencesResponse.ok || !preferencesData.success) {
          throw new Error(preferencesData.error || "Failed to load notification preferences");
        }

        setEmail(profileData.user.email ?? "");
        setPhoneNumber(profileData.user.phoneNumber ?? "");
        setCountry(profileData.user.country ?? "ZW");
        setEmailEnabled(preferencesData.preferences.emailEnabled ?? true);
        setSmsEnabled(preferencesData.preferences.smsEnabled ?? true);
        setNotificationTypes({
          transferConfirmation: preferencesData.preferences.types.transferConfirmation ?? true,
          transferCompleted: preferencesData.preferences.types.transferCompleted ?? true,
          transferFailed: preferencesData.preferences.types.transferFailed ?? true,
          securityAlert: preferencesData.preferences.types.securityAlert ?? true,
          marketing: preferencesData.preferences.types.marketing ?? false,
          lowBalanceAlert: preferencesData.preferences.types.lowBalanceAlert ?? true,
        });
      } catch (error) {
        toast.error("Unable to load settings", error instanceof Error ? error.message : "Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [toast]);

  const handleToggle = (key: keyof NotificationTypes) => {
    setNotificationTypes((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const handleSave = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Phone number required", "Please enter a valid phone number.");
      return;
    }

    if (newPassword && newPassword.length < 8) {
      toast.error("Weak password", "Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match", "Please confirm your new password.");
      return;
    }

    setIsSaving(true);

    try {
      const [profileResponse, preferencesResponse] = await Promise.all([
        fetch("/api/auth/user", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber, country }),
        }),
        fetch("/api/v1/notifications/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailEnabled,
            smsEnabled,
            types: notificationTypes,
          }),
        }),
      ]);

      const profileData = await profileResponse.json();
      const preferencesData = await preferencesResponse.json();

      if (!profileResponse.ok || !profileData.success) {
        throw new Error(profileData.error || "Failed to update profile");
      }

      if (!preferencesResponse.ok || !preferencesData.success) {
        throw new Error(preferencesData.error || "Failed to update preferences");
      }

      if (newPassword) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          throw error;
        }
      }

      setNewPassword("");
      setConfirmPassword("");
      toast.success("Settings saved", "Your profile and notification preferences are up to date.");
    } catch (error) {
      toast.error("Save failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 lg:pb-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Account settings</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">Update your profile, notification preferences, and password.</p>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Profile</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-400">Email</label>
              <input value={email} disabled className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-400">Phone number</label>
              <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-background-dark dark:text-white" placeholder="+263771234567" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-400">Country</label>
              <select value={country} onChange={(event) => setCountry(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-background-dark dark:text-white">
                {countryOptions.map((option) => (
                  <option key={option.code} value={option.code}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Notifications</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
              <span className="text-sm text-slate-700 dark:text-slate-300">Email notifications</span>
              <input type="checkbox" checked={emailEnabled} onChange={() => setEmailEnabled((current) => !current)} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
              <span className="text-sm text-slate-700 dark:text-slate-300">SMS alerts</span>
              <input type="checkbox" checked={smsEnabled} onChange={() => setSmsEnabled((current) => !current)} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
            </label>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              ["transferConfirmation", "Transfer confirmation"],
              ["transferCompleted", "Transfer completed"],
              ["transferFailed", "Transfer failed"],
              ["securityAlert", "Security alerts"],
              ["marketing", "Product updates"],
              ["lowBalanceAlert", "Low balance alerts"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
                <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                <input
                  type="checkbox"
                  checked={notificationTypes[key as keyof NotificationTypes]}
                  onChange={() => handleToggle(key as keyof NotificationTypes)}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Change password</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-400">New password</label>
              <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-background-dark dark:text-white" placeholder="At least 8 characters" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-400">Confirm password</label>
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-background-dark dark:text-white" placeholder="Repeat new password" />
            </div>
          </div>
        </section>
      </div>

      <button onClick={handleSave} disabled={isSaving} className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-background-dark transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
        {isSaving ? "Saving changes..." : "Save changes"}
      </button>
    </div>
  );
}
