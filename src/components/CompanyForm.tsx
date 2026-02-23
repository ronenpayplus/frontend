import { useState } from 'react';
import type { CreateCompanyRequest, UpdateCompanyRequest, Company } from '../types/company';
import {
  COMPANY_STATUSES,
  COMPANY_TYPES,
  BUSINESS_TYPES,
  PLATFORM_ACCOUNT_TYPES,
  CONTRACT_TYPES,
  RISK_PROFILES,
  KYC_STATUSES,
  AML_STATUSES,
  VOLUME_TIERS,
  STATUS_LABELS,
  COMPANY_TYPE_LABELS,
  BUSINESS_TYPE_LABELS,
  RISK_PROFILE_LABELS,
  VOLUME_TIER_LABELS,
  MOCK_CURRENCIES,
  MOCK_COUNTRIES,
  MOCK_TIMEZONES,
} from '../types/company';
import './CompanyForm.css';

interface CompanyFormProps {
  company?: Company;
  onSubmit: (data: CreateCompanyRequest | UpdateCompanyRequest) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
  loading?: boolean;
}

export default function CompanyForm({ company, onSubmit, onCancel, isEdit, loading }: CompanyFormProps) {
  const [form, setForm] = useState({
    name: company?.name || '',
    number: company?.number || '',
    status: company?.status || 'NEW',
    company_type: company?.company_type || '',
    business_type: company?.business_type || '',
    platform_account_type: company?.platform_account_type || '',
    contract_type: company?.contract_type || '',
    default_currency: company?.default_currency || '',
    default_country: company?.default_country || '',
    timezone: company?.timezone || '',
    mcc: company?.mcc || '',
    high_risk_merchant: company?.high_risk_merchant || false,
    is_blocked: company?.is_blocked || false,
    risk_profile: company?.risk_profile || '',
    kyc_status: company?.kyc_status || '',
    aml_status: company?.aml_status || '',
    website: company?.website || '',
    support_email: company?.support_email || '',
    support_phone: company?.support_phone || '',
    volume_tier: company?.volume_tier || '',
    monthly_volume_limit: company?.monthly_volume_limit ?? '',
    message_for_client: company?.message_for_client || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const autoFill = () => {
    const rand = Math.floor(Math.random() * 9000) + 1000;
    setForm({
      name: `חברת טסט ${rand}`,
      number: `TST-${rand}`,
      status: 'NEW',
      company_type: 'operating_company',
      business_type: 'company',
      platform_account_type: 'standard',
      contract_type: 'direct',
      default_currency: 'ILS',
      default_country: 'IL',
      timezone: 'Asia/Jerusalem',
      mcc: '5411',
      high_risk_merchant: false,
      is_blocked: false,
      risk_profile: 'low',
      kyc_status: '',
      aml_status: '',
      website: `https://test-${rand}.co.il`,
      support_email: `support@test-${rand}.co.il`,
      support_phone: `+972-3-${rand}-000`,
      volume_tier: 'growth',
      monthly_volume_limit: 500000,
      message_for_client: 'ברוכים הבאים למערכת',
    });
    setErrors({});
  };

  const set = (field: string, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'שם חובה';
    if (!form.number.trim()) errs.number = 'מספר חובה';
    if (!form.company_type) errs.company_type = 'סוג חברה חובה';
    if (!form.default_currency) errs.default_currency = 'מטבע חובה';
    if (!form.default_country) errs.default_country = 'מדינה חובה';
    if (!form.timezone) errs.timezone = 'אזור זמן חובה';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: Record<string, unknown> = { ...form };
    if (data.monthly_volume_limit === '' || data.monthly_volume_limit === 0) {
      delete data.monthly_volume_limit;
    } else {
      data.monthly_volume_limit = Number(data.monthly_volume_limit);
    }

    if (!isEdit) {
      delete data.status;
      delete data.is_blocked;
      delete data.kyc_status;
      delete data.aml_status;
    }

    await onSubmit(data as unknown as CreateCompanyRequest | UpdateCompanyRequest);
  };

  return (
    <form className="company-form" onSubmit={handleSubmit}>
      {!isEdit && (
        <div className="auto-fill-bar">
          <button type="button" className="btn btn-auto-fill" onClick={autoFill}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            מילוי אוטומטי לבדיקה
          </button>
        </div>
      )}

      <div className="form-section">
        <h3 className="section-title">פרטי חברה</h3>
        <div className="form-grid">
          <div className={`form-field ${errors.name ? 'has-error' : ''}`}>
            <label className="label">שם החברה *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="הזן שם חברה"
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className={`form-field ${errors.number ? 'has-error' : ''}`}>
            <label className="label">מספר חברה *</label>
            <input
              className="input"
              value={form.number}
              onChange={(e) => set('number', e.target.value)}
              placeholder="הזן מספר חברה"
            />
            {errors.number && <span className="field-error">{errors.number}</span>}
          </div>

          {isEdit && (
            <div className="form-field">
              <label className="label">סטטוס</label>
              <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
                {COMPANY_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
                ))}
              </select>
            </div>
          )}

          <div className={`form-field ${errors.company_type ? 'has-error' : ''}`}>
            <label className="label">סוג חברה *</label>
            <select className="input" value={form.company_type} onChange={(e) => set('company_type', e.target.value)}>
              <option value="">בחר סוג חברה</option>
              {COMPANY_TYPES.map((t) => (
                <option key={t} value={t}>{COMPANY_TYPE_LABELS[t] || t}</option>
              ))}
            </select>
            {errors.company_type && <span className="field-error">{errors.company_type}</span>}
          </div>

          <div className="form-field">
            <label className="label">סוג עסק</label>
            <select className="input" value={form.business_type} onChange={(e) => set('business_type', e.target.value)}>
              <option value="">בחר סוג עסק</option>
              {BUSINESS_TYPES.map((t) => (
                <option key={t} value={t}>{BUSINESS_TYPE_LABELS[t] || t}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="label">סוג חשבון פלטפורמה</label>
            <select className="input" value={form.platform_account_type} onChange={(e) => set('platform_account_type', e.target.value)}>
              <option value="">בחר סוג חשבון</option>
              {PLATFORM_ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="label">סוג חוזה</label>
            <select className="input" value={form.contract_type} onChange={(e) => set('contract_type', e.target.value)}>
              <option value="">בחר סוג חוזה</option>
              {CONTRACT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-title">הגדרות אזוריות</h3>
        <div className="form-grid">
          <div className={`form-field ${errors.default_currency ? 'has-error' : ''}`}>
            <label className="label">מטבע ברירת מחדל *</label>
            <select className="input" value={form.default_currency} onChange={(e) => set('default_currency', e.target.value)}>
              <option value="">בחר מטבע</option>
              {MOCK_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
              ))}
            </select>
            {errors.default_currency && <span className="field-error">{errors.default_currency}</span>}
          </div>

          <div className={`form-field ${errors.default_country ? 'has-error' : ''}`}>
            <label className="label">מדינה ברירת מחדל *</label>
            <select className="input" value={form.default_country} onChange={(e) => set('default_country', e.target.value)}>
              <option value="">בחר מדינה</option>
              {MOCK_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
              ))}
            </select>
            {errors.default_country && <span className="field-error">{errors.default_country}</span>}
          </div>

          <div className={`form-field ${errors.timezone ? 'has-error' : ''}`}>
            <label className="label">אזור זמן *</label>
            <select className="input" value={form.timezone} onChange={(e) => set('timezone', e.target.value)}>
              <option value="">בחר אזור זמן</option>
              {MOCK_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
            {errors.timezone && <span className="field-error">{errors.timezone}</span>}
          </div>

          <div className="form-field">
            <label className="label">קוד MCC</label>
            <input
              className="input"
              value={form.mcc}
              onChange={(e) => set('mcc', e.target.value)}
              placeholder="למשל 5411"
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-title">סיכון וציות</h3>
        <div className="form-grid">
          <div className="form-field">
            <label className="label">פרופיל סיכון</label>
            <select className="input" value={form.risk_profile} onChange={(e) => set('risk_profile', e.target.value)}>
              <option value="">בחר פרופיל</option>
              {RISK_PROFILES.map((r) => (
                <option key={r} value={r}>{RISK_PROFILE_LABELS[r] || r}</option>
              ))}
            </select>
          </div>

          {isEdit && (
            <>
              <div className="form-field">
                <label className="label">סטטוס KYC</label>
                <select className="input" value={form.kyc_status} onChange={(e) => set('kyc_status', e.target.value)}>
                  <option value="">בחר סטטוס</option>
                  {KYC_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="label">סטטוס AML</label>
                <select className="input" value={form.aml_status} onChange={(e) => set('aml_status', e.target.value)}>
                  <option value="">בחר סטטוס</option>
                  {AML_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="form-field">
            <label className="label">שכבת נפח</label>
            <select className="input" value={form.volume_tier} onChange={(e) => set('volume_tier', e.target.value)}>
              <option value="">בחר שכבה</option>
              {VOLUME_TIERS.map((v) => (
                <option key={v} value={v}>{VOLUME_TIER_LABELS[v] || v}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="label">מגבלת נפח חודשית</label>
            <input
              className="input"
              type="number"
              value={form.monthly_volume_limit}
              onChange={(e) => set('monthly_volume_limit', e.target.value)}
              placeholder="ללא מגבלה"
            />
          </div>

          <div className="form-field toggle-field">
            <label className="toggle-label">
              <div className={`toggle ${form.high_risk_merchant ? 'active' : ''}`} onClick={() => set('high_risk_merchant', !form.high_risk_merchant)}>
                <div className="toggle-knob" />
              </div>
              <span>סוחר בסיכון גבוה</span>
            </label>
          </div>

          {isEdit && (
            <div className="form-field toggle-field">
              <label className="toggle-label">
                <div className={`toggle ${form.is_blocked ? 'active danger' : ''}`} onClick={() => set('is_blocked', !form.is_blocked)}>
                  <div className="toggle-knob" />
                </div>
                <span>חסום</span>
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-title">פרטי קשר ותמיכה</h3>
        <div className="form-grid">
          <div className="form-field">
            <label className="label">אתר אינטרנט</label>
            <input
              className="input ltr-input"
              value={form.website}
              onChange={(e) => set('website', e.target.value)}
              placeholder="https://example.com"
              dir="ltr"
            />
          </div>

          <div className="form-field">
            <label className="label">אימייל תמיכה</label>
            <input
              className="input ltr-input"
              type="email"
              value={form.support_email}
              onChange={(e) => set('support_email', e.target.value)}
              placeholder="support@example.com"
              dir="ltr"
            />
          </div>

          <div className="form-field">
            <label className="label">טלפון תמיכה</label>
            <input
              className="input ltr-input"
              value={form.support_phone}
              onChange={(e) => set('support_phone', e.target.value)}
              placeholder="+972-XX-XXX-XXXX"
              dir="ltr"
            />
          </div>

          <div className="form-field span-full">
            <label className="label">הודעה ללקוח</label>
            <textarea
              className="input textarea"
              value={form.message_for_client}
              onChange={(e) => set('message_for_client', e.target.value)}
              placeholder="הודעה שתוצג ללקוח"
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            <>
              <div className="spinner spinner-sm" />
              שומר...
            </>
          ) : (
            isEdit ? 'עדכון' : 'יצירה'
          )}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          ביטול
        </button>
      </div>
    </form>
  );
}
