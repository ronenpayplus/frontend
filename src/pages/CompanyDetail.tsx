import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCompany, deleteCompany } from '../api/companies';
import type { Company } from '../types/company';
import {
  COMPANY_TYPE_LABELS,
  BUSINESS_TYPE_LABELS,
  RISK_PROFILE_LABELS,
  VOLUME_TIER_LABELS,
} from '../types/company';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './CompanyDetail.css';

export default function CompanyDetail() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    if (!uuid) return;
    setLoading(true);
    getCompany(uuid)
      .then((data) => setCompany(data.company))
      .catch((err) => {
        console.error(err);
        addToast('שגיאה בטעינת פרטי החברה', 'error');
      })
      .finally(() => setLoading(false));
  }, [uuid, addToast]);

  const handleDelete = async () => {
    if (!uuid) return;
    try {
      await deleteCompany(uuid);
      addToast('החברה נמחקה בהצלחה', 'success');
      setTimeout(() => navigate('/companies'), 500);
    } catch {
      addToast('שגיאה במחיקת החברה', 'error');
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>טוען פרטי חברה...</span>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="empty-state">
        <p>החברה לא נמצאה</p>
        <button className="btn btn-primary" onClick={() => navigate('/companies')}>
          חזרה לרשימה
        </button>
      </div>
    );
  }

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('he-IL', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : '—';

  return (
    <div className="company-detail-page">
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => navigate('/companies')}>חברות</button>
        <span className="breadcrumb-sep">/</span>
        <span>{company.name}</span>
      </div>

      <div className="detail-header">
        <div className="detail-header-info">
          <div className="detail-title-row">
            <h1 className="page-title">{company.name}</h1>
            <StatusBadge status={company.status} />
            {company.is_blocked && <span className="blocked-badge">חסום</span>}
          </div>
          <p className="detail-uuid">{company.uuid}</p>
        </div>
        <div className="detail-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate(`/companies/${uuid}/legal-entities`)}>
            ישויות משפטיות
          </button>
          <button className="btn btn-primary" onClick={() => navigate(`/companies/${uuid}/edit`)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            עריכה
          </button>
          <button className="btn btn-outline btn-danger-outline" onClick={() => setShowDelete(true)}>
            מחיקה
          </button>
        </div>
      </div>

      <div className="detail-sections">
        <div className="detail-card">
          <h3 className="section-title">פרטי חברה</h3>
          <div className="detail-grid">
            <DetailItem label="מספר" value={company.number} mono />
            <DetailItem label="סוג חברה" value={COMPANY_TYPE_LABELS[company.company_type] || company.company_type} />
            <DetailItem label="סוג עסק" value={BUSINESS_TYPE_LABELS[company.business_type || ''] || company.business_type} />
            <DetailItem label="סוג חשבון פלטפורמה" value={company.platform_account_type} />
            <DetailItem label="סוג חוזה" value={company.contract_type} />
          </div>
        </div>

        <div className="detail-card">
          <h3 className="section-title">הגדרות אזוריות</h3>
          <div className="detail-grid">
            <DetailItem label="מטבע" value={company.default_currency} mono />
            <DetailItem label="מדינה" value={company.default_country} mono />
            <DetailItem label="אזור זמן" value={company.timezone} mono />
            <DetailItem label="קוד MCC" value={company.mcc} mono />
          </div>
        </div>

        <div className="detail-card">
          <h3 className="section-title">סיכון וציות</h3>
          <div className="detail-grid">
            <DetailItem label="פרופיל סיכון" value={RISK_PROFILE_LABELS[company.risk_profile || ''] || company.risk_profile} />
            <DetailItem label="סוחר בסיכון גבוה" value={company.high_risk_merchant ? 'כן' : 'לא'} />
            <DetailItem label="סטטוס KYC" value={company.kyc_status} />
            <DetailItem label="סטטוס AML" value={company.aml_status} />
            <DetailItem label="שכבת נפח" value={VOLUME_TIER_LABELS[company.volume_tier || ''] || company.volume_tier} />
            <DetailItem label="מגבלת נפח חודשית" value={company.monthly_volume_limit?.toLocaleString()} />
          </div>
        </div>

        <div className="detail-card">
          <h3 className="section-title">פרטי קשר ותמיכה</h3>
          <div className="detail-grid">
            <DetailItem label="אתר" value={company.website} ltr />
            <DetailItem label="אימייל תמיכה" value={company.support_email} ltr />
            <DetailItem label="טלפון תמיכה" value={company.support_phone} ltr />
            {company.message_for_client && (
              <div className="detail-item span-full">
                <span className="detail-label">הודעה ללקוח</span>
                <span className="detail-value">{company.message_for_client}</span>
              </div>
            )}
          </div>
        </div>

        <div className="detail-card">
          <h3 className="section-title">מידע על המערכת</h3>
          <div className="detail-grid">
            <DetailItem label="נוצר" value={formatDate(company.created_at)} />
            <DetailItem label="עודכן" value={formatDate(company.updated_at)} />
            <DetailItem label="הופעל" value={formatDate(company.activated_at)} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="מחיקת חברה"
        message={`האם אתה בטוח שברצונך למחוק את "${company.name}"? פעולה זו אינה הפיכה.`}
        confirmLabel="מחק"
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
