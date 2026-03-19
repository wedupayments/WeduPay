import { AdminDashboardShell, AdminDashboardData } from "@/components/dashboard/AdminDashboardShell";

const DEMO_DATA: AdminDashboardData = {
  dailyVolume: "$1.24M",
  dailyDelta: "+12.5%",
  monthlyVolume: "$34.82M",
  monthlyDelta: "+8.2%",
  activeMerchants: 1240,
  merchantsDelta: "+4.1%",
  walletProviders: 12,
  networkProviders: [
    { name: "EcoCash", code: "EC", status: "Connected", vol: "$450k", color: "text-primary" },
    { name: "Mukuru", code: "MK", status: "Connected", vol: "$320k", color: "text-primary" },
    { name: "OneMoney", code: "OM", status: "Maintenance", vol: "$0", color: "text-yellow-500" },
  ],
  recentFlows: [
    { merchant: "Acme Retail Ltd", code: "AR", channel: "EcoCash Wallet", amount: "$14,200.00", status: "COMPLETED", statusColor: "text-primary bg-primary/10", time: "2 mins ago" },
    { merchant: "Sunrise Electronics", code: "SE", channel: "Mukuru Cash", amount: "$8,540.50", status: "COMPLETED", statusColor: "text-primary bg-primary/10", time: "12 mins ago" },
    { merchant: "Global Expeditions", code: "GE", channel: "International Card", amount: "$25,000.00", status: "PENDING", statusColor: "text-yellow-500 bg-yellow-500/10", time: "45 mins ago" },
  ],
};

export default function AdminDemoPage() {
  return <AdminDashboardShell data={DEMO_DATA} isDemo />;
}
