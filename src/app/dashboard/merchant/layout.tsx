"use client";

import { MerchantLayout } from "@/components/dashboard/MerchantLayout";
import { DashboardErrorBoundary } from "@/components/dashboard/DashboardErrorBoundary";

export default function MerchantLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MerchantLayout>
      <DashboardErrorBoundary>
        {children}
      </DashboardErrorBoundary>
    </MerchantLayout>
  );
}
