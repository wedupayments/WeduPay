"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";

interface KycPayload {
  status: string;
  country: string;
  submission: {
    fullName?: string;
    documentType?: string;
    documentNumber?: string;
    submittedAt?: string;
  } | null;
}

const countryOptions = [
  { code: "ZW", label: "Zimbabwe" },
  { code: "KE", label: "Kenya" },
  { code: "NG", label: "Nigeria" },
  { code: "GH", label: "Ghana" },
  { code: "UG", label: "Uganda" },
  { code: "TZ", label: "Tanzania" },
];

export default function KycPage() {
  const toast = useToast();
  const { isInitialized, isLoading: authLoading, session } = useAuth();
  const [kyc, setKyc] = useState<KycPayload | null>(null);
  const [fullName, setFullName] = useState("");
  const [documentType, setDocumentType] = useState("PASSPORT");
  const [documentNumber, setDocumentNumber] = useState("");
  const [country, setCountry] = useState("ZW");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Wait for auth to initialize before making API calls
    if (!isInitialized || authLoading || !session) {
      return;
    }

    const loadKyc = async () => {
      try {
        const response = await fetch("/api/v1/kyc/status");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to load KYC status");
        }

        setKyc(data.kyc);
        setCountry(data.kyc.country || "ZW");
        if (data.kyc.submission?.fullName) {
          setFullName(data.kyc.submission.fullName);
        }
        if (data.kyc.submission?.documentType) {
          setDocumentType(data.kyc.submission.documentType);
        }
        if (data.kyc.submission?.documentNumber) {
          setDocumentNumber(data.kyc.submission.documentNumber);
        }
      } catch (error) {
        toast.error("Unable to load KYC", error instanceof Error ? error.message : "Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadKyc();
  }, [isInitialized, authLoading, session, toast]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/kyc/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          documentType,
          documentNumber,
          country,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to submit KYC");
      }

      toast.success("KYC submitted", data.message || "Your verification details are under review.");
      setKyc({
        status: "pending",
        country,
        submission: {
          fullName,
          documentType,
          documentNumber,
          submittedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      toast.error("KYC submission failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">KYC verification</h1>
        <p className="text-slate-600 dark:text-slate-400">Keep your account compliant and unlock higher transfer limits.</p>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark p-8 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark p-6 shadow-sm">
            <p className="text-sm uppercase tracking-wide text-slate-500">Current status</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                {(kyc?.status ?? "pending").toUpperCase()}
              </span>
              {kyc?.submission?.submittedAt ? (
                <span className="text-sm text-slate-500">
                  Submitted {new Date(kyc.submission.submittedAt).toLocaleString()}
                </span>
              ) : null}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-primary/5">
                <p className="text-xs uppercase tracking-wide text-slate-500">Benefit</p>
                <p className="mt-2 font-semibold text-slate-900 dark:text-white">Higher transfer limits</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-primary/5">
                <p className="text-xs uppercase tracking-wide text-slate-500">Benefit</p>
                <p className="mt-2 font-semibold text-slate-900 dark:text-white">Faster compliance reviews</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-primary/5">
                <p className="text-xs uppercase tracking-wide text-slate-500">Provider</p>
                <p className="mt-2 font-semibold text-slate-900 dark:text-white">Didit integration prep</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 dark:border-primary/10 bg-white dark:bg-background-dark p-6 shadow-sm space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Full name</label>
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-background-dark dark:text-white" placeholder="Your legal name" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Country</label>
                <select value={country} onChange={(event) => setCountry(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-background-dark dark:text-white">
                  {countryOptions.map((option) => (
                    <option key={option.code} value={option.code}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Document type</label>
                <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-background-dark dark:text-white">
                  <option value="PASSPORT">Passport</option>
                  <option value="NATIONAL_ID">National ID</option>
                  <option value="DRIVERS_LICENSE">Driver&apos;s license</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Document number</label>
                <input value={documentNumber} onChange={(event) => setDocumentNumber(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-background-dark dark:text-white" placeholder="Document number" />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-background-dark transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? "Submitting KYC..." : "Submit KYC details"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
