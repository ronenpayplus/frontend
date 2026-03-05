import { useMemo, useState } from 'react';
import {
  LEGAL_ENTITY_KYC_LABELS,
  LEGAL_ENTITY_KYC_STATUSES,
  LEGAL_ENTITY_STATUSES,
  LEGAL_ENTITY_STATUS_LABELS,
  LEGAL_ENTITY_TYPES,
  LEGAL_ENTITY_TYPE_LABELS,
  TAX_ID_TYPES,
  type CreateLegalEntityRequest,
  type LegalEntity,
  type UpdateLegalEntityRequest,
} from '../types/legalEntity';
import { MOCK_COUNTRIES } from '../types/company';
import type { LocalizationInput } from '../types/orgEntityLocalization';
import LocalizationsEditor, { ensureAtLeastOneLocalization } from './LocalizationsEditor';
import './CompanyForm.css';

interface LegalEntityFormProps {
  companyUUID: string;
  initial?: LegalEntity | null;
  mode: 'create' | 'edit';
  loading: boolean;
  initialLocalizations?: LocalizationInput[];
  onSubmit: (data: CreateLegalEntityRequest | UpdateLegalEntityRequest) => Promise<void>;
  onCancel: () => void;
}

export default function LegalEntityForm({
  companyUUID,
  initial,
  mode,
  loading,
  initialLocalizations,
  onSubmit,
  onCancel,
}: LegalEntityFormProps) {
  const isEdit = mode === 'edit';

  const [form, setForm] = useState({
    legal_name: initial?.legal_name ?? '',
    entity_type: initial?.entity_type ?? 'llc',
    tax_id: initial?.tax_id ?? '',
    tax_id_type: initial?.tax_id_type ?? 'vat',
    vat_number: initial?.vat_number ?? '',
    registration_number: initial?.registration_number ?? '',
    date_of_incorporation: initial?.date_of_incorporation?.slice(0, 10) ?? '',
    country: initial?.country ?? 'IL',
    registered_address_id: initial?.registered_address_id ?? 1,
    operating_address_id: initial?.operating_address_id ?? '',
    kyc_status: initial?.kyc_status ?? 'pending',
    status: initial?.status ?? 'active',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [localizations, setLocalizations] = useState<LocalizationInput[]>(
    initialLocalizations && initialLocalizations.length > 0
      ? initialLocalizations
      : [{
        lang_code: 'en',
        display_name: initial?.legal_name ?? '',
        brand_name: '',
        description: '',
        support_email: '',
        support_phone: '',
        is_default: true,
      }],
  );

  const title = useMemo(
    () => (isEdit ? 'Edit Legal Entity' : 'New Legal Entity'),
    [isEdit],
  );

  const setValue = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.legal_name.trim()) next.legal_name = 'Legal name is required';
    if (!form.tax_id.trim()) next.tax_id = 'Tax ID is required';
    if (!form.country) next.country = 'Country is required';
    if (!form.registered_address_id || Number(form.registered_address_id) <= 0) {
      next.registered_address_id = 'Registered address ID is required (must be > 0)';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleAutoFill = () => {
    const rand = Math.floor(Math.random() * 9000) + 1000;
    setForm({
      legal_name: `Legal Entity ${rand}`,
      entity_type: 'llc',
      tax_id: `TAX-${rand}`,
      tax_id_type: 'vat',
      vat_number: `VAT-${rand}`,
      registration_number: `REG-${rand}`,
      date_of_incorporation: '2020-03-15',
      country: 'IL',
      registered_address_id: 1,
      operating_address_id: '',
      kyc_status: 'pending',
      status: 'active',
    });
    setLocalizations([
      {
        lang_code: 'en',
        display_name: `Legal Entity ${rand}`,
        brand_name: `Legal Entity ${rand}`,
        description: 'English localization',
        support_email: `support-${rand}@example.com`,
        support_phone: `+1-202-555-${String(rand).slice(-4)}`,
        is_default: true,
      },
      {
        lang_code: 'fr',
        display_name: `Entite Legale ${rand}`,
        brand_name: `Entite ${rand}`,
        description: 'French localization',
        support_email: `assistance-${rand}@example.com`,
        support_phone: `+33-1-${String(rand).slice(-4)}-1000`,
        is_default: false,
      },
    ]);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const base = {
      legal_name: form.legal_name,
      entity_type: form.entity_type,
      tax_id: form.tax_id,
      tax_id_type: form.tax_id_type,
      vat_number: form.vat_number || undefined,
      registration_number: form.registration_number || undefined,
      date_of_incorporation: form.date_of_incorporation || undefined,
      country: form.country,
      registered_address_id: Number(form.registered_address_id),
      operating_address_id: form.operating_address_id
        ? Number(form.operating_address_id)
        : undefined,
      localizations: ensureAtLeastOneLocalization(localizations, form.legal_name),
    };

    if (isEdit) {
      await onSubmit({
        ...base,
        kyc_status: form.kyc_status,
        status: form.status,
      } as UpdateLegalEntityRequest);
      return;
    }

    await onSubmit({
      ...base,
      company_uuid: companyUUID,
    } as CreateLegalEntityRequest);
  };

  return (
    <form className="company-form" onSubmit={handleSubmit}>
      <div className="auto-fill-bar">
        <button type="button" className="btn btn-auto-fill" onClick={handleAutoFill}>
          Quick Fill
        </button>
      </div>

      <div className="form-section">
        <h3 className="section-title">{title}</h3>
        <div className="form-grid">
          <div className={`form-field ${errors.legal_name ? 'has-error' : ''}`}>
            <label className="label">Legal Name *</label>
            <input
              className="input"
              value={form.legal_name}
              onChange={(e) => setValue('legal_name', e.target.value)}
            />
            {errors.legal_name ? <span className="field-error">{errors.legal_name}</span> : null}
          </div>

          <div className="form-field">
            <label className="label">Entity Type *</label>
            <select
              className="input"
              value={form.entity_type}
              onChange={(e) => setValue('entity_type', e.target.value)}
            >
              {LEGAL_ENTITY_TYPES.map((v) => (
                <option key={v} value={v}>
                  {LEGAL_ENTITY_TYPE_LABELS[v] ?? v}
                </option>
              ))}
            </select>
          </div>

          <div className={`form-field ${errors.tax_id ? 'has-error' : ''}`}>
            <label className="label">Tax ID *</label>
            <input
              className="input ltr-input"
              value={form.tax_id}
              onChange={(e) => setValue('tax_id', e.target.value)}
              dir="ltr"
            />
            {errors.tax_id ? <span className="field-error">{errors.tax_id}</span> : null}
          </div>

          <div className="form-field">
            <label className="label">Tax ID Type *</label>
            <select
              className="input"
              value={form.tax_id_type}
              onChange={(e) => setValue('tax_id_type', e.target.value)}
            >
              {TAX_ID_TYPES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="label">VAT Number</label>
            <input
              className="input ltr-input"
              value={form.vat_number}
              onChange={(e) => setValue('vat_number', e.target.value)}
              dir="ltr"
            />
          </div>

          <div className="form-field">
            <label className="label">Registration Number</label>
            <input
              className="input ltr-input"
              value={form.registration_number}
              onChange={(e) => setValue('registration_number', e.target.value)}
              dir="ltr"
            />
          </div>

          <div className="form-field">
            <label className="label">Date of Incorporation</label>
            <input
              className="input"
              type="date"
              value={form.date_of_incorporation}
              onChange={(e) => setValue('date_of_incorporation', e.target.value)}
            />
          </div>

          <div className={`form-field ${errors.country ? 'has-error' : ''}`}>
            <label className="label">Country *</label>
            <select
              className="input"
              value={form.country}
              onChange={(e) => setValue('country', e.target.value)}
            >
              {MOCK_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            {errors.country ? <span className="field-error">{errors.country}</span> : null}
          </div>

          <div className={`form-field ${errors.registered_address_id ? 'has-error' : ''}`}>
            <label className="label">Registered Address ID *</label>
            <input
              className="input"
              type="number"
              min={1}
              value={form.registered_address_id}
              onChange={(e) => setValue('registered_address_id', Number(e.target.value))}
            />
            {errors.registered_address_id ? (
              <span className="field-error">{errors.registered_address_id}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label className="label">Operating Address ID</label>
            <input
              className="input"
              type="number"
              min={1}
              value={form.operating_address_id}
              onChange={(e) => setValue('operating_address_id', e.target.value)}
            />
          </div>

          {isEdit ? (
            <>
              <div className="form-field">
                <label className="label">KYC Status *</label>
                <select
                  className="input"
                  value={form.kyc_status}
                  onChange={(e) => setValue('kyc_status', e.target.value)}
                >
                  {LEGAL_ENTITY_KYC_STATUSES.map((v) => (
                    <option key={v} value={v}>
                      {LEGAL_ENTITY_KYC_LABELS[v] ?? v}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="label">Status *</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={(e) => setValue('status', e.target.value)}
                >
                  {LEGAL_ENTITY_STATUSES.map((v) => (
                    <option key={v} value={v}>
                      {LEGAL_ENTITY_STATUS_LABELS[v] ?? v}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : null}
        </div>
      </div>
      <LocalizationsEditor localizations={localizations} onChange={setLocalizations} />

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : isEdit ? 'Update Entity' : 'Create Entity'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
