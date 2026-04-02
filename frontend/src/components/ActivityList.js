'use client';
import { CATEGORY_META } from '../lib/api';

const OAKVILLE_BOOKING_URL =
  'https://townofoakville.perfectmind.com/24974/Clients/BookMe4?widgetId=acf798a6-9321-41b7-aa41-92cbb8c1b485&embed=False&redirectedFromEmbededMode=False';

function openOakvilleBooking() {
  const w = window.open(OAKVILLE_BOOKING_URL, '_blank');
  if (w) w.opener = null;
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')}${ampm}`;
}
function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T12:00:00');
  return dt.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
}

function ActivityCard({ activity, onFacilityClick }) {
  const meta = CATEGORY_META[activity.category] || { icon: '', label: activity.category, color: '#6B7280' };
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Open Town of Oakville drop-in booking"
      onClick={openOakvilleBooking}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openOakvilleBooking();
        }
      }}
      className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white" style={{backgroundColor: meta.color}}>
              {meta.label}
            </span>
            <span className="text-[11px] text-gray-400 capitalize">{(activity.age_group || 'all').replace('_', ' ')}</span>
            {activity.is_full && <span className="text-[11px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">Full</span>}
          </div>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug">{activity.name}</h3>
          <div className="mt-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onFacilityClick) onFacilityClick(activity.facility_id);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline text-left"
            >
              {activity.facility_name || activity.facility_id}
            </button>
            {activity.room && <span className="text-[11px] text-gray-400 ml-1">· {activity.room}</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-semibold text-gray-900">{formatTime(activity.start_time)}–{formatTime(activity.end_time)}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">{formatDate(activity.date)}</div>
          <div className="mt-1.5">
            {activity.cost_type === 'free'
              ? <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Free</span>
              : <span className="text-xs text-gray-600 font-medium">${activity.cost_amount?.toFixed(2)}</span>}
          </div>
          {activity.spots_left != null && !activity.is_full && (
            <div className="text-[11px] text-gray-400 mt-0.5">{activity.spots_left} spots</div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[1,2,3,4,5,6].map(i => <div key={i} className="bg-gray-100 rounded-lg h-[72px] animate-pulse" />)}
    </div>
  );
}

export default function ActivityList({
  activities, loading, error, totalCount,
  page, pageSize, onPageChange,
  groupBy, selectedFacility, onFacilityClick,
}) {
  if (loading) return <LoadingSkeleton />;
  if (error) return (
    <div className="p-8 text-center">
      <div className="text-red-500 text-4xl mb-2">!</div>
      <p className="text-red-600 font-medium text-sm">{error}</p>
      <button onClick={() => window.location.reload()} className="mt-3 text-sm text-blue-600 hover:underline">Reload page</button>
    </div>
  );
  if (activities.length === 0) return (
    <div className="p-8 text-center">
      <div className="text-gray-300 text-4xl mb-2">\uD83D\uDD0D</div>
      <p className="text-gray-500 font-medium">No activities found</p>
      <p className="text-gray-400 text-sm mt-1">Try changing your filters</p>
    </div>
  );
  const totalPages = Math.ceil(totalCount / pageSize);
  return (
    <div className="p-3 sm:p-4">
      {selectedFacility && (
        <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center justify-between">
          <span className="text-sm text-blue-800">Showing: <b>{activities[0]?.facility_name || selectedFacility}</b></span>
          <button onClick={() => onFacilityClick(selectedFacility)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Show all</button>
        </div>
      )}
      <div className="space-y-2">
        {activities.map(a => <ActivityCard key={a.id} activity={a} onFacilityClick={onFacilityClick} />)}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-gray-100">
          <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-lg text-sm border border-gray-300 disabled:opacity-30 hover:bg-gray-50 font-medium">Prev</button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
            className="px-4 py-2 rounded-lg text-sm border border-gray-300 disabled:opacity-30 hover:bg-gray-50 font-medium">Next</button>
        </div>
      )}
    </div>
  );
}
