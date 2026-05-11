"use client";

import { CustomerLayout } from "@/shared/components/layout/CustomerLayout";

export default function CustomerLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CustomerLayout>{children}</CustomerLayout>;
}
