'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { CATEGORY_META, AGE_GROUPS } from '../lib/api';

/** Must match `date_range` in `recfindobm/data/seed/oakville_programs.json` _meta when you refresh seed data. */
const SCHEDULE_YEAR = 2026;
const SCHEDULE_MONTH = 4;

function buildDayOptions(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const out = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const mp = String(month).padStart(2, '0');
    const dp = String(day).padStart(2, '0');
    const value = `${year}-${mp}-${dp}`;
    const dt = new Date(year, month - 1, day, 12, 0, 0);
    const label = dt.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
    out.push({ value, label });
  }
  return out;
}

/** Outside-click is handled once on FilterBar — per-dropdown listeners break clicks (sibling dropdowns close the open menu before the option receives the click). */
function Dropdown({ label, isOpen, onToggle, children, activeCount }) {
  return (
    <div className="relative">
      <button type="button" onClick={() => onToggle(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all
          ${activeCount > 0 ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'}`}>
        <span>{label}</span>
        {activeCount > 0 && <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeCount}</span>}
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[1010] min-w-[200px] py-1 max-h-[300px] overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  );
}

function CheckOption({ checked, onChange, label, count, color }) {
  return (
    <label className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
      <input type="checkbox" checked={checked} onChange={onChange}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
      {color && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{backgroundColor: color}} />}
      <span className="flex-1 text-gray-700">{label}</span>
      {count !== undefined && <span className="text-xs text-gray-400">{count}</span>}
    </label>
  );
}

export default function FilterBar({
  categories, selectedCategories, onCategoryChange,
  selectedAgeGroups, onAgeGroupChange,
  selectedDay, onDayChange,
  costType, onCostTypeChange,
  selectedFacility, onFacilityChange,
  groupBy, onGroupByChange,
  hasActiveFilters, onClearFilters,
  totalCount, facilities,
}) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const toggle = (name) => (isOpen) => setOpenDropdown(isOpen ? name : null);

  const toggleCategory = (catId) => {
    onCategoryChange(selectedCategories.includes(catId)
      ? selectedCategories.filter(c => c !== catId)
      : [...selectedCategories, catId]);
  };
  const toggleAgeGroup = (ageId) => {
    onAgeGroupChange(selectedAgeGroups.includes(ageId)
      ? selectedAgeGroups.filter(a => a !== ageId)
      : [...selectedAgeGroups, ageId]);
  };

  const filterUiRef = useRef(null);
  useEffect(() => {
    const close = (e) => {
      if (!openDropdown) return;
      if (filterUiRef.current && filterUiRef.current.contains(e.target)) return;
      setOpenDropdown(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [openDropdown]);

  const dates = useMemo(() => buildDayOptions(SCHEDULE_YEAR, SCHEDULE_MONTH), []);

  return (
    <div
      ref={filterUiRef}
      className="bg-white border-b border-gray-200 px-3 sm:px-4 py-2.5 sticky top-[52px] z-[1000] shadow-sm"
    >
      {/* Row 1: Dropdown filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Activities dropdown */}
        <Dropdown label="Activities" isOpen={openDropdown === 'cat'} onToggle={toggle('cat')} activeCount={selectedCategories.length}>
          {categories.map(cat => {
            const meta = CATEGORY_META[cat.id] || { label: cat.id, color: '#6B7280' };
            return <CheckOption key={cat.id} checked={selectedCategories.includes(cat.id)}
              onChange={() => toggleCategory(cat.id)} label={meta.label} count={cat.count} color={meta.color} />;
          })}
        </Dropdown>

        {/* Age range dropdown */}
        <Dropdown label="Age range" isOpen={openDropdown === 'age'} onToggle={toggle('age')} activeCount={selectedAgeGroups.length}>
          {AGE_GROUPS.map(ag => (
            <CheckOption key={ag.id} checked={selectedAgeGroups.includes(ag.id)}
              onChange={() => toggleAgeGroup(ag.id)} label={ag.label} />
          ))}
        </Dropdown>

        {/* Day dropdown */}
        <Dropdown label={selectedDay ? dates.find(d=>d.value===selectedDay)?.label || 'Day' : 'Day'}
          isOpen={openDropdown === 'day'} onToggle={toggle('day')} activeCount={selectedDay ? 1 : 0}>
          <label className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
            <input type="radio" name="day" checked={!selectedDay} onChange={() => { onDayChange(null); setOpenDropdown(null); }}
              className="w-4 h-4 text-blue-600" />
            <span className="text-gray-700">All days</span>
          </label>
          {dates.map(d => (
            <label key={d.value} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
              <input type="radio" name="day" checked={selectedDay === d.value}
                onChange={() => { onDayChange(d.value); setOpenDropdown(null); }}
                className="w-4 h-4 text-blue-600" />
              <span className="text-gray-700">{d.label}</span>
            </label>
          ))}
        </Dropdown>

        {/* Facilities dropdown */}
        <Dropdown label={selectedFacility ? (facilities||[]).find(f=>f.id===selectedFacility)?.name?.split(' ').slice(0,3).join(' ') || 'Facility' : 'Facilities'}
          isOpen={openDropdown === 'fac'} onToggle={toggle('fac')} activeCount={selectedFacility ? 1 : 0}>
          <label className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-100">
            <input type="radio" name="fac" checked={!selectedFacility} onChange={() => { onFacilityChange(null); setOpenDropdown(null); }}
              className="w-4 h-4 text-blue-600" />
            <span className="text-gray-700 font-medium">All facilities</span>
          </label>
          {(facilities || []).map(f => (
            <label key={f.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
              <input type="radio" name="fac" checked={selectedFacility === f.id}
                onChange={() => { onFacilityChange(f.id); setOpenDropdown(null); }}
                className="w-4 h-4 text-blue-600" />
              <span className="text-gray-700">{f.name}</span>
              {f.distance_km !== undefined && <span className="text-xs text-gray-400 ml-auto">{f.distance_km}km</span>}
            </label>
          ))}
        </Dropdown>

        {/* Cost toggle */}
        <button type="button" onClick={() => onCostTypeChange(costType === 'free' ? null : 'free')}
          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all
            ${costType === 'free' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'}`}>
          Free only
        </button>

        {/* Reset */}
        {hasActiveFilters && (
          <button type="button" onClick={onClearFilters} className="text-sm text-blue-600 hover:text-blue-800 font-medium ml-1">
            Reset all
          </button>
        )}

        {/* Results count */}
        <span className="ml-auto text-sm text-gray-500 whitespace-nowrap">{totalCount.toLocaleString()} results</span>
      </div>

      {/* Row 2: Group-by (optional) */}
      <div className="flex items-center gap-1.5 mt-2">
        <span className="text-xs text-gray-400">Group by:</span>
        {[{id: null, label: 'None'}, {id: 'facility', label: 'Facility'}, {id: 'category', label: 'Category'}, {id: 'day', label: 'Day'}].map(g => (
          <button type="button" key={g.id || 'none'} onClick={() => onGroupByChange(g.id)}
            className={`px-2 py-1 rounded text-xs font-medium transition-all
              ${groupBy === g.id ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            {g.label}
          </button>
        ))}
      </div>
    </div>
  );
}
