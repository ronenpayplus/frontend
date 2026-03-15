import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { listMerchantAccountCurrencies } from '../api/merchantAccountCurrencies';
import { listPaymentMethods } from '../api/paymentMethods';
import { listChannelTypes } from '../api/channelTypes';
import { listCurrencies } from '../api/currencies';
import { listOrgEntityLocalizations } from '../api/orgEntityLocalizations';
import {
  listSubMerchantCurrencies,
  syncSubMerchantCurrencies,
} from '../api/subMerchantCurrencies';
import { listSubMerchantMethods, setSubMerchantMethods } from '../api/subMerchantMethods';
import { listSubMerchantChannels, setSubMerchantChannels } from '../api/subMerchantChannels';
import { getMerchantAccount, listMerchantAccounts } from '../api/merchantAccounts';
import { listAccounts } from '../api/accounts';
import { listLegalEntities } from '../api/legalEntities';
import { getMerchant, listMerchants } from '../api/merchants';
import {
  createSubMerchantAccount,
  deleteSubMerchantAccount,
  listSubMerchantAccounts,
  updateSubMerchantAccount,
} from '../api/subMerchantAccounts';
import type { MerchantAccount } from '../types/merchantAccount';
import type { Merchant } from '../types/merchant';
import type { Account } from '../types/account';
import type { LegalEntity } from '../types/legalEntity';
import type { Currency } from '../types/currency';
import type { PaymentMethod } from '../types/paymentMethod';
import type { ChannelType } from '../types/channelType';
import type { LocalizationInput } from '../types/orgEntityLocalization';
import type {
  CreateSubMerchantAccountRequest,
  SubMerchantAccount,
  UpdateSubMerchantAccountRequest,
} from '../types/subMerchantAccount';
import {
  SUB_MERCHANT_ENTITY_TYPES,
  SUB_MERCHANT_KYC_STATUSES,
  SUB_MERCHANT_ONBOARDING_STATUSES,
  SUB_MERCHANT_SELLER_MODELS,
  SUB_MERCHANT_STATUSES,
} from '../types/subMerchantAccount';
import { MOCK_COUNTRIES, MOCK_TIMEZONES } from '../types/account';
import ConfirmDialog from '../components/ConfirmDialog';
import DualListSelector from '../components/DualListSelector';
import type { DualListItem } from '../components/DualListSelector';
import LocalizationsEditor, { ensureAtLeastOneLocalization } from '../components/LocalizationsEditor';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './AccountsList.css';
import './AccountCreate.css';

