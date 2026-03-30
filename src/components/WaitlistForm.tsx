"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface WaitlistFormProps {
  type: "MERCHANT" | "STUDENT";
  buttonText: string;
  className?: string;
  showNameField?: boolean;
}

export function WaitlistForm({ type, buttonText, className, showNameField = false }: WaitlistFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type, name: showNameField ? name : undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to join waitlist");
      }

      setMessage({ text: data.message || "Success! You've been added to the waitlist.", success: true });
      setEmail("");
      setName("");
      
      // Redirect to dashboard after successful signup
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage({ text: err.message, success: false });
      } else {
        setMessage({ text: "An unknown error occurred", success: false });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {showNameField && (
          <input
            type="text"
            placeholder="Your name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-white/15 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          />
        )}
        <div className={`flex ${showNameField ? "" : "flex-col sm:flex-row"} gap-3`}>
          <input
            type="email"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-white/15 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 whitespace-nowrap flex items-center justify-center px-5 py-3 bg-primary text-background-dark font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Joining..." : buttonText}
          </button>
        </div>
      </form>
      {message && (
        <p className={`mt-3 text-sm font-medium ${message.success ? "text-primary" : "text-red-500"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
