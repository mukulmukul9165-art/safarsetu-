import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaSearch, FaTimes } from 'react-icons/fa';

const AdminListToolbar = ({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  filterOptions,
  total,
  shown,
  placeholderKey = 'admin.search_placeholder',
}) => {
  const { t } = useTranslation();
  const hasFilters = search.trim() || filter !== 'all';

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6 p-4 bg-dark/5 rounded-2xl border border-border">
      <div className="relative flex-1 min-w-[200px]">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t(placeholderKey)}
          className="input-field pl-11 pr-10 py-3 text-sm w-full bg-background border-border"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-dark"
            aria-label={t('admin.clear_filters')}
          >
            <FaTimes />
          </button>
        )}
      </div>
      <select
        value={filter}
        onChange={(e) => onFilterChange(e.target.value)}
        className="input-field py-3 px-4 text-xs font-bold uppercase tracking-widest min-w-[160px] bg-background border-border cursor-pointer"
      >
        {filterOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {t(opt.labelKey)}
          </option>
        ))}
      </select>
      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            onSearchChange('');
            onFilterChange('all');
          }}
          className="px-4 py-3 rounded-xl border border-border text-xs font-black uppercase tracking-widest text-muted hover:text-dark hover:border-primary/40 transition-all"
        >
          {t('admin.clear_filters')}
        </button>
      )}
      <p className="w-full sm:w-auto sm:ml-auto text-[10px] text-muted font-black uppercase tracking-widest self-center">
        {t('admin.showing_count', { n: shown, total })}
      </p>
    </div>
  );
};

export default AdminListToolbar;
