import { AdminLayout } from "@/components/dashboard/AdminLayout";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}