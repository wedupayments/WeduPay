import { CustomerDashboardShell, CustomerDashboardData } from "@/components/dashboard/CustomerDashboardShell";

const DEMO_DATA: CustomerDashboardData = {
  userName: "Alex",
  pendingApprovals: 2,
  verifiedThisSemester: "$1,240.00",
  primaryMerchant: "BYU-Pathway",
  activeReferences: [
    { title: "BYU-Pathway Worldwide", ref: "BYU-2024-88291", icon: "school" },
    { title: "Course Materials Fund", ref: "MAT-BK-2024", icon: "menu_book" },
  ],
  recentTransactions: [
    { purpose: "BYU-Pathway Tuition", term: "Winter 2024", date: "Oct 12, 2024", amount: "$450.00", status: "Verified", statusColor: "bg-primary text-primary" },
    { purpose: "Application Fee", term: "Global Enrollment", date: "Oct 10, 2024", amount: "$35.00", status: "Pending", statusColor: "bg-orange-500 text-orange-500" },
    { purpose: "BYU-Pathway Tuition", term: "Fall 2023", date: "Sep 15, 2023", amount: "$755.00", status: "Verified", statusColor: "bg-primary text-primary" },
  ],
};

export default function CustomerDemoPage() {
  return <CustomerDashboardShell data={DEMO_DATA} isDemo />;
}
