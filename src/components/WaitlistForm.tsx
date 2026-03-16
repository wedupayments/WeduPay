"use client";

import { useState } from "react";

interface WaitlistFormProps {
  type: "MERCHANT" | "STUDENT";
  buttonText: string;
  className?: string;
}

export function WaitlistForm({ type, buttonText, className }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
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
        body: JSON.stringify({ email, type }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to join waitlist");
      }

      setMessage({ text: "Success! You've been added to the waitlist.", success: true });
      setEmail("");
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
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          placeholder="Enter your email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-primary/20 bg-background-light dark:bg-background-dark focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center px-6 py-3 bg-primary text-background-dark font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Joining..." : buttonText}
        </button>
      </form>
      {message && (
        <p className={`mt-3 text-sm font-medium ${message.success ? "text-primary" : "text-red-500"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
