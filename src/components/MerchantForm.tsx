import { useState } from 'react';
import type { CreateMerchantRequest, Merchant, UpdateMerchantRequest } from '../types/merchant';
import {
  MERCHANT_BUSINESS_MODELS,
  MERCHANT_BUSINESS_MODEL_LABELS,
  MERCHANT_STATUSES,
} from '../types/merchant';
import { STATUS_LABELS } from '../types/company';
import './CompanyForm.css';

interface MerchantFormProps {
  legalEntityUUID: string;
  mode: 'create' | 'edit';
  loading: boolean;
  initial?: Merchant | null;
  onSubmit: (data: CreateMerchantRequest | UpdateMerchantRequest) => Promise<void>;
  onCancel: () => void;
}

export default function MerchantForm({
  legalEntityUUID,
  mode,
  loading,
  initial,
  onSubmit,
  onCancel,
}: MerchantFormProps) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState({
    merchant_id_external: initial?.merchant_id_external ?? '',
    name: initial?.name ?? '',
    merchant_code: initial?.merchant_code ?? '',
    category_code: initial?.category_code ?? '',
    mcc_default: initial?.mcc_default ?? '',
    business_model: initial?.business_model ?? 'retail',
    status: initial?.status ?? 'NEW',
    website: initial?.website ?? '',
    contact_email: initial?.contact_email ?? '',
    contact_phone: initial?.contact_phone ?? '',
    address_id: initial?.address_id ?? '',
    notes: initial?.notes ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (!form.name.trim()) next.name = 'שם חובה';
    if (!form.merchant_code.trim()) next.merchant_code = 'Merchant code חובה';
    if (!form.category_code.trim()) next.category_code = 'Category code חובה';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const autoFill = () => {
    const rand = Math.floor(Math.random() * 9000) + 1000;
    setForm({
      merchant_id_external: `EXT-MER-${rand}`,
      name: `Merchant ${rand}`,
      merchant_code: `MER-${rand}`,
      category_code: '5411',
      mcc_default: '5411',
      business_model: 'retail',
      status: 'NEW',
      website: `https://merchant-${rand}.example.com`,
      contact_email: `merchant-${rand}@example.com`,
      contact_phone: `+972-50-${rand}-000`,
      address_id: '',
      notes: 'Auto-filled test merchant',
    });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const common = {
      merchant_id_external: form.merchant_id_external || undefined,
      name: form.name,
      merchant_code: form.merchant_code,
      category_code: form.category_code,
      mcc_default: form.mcc_default || undefined,
      business_model: form.business_model || undefined,
      status: form.status,
      website: form.website || undefined,
      contact_email: form.contact_email || undefined,
      contact_phone: form.contact_phone || undefined,
      address_id: form.address_id ? Number(form.address_id) : undefined,
      notes: form.notes || undefined,
    };

    if (isEdit) {
      await onSubmit(common as UpdateMerchantRequest);
      return;
    }

    await onSubmit({
      ...common,
      legal_entity_uuid: legalEntityUUID,
    } as CreateMerchantRequest);
  };

  return (
    <form className="company-form" onSubmit={handleSubmit}>
      <div className="auto-fill-bar">
        <button type="button" className="btn btn-auto-fill" onClick={autoFill}>
          מילוי מהיר
        </button>
      </div>

      <div className="form-section">
        <h3 className="section-title">{isEdit ? 'עריכת סוחר' : 'סוחר חדש'}</h3>
        <div className="form-grid">
          <div className={`form-field ${errors.name ? 'has-error' : ''}`}>
            <label className="label">שם *</label>
            <input className="input" value={form.name} onChange={(e) => setValue('name', e.target.value)} />
            {errors.name ? <span className="field-error">{errors.name}</span> : null}
          </div>

          <div className={`form-field ${errors.merchant_code ? 'has-error' : ''}`}>
            <label className="label">Merchant Code *</label>
            <input
              className="input ltr-input"
              dir="ltr"
              value={form.merchant_code}
              onChange={(e) => setValue('merchant_code', e.target.value)}
            />
            {errors.merchant_code ? <span className="field-error">{errors.merchant_code}</span> : null}
          </div>

          <div className={`form-field ${errors.category_code ? 'has-error' : ''}`}>
            <label className="label">Category Code *</label>
            <input
              className="input ltr-input"
              dir="ltr"
              value={form.category_code}
              onChange={(e) => setValue('category_code', e.target.value)}
            />
            {errors.category_code ? <span className="field-error">{errors.category_code}</span> : null}
          </div>

          <div className="form-field">
            <label className="label">MCC</label>
            <input
              className="input ltr-input"
              dir="ltr"
              value={form.mcc_default}
              onChange={(e) => setValue('mcc_default', e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="label">Business Model</label>
            <select className="input" value={form.business_model} onChange={(e) => setValue('business_model', e.target.value)}>
              {MERCHANT_BUSINESS_MODELS.map((v) => (
                <option key={v} value={v}>
                  {MERCHANT_BUSINESS_MODEL_LABELS[v] ?? v}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setValue('status', e.target.value)}>
              {MERCHANT_STATUSES.map((v) => (
                <option key={v} value={v}>
                  {STATUS_LABELS[v] ?? v}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="label">External Merchant ID</label>
            <input
              className="input ltr-input"
              dir="ltr"
              value={form.merchant_id_external}
              onChange={(e) => setValue('merchant_id_external', e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="label">Website</label>
            <input
              className="input ltr-input"
              dir="ltr"
              value={form.website}
              onChange={(e) => setValue('website', e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="label">Contact Email</label>
            <input
              className="input ltr-input"
              dir="ltr"
              value={form.contact_email}
              onChange={(e) => setValue('contact_email', e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="label">Contact Phone</label>
            <input
              className="input ltr-input"
              dir="ltr"
              value={form.contact_phone}
              onChange={(e) => setValue('contact_phone', e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="label">Address ID</label>
            <input
              type="number"
              className="input"
              value={form.address_id}
              onChange={(e) => setValue('address_id', e.target.value)}
            />
          </div>

          <div className="form-field span-full">
            <label className="label">Notes</label>
            <textarea
              className="input textarea"
              rows={3}
              value={form.notes}
              onChange={(e) => setValue('notes', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'שומר...' : isEdit ? 'עדכון סוחר' : 'יצירת סוחר'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          ביטול
        </button>
      </div>
    </form>
  );
}