export default function SubMerchantAccountsPage() {
  const navigate = useNavigate();
  const { uuid: routeMerchantAccountUUID } = useParams<{ uuid: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();

  const selectedAccountUUID = searchParams.get('account_uuid') || '';
  const selectedLegalEntityUUID = searchParams.get('legal_entity_uuid') || '';
  const selectedMerchantAccountUUID = routeMerchantAccountUUID || searchParams.get('merchant_account_uuid') || '';
  const selectedMerchantUUID = searchParams.get('merchant_uuid') || '';
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [legalEntities, setLegalEntities] = useState<LegalEntity[]>([]);
  const [allMerchantAccounts, setAllMerchantAccounts] = useState<MerchantAccount[]>([]);
  const [merchantAccountCurrencies, setMerchantAccountCurrencies] = useState<string[]>([]);
  const [allCurrencies, setAllCurrencies] = useState<Currency[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [items, setItems] = useState<SubMerchantAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<SubMerchantAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubMerchantAccount | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [paymentMethodsRef, setPaymentMethodsRef] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [channelTypesRef, setChannelTypesRef] = useState<ChannelType[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [localizations, setLocalizations] = useState<LocalizationInput[]>([
    {
      lang_code: 'en',
      display_name: '',
      brand_name: '',
      description: '',
      support_email: '',
      support_phone: '',
      is_default: true,
    },
  ]);
  const merchantAccounts = useMemo(
    () =>
      allMerchantAccounts.filter((account) => {
        if (selectedAccountUUID && account.account_uuid && account.account_uuid !== selectedAccountUUID) return false;
        if (selectedLegalEntityUUID && account.legal_entity_uuid && account.legal_entity_uuid !== selectedLegalEntityUUID) return false;
        if (selectedMerchantUUID && account.merchant_uuid && account.merchant_uuid !== selectedMerchantUUID) return false;
        return true;
      }),
    [allMerchantAccounts, selectedAccountUUID, selectedLegalEntityUUID, selectedMerchantUUID],
  );
  const selectedMerchantAccount =
    merchantAccounts.find((m) => m.uuid === selectedMerchantAccountUUID)
    || allMerchantAccounts.find((m) => m.uuid === selectedMerchantAccountUUID)
    || null;
  const inferredMerchantUUID = selectedMerchantAccount?.merchant_uuid || '';
  const effectiveMerchantUUID = selectedMerchantUUID || inferredMerchantUUID;
  const currencyDualListItems = useMemo<DualListItem[]>(
    () => allCurrencies.map((currency) => ({ code: currency.alpha3, label: `${currency.alpha3} - ${currency.name}` })),
    [allCurrencies],
  );
  const availableCurrencyCodes = useMemo(
    () => new Set(allCurrencies.map((currency) => currency.alpha3)),
    [allCurrencies],
  );
  const hasValidSelectedCurrencies = useMemo(
    () => selectedCurrencies.some((code) => availableCurrencyCodes.has(code)),
    [selectedCurrencies, availableCurrencyCodes],
  );
  const paymentMethodDualListItems = useMemo<DualListItem[]>(
    () => paymentMethodsRef.filter((m) => m.is_active).map((m) => ({ code: m.method_code, label: `${m.method_code} - ${m.display_name}` })),
    [paymentMethodsRef],
  );
  const channelTypeDualListItems = useMemo<DualListItem[]>(
    () => channelTypesRef.filter((c) => c.is_active).map((c) => ({ code: c.channel_code, label: `${c.channel_code} - ${c.display_name}` })),
    [channelTypesRef],
  );

  const [form, setForm] = useState({
    name: '',
    sub_merchant_code: '',
    entity_type: 'account',
    seller_model: 'PLATFORM_MOR',
    category_code: '5411',
    mcc_default: '5411',
    status: 'NEW',
    onboarding_status: 'NEW',
    kyc_status: 'not_started',
    country: 'IL',
    currency: 'ILS',
    timezone: 'Asia/Jerusalem',
    payments_enabled: false,
    payouts_enabled: false,
    default_acquiring_model: 'PLATFORM_MID',
    notes: '',
  });

  useEffect(() => {
    listAccounts({ page: 1, page_size: 300 })
      .then((data) => setAccounts(data.accounts || []))
      .catch(() => setAccounts([]));
  }, []);

  useEffect(() => {
    listCurrencies({ is_active: 'true', page: 1, page_size: 300 })
      .then((data) => setAllCurrencies(data.currencies || []))
      .catch(() => setAllCurrencies([]));
  }, []);

  const [paymentMethodsLoadError, setPaymentMethodsLoadError] = useState('');
  const [channelTypesLoadError, setChannelTypesLoadError] = useState('');

  useEffect(() => {
    listPaymentMethods({ is_active: 'true', page: 1, page_size: 500 })
      .then((data) => {
        setPaymentMethodsRef(data?.payment_methods || []);
        setPaymentMethodsLoadError('');
      })
      .catch((err) => {
        setPaymentMethodsRef([]);
        setPaymentMethodsLoadError(err instanceof Error ? err.message : 'Failed to load');
      });
  }, []);

  useEffect(() => {
    listChannelTypes({ is_active: 'true', page: 1, page_size: 500 })
      .then((data) => {
        setChannelTypesRef(data?.channel_types || []);
        setChannelTypesLoadError('');
      })
      .catch((err) => {
        setChannelTypesRef([]);
        setChannelTypesLoadError(err instanceof Error ? err.message : 'Failed to load');
      });
  }, []);

  useEffect(() => {
    if (!selectedAccountUUID) {
      setLegalEntities([]);
      return;
    }
    listLegalEntities({ account_uuid: selectedAccountUUID, page: 1, page_size: 300 })
      .then((data) => setLegalEntities(data.legal_entities || []))
      .catch(() => setLegalEntities([]));
  }, [selectedAccountUUID]);

  useEffect(() => {
    if (!selectedLegalEntityUUID) {
      setMerchants([]);
      return;
    }
    listMerchants({ legal_entity_uuid: selectedLegalEntityUUID, page: 1, page_size: 300 })
      .then((data) => setMerchants(data.merchants || []))
      .catch(() => setMerchants([]));
  }, [selectedLegalEntityUUID]);

  useEffect(() => {
    if (!effectiveMerchantUUID) return;
    if (merchants.some((m) => m.uuid === effectiveMerchantUUID)) return;
    getMerchant(effectiveMerchantUUID)
      .then((data) => {
        const merchant = data.merchant;
        if (!merchant?.uuid) return;
        setMerchants((prev) => (prev.some((m) => m.uuid === merchant.uuid) ? prev : [merchant, ...prev]));
      })
      .catch(() => {
        // keep UI usable even if merchant lookup fails
      });
  }, [effectiveMerchantUUID, merchants]);

  useEffect(() => {
    listMerchantAccounts({ page: 1, page_size: 500 })
      .then((data) => setAllMerchantAccounts(data.merchant_accounts || []))
      .catch(() => setAllMerchantAccounts([]));
  }, []);

  useEffect(() => {
    if (!selectedMerchantAccountUUID) {
      setMerchantAccountCurrencies([]);
      return;
    }
    listMerchantAccountCurrencies(selectedMerchantAccountUUID)
      .then((data) => {
        const rows = data.merchant_account_currencies || [];
        const uniqueCodes = Array.from(new Set(rows.map((row) => row.currency_code).filter(Boolean)));
        setMerchantAccountCurrencies(uniqueCodes);
        if (uniqueCodes.length > 0) {
          const defaultCode = rows.find((row) => row.is_default)?.currency_code || uniqueCodes[0];
          setSelectedCurrencies((prev) => (prev.length > 0 ? prev.filter((code) => uniqueCodes.includes(code)) : [defaultCode]));
          setForm((prev) => ({ ...prev, currency: defaultCode }));
        } else {
          setSelectedCurrencies([]);
          setForm((prev) => ({ ...prev, currency: '' }));
        }
      })
      .catch(() => {
        setMerchantAccountCurrencies([]);
        setSelectedCurrencies([]);
        setForm((prev) => ({ ...prev, currency: '' }));
      });
  }, [selectedMerchantAccountUUID]);

  useEffect(() => {
    if (merchantAccountCurrencies.length > 0) return;
    if (!selectedMerchantAccount?.currency) return;
    setMerchantAccountCurrencies([selectedMerchantAccount.currency]);
    setSelectedCurrencies([selectedMerchantAccount.currency]);
    setForm((prev) => ({ ...prev, currency: selectedMerchantAccount.currency || prev.currency }));
  }, [merchantAccountCurrencies, selectedMerchantAccount]);

  useEffect(() => {
    if (selectedCurrencies.length === 0) return;
    setForm((prev) => ({ ...prev, currency: selectedCurrencies[0] }));
  }, [selectedCurrencies]);

  useEffect(() => {
    const missingMerchantUUIDs = Array.from(
      new Set(
        merchantAccounts
          .map((account) => account.merchant_uuid)
          .filter((uuid): uuid is string => Boolean(uuid) && !merchants.some((merchant) => merchant.uuid === uuid)),
      ),
    );
    if (missingMerchantUUIDs.length === 0) return;
    Promise.all(
      missingMerchantUUIDs.map((uuid) =>
        getMerchant(uuid)
          .then((data) => data.merchant)
          .catch(() => null),
      ),
    ).then((fetched) => {
      const valid = fetched.filter((merchant): merchant is Merchant => Boolean(merchant?.uuid));
      if (valid.length === 0) return;
      setMerchants((prev) => {
        const byUUID = new Map(prev.map((merchant) => [merchant.uuid, merchant]));
        valid.forEach((merchant) => byUUID.set(merchant.uuid, merchant));
        return Array.from(byUUID.values());
      });
    });
  }, [merchantAccounts, merchants]);

  useEffect(() => {
    const accountUUIDToResolve = routeMerchantAccountUUID || selectedMerchantAccountUUID;
    if (!accountUUIDToResolve) return;

    const syncHierarchy = async () => {
      const params = new URLSearchParams(searchParams);
      try {
        const local = allMerchantAccounts.find((account) => account.uuid === accountUUIDToResolve);
        const account = local || (await getMerchantAccount(accountUUIDToResolve)).merchant_account;
        if (!account) return;
        if (account.account_uuid) params.set('account_uuid', account.account_uuid);
        if (account.legal_entity_uuid) params.set('legal_entity_uuid', account.legal_entity_uuid);
        if (account.merchant_uuid) {
          params.set('merchant_uuid', account.merchant_uuid);
        } else {
          params.delete('merchant_uuid');
        }
        params.set('merchant_account_uuid', account.uuid);
        if (params.toString() !== searchParams.toString()) {
          setSearchParams(params);
        }
      } catch {
        // keep manual selection flow
      }
    };
    syncHierarchy();
  }, [routeMerchantAccountUUID, selectedMerchantAccountUUID, allMerchantAccounts, searchParams, setSearchParams]);

  const fetchItems = useCallback(async () => {
    if (!selectedMerchantAccountUUID) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listSubMerchantAccounts({
        merchant_account_uuid: selectedMerchantAccountUUID,
        search: search || undefined,
        page: 1,
        page_size: 50,
      });
      setItems(data.sub_merchant_accounts || []);
    } catch (error) {
      console.error(error);
      addToast('Failed to load sub merchants', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedMerchantAccountUUID, search, addToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const selectedAccountName = useMemo(
    () => selectedMerchantAccount?.name || '',
    [selectedMerchantAccount],
  );
  const merchantOptions = useMemo(() => {
    const byUUID = new Map<string, string>();
    merchants.forEach((merchant) => {
      if (!merchant.uuid) return;
      byUUID.set(merchant.uuid, merchant.name || merchant.merchant_code || merchant.uuid);
    });
    merchantAccounts.forEach((account) => {
      if (!account.merchant_uuid) return;
      if (!byUUID.has(account.merchant_uuid)) {
        byUUID.set(account.merchant_uuid, `Merchant (via account: ${account.name || account.uuid})`);
      }
    });
    return Array.from(byUUID.entries()).map(([uuid, label]) => ({ uuid, label }));
  }, [merchants, merchantAccounts]);
  const hasSelectedMerchantInOptions = useMemo(
    () => (effectiveMerchantUUID ? merchantOptions.some((option) => option.uuid === effectiveMerchantUUID) : false),
    [merchantOptions, effectiveMerchantUUID],
  );

  const selectedMerchantFallbackLabel = useMemo(() => {
    if (!effectiveMerchantUUID || hasSelectedMerchantInOptions) return '';
    const fromAccount = merchantAccounts.find((a) => a.merchant_uuid === effectiveMerchantUUID);
    return fromAccount?.name
      ? `Merchant (via account: ${fromAccount.name})`
      : `UUID: ${effectiveMerchantUUID}`;
  }, [effectiveMerchantUUID, hasSelectedMerchantInOptions, merchantAccounts]);

  useEffect(() => {
    if (!selectedMerchantAccountUUID || !inferredMerchantUUID) return;
    if (selectedMerchantUUID === inferredMerchantUUID) return;
    const params = new URLSearchParams(searchParams);
    params.set('merchant_uuid', inferredMerchantUUID);
    setSearchParams(params);
  }, [selectedMerchantAccountUUID, selectedMerchantUUID, inferredMerchantUUID, searchParams, setSearchParams]);

  const resetForm = () => {
    setForm({
      name: '',
      sub_merchant_code: '',
      entity_type: 'account',
      seller_model: 'PLATFORM_MOR',
      category_code: '5411',
      mcc_default: '5411',
      status: 'NEW',
      onboarding_status: 'NEW',
      kyc_status: 'not_started',
      country: 'IL',
      currency: merchantAccountCurrencies[0] || '',
      timezone: 'Asia/Jerusalem',
      payments_enabled: false,
      payouts_enabled: false,
      default_acquiring_model: 'PLATFORM_MID',
      notes: '',
    });
    setSelectedCurrencies([]);
    setSelectedPaymentMethods([]);
    setSelectedChannels([]);
    setLocalizations([
      {
        lang_code: 'en',
        display_name: '',
        brand_name: '',
        description: '',
        support_email: '',
        support_phone: '',
        is_default: true,
      },
    ]);
  };

  const autoFill = () => {
    const rand = Math.floor(Math.random() * 9000) + 1000;
    setForm({
      name: `Sub Merchant ${rand}`,
      sub_merchant_code: `SUB-${rand}`,
      entity_type: 'account',
      seller_model: 'PLATFORM_MOR',
      category_code: '5411',
      mcc_default: '5411',
      status: 'NEW',
      onboarding_status: 'NEW',
      kyc_status: 'not_started',
      country: 'IL',
      currency: merchantAccountCurrencies[0] || form.currency || '',
      timezone: 'Asia/Jerusalem',
      payments_enabled: false,
      payouts_enabled: false,
      default_acquiring_model: 'PLATFORM_MID',
      notes: 'Auto-filled for testing',
    });
    setLocalizations([
      {
        lang_code: 'en',
        display_name: `Sub Merchant ${rand}`,
        brand_name: `Sub Merchant ${rand}`,
        description: 'English localization',
        support_email: `sub-${rand}@example.com`,
        support_phone: `+1-202-555-${String(rand).slice(-4)}`,
        is_default: true,
      },
      {
        lang_code: 'fr',
        display_name: `Sous Marchand ${rand}`,
        brand_name: `Sous Marchand ${rand}`,
        description: 'French localization',
        support_email: `assistance-${rand}@example.com`,
        support_phone: `+33-1-${String(rand).slice(-4)}-1000`,
        is_default: false,
      },
    ]);
  };

  const startEdit = async (item: SubMerchantAccount) => {
    setShowCreate(false);
    setEditing(item);
    setForm({
      name: item.name,
      sub_merchant_code: item.sub_merchant_code || '',
      entity_type: item.entity_type || 'account',
      seller_model: item.seller_model,
      category_code: item.category_code,
      mcc_default: item.mcc_default || '',
      status: item.status,
      onboarding_status: item.onboarding_status || 'NEW',
      kyc_status: item.kyc_status || 'not_started',
      country: item.country,
      currency: item.currency,
      timezone: item.timezone,
      payments_enabled: item.payments_enabled,
      payouts_enabled: item.payouts_enabled,
      default_acquiring_model: item.default_acquiring_model || 'PLATFORM_MID',
      notes: item.notes || '',
    });
    try {
      const data = await listSubMerchantCurrencies(item.uuid);
      const selected = (data.sub_merchant_currencies || []).map((row) => row.currency_code);
      setSelectedCurrencies(selected.length > 0 ? selected : (item.currency ? [item.currency] : []));
    } catch {
      setSelectedCurrencies(item.currency ? [item.currency] : []);
    }
    try {
      const data = await listSubMerchantMethods(item.uuid);
      setSelectedPaymentMethods((data.sub_merchant_methods || []).map((row) => row.method_code));
    } catch {
      setSelectedPaymentMethods([]);
    }
    try {
      const data = await listSubMerchantChannels(item.uuid);
      setSelectedChannels((data.sub_merchant_channels || []).map((row) => row.channel_type));
    } catch {
      setSelectedChannels([]);
    }
    try {
      const rows = await listOrgEntityLocalizations('sub_merchant', item.uuid);
      setLocalizations(rows);
    } catch {
      setLocalizations([
        {
          lang_code: 'en',
          display_name: item.name,
          brand_name: '',
          description: '',
          support_email: '',
          support_phone: '',
          is_default: true,
        },
      ]);
    }
  };

  const save = async () => {
    if (!selectedMerchantAccountUUID || !effectiveMerchantUUID || !form.name || !form.category_code) {
      addToast('Merchant account + merchant + name, category and currency are required', 'error');
      return;
    }
    if (allCurrencies.length === 0) {
      addToast('No available currencies in reference table', 'error');
      return;
    }
    if (selectedCurrencies.length === 0) {
      addToast('At least one currency must be selected', 'error');
      return;
    }
    const validSelected = selectedCurrencies.filter((code) => availableCurrencyCodes.has(code));
    if (validSelected.length === 0) {
      addToast('No valid currency selected from reference table', 'error');
      return;
    }
    const selectedCurrency = validSelected[0];

    setSaving(true);
    try {
      let subMerchantUUID = '';
      if (editing) {
        const payload: UpdateSubMerchantAccountRequest = {
          ...form,
          currency: selectedCurrency,
          localizations: ensureAtLeastOneLocalization(localizations, form.name),
        };
        await updateSubMerchantAccount(editing.uuid, payload);
        subMerchantUUID = editing.uuid;
        addToast('Sub merchant updated', 'success');
        setEditing(null);
      } else {
        const payload: CreateSubMerchantAccountRequest = {
          merchant_account_uuid: selectedMerchantAccountUUID,
          merchant_uuid: effectiveMerchantUUID,
          ...form,
          currency: selectedCurrency,
          localizations: ensureAtLeastOneLocalization(localizations, form.name),
        };
        const created = await createSubMerchantAccount(payload);
        subMerchantUUID = (created as unknown as { uuid?: string; sub_merchant_account?: { uuid?: string } }).uuid
          || (created as unknown as { sub_merchant_account?: { uuid?: string } }).sub_merchant_account?.uuid
          || '';
        addToast('Sub merchant created', 'success');
        setShowCreate(false);
      }

      if (subMerchantUUID && validSelected.length > 0) {
        try {
          await syncSubMerchantCurrencies(subMerchantUUID, validSelected);
        } catch (currencySyncError) {
          console.error(currencySyncError);
          addToast('Sub merchant saved, but currency sync failed', 'error');
        }
      }
      if (subMerchantUUID && selectedPaymentMethods.length > 0) {
        try {
          await setSubMerchantMethods({
            sub_merchant_uuid: subMerchantUUID,
            methods: selectedPaymentMethods.map((code) => ({ method_code: code, is_enabled: true })),
          });
        } catch (methodsError) {
          console.error(methodsError);
          addToast('Sub merchant saved, but payment methods sync failed', 'error');
        }
      }
      if (subMerchantUUID && selectedChannels.length > 0) {
        try {
          await setSubMerchantChannels({
            sub_merchant_uuid: subMerchantUUID,
            channels: selectedChannels.map((code) => ({ channel_type: code })),
          });
        } catch (channelsError) {
          console.error(channelsError);
          addToast('Sub merchant saved, but channels sync failed', 'error');
        }
      }

      resetForm();
      await fetchItems();
    } catch (error) {
      console.error(error);
      addToast('Failed to save sub merchant', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteSubMerchantAccount(deleteTarget.uuid);
      setDeleteTarget(null);
      addToast('Sub merchant deleted', 'success');
      await fetchItems();
    } catch (error) {
      console.error(error);
      addToast('Failed to delete sub merchant', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="accounts-page">
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => navigate('/merchant-accounts')}>Merchant Accounts</button>
        <span className="breadcrumb-sep">/</span>
        <span>Sub Merchants</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Sub Merchants</h1>
          <p className="page-subtitle">{selectedAccountName ? `Selected account: ${selectedAccountName}` : 'Select a merchant account'}</p>
        </div>
        <button className="btn btn-primary" disabled={!selectedMerchantAccountUUID} onClick={() => { setShowCreate((v) => !v); setEditing(null); resetForm(); }}>
          {showCreate ? 'Close Form' : 'New Sub Merchant'}
        </button>
      </div>

      {(showCreate || editing) ? (
        <div className="form-section">
          <div className="auto-fill-bar">
            <button type="button" className="btn btn-auto-fill" onClick={autoFill}>Quick Fill</button>
          </div>
          <h3 className="section-title">{editing ? 'Edit Sub Merchant' : 'Create Sub Merchant'}</h3>
          <div className="form-grid">
            <div className="form-field"><label className="label">Name *</label><input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Sub Merchant Code</label><input className="input ltr-input" dir="ltr" value={form.sub_merchant_code} onChange={(e) => setForm((p) => ({ ...p, sub_merchant_code: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Entity Type</label><select className="input" value={form.entity_type} onChange={(e) => setForm((p) => ({ ...p, entity_type: e.target.value }))}>{SUB_MERCHANT_ENTITY_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
            <div className="form-field"><label className="label">Seller Model</label><select className="input" value={form.seller_model} onChange={(e) => setForm((p) => ({ ...p, seller_model: e.target.value }))}>{SUB_MERCHANT_SELLER_MODELS.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
            <div className="form-field"><label className="label">Category *</label><input className="input ltr-input" dir="ltr" value={form.category_code} onChange={(e) => setForm((p) => ({ ...p, category_code: e.target.value }))} /></div>
            <div className="form-field"><label className="label">MCC</label><input className="input ltr-input" dir="ltr" value={form.mcc_default} onChange={(e) => setForm((p) => ({ ...p, mcc_default: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Status</label><select className="input" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>{SUB_MERCHANT_STATUSES.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
            <div className="form-field"><label className="label">Onboarding</label><select className="input" value={form.onboarding_status} onChange={(e) => setForm((p) => ({ ...p, onboarding_status: e.target.value }))}>{SUB_MERCHANT_ONBOARDING_STATUSES.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
            <div className="form-field"><label className="label">KYC</label><select className="input" value={form.kyc_status} onChange={(e) => setForm((p) => ({ ...p, kyc_status: e.target.value }))}>{SUB_MERCHANT_KYC_STATUSES.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
            <div className="form-field"><label className="label">Country</label><select className="input" value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}>{MOCK_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</select></div>
            <div className="form-field">
              <label className="label">Default Currency</label>
              <input className="input" value={selectedCurrencies[0] || ''} placeholder="Will be selected from available currencies" disabled />
            </div>
            <div className="form-field"><label className="label">Timezone</label><select className="input" value={form.timezone} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}>{MOCK_TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            <div className="form-field"><label className="label">Acquiring Model</label><select className="input" value={form.default_acquiring_model} onChange={(e) => setForm((p) => ({ ...p, default_acquiring_model: e.target.value }))}><option value="PLATFORM_MID">PLATFORM_MID</option><option value="SELLER_MID">SELLER_MID</option></select></div>
            <div className="form-field"><label className="label">Notes</label><input className="input" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} /></div>
            <div className="form-field toggle-field"><label className="toggle-label"><div className={`toggle ${form.payments_enabled ? 'active' : ''}`} onClick={() => setForm((p) => ({ ...p, payments_enabled: !p.payments_enabled }))}><div className="toggle-knob" /></div><span>Payments Enabled</span></label></div>
            <div className="form-field toggle-field"><label className="toggle-label"><div className={`toggle ${form.payouts_enabled ? 'active' : ''}`} onClick={() => setForm((p) => ({ ...p, payouts_enabled: !p.payouts_enabled }))}><div className="toggle-knob" /></div><span>Payouts Enabled</span></label></div>
          </div>
          <LocalizationsEditor localizations={localizations} onChange={setLocalizations} />
          <div style={{ marginTop: '20px' }}>
            <h4 className="section-title" style={{ marginBottom: '12px' }}>Sub Merchant Currencies</h4>
            <DualListSelector
              sourceTitle="All currencies (reference table)"
              targetTitle="Selected currencies"
              available={currencyDualListItems}
              selected={selectedCurrencies}
              onChange={setSelectedCurrencies}
              disabled={saving || allCurrencies.length === 0}
            />
          </div>
          <div style={{ marginTop: '20px' }}>
            <h4 className="section-title" style={{ marginBottom: '12px' }}>Sub Merchant Payment Methods</h4>
            {paymentMethodsLoadError ? (
              <p style={{ color: 'var(--color-danger)', fontSize: '14px' }}>Failed to load payment methods: {paymentMethodsLoadError}</p>
            ) : paymentMethodsRef.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>No available payment methods (empty reference table)</p>
            ) : (
              <DualListSelector
                sourceTitle="All payment methods"
                targetTitle="Selected payment methods"
                available={paymentMethodDualListItems}
                selected={selectedPaymentMethods}
                onChange={setSelectedPaymentMethods}
                disabled={saving}
              />
            )}
          </div>
          <div style={{ marginTop: '20px' }}>
            <h4 className="section-title" style={{ marginBottom: '12px' }}>Sub Merchant Channels</h4>
            {channelTypesLoadError ? (
              <p style={{ color: 'var(--color-danger)', fontSize: '14px' }}>Failed to load channels: {channelTypesLoadError}</p>
            ) : channelTypesRef.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>No available channels (empty reference table)</p>
            ) : (
              <DualListSelector
                sourceTitle="All channels"
                targetTitle="Selected channels"
                available={channelTypeDualListItems}
                selected={selectedChannels}
                onChange={setSelectedChannels}
                disabled={saving}
              />
            )}
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={save} disabled={saving || !hasValidSelectedCurrencies}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
            <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setEditing(null); }}>Cancel</button>
          </div>
        </div>
      ) : null}

      <div className="card filters-card">
        <form className="filters-form" onSubmit={(e) => { e.preventDefault(); fetchItems(); }}>
          <div className="filter-group">
            <select className="input" value={selectedAccountUUID} onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('account_uuid', e.target.value); else params.delete('account_uuid');
              params.delete('legal_entity_uuid');
              params.delete('merchant_uuid');
              if (!routeMerchantAccountUUID) params.delete('merchant_account_uuid');
              setSearchParams(params);
            }}>
              <option value="">Select Account</option>
              {accounts.map((account) => <option key={account.uuid} value={account.uuid}>{account.name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <select
              className="input"
              value={selectedLegalEntityUUID}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                if (e.target.value) params.set('legal_entity_uuid', e.target.value); else params.delete('legal_entity_uuid');
                params.delete('merchant_uuid');
                if (!routeMerchantAccountUUID) params.delete('merchant_account_uuid');
                setSearchParams(params);
              }}
              disabled={!selectedAccountUUID}
            >
              <option value="">Select Legal Entity</option>
              {legalEntities.map((entity) => <option key={entity.uuid} value={entity.uuid}>{entity.legal_name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <select className="input" value={effectiveMerchantUUID} onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('merchant_uuid', e.target.value); else params.delete('merchant_uuid');
              if (!routeMerchantAccountUUID) params.delete('merchant_account_uuid');
              setSearchParams(params);
            }} disabled={!selectedLegalEntityUUID && !selectedMerchantAccountUUID}>
              <option value="">Select Merchant</option>
              {selectedMerchantFallbackLabel ? <option value={effectiveMerchantUUID}>{selectedMerchantFallbackLabel}</option> : null}
              {merchantOptions.map((option) => <option key={option.uuid} value={option.uuid}>{option.label}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <select className="input" value={selectedMerchantAccountUUID} onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('merchant_account_uuid', e.target.value); else params.delete('merchant_account_uuid');
              if (e.target.value) {
                const account = merchantAccounts.find((m) => m.uuid === e.target.value);
                if (account?.merchant_uuid) {
                  params.set('merchant_uuid', account.merchant_uuid);
                } else {
                  params.delete('merchant_uuid');
                }
              } else {
                params.delete('merchant_uuid');
              }
              setSearchParams(params);
            }} disabled={!!routeMerchantAccountUUID}>
              <option value="">Select Merchant Account</option>
              {merchantAccounts.map((m) => <option key={m.uuid} value={m.uuid}>{m.name}</option>)}
            </select>
          </div>
          <div className="filter-group"><input className="input" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <button className="btn btn-primary" type="submit">Search</button>
        </form>
        {selectedMerchantAccountUUID && !effectiveMerchantUUID ? (
          <p className="error-message" style={{ marginTop: 8 }}>
            Merchant could not be resolved for the selected merchant account. Please select a merchant manually.
          </p>
        ) : null}
      </div>

      <div className="card table-card">
        {loading ? <div className="loading-state"><div className="spinner" /><span>Loading sub merchants...</span></div> : items.length === 0 ? <div className="empty-state"><p>No sub merchants found</p></div> : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Code</th><th>Status</th><th>KYC</th><th>Currency</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.uuid}>
                    <td className="cell-name">{item.name}</td>
                    <td className="cell-mono">{item.sub_merchant_code || '—'}</td>
                    <td>{item.status}</td>
                    <td>{item.kyc_status || '—'}</td>
                    <td className="cell-mono">{item.currency}</td>
                    <td className="cell-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(`/sub-merchants/${item.uuid}/stores?merchant_account_uuid=${item.merchant_account_uuid}`)}>Stores</button>
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
        title="Delete Sub Merchant"
        message={`Delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
