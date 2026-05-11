import { useQuery } from '@tanstack/react-query';
import { fetchAdminOrders } from '../api/admin.api';
import type { AdminOrderFilters } from '../types/admin.types';

export function useAdminOrders(filters: AdminOrderFilters) {
  return useQuery({
    queryKey: ['admin-orders', filters],
    queryFn: () => fetchAdminOrders(filters),
    staleTime: 30 * 1000,
  });
}
