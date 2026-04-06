"use client";

import { MerchantLayout } from "@/components/dashboard/MerchantLayout";

export default function MerchantLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MerchantLayout>{children}</MerchantLayout>;
}
