// RecFindOBM API client — calls FastAPI backend

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function searchActivities(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category) filters.category.forEach(c => params.append('category', c));
  if (filters.age_group) filters.age_group.forEach(a => params.append('age_group', a));
  if (filters.day) filters.day.forEach(d => params.append('day', d));
  if (filters.cost_type) params.set('cost_type', filters.cost_type);
  if (filters.facility_id) params.set('facility_id', filters.facility_id);
  if (filters.sort_by) params.set('sort_by', filters.sort_by);
  if (filters.group_by) params.set('group_by', filters.group_by);
  if (filters.page) params.set('page', filters.page);
  if (filters.page_size) params.set('page_size', filters.page_size);

  const res = await fetch(`${API_BASE}/api/v1/activities/search?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getActivity(id) {
  const res = await fetch(`${API_BASE}/api/v1/activities/${id}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getCategories() {
  const res = await fetch(`${API_BASE}/api/v1/activities/categories`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getNearbyFacilities(lat, lng, radius_km = 10, limit = 50) {
  const res = await fetch(
    `${API_BASE}/api/v1/facilities/nearby?lat=${lat}&lng=${lng}&radius_km=${radius_km}&limit=${limit}`
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/** Fetch all pages for the same filter set (map + client-side list pagination). */
export async function fetchAllMatchingActivities(filters = {}) {
  const pageSize = 5000;
  let page = 1;
  const all = [];
  let total = 0;
  let hasNext = true;
  while (hasNext) {
    const res = await searchActivities({ ...filters, page, page_size: pageSize });
    const chunk = res.data || [];
    all.push(...chunk);
    total = res.meta?.total ?? all.length;
    hasNext = Boolean(res.meta?.has_next);
    page += 1;
    if (chunk.length === 0) break;
  }
  return { data: all, total };
}

export async function getFacility(id) {
  const res = await fetch(`${API_BASE}/api/v1/facilities/${id}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const CATEGORY_META = {
  swimming:          { label: 'Swimming',       icon: '\uD83C\uDFCA', color: '#0EA5E9' },
  skating:           { label: 'Skating',        icon: '\u26F8\uFE0F', color: '#8B5CF6' },
  sports:            { label: 'Sports',         icon: '\uD83C\uDFF8', color: '#F97316' },
  fitness:           { label: 'Fitness',        icon: '\uD83D\uDCAA', color: '#EF4444' },
  arts:              { label: 'Arts & Culture', icon: '\uD83C\uDFA8', color: '#EC4899' },
  social:            { label: 'Social',         icon: '\uD83D\uDC65', color: '#A855F7' },
  court_booking:     { label: 'Court Booking',  icon: '\uD83C\uDFBE', color: '#14B8A6' },
  indoor_playground: { label: 'Preschool',      icon: '\uD83D\uDC76', color: '#FBBF24' },
  stem:              { label: 'STEM',           icon: '\uD83D\uDD2C', color: '#06B6D4' },
  outdoor:           { label: 'Outdoor',        icon: '\uD83C\uDF33', color: '#22C55E' },
};

export const FACILITY_TYPE_COLORS = {
  community_center: '#3B82F6',
  arena:            '#8B5CF6',
  library:          '#F59E0B',
  pool:             '#06B6D4',
  seniors_centre:   '#EC4899',
  museum:           '#6366F1',
};

export const AGE_GROUPS = [
  { id: 'family',    label: 'All Ages' },
  { id: 'preschool', label: 'Preschool' },
  { id: 'child',     label: 'Kids' },
  { id: 'teen',      label: 'Teens' },
  { id: 'adult',     label: 'Adults' },
  { id: 'senior',    label: 'Seniors' },
];
