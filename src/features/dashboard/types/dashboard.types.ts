/**
 * Dashboard domain types
 *
 * Shared between the customer dashboard page, hook, and components.
 * Matches the shape returned by /api/v1/dashboard/customer.
 */

export type TransactionDisplayStatus =
  | "Verified"
  | "Pending"
  | "Processing"
  | "Failed";

export interface DashboardTransaction {
  id: string;
  merchant: string;
  purpose: string;
  term: string;
  date: string;
  amount: string;
  status: TransactionDisplayStatus;
}

export interface DashboardReference {
  id: string;
  title: string;
  ref: string;
  icon: string;
}

export interface DashboardStats {
  pendingApprovals: number;
  totalSpent: string;
  primaryMerchant: string;
}

export interface DashboardUser {
  name: string;
  userId: string;
  email: string;
}

export interface CustomerDashboardData {
  stats: DashboardStats;
  references: DashboardReference[];
  transactions: DashboardTransaction[];
  user: DashboardUser;
}
