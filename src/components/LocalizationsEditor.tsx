import type { LocalizationInput } from '../types/orgEntityLocalization';

interface LocalizationsEditorProps {
  localizations: LocalizationInput[];
  onChange: (rows: LocalizationInput[]) => void;
  title?: string;
}

function createDefaultLocalization(): LocalizationInput {
  return {
    lang_code: 'en',
    display_name: '',
    brand_name: '',
    description: '',
    support_email: '',
    support_phone: '',
    is_default: true,
  };
}

export function sanitizeLocalizations(rows: LocalizationInput[]): LocalizationInput[] {
  const cleaned = rows
    .map((row) => ({
      ...row,
      lang_code: (row.lang_code || '').trim().toLowerCase(),
      display_name: (row.display_name || '').trim(),
      brand_name: (row.brand_name || '').trim(),
      description: (row.description || '').trim(),
      support_email: (row.support_email || '').trim(),
      support_phone: (row.support_phone || '').trim(),
    }))
    .filter((row) => row.lang_code && row.display_name);

  if (cleaned.length === 0) return [];

  let hasDefault = false;
  const withDefault = cleaned.map((row) => {
    if (row.is_default && !hasDefault) {
      hasDefault = true;
      return row;
    }
    return { ...row, is_default: false };
  });

  if (!hasDefault) withDefault[0].is_default = true;
  return withDefault;
}

export function ensureAtLeastOneLocalization(rows: LocalizationInput[], displayName: string): LocalizationInput[] {
  const normalized = sanitizeLocalizations(rows);
  if (normalized.length > 0) return normalized;
  return [
    {
      ...createDefaultLocalization(),
      display_name: displayName.trim(),
    },
  ];
}

export default function LocalizationsEditor({
  localizations,
  onChange,
  title = 'Localizations (Multi-language)',
}: LocalizationsEditorProps) {
  const setRow = <K extends keyof LocalizationInput>(index: number, key: K, value: LocalizationInput[K]) => {
    const next = [...localizations];
    next[index] = { ...next[index], [key]: value };
    if (key === 'is_default' && value) {
      for (let i = 0; i < next.length; i += 1) next[i].is_default = i === index;
    }
    onChange(next);
  };

  const addRow = () => {
    const next = [...localizations, { ...createDefaultLocalization(), is_default: localizations.length === 0 }];
    onChange(next);
  };

  const removeRow = (index: number) => {
    const next = localizations.filter((_, i) => i !== index);
    if (next.length > 0 && !next.some((row) => row.is_default)) {
      next[0].is_default = true;
    }
    onChange(next);
  };

  return (
    <div className="form-section">
      <div className="auto-fill-bar">
        <h3 className="section-title" style={{ margin: 0 }}>{title}</h3>
        <button type="button" className="btn btn-secondary btn-sm" onClick={addRow}>
          Add Language
        </button>
      </div>

      {localizations.map((row, index) => (
        <div
          key={`${row.lang_code}-${index}`}
          className="form-grid"
          style={{ marginBottom: 12, padding: 12, border: '1px solid var(--color-border-light)', borderRadius: 8 }}
        >
          <div className="form-field">
            <label className="label">Language Code *</label>
            <input
              className="input ltr-input"
              dir="ltr"
              value={row.lang_code}
              onChange={(e) => setRow(index, 'lang_code', e.target.value)}
              placeholder="en"
            />
          </div>
          <div className="form-field">
            <label className="label">Display Name *</label>
            <input
              className="input"
              value={row.display_name}
              onChange={(e) => setRow(index, 'display_name', e.target.value)}
              placeholder="Name in this language"
            />
          </div>
          <div className="form-field">
            <label className="label">Brand Name</label>
            <input
              className="input"
              value={row.brand_name || ''}
              onChange={(e) => setRow(index, 'brand_name', e.target.value)}
            />
          </div>
          <div className="form-field">
            <label className="label">Description</label>
            <input
              className="input"
              value={row.description || ''}
              onChange={(e) => setRow(index, 'description', e.target.value)}
            />
          </div>
          <div className="form-field">
            <label className="label">Support Email</label>
            <input
              className="input ltr-input"
              dir="ltr"
              value={row.support_email || ''}
              onChange={(e) => setRow(index, 'support_email', e.target.value)}
            />
          </div>
          <div className="form-field">
            <label className="label">Support Phone</label>
            <input
              className="input ltr-input"
              dir="ltr"
              value={row.support_phone || ''}
              onChange={(e) => setRow(index, 'support_phone', e.target.value)}
            />
          </div>
          <div className="form-field toggle-field">
            <label className="toggle-label">
              <div className={`toggle ${row.is_default ? 'active' : ''}`} onClick={() => setRow(index, 'is_default', true)}>
                <div className="toggle-knob" />
              </div>
              <span>Default language</span>
            </label>
          </div>
          <div className="form-field">
            <button type="button" className="btn btn-ghost" onClick={() => removeRow(index)} disabled={localizations.length <= 1}>
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
