import { useCallback, useEffect, useState } from 'react';
import { createChannelType, deleteChannelType, listChannelTypes, updateChannelType } from '../api/channelTypes';
import type { ChannelType, CreateChannelTypeRequest, UpdateChannelTypeRequest } from '../types/channelType';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './AccountsList.css';
import './AccountCreate.css';
import '../components/AccountForm.css';

type ChannelTypeFormState = {
  channel_code: string;
  display_name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
};

const defaultForm: ChannelTypeFormState = {
  channel_code: '',
  display_name: '',
  description: '',
  is_active: true,
  sort_order: 100,
};

export default function ChannelTypesPage() {
  const { toasts, addToast, removeToast } = useToast();
  const [items, setItems] = useState<ChannelType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('true');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ChannelType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChannelType | null>(null);
  const [form, setForm] = useState<ChannelTypeFormState>(defaultForm);

  const fetchChannelTypes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listChannelTypes({
        search: search || undefined,
        is_active: isActiveFilter || undefined,
        page: 1,
        page_size: 150,
      });
      setItems(data?.channel_types ?? []);
    } catch (error) {
      console.error('Channel types load error:', error);
      const msg = error instanceof Error ? error.message : String(error);
      addToast(`Failed to load channels: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [search, isActiveFilter, addToast]);

  useEffect(() => {
    fetchChannelTypes();
  }, [fetchChannelTypes]);

  const resetForm = () => setForm(defaultForm);

  const startCreate = () => {
    setEditing(null);
    resetForm();
    setShowCreate(true);
  };

  const autoFillForm = () => {
    const sample = [
      { prefix: 'WEB', display_name: 'Online', description: 'E-commerce transactions' },
      { prefix: 'POS', display_name: 'Point Of Sale', description: 'In-store card present sales' },
      { prefix: 'TEL', display_name: 'MOTO', description: 'Mail Order / Telephone Order' },
    ];
    const pick = sample[Math.floor(Math.random() * sample.length)];
    const unique = Date.now().toString().slice(-4);
    setForm({
      channel_code: `${pick.prefix}${unique}`,
      display_name: `${pick.display_name} ${unique}`,
      description: pick.description,
      is_active: true,
      sort_order: 100,
    });
  };

  const startEdit = (channelType: ChannelType) => {
    setShowCreate(false);
    setEditing(channelType);
    setForm({
      channel_code: channelType.channel_code || '',
      display_name: channelType.display_name || '',
      description: channelType.description || '',
      is_active: channelType.is_active,
      sort_order: channelType.sort_order ?? 100,
    });
  };

  const buildPayload = (): CreateChannelTypeRequest | UpdateChannelTypeRequest => ({
    channel_code: form.channel_code.trim().toUpperCase(),
    display_name: form.display_name.trim(),
    description: form.description.trim() || undefined,
    is_active: form.is_active,
    sort_order: Number(form.sort_order),
  });

  const save = async () => {
    if (!form.channel_code || !form.display_name) {
      addToast('Channel code and display name are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editing) {
        await updateChannelType(editing.channel_code, payload);
        addToast('Channel updated', 'success');
        setEditing(null);
      } else {
        await createChannelType(payload);
        addToast('Channel created', 'success');
        setShowCreate(false);
      }
      resetForm();
      await fetchChannelTypes();
    } catch (error) {
      console.error(error);
      const errMsg = error instanceof Error ? error.message : String(error);
      addToast(`Failed to save channel: ${errMsg}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteChannelType(deleteTarget.channel_code);
      addToast('Channel marked as inactive', 'success');
      setDeleteTarget(null);
      setIsActiveFilter('true');
      await fetchChannelTypes();
    } catch (error) {
      console.error(error);
      const errMsg = error instanceof Error ? error.message : String(error);
      addToast(`Failed to delete channel: ${errMsg}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="accounts-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Channel Types</h1>
          <p className="page-subtitle">Reference Table - Channel Types</p>
        </div>
        <button className="btn btn-primary" onClick={() => (showCreate ? setShowCreate(false) : startCreate())}>
          {showCreate ? 'Close Form' : 'New Channel'}
        </button>
      </div>

      {(showCreate || editing) && (
        <div className="form-section">
          <div className="auto-fill-bar">
            <button type="button" className="btn btn-auto-fill" onClick={autoFillForm}>
              Quick Fill
            </button>
          </div>
          <h3 className="section-title">{editing ? 'Edit Channel' : 'Create Channel'}</h3>
          <div className="form-grid">
            <div className="form-field">
              <label className="label">Channel Code *</label>
              <input
                className="input ltr-input"
                dir="ltr"
                maxLength={20}
                disabled={!!editing}
                value={form.channel_code}
                onChange={(e) => setForm((p) => ({ ...p, channel_code: e.target.value }))}
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
            <div className="form-field" style={{ gridColumn: '1 / -1' }}>
              <label className="label">Description</label>
              <textarea
                className="input"
                rows={3}
                maxLength={255}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
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
            fetchChannelTypes();
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
            <span>Loading channels...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p>No channels found</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Display Name</th>
                  <th>Channel Code</th>
                  <th>Description</th>
                  <th>Sort</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((channelType) => (
                  <tr key={channelType.channel_code}>
                    <td className="cell-name">{channelType.display_name}</td>
                    <td className="cell-mono">{channelType.channel_code}</td>
                    <td>{channelType.description || '-'}</td>
                    <td>{channelType.sort_order}</td>
                    <td>{channelType.is_active ? 'Yes' : 'No'}</td>
                    <td className="cell-actions">
                      <button className="action-btn edit" onClick={() => startEdit(channelType)}>
                        ✎
                      </button>
                      <button className="action-btn delete" onClick={() => setDeleteTarget(channelType)}>
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
        title="Deactivate Channel"
        message={`Mark "${deleteTarget?.display_name}" as inactive?`}
        confirmLabel="Deactivate"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
