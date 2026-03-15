import { STATUS_LABELS } from '../types/account';
import './StatusBadge.css';

interface StatusBadgeProps {
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: 'blue',
  PENDING_KYC: 'orange',
  ACTIVE: 'green',
  RESTRICTED: 'yellow',
  SUSPENDED: 'red',
  CLOSED: 'gray',
  TERMINATED: 'dark',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const color = STATUS_COLORS[status] || 'gray';
  const label = STATUS_LABELS[status] || status;

  return (
    <span className={`status-badge status-${color}`}>
      {label}
    </span>
  );
}
