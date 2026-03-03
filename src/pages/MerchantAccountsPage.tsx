import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getMerchant, listMerchants } from '../api/merchants';
import { getLegalEntity, listLegalEntities } from '../api/legalEntities';
import { listCompanies } from '../api/companies';
import { listCurrencies } from '../api/currencies';
import {
  createMerchantAccount,
  deleteMerchantAccount,
  listMerchantAccounts,
  updateMerchantAccount,
} from '../api/merchantAccounts';
import {
  listMerchantAccountCurrencies,
  syncMerchantAccountCurrencies,
} from '../api/merchantAccountCurrencies';
import type { Currency } from '../types/currency';
import type { Merchant } from '../types/merchant';
import type { LegalEntity } from '../types/legalEntity';
import type { Company } from '../types/company';
import type {
  CreateMerchantAccountRequest,
  MerchantAccount,
  UpdateMerchantAccountRequest,
} from '../types/merchantAccount';
import { CONTRACT_TYPES, KYC_STATUSES, MOCK_COUNTRIES, MOCK_TIMEZONES, STATUS_LABELS, VOLUME_TIERS } from '../types/company';
import ConfirmDialog from '../components/ConfirmDialog';
import DualListSelector from '../components/DualListSelector';
import type { DualListItem } from '../components/DualListSelector';
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
  const selectedCompanyUUID = searchParams.get('company_uuid') || '';
  const selectedLegalEntityUUID = searchParams.get('legal_entity_uuid') || '';
  const [companies, setCompanies] = useState<Company[]>([]);
  const [legalEntities, setLegalEntities] = useState<LegalEntity[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [selectedLegalEntity, setSelectedLegalEntity] = useState<LegalEntity | null>(null);
  const [items, setItems] = useState<MerchantAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<MerchantAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MerchantAccount | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);

  const currencyDualListItems = useMemo<DualListItem[]>(
    () => currencies.map((c) => ({ code: c.alpha3, label: `${c.alpha3} - ${c.name}` })),
    [currencies],
  );
  const hasValidSelectedCurrencies = useMemo(() => {
    const availableCurrencyCodes = new Set(currencies.map((c) => c.alpha3));
    if (availableCurrencyCodes.size === 0) return false;
    return selectedCurrencies.some((code) => availableCurrencyCodes.has(code));
  }, [currencies, selectedCurrencies]);

  const [form, setForm] = useState({
    name: '',
    merchant_code: '',
    mcc: '',
    charges_enabled: true,
    payouts_enabled: false,
    country: 'IL',
    currency: '',
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
    listCompanies({ page: 1, page_size: 300 })
      .then((data) => setCompanies(data.companies || []))
      .catch(() => setCompanies([]));
  }, []);

  useEffect(() => {
    listCurrencies({ is_active: 'true', page: 1, page_size: 300 })
      .then((data) => setCurrencies(data.currencies || []))
      .catch(() => setCurrencies([]));
  }, []);

  useEffect(() => {
    const companyUUID = selectedCompanyUUID || fallbackCompanyUUID;
    if (!companyUUID) {
      setLegalEntities([]);
      return;
    }
    listLegalEntities({ company_uuid: companyUUID, page: 1, page_size: 300 })
      .then((data) => setLegalEntities(data.legal_entities || []))
      .catch(() => setLegalEntities([]));
  }, [selectedCompanyUUID, fallbackCompanyUUID]);

  useEffect(() => {
    const legalEntityUUID = selectedLegalEntityUUID || fallbackLegalEntityUUID;
    if (!legalEntityUUID) {
      setMerchants([]);
      return;
    }
    listMerchants({ legal_entity_uuid: legalEntityUUID, page: 1, page_size: 300 })
      .then((data) => setMerchants(data.merchants || []))
      .catch(() => setMerchants([]));
  }, [selectedLegalEntityUUID, fallbackLegalEntityUUID]);

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
    if (!selectedMerchant || !selectedLegalEntity) return;
    const params = new URLSearchParams(searchParams);
    if (selectedLegalEntity.company_uuid) params.set('company_uuid', selectedLegalEntity.company_uuid);
    if (selectedMerchant.legal_entity_uuid) params.set('legal_entity_uuid', selectedMerchant.legal_entity_uuid);
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params);
    }
  }, [selectedMerchant, selectedLegalEntity, searchParams, setSearchParams]);

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
      currency: '',
      timezone: 'Asia/Jerusalem',
      status: 'NEW',
      kyc_status: 'pending',
      aml_status: 'pending',
      risk_profile: 'low',
      contract_type: 'direct',
      volume_tier: 'starter',
      default_acquiring_model: 'PLATFORM_MID',
    });
    setSelectedCurrencies([]);
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
      currency: '',
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

  const startEdit = async (item: MerchantAccount) => {
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
    try {
      const data = await listMerchantAccountCurrencies(item.uuid);
      setSelectedCurrencies(
        (data.merchant_account_currencies || []).map((c) => c.currency_code),
      );
    } catch {
      setSelectedCurrencies([]);
    }
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
    if (currencies.length === 0) {
      addToast('אין מטבעות זמינים. לא ניתן לשמור חשבון סוחר', 'error');
      return;
    }
    if (!hasValidSelectedCurrencies) {
      addToast('חובה לבחור לפחות מטבע זמין אחד', 'error');
      return;
    }

    setSaving(true);
    try {
      const availableCurrencyCodes = new Set(currencies.map((c) => c.alpha3));
      const validSelectedCurrencies = selectedCurrencies.filter((code) => availableCurrencyCodes.has(code));
      const baseCurrency =
        form.currency && validSelectedCurrencies.includes(form.currency)
          ? form.currency
          : validSelectedCurrencies[0];

      let accountUUID: string;
      if (editing) {
        accountUUID = editing.uuid;
        const payload: UpdateMerchantAccountRequest = {
          uuid: editing.uuid,
          ...form,
          currency: baseCurrency,
        };
        await updateMerchantAccount(editing.uuid, payload);
      } else {
        const payload: CreateMerchantAccountRequest = {
          merchant_uuid: selectedMerchant.uuid,
          legal_entity_uuid: resolvedLegalEntityUUID,
          company_uuid: resolvedCompanyUUID,
          ...form,
          currency: baseCurrency,
        };
        const result = await createMerchantAccount(payload);
        accountUUID = (result as unknown as { merchant_account?: { uuid?: string }; uuid?: string })
          ?.merchant_account?.uuid || (result as unknown as { uuid?: string })?.uuid || '';
      }

      if (accountUUID && selectedCurrencies.length > 0) {
        try {
          await syncMerchantAccountCurrencies(accountUUID, selectedCurrencies);
        } catch (currError) {
          console.error('Currency sync error:', currError);
          addToast('חשבון סוחר נשמר, אך סנכרון המטבעות נכשל', 'error');
        }
      }

      addToast(
        editing ? 'חשבון סוחר עודכן בהצלחה' : 'חשבון סוחר נוצר בהצלחה',
        'success',
      );
      if (editing) setEditing(null);
      else setShowCreate(false);
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
            <div className="form-field"><label className="label">מטבע</label><input className="input" value={selectedCurrencies[0] || 'ייבחר מתוך המטבעות הזמינים'} disabled /></div>
            <div className="form-field"><label className="label">אזור זמן</label><select className="input" value={form.timezone} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}>{MOCK_TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            <div className="form-field"><label className="label">סוג חוזה</label><select className="input" value={form.contract_type} onChange={(e) => setForm((p) => ({ ...p, contract_type: e.target.value }))}>{CONTRACT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="form-field"><label className="label">שכבת נפח</label><select className="input" value={form.volume_tier} onChange={(e) => setForm((p) => ({ ...p, volume_tier: e.target.value }))}>{VOLUME_TIERS.map((v) => <option key={v} value={v}>{v}</option>)}</select></div>
            <div className="form-field"><label className="label">Default Acquiring Model</label><select className="input" value={form.default_acquiring_model} onChange={(e) => setForm((p) => ({ ...p, default_acquiring_model: e.target.value }))}><option value="PLATFORM_MID">PLATFORM_MID</option><option value="SELLER_MID">SELLER_MID</option></select></div>
            <div className="form-field toggle-field"><label className="toggle-label"><div className={`toggle ${form.charges_enabled ? 'active' : ''}`} onClick={() => setForm((p) => ({ ...p, charges_enabled: !p.charges_enabled }))}><div className="toggle-knob" /></div><span>Charges Enabled</span></label></div>
            <div className="form-field toggle-field"><label className="toggle-label"><div className={`toggle ${form.payouts_enabled ? 'active' : ''}`} onClick={() => setForm((p) => ({ ...p, payouts_enabled: !p.payouts_enabled }))}><div className="toggle-knob" /></div><span>Payouts Enabled</span></label></div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h4 className="section-title" style={{ marginBottom: '12px' }}>מטבעות זמינים לחשבון סוחר</h4>
            <DualListSelector
              sourceTitle="כל המטבעות"
              targetTitle="מטבעות נבחרים"
              available={currencyDualListItems}
              selected={selectedCurrencies}
              onChange={setSelectedCurrencies}
              disabled={saving}
            />
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !hasValidSelectedCurrencies}>{saving ? 'שומר...' : editing ? 'עדכן' : 'צור'}</button>
            <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setEditing(null); resetForm(); }}>ביטול</button>
          </div>
        </div>
      ) : null}

      <div className="card filters-card">
        <form className="filters-form" onSubmit={(e) => { e.preventDefault(); fetchItems(); }}>
          <div className="filter-group">
            <select className="input" value={selectedCompanyUUID} onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('company_uuid', e.target.value); else params.delete('company_uuid');
              params.delete('legal_entity_uuid');
              if (!routeMerchantUUID) params.delete('merchant_uuid');
              setSearchParams(params);
            }}>
              <option value="">בחר חברה</option>
              {companies.map((company) => <option key={company.uuid} value={company.uuid}>{company.name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <select
              className="input"
              value={selectedLegalEntityUUID}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                if (e.target.value) params.set('legal_entity_uuid', e.target.value); else params.delete('legal_entity_uuid');
                if (!routeMerchantUUID) params.delete('merchant_uuid');
                setSearchParams(params);
              }}
              disabled={!selectedCompanyUUID && !fallbackCompanyUUID}
            >
              <option value="">בחר ישות משפטית</option>
              {legalEntities.map((entity) => <option key={entity.uuid} value={entity.uuid}>{entity.legal_name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <select className="input" value={selectedMerchantUUID} onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('merchant_uuid', e.target.value); else params.delete('merchant_uuid');
              setSearchParams(params);
            }} disabled={!!routeMerchantUUID || (!selectedLegalEntityUUID && !fallbackLegalEntityUUID)}>
              <option value="">בחר סוחר</option>
              {selectedMerchant && !merchants.some((m) => m.uuid === selectedMerchant.uuid)
                ? <option value={selectedMerchant.uuid}>{selectedMerchant.name || selectedMerchant.uuid}</option>
                : null}
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
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(`/merchant-accounts/${item.uuid}/sub-merchants?merchant_uuid=${selectedMerchantUUID}`)}>תתי-סוחרים</button>
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
