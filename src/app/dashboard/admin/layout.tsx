import { AdminLayout } from "@/shared/components/layout/AdminLayout";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}