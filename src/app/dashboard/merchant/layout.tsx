"use client";

import { MerchantLayout } from "@/shared/components/layout/MerchantLayout";
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
