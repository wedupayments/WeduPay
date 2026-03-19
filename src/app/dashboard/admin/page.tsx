import { AdminDashboardShell, AdminDashboardData } from "@/components/dashboard/AdminDashboardShell";

const EMPTY_DATA: AdminDashboardData = {
  dailyVolume: null,
  dailyDelta: null,
  monthlyVolume: null,
  monthlyDelta: null,
  activeMerchants: null,
  merchantsDelta: null,
  walletProviders: null,
  // TODO: replace with DB query — e.g. prisma.walletProvider.findMany()
  networkProviders: [
    { name: "EcoCash", code: "EC", status: "Connected", vol: null, color: "text-primary" },
    { name: "Mukuru", code: "MK", status: "Connected", vol: null, color: "text-primary" },
    { name: "OneMoney", code: "OM", status: "Maintenance", vol: null, color: "text-yellow-500" },
  ],
  recentFlows: [], // TODO: replace with DB query
};

export default function AdminDashboard() {
  return <AdminDashboardShell data={EMPTY_DATA} />;
}
