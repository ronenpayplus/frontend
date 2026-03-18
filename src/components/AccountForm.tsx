import { useEffect, useState } from 'react';
import type {
  CreateAccountRequest,
  UpdateAccountRequest,
  Account,
  AccountLocalizationInput,
} from '../types/account';
import {
  ACCOUNT_STATUSES,
  BUSINESS_TYPES,
  PLATFORM_ACCOUNT_TYPES,
  CONTRACT_TYPES,
  RISK_PROFILES,
  KYC_STATUSES,
  AML_STATUSES,
  VOLUME_TIERS,
  STATUS_LABELS,
  BUSINESS_TYPE_LABELS,
  RISK_PROFILE_LABELS,
  VOLUME_TIER_LABELS,
  MOCK_CURRENCIES,
  MOCK_COUNTRIES,
  MOCK_TIMEZONES,
} from '../types/account';
import './AccountForm.css';

interface AccountFormProps {
  account?: Account;
  initialLocalizations?: AccountLocalizationInput[];
  onSubmit: (data: CreateAccountRequest | UpdateAccountRequest) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
  loading?: boolean;
}

export default function AccountForm({
  account,
  initialLocalizations,
  onSubmit,
  onCancel,
  isEdit,
  loading,
}: AccountFormProps) {
  const buildDefaultLocalization = (
    sourceAccount?: Account,
  ): AccountLocalizationInput => ({
    lang_code: 'en',
    display_name: sourceAccount?.name || '',
    brand_name: '',
    legal_entity_name: '',
    settlement_descriptor: '',
    description: '',
    website_url: sourceAccount?.website || '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    support_email: sourceAccount?.support_email || '',
    support_phone: sourceAccount?.support_phone || '',
    receipt_header: '',
    receipt_footer: '',
    invoice_notes: '',
    is_default: true,
  });

  const [form, setForm] = useState({
    name: account?.name || '',
    first_name: account?.first_name || '',
    last_name: account?.last_name || '',
    number: account?.number || '',
    status: account?.status || 'NEW',
    account_type: account?.account_type || '',
    business_type: account?.business_type || '',
    platform_account_type: account?.platform_account_type || '',
    contract_type: account?.contract_type || '',
    default_currency: account?.default_currency || '',
    default_country: account?.default_country || '',
    timezone: account?.timezone || '',
    mcc: account?.mcc || '',
    industry: account?.industry || '',
    high_risk_merchant: account?.high_risk_merchant || false,
    is_blocked: account?.is_blocked || false,
    risk_profile: account?.risk_profile || '',
    kyc_status: account?.kyc_status || '',
    aml_status: account?.aml_status || '',
    website: account?.website || '',
    support_email: account?.support_email || '',
    support_phone: account?.support_phone || '',
    volume_tier: account?.volume_tier || '',
    monthly_volume_limit: account?.monthly_volume_limit ?? '',
    message_for_client: account?.message_for_client || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [localizations, setLocalizations] = useState<AccountLocalizationInput[]>(
    initialLocalizations && initialLocalizations.length > 0
      ? initialLocalizations
      : [buildDefaultLocalization(account)],
  );

  useEffect(() => {
    if (initialLocalizations && initialLocalizations.length > 0) {
      setLocalizations(initialLocalizations);
      return;
    }
    setLocalizations([buildDefaultLocalization(account)]);
  }, [initialLocalizations, account]);

  const autoFill = () => {
    const rand = Math.floor(Math.random() * 9000) + 1000;
    setForm({
      name: `Test Account ${rand}`,
      first_name: '',
      last_name: '',
      number: `TST-${rand}`,
      status: 'NEW',
      account_type: 'llc',
      business_type: 'company',
      platform_account_type: 'standard',
      contract_type: 'direct',
      default_currency: 'ILS',
      default_country: 'IL',
      timezone: 'Asia/Jerusalem',
      mcc: '5411',
      industry: 'fintech',
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
      message_for_client: 'Welcome to the system',
    });
    setErrors({});
    setLocalizations([
      {
        lang_code: 'en',
        display_name: `Test Account ${rand}`,
        brand_name: `Test Brand ${rand}`,
        legal_entity_name: '',
        settlement_descriptor: '',
        description: 'English localization',
        website_url: `https://test-${rand}.co.il`,
        contact_name: 'Support Team',
        contact_email: `support@test-${rand}.co.il`,
        contact_phone: `+972-3-${rand}-000`,
        support_email: `support@test-${rand}.co.il`,
        support_phone: `+972-3-${rand}-000`,
        receipt_header: 'Thank you for your purchase',
        receipt_footer: 'Need help? Contact support',
        invoice_notes: 'Generated automatically',
        is_default: true,
      },
      {
        lang_code: 'fr',
        display_name: `Societe Test ${rand}`,
        brand_name: `Marque Test ${rand}`,
        legal_entity_name: '',
        settlement_descriptor: '',
        description: 'French localization',
        website_url: `https://test-${rand}.co.il`,
        contact_name: 'Equipe Support',
        contact_email: `support@test-${rand}.co.il`,
        contact_phone: `+972-3-${rand}-000`,
        support_email: `support@test-${rand}.co.il`,
        support_phone: `+972-3-${rand}-000`,
        receipt_header: 'Merci pour votre achat',
        receipt_footer: 'Besoin d aide? Contactez le support',
        invoice_notes: 'Genere automatiquement',
        is_default: false,
      },
    ]);
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
    if (!form.name.trim()) errs.name = 'Name is required';
    if (form.business_type === 'individual') {
      if (!form.first_name.trim()) errs.first_name = 'First name is required for individuals';
      if (!form.last_name.trim()) errs.last_name = 'Last name is required for individuals';
    }
    if (!form.number.trim()) errs.number = 'Account number is required';
    if (!form.account_type) errs.account_type = 'Account type is required';
    if (!form.default_currency) errs.default_currency = 'Currency is required';
    if (!form.default_country) errs.default_country = 'Country is required';
    if (!form.timezone) errs.timezone = 'Timezone is required';
    if (localizations.length === 0) errs.localizations = 'At least one localization is required';
    const seenLangs = new Set<string>();
    let hasDefault = false;
    localizations.forEach((loc, index) => {
      const lang = loc.lang_code.trim().toLowerCase();
      if (!lang) errs[`localizations.${index}.lang_code`] = 'Language code is required';
      if (!loc.display_name.trim()) errs[`localizations.${index}.display_name`] = 'Display name is required';
      if (lang) {
        if (seenLangs.has(lang)) errs[`localizations.${index}.lang_code`] = 'Language must be unique';
        seenLangs.add(lang);
      }
      if (loc.is_default) hasDefault = true;
    });
    if (localizations.length > 0 && !hasDefault) errs.localizations_default = 'One localization must be default';
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

    const sanitizedLocalizations = localizations.map((loc) => ({
      lang_code: loc.lang_code.trim().toLowerCase(),
      display_name: loc.display_name.trim(),
      brand_name: loc.brand_name?.trim() || undefined,
      legal_entity_name: loc.legal_entity_name?.trim() || undefined,
      settlement_descriptor: loc.settlement_descriptor?.trim() || undefined,
      description: loc.description?.trim() || undefined,
      website_url: loc.website_url?.trim() || undefined,
      contact_name: loc.contact_name?.trim() || undefined,
      contact_email: loc.contact_email?.trim() || undefined,
      contact_phone: loc.contact_phone?.trim() || undefined,
      support_email: loc.support_email?.trim() || undefined,
      support_phone: loc.support_phone?.trim() || undefined,
      receipt_header: loc.receipt_header?.trim() || undefined,
      receipt_footer: loc.receipt_footer?.trim() || undefined,
      invoice_notes: loc.invoice_notes?.trim() || undefined,
      is_default: loc.is_default,
    }));

    await onSubmit({
      ...(data as unknown as CreateAccountRequest | UpdateAccountRequest),
      localizations: sanitizedLocalizations,
    });
  };

  const addLocalization = () => {
    setLocalizations((prev) => [
      ...prev,
      {
        lang_code: '',
        display_name: '',
        brand_name: '',
        legal_entity_name: '',
        settlement_descriptor: '',
        description: '',
        website_url: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        support_email: '',
        support_phone: '',
        receipt_header: '',
        receipt_footer: '',
        invoice_notes: '',
        is_default: false,
      },
    ]);
  };

  const removeLocalization = (index: number) => {
    setLocalizations((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      if (!next.some((loc) => loc.is_default)) {
        next[0] = { ...next[0], is_default: true };
      }
      return next;
    });
  };

  const setLocalizationValue = (index: number, field: keyof AccountLocalizationInput, value: string | boolean) => {
    setLocalizations((prev) =>
      prev.map((loc, i) => {
        if (i !== index) return loc;
        if (field === 'is_default' && value === true) {
          return { ...loc, is_default: true };
        }
        return { ...loc, [field]: value } as AccountLocalizationInput;
      }).map((loc, i) => {
        if (field === 'is_default' && value === true && i !== index) return { ...loc, is_default: false };
        return loc;
      }),
    );
  };

  return (
    <form className="account-form" onSubmit={handleSubmit}>
      {!isEdit && (
        <div className="auto-fill-bar">
          <button type="button" className="btn btn-auto-fill" onClick={autoFill}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Quick Fill
          </button>
        </div>
      )}

      <div className="form-section">
        <h3 className="section-title">Account Details</h3>
        <div className="form-grid">
          <div className={`form-field ${errors.name ? 'has-error' : ''}`}>
            <label className="label">Account Name *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Enter account name"
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className={`form-field ${errors.number ? 'has-error' : ''}`}>
            <label className="label">Account Number *</label>
            <input
              className="input"
              value={form.number}
              onChange={(e) => set('number', e.target.value)}
              placeholder="Enter account number"
            />
            {errors.number && <span className="field-error">{errors.number}</span>}
          </div>

          {isEdit && (
            <div className="form-field">
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
                {ACCOUNT_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
                ))}
              </select>
            </div>
          )}

          <div className={`form-field ${errors.account_type ? 'has-error' : ''}`}>
            <label className="label">Account Type *</label>
            <input
              className="input"
              value={form.account_type}
              onChange={(e) => set('account_type', e.target.value)}
              placeholder="e.g. operating_account, holding_account"
            />
            {errors.account_type && <span className="field-error">{errors.account_type}</span>}
          </div>

          <div className="form-field">
            <label className="label">Business Type</label>
            <select className="input" value={form.business_type} onChange={(e) => set('business_type', e.target.value)}>
              <option value="">Select business type</option>
              {BUSINESS_TYPES.map((t) => (
                <option key={t} value={t}>{BUSINESS_TYPE_LABELS[t] || t}</option>
              ))}
            </select>
          </div>

          {form.business_type === 'individual' && (
            <>
              <div className={`form-field ${errors.first_name ? 'has-error' : ''}`}>
                <label className="label">First Name *</label>
                <input
                  className="input"
                  value={form.first_name}
                  onChange={(e) => set('first_name', e.target.value)}
                  placeholder="Enter first name"
                />
                {errors.first_name && <span className="field-error">{errors.first_name}</span>}
              </div>

              <div className={`form-field ${errors.last_name ? 'has-error' : ''}`}>
                <label className="label">Last Name *</label>
                <input
                  className="input"
                  value={form.last_name}
                  onChange={(e) => set('last_name', e.target.value)}
                  placeholder="Enter last name"
                />
                {errors.last_name && <span className="field-error">{errors.last_name}</span>}
              </div>
            </>
          )}

          <div className="form-field">
            <label className="label">Platform Account Type</label>
            <select className="input" value={form.platform_account_type} onChange={(e) => set('platform_account_type', e.target.value)}>
              <option value="">Select account type</option>
              {PLATFORM_ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="label">Contract Type</label>
            <select className="input" value={form.contract_type} onChange={(e) => set('contract_type', e.target.value)}>
              <option value="">Select contract type</option>
              {CONTRACT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-title">Regional Settings</h3>
        <div className="form-grid">
          <div className={`form-field ${errors.default_currency ? 'has-error' : ''}`}>
            <label className="label">Default Currency *</label>
            <select className="input" value={form.default_currency} onChange={(e) => set('default_currency', e.target.value)}>
              <option value="">Select currency</option>
              {MOCK_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
              ))}
            </select>
            {errors.default_currency && <span className="field-error">{errors.default_currency}</span>}
          </div>

          <div className={`form-field ${errors.default_country ? 'has-error' : ''}`}>
            <label className="label">Default Country *</label>
            <select className="input" value={form.default_country} onChange={(e) => set('default_country', e.target.value)}>
              <option value="">Select country</option>
              {MOCK_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
              ))}
            </select>
            {errors.default_country && <span className="field-error">{errors.default_country}</span>}
          </div>

          <div className={`form-field ${errors.timezone ? 'has-error' : ''}`}>
            <label className="label">Timezone *</label>
            <select className="input" value={form.timezone} onChange={(e) => set('timezone', e.target.value)}>
              <option value="">Select timezone</option>
              {MOCK_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
            {errors.timezone && <span className="field-error">{errors.timezone}</span>}
          </div>

          <div className="form-field">
            <label className="label">MCC Code</label>
            <input
              className="input"
              value={form.mcc}
              onChange={(e) => set('mcc', e.target.value)}
              placeholder="e.g. 5411"
            />
          </div>

          <div className="form-field">
            <label className="label">Industry</label>
            <input
              className="input"
              value={form.industry}
              onChange={(e) => set('industry', e.target.value)}
              placeholder="e.g. fintech, retail, healthcare"
              maxLength={100}
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-title">Risk & Compliance</h3>
        <div className="form-grid">
          <div className="form-field">
            <label className="label">Risk Profile</label>
            <select className="input" value={form.risk_profile} onChange={(e) => set('risk_profile', e.target.value)}>
              <option value="">Select profile</option>
              {RISK_PROFILES.map((r) => (
                <option key={r} value={r}>{RISK_PROFILE_LABELS[r] || r}</option>
              ))}
            </select>
          </div>

          {isEdit && (
            <>
              <div className="form-field">
                <label className="label">KYC Status</label>
                <select className="input" value={form.kyc_status} onChange={(e) => set('kyc_status', e.target.value)}>
                  <option value="">Select status</option>
                  {KYC_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="label">AML Status</label>
                <select className="input" value={form.aml_status} onChange={(e) => set('aml_status', e.target.value)}>
                  <option value="">Select status</option>
                  {AML_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="form-field">
            <label className="label">Volume Tier</label>
            <select className="input" value={form.volume_tier} onChange={(e) => set('volume_tier', e.target.value)}>
              <option value="">Select tier</option>
              {VOLUME_TIERS.map((v) => (
                <option key={v} value={v}>{VOLUME_TIER_LABELS[v] || v}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="label">Monthly Volume Limit</label>
            <input
              className="input"
              type="number"
              value={form.monthly_volume_limit}
              onChange={(e) => set('monthly_volume_limit', e.target.value)}
              placeholder="No limit"
            />
          </div>

          <div className="form-field toggle-field">
            <label className="toggle-label">
              <div className={`toggle ${form.high_risk_merchant ? 'active' : ''}`} onClick={() => set('high_risk_merchant', !form.high_risk_merchant)}>
                <div className="toggle-knob" />
              </div>
              <span>High-risk merchant</span>
            </label>
          </div>

          {isEdit && (
            <div className="form-field toggle-field">
              <label className="toggle-label">
                <div className={`toggle ${form.is_blocked ? 'active danger' : ''}`} onClick={() => set('is_blocked', !form.is_blocked)}>
                  <div className="toggle-knob" />
                </div>
                <span>Blocked</span>
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-title">Contact & Support</h3>
        <div className="form-grid">
          <div className="form-field">
            <label className="label">Website</label>
            <input
              className="input ltr-input"
              value={form.website}
              onChange={(e) => set('website', e.target.value)}
              placeholder="https://example.com"
              dir="ltr"
            />
          </div>

          <div className="form-field">
            <label className="label">Support Email</label>
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
            <label className="label">Support Phone</label>
            <input
              className="input ltr-input"
              value={form.support_phone}
              onChange={(e) => set('support_phone', e.target.value)}
              placeholder="+972-XX-XXX-XXXX"
              dir="ltr"
            />
          </div>

          <div className="form-field span-full">
            <label className="label">Message for Customer</label>
            <textarea
              className="input textarea"
              value={form.message_for_client}
              onChange={(e) => set('message_for_client', e.target.value)}
              placeholder="Message shown to customer"
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="auto-fill-bar">
          <h3 className="section-title" style={{ margin: 0 }}>Localizations (Multi-language)</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addLocalization}>
            Add Language
          </button>
        </div>
        {errors.localizations ? <span className="field-error">{errors.localizations}</span> : null}
        {errors.localizations_default ? <span className="field-error">{errors.localizations_default}</span> : null}
        {localizations.map((loc, index) => (
          <div key={`${loc.lang_code}-${index}`} className="form-grid" style={{ marginBottom: 12, padding: 12, border: '1px solid var(--color-border-light)', borderRadius: 8 }}>
            <div className={`form-field ${errors[`localizations.${index}.lang_code`] ? 'has-error' : ''}`}>
              <label className="label">Language Code *</label>
              <input
                className="input ltr-input"
                dir="ltr"
                value={loc.lang_code}
                onChange={(e) => setLocalizationValue(index, 'lang_code', e.target.value)}
                placeholder="en"
              />
              {errors[`localizations.${index}.lang_code`] ? <span className="field-error">{errors[`localizations.${index}.lang_code`]}</span> : null}
            </div>
            <div className={`form-field ${errors[`localizations.${index}.display_name`] ? 'has-error' : ''}`}>
              <label className="label">Display Name *</label>
              <input
                className="input"
                value={loc.display_name}
                onChange={(e) => setLocalizationValue(index, 'display_name', e.target.value)}
                placeholder="Account name in this language"
              />
              {errors[`localizations.${index}.display_name`] ? <span className="field-error">{errors[`localizations.${index}.display_name`]}</span> : null}
            </div>
            <div className="form-field">
              <label className="label">Brand Name</label>
              <input className="input" value={loc.brand_name || ''} onChange={(e) => setLocalizationValue(index, 'brand_name', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="label">Description</label>
              <input className="input" value={loc.description || ''} onChange={(e) => setLocalizationValue(index, 'description', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="label">Support Email</label>
              <input className="input ltr-input" dir="ltr" value={loc.support_email || ''} onChange={(e) => setLocalizationValue(index, 'support_email', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="label">Support Phone</label>
              <input className="input ltr-input" dir="ltr" value={loc.support_phone || ''} onChange={(e) => setLocalizationValue(index, 'support_phone', e.target.value)} />
            </div>
            <div className="form-field toggle-field">
              <label className="toggle-label">
                <div className={`toggle ${loc.is_default ? 'active' : ''}`} onClick={() => setLocalizationValue(index, 'is_default', true)}>
                  <div className="toggle-knob" />
                </div>
                <span>Default language</span>
              </label>
            </div>
            <div className="form-field">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => removeLocalization(index)}
                disabled={localizations.length <= 1}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            <>
              <div className="spinner spinner-sm" />
              Saving...
            </>
          ) : (
            isEdit ? 'Update' : 'Create'
          )}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
