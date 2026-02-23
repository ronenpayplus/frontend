import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getMerchant, listMerchants } from '../api/merchants';
import { getLegalEntity, listLegalEntities } from '../api/legalEntities';
import { listCompanies } from '../api/companies';
import {
  createMerchantAccount,
  deleteMerchantAccount,
  listMerchantAccounts,
  updateMerchantAccount,
} from '../api/merchantAccounts';
import type { Merchant } from '../types/merchant';
import type { LegalEntity } from '../types/legalEntity';
import type {
  CreateMerchantAccountRequest,
  MerchantAccount,
  UpdateMerchantAccountRequest,
} from '../types/merchantAccount';
import { CONTRACT_TYPES, KYC_STATUSES, MOCK_COUNTRIES, MOCK_CURRENCIES, MOCK_TIMEZONES, STATUS_LABELS, VOLUME_TIERS } from '../types/company';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './CompaniesList.css';
import './CompanyCreate.css';

export default function MerchantAccountsPage() {
  const navigate = useNavigate();
  const { uuid: routeMerchantUUID } = useParams<{ uuid: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();

  const selectedMerchantUUID = routeMerchantUUID || searchParams.get('merchant_uuid') || '';
  const fallbackLegalEntityUUID = searchParams.get('legal_entity_uuid') || '';
  const fallbackCompanyUUID = searchParams.get('company_uuid') || '';
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [selectedLegalEntity, setSelectedLegalEntity] = useState<LegalEntity | null>(null);
  const [items, setItems] = useState<MerchantAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<MerchantAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MerchantAccount | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const [form, setForm] = useState({
    name: '',
    merchant_code: '',
    mcc: '',
    charges_enabled: true,
    payouts_enabled: false,
    country: 'IL',
    currency: 'ILS',
    timezone: 'Asia/Jerusalem',
    status: 'NEW',
    kyc_status: 'pending',
    aml_status: 'pending',
    risk_profile: 'low',
    contract_type: 'direct',
    volume_tier: 'starter',
    default_acquiring_model: 'PLATFORM_MID',
  });

  useEffect(() => {
    const loadMerchants = async () => {
      try {
        const direct = await listMerchants({ page: 1, page_size: 300 });
        if ((direct.merchants || []).length > 0) {
          setMerchants(direct.merchants || []);
          return;
        }

        // Fallback for environments where list requires legal_entity_uuid.
        const companiesData = await listCompanies({ page: 1, page_size: 200 });
        const unique = new Map<string, Merchant>();
        await Promise.all(
          (companiesData.companies || []).map(async (company) => {
            try {
              const legalEntities = await listLegalEntities({
                company_uuid: company.uuid,
                page: 1,
                page_size: 200,
              });
              await Promise.all(
                (legalEntities.legal_entities || []).map(async (le) => {
                  try {
                    const merchantsData = await listMerchants({
                      legal_entity_uuid: le.uuid,
                      page: 1,
                      page_size: 200,
                    });
                    (merchantsData.merchants || []).forEach((m) => unique.set(m.uuid, m));
                  } catch {
                    // continue
                  }
                }),
              );
            } catch {
              // continue
            }
          }),
        );
        setMerchants(Array.from(unique.values()));
      } catch {
        setMerchants([]);
      }
    };
    loadMerchants();
  }, []);

  useEffect(() => {
    const fromList = merchants.find((m) => m.uuid === selectedMerchantUUID) || null;
    if (fromList) {
      setSelectedMerchant(fromList);
      return;
    }
    if (!selectedMerchantUUID) {
      setSelectedMerchant(null);
      return;
    }
    getMerchant(selectedMerchantUUID)
      .then((data) => setSelectedMerchant(data.merchant))
      .catch(() => setSelectedMerchant(null));
  }, [selectedMerchantUUID, merchants]);

  useEffect(() => {
    if (!selectedMerchant?.legal_entity_uuid) {
      setSelectedLegalEntity(null);
      return;
    }
    getLegalEntity(selectedMerchant.legal_entity_uuid)
      .then((data) => setSelectedLegalEntity(data.legal_entity))
      .catch(() => setSelectedLegalEntity(null));
  }, [selectedMerchant]);

  const resolvedLegalEntityUUID = selectedMerchant?.legal_entity_uuid || fallbackLegalEntityUUID;
  const resolvedCompanyUUID = selectedLegalEntity?.company_uuid || fallbackCompanyUUID;

  useEffect(() => {
    if (routeMerchantUUID || selectedMerchantUUID || merchants.length === 0) return;
    const params = new URLSearchParams(searchParams);
    params.set('merchant_uuid', merchants[0].uuid);
    params.set('page', '1');
    setSearchParams(params);
  }, [routeMerchantUUID, selectedMerchantUUID, merchants, searchParams, setSearchParams]);

  const fetchItems = useCallback(async () => {
    if (!selectedMerchantUUID) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listMerchantAccounts({
        merchant_uuid: selectedMerchantUUID,
        search: search || undefined,
        page: 1,
        page_size: 50,
      });
      setItems(data.merchant_accounts || []);
    } catch (error) {
      console.error(error);
      addToast('שגיאה בטעינת חשבונות סוחר', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedMerchantUUID, search, addToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const headerSub = useMemo(
    () =>
      selectedMerchant
        ? `סוחר נבחר: ${selectedMerchant.name}`
        : 'בחר סוחר כדי לנהל חשבונות סוחר',
    [selectedMerchant],
  );

  const resetForm = () => {
    setForm({
      name: '',
      merchant_code: '',
      mcc: '',
      charges_enabled: true,
      payouts_enabled: false,
      country: 'IL',
      currency: 'ILS',
      timezone: 'Asia/Jerusalem',
      status: 'NEW',
      kyc_status: 'pending',
      aml_status: 'pending',
      risk_profile: 'low',
      contract_type: 'direct',
      volume_tier: 'starter',
      default_acquiring_model: 'PLATFORM_MID',
    });
  };

  const autoFillCreateForm = () => {
    const rand = Math.floor(Math.random() * 9000) + 1000;
    setForm({
      name: `Merchant Account ${rand}`,
      merchant_code: `MA-${rand}`,
      mcc: '5411',
      charges_enabled: true,
      payouts_enabled: false,
      country: 'IL',
      currency: 'ILS',
      timezone: 'Asia/Jerusalem',
      status: 'NEW',
      kyc_status: 'pending',
      aml_status: 'pending',
      risk_profile: 'low',
      contract_type: 'direct',
      volume_tier: 'starter',
      default_acquiring_model: 'PLATFORM_MID',
    });
  };

  const startEdit = (item: MerchantAccount) => {
    setEditing(item);
    setShowCreate(false);
    setForm({
      name: item.name,
      merchant_code: item.merchant_code,
      mcc: item.mcc,
      charges_enabled: item.charges_enabled,
      payouts_enabled: item.payouts_enabled,
      country: item.country,
      currency: item.currency,
      timezone: item.timezone,
      status: item.status,
      kyc_status: item.kyc_status || 'pending',
      aml_status: item.aml_status || 'pending',
      risk_profile: item.risk_profile || 'low',
      contract_type: item.contract_type || 'direct',
      volume_tier: item.volume_tier || 'starter',
      default_acquiring_model: item.default_acquiring_model || 'PLATFORM_MID',
    });
  };

  const handleSave = async () => {
    if (!selectedMerchant || !resolvedLegalEntityUUID || !resolvedCompanyUUID) {
      addToast('נדרש לבחור סוחר + legal_entity + company', 'error');
      return;
    }
    if (!form.name || !form.merchant_code || !form.mcc) {
      addToast('שם, Merchant Code ו-MCC הם שדות חובה', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const payload: UpdateMerchantAccountRequest = {
          ...form,
        };
        await updateMerchantAccount(editing.uuid, payload);
        addToast('חשבון סוחר עודכן בהצלחה', 'success');
        setEditing(null);
      } else {
        const payload: CreateMerchantAccountRequest = {
          merchant_uuid: selectedMerchant.uuid,
          legal_entity_uuid: resolvedLegalEntityUUID,
          company_uuid: resolvedCompanyUUID,
          ...form,
        };
        await createMerchantAccount(payload);
        addToast('חשבון סוחר נוצר בהצלחה', 'success');
        setShowCreate(false);
      }
      resetForm();
      await fetchItems();
    } catch (error) {
      console.error(error);
      addToast(
        `שמירת חשבון סוחר נכשלה: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`,
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteMerchantAccount(deleteTarget.uuid);
      setDeleteTarget(null);
      addToast('חשבון סוחר נמחק בהצלחה', 'success');
      await fetchItems();
    } catch (error) {
      console.error(error);
      addToast('מחיקת חשבון סוחר נכשלה', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="companies-page">
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => navigate('/merchants')}>סוחרים</button>
        <span className="breadcrumb-sep">/</span>
        <span>חשבונות סוחר</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">חשבונות סוחר</h1>
          <p className="page-subtitle">{headerSub}</p>
        </div>
        <button className="btn btn-primary" disabled={!selectedMerchantUUID} onClick={() => { setShowCreate((v) => !v); setEditing(null); resetForm(); }}>
          {showCreate ? 'סגור טופס' : 'חשבון סוחר חדש'}
        </button>
      </div>

      {(showCreate || editing) ? (
        <div className="form-section">
          {showCreate && !editing ? (
            <div className="auto-fill-bar">
              <button type="button" className="btn btn-auto-fill" onClick={autoFillCreateForm}>
                מילוי מהיר
              </button>
            </div>
          ) : null}
          <h3 className="section-title">{editing ? 'עריכת חשבון סוחר' : 'יצירת חשבון סוחר'}</h3>
          <div className="form-grid">
            <div className="form-field"><label className="label">שם *</label><input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Merchant Code *</label><input className="input ltr-input" dir="ltr" value={form.merchant_code} onChange={(e) => setForm((p) => ({ ...p, merchant_code: e.target.value }))} /></div>
            <div className="form-field"><label className="label">MCC *</label><input className="input ltr-input" dir="ltr" value={form.mcc} onChange={(e) => setForm((p) => ({ ...p, mcc: e.target.value }))} /></div>
            <div className="form-field"><label className="label">סטטוס</label><select className="input" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>{Object.keys(STATUS_LABELS).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></div>
            <div className="form-field"><label className="label">KYC</label><select className="input" value={form.kyc_status} onChange={(e) => setForm((p) => ({ ...p, kyc_status: e.target.value }))}>{KYC_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="label">מדינה</label><select className="input" value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}>{MOCK_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</select></div>
            <div className="form-field"><label className="label">מטבע</label><select className="input" value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}>{MOCK_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}</select></div>
            <div className="form-field"><label className="label">אזור זמן</label><select className="input" value={form.timezone} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}>{MOCK_TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            <div className="form-field"><label className="label">סוג חוזה</label><select className="input" value={form.contract_type} onChange={(e) => setForm((p) => ({ ...p, contract_type: e.target.value }))}>{CONTRACT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="form-field"><label className="label">שכבת נפח</label><select className="input" value={form.volume_tier} onChange={(e) => setForm((p) => ({ ...p, volume_tier: e.target.value }))}>{VOLUME_TIERS.map((v) => <option key={v} value={v}>{v}</option>)}</select></div>
            <div className="form-field"><label className="label">Default Acquiring Model</label><select className="input" value={form.default_acquiring_model} onChange={(e) => setForm((p) => ({ ...p, default_acquiring_model: e.target.value }))}><option value="PLATFORM_MID">PLATFORM_MID</option><option value="SELLER_MID">SELLER_MID</option></select></div>
            <div className="form-field toggle-field"><label className="toggle-label"><div className={`toggle ${form.charges_enabled ? 'active' : ''}`} onClick={() => setForm((p) => ({ ...p, charges_enabled: !p.charges_enabled }))}><div className="toggle-knob" /></div><span>Charges Enabled</span></label></div>
            <div className="form-field toggle-field"><label className="toggle-label"><div className={`toggle ${form.payouts_enabled ? 'active' : ''}`} onClick={() => setForm((p) => ({ ...p, payouts_enabled: !p.payouts_enabled }))}><div className="toggle-knob" /></div><span>Payouts Enabled</span></label></div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'שומר...' : editing ? 'עדכן' : 'צור'}</button>
            <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setEditing(null); }}>ביטול</button>
          </div>
        </div>
      ) : null}

      <div className="card filters-card">
        <form className="filters-form" onSubmit={(e) => { e.preventDefault(); fetchItems(); }}>
          <div className="filter-group">
            <select className="input" value={selectedMerchantUUID} onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('merchant_uuid', e.target.value); else params.delete('merchant_uuid');
              setSearchParams(params);
            }} disabled={!!routeMerchantUUID}>
              <option value="">בחר סוחר</option>
              {merchants.map((m) => <option key={m.uuid} value={m.uuid}>{m.name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <input className="input" placeholder="חיפוש" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit">חיפוש</button>
        </form>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="loading-state"><div className="spinner" /><span>טוען חשבונות סוחר...</span></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><p>לא נמצאו חשבונות סוחר</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>שם</th><th>קוד</th><th>MCC</th><th>סטטוס</th><th>מטבע</th><th>פעולות</th></tr></thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.uuid}>
                    <td className="cell-name">{item.name}</td>
                    <td className="cell-mono">{item.merchant_code}</td>
                    <td className="cell-mono">{item.mcc}</td>
                    <td>{STATUS_LABELS[item.status] || item.status}</td>
                    <td className="cell-mono">{item.currency}</td>
                    <td className="cell-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(`/merchant-accounts/${item.uuid}/stores?merchant_uuid=${selectedMerchantUUID}`)}>חנויות</button>
                      <button className="action-btn edit" onClick={() => startEdit(item)}>✎</button>
                      <button className="action-btn delete" onClick={() => setDeleteTarget(item)}>🗑</button>
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
        title="מחיקת חשבון סוחר"
        message={`למחוק את "${deleteTarget?.name}"?`}
        confirmLabel="מחק"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
