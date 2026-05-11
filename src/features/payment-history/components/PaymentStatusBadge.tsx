import { Badge } from '@/shared/components/ui/Badge';
import type { PaymentStatus } from '@/shared/types/common.types';

const variantMap: Record<PaymentStatus, 'success' | 'warning' | 'danger' | 'neutral' | 'info'> = {
  COMPLETED: 'success',
  PENDING: 'warning',
  PROCESSING: 'info',
  FAILED: 'danger',
  EXPIRED: 'neutral',
};

const labelMap: Record<PaymentStatus, string> = {
  COMPLETED: 'Completed',
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  FAILED: 'Failed',
  EXPIRED: 'Expired',
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>;
}
