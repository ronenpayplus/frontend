import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAccount, deleteAccount } from '../api/accounts';
import type { Account } from '../types/account';
import {
  BUSINESS_TYPE_LABELS,
  RISK_PROFILE_LABELS,
  VOLUME_TIER_LABELS,
} from '../types/account';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './AccountDetail.css';

export default function AccountDetail() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    if (!uuid) return;
    setLoading(true);
    getAccount(uuid)
      .then((data) => setAccount(data.account))
      .catch((err) => {
        console.error(err);
        addToast('Failed to load account details', 'error');
      })
      .finally(() => setLoading(false));
  }, [uuid, addToast]);

  const handleDelete = async () => {
    if (!uuid) return;
    try {
      await deleteAccount(uuid);
      addToast('Account deleted successfully', 'success');
      setTimeout(() => navigate('/accounts'), 500);
    } catch {
      addToast('Failed to delete account', 'error');
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>Loading account details...</span>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="empty-state">
        <p>Account not found</p>
        <button className="btn btn-primary" onClick={() => navigate('/accounts')}>
          Back to list
        </button>
      </div>
    );
  }

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('he-IL', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : '—';

  return (
    <div className="account-detail-page">
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => navigate('/accounts')}>Accounts</button>
        <span className="breadcrumb-sep">/</span>
        <span>{account.name}</span>
      </div>

      <div className="detail-header">
        <div className="detail-header-info">
          <div className="detail-title-row">
            <h1 className="page-title">{account.name}</h1>
            <StatusBadge status={account.status} />
            {account.is_blocked && <span className="blocked-badge">Blocked</span>}
          </div>
          <p className="detail-uuid">{account.uuid}</p>
        </div>
        <div className="detail-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate(`/accounts/${uuid}/legal-entities`)}>
            Legal Entities
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(`/accounts/${uuid}/contacts`)}>
            Contacts
          </button>
          <button className="btn btn-primary" onClick={() => navigate(`/accounts/${uuid}/edit`)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
          <button className="btn btn-outline btn-danger-outline" onClick={() => setShowDelete(true)}>
            Delete
          </button>
        </div>
      </div>

      <div className="detail-sections">
        <div className="detail-card">
          <h3 className="section-title">Account Details</h3>
          <div className="detail-grid">
            <DetailItem label="Number" value={account.number} mono />
            <DetailItem label="Account Type" value={account.account_type} />
            <DetailItem label="Business Type" value={BUSINESS_TYPE_LABELS[account.business_type || ''] || account.business_type} />
            {account.business_type === 'individual' && (
              <>
                <DetailItem label="First Name" value={account.first_name} />
                <DetailItem label="Last Name" value={account.last_name} />
              </>
            )}
            <DetailItem label="Industry" value={account.industry} />
            <DetailItem label="Platform Account Type" value={account.platform_account_type} />
            <DetailItem label="Contract Type" value={account.contract_type} />
          </div>
        </div>

        <div className="detail-card">
          <h3 className="section-title">Regional Settings</h3>
          <div className="detail-grid">
            <DetailItem label="Currency" value={account.default_currency} mono />
            <DetailItem label="Country" value={account.default_country} mono />
            <DetailItem label="Timezone" value={account.timezone} mono />
            <DetailItem label="MCC Code" value={account.mcc} mono />
          </div>
        </div>

        <div className="detail-card">
          <h3 className="section-title">Risk & Compliance</h3>
          <div className="detail-grid">
            <DetailItem label="Risk Profile" value={RISK_PROFILE_LABELS[account.risk_profile || ''] || account.risk_profile} />
            <DetailItem label="High Risk Merchant" value={account.high_risk_merchant ? 'Yes' : 'No'} />
            <DetailItem label="KYC Status" value={account.kyc_status} />
            <DetailItem label="AML Status" value={account.aml_status} />
            <DetailItem label="Volume Tier" value={VOLUME_TIER_LABELS[account.volume_tier || ''] || account.volume_tier} />
            <DetailItem label="Monthly Volume Limit" value={account.monthly_volume_limit?.toLocaleString()} />
          </div>
        </div>

        <div className="detail-card">
          <h3 className="section-title">Contact & Support</h3>
          <div className="detail-grid">
            <DetailItem label="Website" value={account.website} ltr />
            <DetailItem label="Support Email" value={account.support_email} ltr />
            <DetailItem label="Support Phone" value={account.support_phone} ltr />
            {account.message_for_client && (
              <div className="detail-item span-full">
                <span className="detail-label">Customer Message</span>
                <span className="detail-value">{account.message_for_client}</span>
              </div>
            )}
          </div>
        </div>

        <div className="detail-card">
          <h3 className="section-title">System Information</h3>
          <div className="detail-grid">
            <DetailItem label="Created" value={formatDate(account.created_at)} />
            <DetailItem label="Updated" value={formatDate(account.updated_at)} />
            <DetailItem label="Activated" value={formatDate(account.activated_at)} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete Account"
        message={`Are you sure you want to delete "${account.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

function DetailItem({ label, value, mono, ltr }: { label: string; value?: string | number; mono?: boolean; ltr?: boolean }) {
  return (
    <div className="detail-item">
      <span className="detail-label">{label}</span>
      <span className={`detail-value ${mono ? 'mono' : ''} ${ltr ? 'ltr' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}
