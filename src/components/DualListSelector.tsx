import { useMemo, useState } from 'react';
import './DualListSelector.css';

export interface DualListItem {
  code: string;
  label: string;
}

interface DualListSelectorProps {
  sourceTitle: string;
  targetTitle: string;
  available: DualListItem[];
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
}

export default function DualListSelector({
  sourceTitle,
  targetTitle,
  available,
  selected,
  onChange,
  disabled = false,
}: DualListSelectorProps) {
  const [sourceSearch, setSourceSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [sourceHighlighted, setSourceHighlighted] = useState<Set<string>>(new Set());
  const [targetHighlighted, setTargetHighlighted] = useState<Set<string>>(new Set());

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const itemMap = useMemo(() => {
    const map = new Map<string, DualListItem>();
    for (const item of available) map.set(item.code, item);
    return map;
  }, [available]);

  const sourceItems = useMemo(() => {
    const term = sourceSearch.toLowerCase();
    return available
      .filter((item) => !selectedSet.has(item.code))
      .filter((item) => !term || item.label.toLowerCase().includes(term) || item.code.toLowerCase().includes(term));
  }, [available, selectedSet, sourceSearch]);

  const targetItems = useMemo(() => {
    const term = targetSearch.toLowerCase();
    return selected
      .map((code) => itemMap.get(code))
      .filter((item): item is DualListItem => !!item)
      .filter((item) => !term || item.label.toLowerCase().includes(term) || item.code.toLowerCase().includes(term));
  }, [selected, itemMap, targetSearch]);

  const toggleSourceItem = (code: string, e: React.MouseEvent) => {
    if (disabled) return;
    setSourceHighlighted((prev) => {
      const next = new Set(e.ctrlKey || e.metaKey ? prev : []);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const toggleTargetItem = (code: string, e: React.MouseEvent) => {
    if (disabled) return;
    setTargetHighlighted((prev) => {
      const next = new Set(e.ctrlKey || e.metaKey ? prev : []);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const moveToTarget = () => {
    if (disabled) return;
    const toMove = sourceHighlighted.size > 0
      ? [...sourceHighlighted].filter((code) => !selectedSet.has(code))
      : [];
    if (toMove.length === 0) return;
    onChange([...selected, ...toMove]);
    setSourceHighlighted(new Set());
  };

  const moveToSource = () => {
    if (disabled) return;
    const toRemove = targetHighlighted.size > 0
      ? new Set([...targetHighlighted])
      : new Set<string>();
    if (toRemove.size === 0) return;
    onChange(selected.filter((code) => !toRemove.has(code)));
    setTargetHighlighted(new Set());
  };

  const moveAllToTarget = () => {
    if (disabled) return;
    const allCodes = available.map((item) => item.code);
    onChange([...new Set(allCodes)]);
    setSourceHighlighted(new Set());
  };

  const moveAllToSource = () => {
    if (disabled) return;
    onChange([]);
    setTargetHighlighted(new Set());
  };

  return (
    <div className={`dual-list ${disabled ? 'dual-list--disabled' : ''}`}>
      <div className="dual-list__panel">
        <div className="dual-list__header">
          <span className="dual-list__title">{sourceTitle}</span>
          <span className="dual-list__count">{sourceItems.length}</span>
        </div>
        <div className="dual-list__search">
          <input
            className="input dual-list__search-input"
            placeholder="סינון..."
            value={sourceSearch}
            onChange={(e) => setSourceSearch(e.target.value)}
            disabled={disabled}
          />
        </div>
        <ul className="dual-list__items">
          {sourceItems.map((item) => (
            <li
              key={item.code}
              className={`dual-list__item ${sourceHighlighted.has(item.code) ? 'dual-list__item--selected' : ''}`}
              onClick={(e) => toggleSourceItem(item.code, e)}
              onDoubleClick={() => {
                if (disabled) return;
                onChange([...selected, item.code]);
                setSourceHighlighted((prev) => { const n = new Set(prev); n.delete(item.code); return n; });
              }}
            >
              <span className="dual-list__item-code">{item.code}</span>
              <span className="dual-list__item-label">{item.label}</span>
            </li>
          ))}
          {sourceItems.length === 0 && (
            <li className="dual-list__empty">אין פריטים זמינים</li>
          )}
        </ul>
      </div>

      <div className="dual-list__controls">
        <button
          className="btn btn-outline dual-list__btn"
          onClick={moveAllToTarget}
          disabled={disabled || sourceItems.length === 0}
          title="הוסף הכל"
        >
          &raquo;
        </button>
        <button
          className="btn btn-outline dual-list__btn"
          onClick={moveToTarget}
          disabled={disabled || sourceHighlighted.size === 0}
          title="הוסף נבחרים"
        >
          &rsaquo;
        </button>
        <button
          className="btn btn-outline dual-list__btn"
          onClick={moveToSource}
          disabled={disabled || targetHighlighted.size === 0}
          title="הסר נבחרים"
        >
          &lsaquo;
        </button>
        <button
          className="btn btn-outline dual-list__btn"
          onClick={moveAllToSource}
          disabled={disabled || selected.length === 0}
          title="הסר הכל"
        >
          &laquo;
        </button>
      </div>

      <div className="dual-list__panel">
        <div className="dual-list__header">
          <span className="dual-list__title">{targetTitle}</span>
          <span className="dual-list__count">{targetItems.length}</span>
        </div>
        <div className="dual-list__search">
          <input
            className="input dual-list__search-input"
            placeholder="סינון..."
            value={targetSearch}
            onChange={(e) => setTargetSearch(e.target.value)}
            disabled={disabled}
          />
        </div>
        <ul className="dual-list__items">
          {targetItems.map((item) => (
            <li
              key={item.code}
              className={`dual-list__item ${targetHighlighted.has(item.code) ? 'dual-list__item--selected' : ''}`}
              onClick={(e) => toggleTargetItem(item.code, e)}
              onDoubleClick={() => {
                if (disabled) return;
                onChange(selected.filter((c) => c !== item.code));
                setTargetHighlighted((prev) => { const n = new Set(prev); n.delete(item.code); return n; });
              }}
            >
              <span className="dual-list__item-code">{item.code}</span>
              <span className="dual-list__item-label">{item.label}</span>
            </li>
          ))}
          {targetItems.length === 0 && (
            <li className="dual-list__empty">לא נבחרו מטבעות</li>
          )}
        </ul>
      </div>
    </div>
  );
}
