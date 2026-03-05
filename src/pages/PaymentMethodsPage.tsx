import { useCallback, useEffect, useState } from 'react';
import {
  createPaymentMethod,
  deletePaymentMethod,
  listPaymentMethods,
  updatePaymentMethod,
} from '../api/paymentMethods';
import type {
  CreatePaymentMethodRequest,
  PaymentMethod,
  PaymentMethodCategory,
  UpdatePaymentMethodRequest,
} from '../types/paymentMethod';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './CompaniesList.css';
import './CompanyCreate.css';
import '../components/CompanyForm.css';

type PaymentMethodFormState = {
  method_code: string;
  display_name: string;
  category: PaymentMethodCategory;
  brand: string;
  is_active: boolean;
  sort_order: number;
  metadataText: string;
};

const categories: PaymentMethodCategory[] = [
  'CARD',
  'BANK_TRANSFER',
  'WALLET',
  'BNPL',
  'CRYPTO',
  'VOUCHER',
  'OTHER',
];

const defaultForm: PaymentMethodFormState = {
  method_code: '',
  display_name: '',
  category: 'CARD',
  brand: '',
  is_active: true,
  sort_order: 100,
  metadataText: '',
};

export default function PaymentMethodsPage() {
  const { toasts, addToast, removeToast } = useToast();
  const [items, setItems] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('true');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState<PaymentMethodFormState>(defaultForm);

  const fetchPaymentMethods = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPaymentMethods({
        search: search || undefined,
        category: categoryFilter || undefined,
        is_active: isActiveFilter || undefined,
        page: 1,
        page_size: 150,
      });
      setItems(data?.payment_methods ?? []);
    } catch (error) {
      console.error('Payment methods load error:', error);
      const msg = error instanceof Error ? error.message : String(error);
      addToast(`Failed to load payment methods: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, isActiveFilter, addToast]);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const resetForm = () => setForm(defaultForm);

  const startCreate = () => {
    setEditing(null);
    resetForm();
    setShowCreate(true);
  };

  const autoFillForm = () => {
    const sample = [
      { prefix: 'PMCARD', display_name: 'Card Method', category: 'CARD' as const, brand: 'CUSTOM' },
      { prefix: 'PMWAL', display_name: 'Wallet Method', category: 'WALLET' as const, brand: 'CUSTOM' },
      { prefix: 'PMBANK', display_name: 'Bank Transfer Method', category: 'BANK_TRANSFER' as const, brand: 'CUSTOM' },
    ];
    const pick = sample[Math.floor(Math.random() * sample.length)];
    const unique = Date.now().toString().slice(-6);
    setForm({
      method_code: `${pick.prefix}${unique}`,
      display_name: `${pick.display_name} ${unique}`,
      category: pick.category,
      brand: pick.brand,
      is_active: true,
      sort_order: 100,
      metadataText: '',
    });
  };

  const startEdit = (paymentMethod: PaymentMethod) => {
    setShowCreate(false);
    setEditing(paymentMethod);
    setForm({
      method_code: paymentMethod.method_code || '',
      display_name: paymentMethod.display_name || '',
      category: paymentMethod.category,
      brand: paymentMethod.brand || '',
      is_active: paymentMethod.is_active,
      sort_order: paymentMethod.sort_order ?? 100,
      metadataText: paymentMethod.metadata ? JSON.stringify(paymentMethod.metadata, null, 2) : '',
    });
  };

  const buildPayload = (): CreatePaymentMethodRequest | UpdatePaymentMethodRequest => {
    const metadataText = form.metadataText.trim();
    let parsedMetadata: Record<string, unknown> | null | undefined;

    if (metadataText) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(metadataText);
      } catch {
        throw new Error('INVALID_METADATA');
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('INVALID_METADATA');
      }
      parsedMetadata = parsed as Record<string, unknown>;
    }

    return {
      method_code: form.method_code.trim().toUpperCase(),
      display_name: form.display_name.trim(),
      category: form.category,
      brand: form.brand.trim() || undefined,
      is_active: form.is_active,
      sort_order: Number(form.sort_order),
      metadata: parsedMetadata,
    };
  };

  const save = async () => {
    if (!form.method_code || !form.display_name || !form.category) {
      addToast('Method code, display name, and category are required', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (editing) {
        await updatePaymentMethod(editing.method_code, payload);
        addToast('Payment method updated', 'success');
        setEditing(null);
      } else {
        await createPaymentMethod(payload);
        addToast('Payment method created', 'success');
        setShowCreate(false);
      }
      resetForm();
      await fetchPaymentMethods();
    } catch (error) {
      console.error(error);
      const errMsg = error instanceof Error ? error.message : String(error);
      addToast(
        errMsg === 'INVALID_METADATA'
          ? 'Metadata must be a valid JSON object'
          : `Failed to save payment method: ${errMsg}`,
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deletePaymentMethod(deleteTarget.method_code);
      addToast('Payment method marked as inactive', 'success');
      setDeleteTarget(null);
      setIsActiveFilter('true');
      await fetchPaymentMethods();
    } catch (error) {
      console.error(error);
      const errMsg = error instanceof Error ? error.message : String(error);
      addToast(`Failed to delete payment method: ${errMsg}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="companies-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payment Methods</h1>
          <p className="page-subtitle">Reference Table - Payment Methods</p>
        </div>
        <button className="btn btn-primary" onClick={() => (showCreate ? setShowCreate(false) : startCreate())}>
          {showCreate ? 'Close Form' : 'New Payment Method'}
        </button>
      </div>

      {(showCreate || editing) && (
        <div className="form-section">
          <div className="auto-fill-bar">
            <button type="button" className="btn btn-auto-fill" onClick={autoFillForm}>
              Quick Fill
            </button>
          </div>
          <h3 className="section-title">{editing ? 'Edit Payment Method' : 'Create Payment Method'}</h3>
          <div className="form-grid">
            <div className="form-field">
              <label className="label">Method Code *</label>
              <input
                className="input ltr-input"
                dir="ltr"
                maxLength={50}
                disabled={!!editing}
                value={form.method_code}
                onChange={(e) => setForm((p) => ({ ...p, method_code: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label className="label">Display Name *</label>
              <input
                className="input"
                value={form.display_name}
                onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label className="label">Category *</label>
              <select
                className="input ltr-input"
                dir="ltr"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as PaymentMethodCategory }))}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label className="label">Brand</label>
              <input
                className="input ltr-input"
                dir="ltr"
                maxLength={50}
                value={form.brand}
                onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label className="label">Sort Order</label>
              <input
                type="number"
                className="input ltr-input"
                dir="ltr"
                value={form.sort_order}
                onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
              />
            </div>
            <div className="form-field">
              <label className="label">Active</label>
              <select
                className="input"
                value={form.is_active ? 'true' : 'false'}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.value === 'true' }))}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="form-field" style={{ gridColumn: '1 / -1' }}>
              <label className="label">Metadata (JSON Object)</label>
              <textarea
                className="input ltr-input"
                dir="ltr"
                rows={5}
                value={form.metadataText}
                onChange={(e) => setForm((p) => ({ ...p, metadataText: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowCreate(false);
                setEditing(null);
                resetForm();
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="card filters-card">
        <form
          className="filters-form"
          onSubmit={(e) => {
            e.preventDefault();
            fetchPaymentMethods();
          }}
        >
          <div className="filter-group">
            <input
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code / name"
            />
          </div>
          <div className="filter-group">
            <select
              className="input ltr-input"
              dir="ltr"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Category (all)</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <select className="input" value={isActiveFilter} onChange={(e) => setIsActiveFilter(e.target.value)}>
              <option value="">Active (All)</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <button className="btn btn-primary" type="submit">
            Search
          </button>
        </form>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <span>Loading payment methods...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p>No payment methods found</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Display Name</th>
                  <th>Method Code</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Sort</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((paymentMethod) => (
                  <tr key={paymentMethod.method_code}>
                    <td className="cell-name">{paymentMethod.display_name}</td>
                    <td className="cell-mono">{paymentMethod.method_code}</td>
                    <td className="cell-mono">{paymentMethod.category}</td>
                    <td className="cell-mono">{paymentMethod.brand || '-'}</td>
                    <td>{paymentMethod.sort_order}</td>
                    <td>{paymentMethod.is_active ? 'Yes' : 'No'}</td>
                    <td className="cell-actions">
                      <button className="action-btn edit" onClick={() => startEdit(paymentMethod)}>
                        ✎
                      </button>
                      <button className="action-btn delete" onClick={() => setDeleteTarget(paymentMethod)}>
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Deactivate Payment Method"
        message={`Mark "${deleteTarget?.display_name}" as inactive?`}
        confirmLabel="Deactivate"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
