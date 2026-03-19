import { CustomerDashboardShell, CustomerDashboardData } from "@/components/dashboard/CustomerDashboardShell";

const EMPTY_DATA: CustomerDashboardData = {
  userName: null,           // TODO: replace with session user name
  pendingApprovals: null,   // TODO: replace with DB query
  verifiedThisSemester: null,
  primaryMerchant: null,
  activeReferences: [],     // TODO: replace with DB query
  recentTransactions: [],   // TODO: replace with DB query
};

export default function CustomerDashboard() {
  return <CustomerDashboardShell data={EMPTY_DATA} />;
}
