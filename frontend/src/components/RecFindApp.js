'use client';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { searchActivities, fetchAllMatchingActivities, getCategories, getNearbyFacilities } from '../lib/api';
import FilterBar from './FilterBar';
import ActivityList from './ActivityList';
import Header from './Header';

const MapView = dynamic(() => import('./MapView'), { ssr: false, loading: () => <div style={{height:'40vh',background:'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center'}}>Loading map...</div> });
const DEFAULT_CENTER = { lat: 43.4350, lng: -79.6800 };

export default function RecFindApp() {
  const [facilities, setFacilities] = useState([]);
  /** Current page for the list (small payload — fast first paint). */
  const [listActivities, setListActivities] = useState([]);
  /** All matching activities for the map (loaded after list, same filters). */
  const [mapActivities, setMapActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mapSyncing, setMapSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(DEFAULT_CENTER);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [costType, setCostType] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [groupBy, setGroupBy] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    getNearbyFacilities(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng, 30, 50)
      .then(res => setFacilities(res.data))
      .catch(err => console.error('Facilities error:', err));
  }, []);

  useEffect(() => {
    getCategories().then(res => setCategories(res.data)).catch(err => console.error('Categories error:', err));
  }, []);

  const buildFilters = useCallback(() => {
    const filters = { sort_by: 'time' };
    if (selectedCategories.length > 0) filters.category = selectedCategories;
    if (selectedAgeGroups.length > 0) filters.age_group = selectedAgeGroups;
    if (selectedDay) filters.day = [selectedDay];
    if (costType) filters.cost_type = costType;
    if (selectedFacility) filters.facility_id = selectedFacility;
    if (groupBy) filters.group_by = groupBy;
    return filters;
  }, [selectedCategories, selectedAgeGroups, selectedDay, costType, selectedFacility, groupBy]);

  const fetchListPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchActivities({ ...buildFilters(), page, page_size: PAGE_SIZE });
      setListActivities(res.data);
      setTotalCount(res.meta.total);
    } catch (err) {
      setListActivities([]);
      setTotalCount(0);
      setError('Cannot connect to API. Start backend: cd backend-v2 && .venv/bin/uvicorn app.main:app --reload --port 8000');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [buildFilters, page]);

  useEffect(() => { fetchListPage(); }, [fetchListPage]);
  useEffect(() => { setPage(1); }, [selectedCategories, selectedAgeGroups, selectedDay, costType, selectedFacility, groupBy]);

  /** Full result set for map — debounced so filters stay responsive; does not block the list request. */
  useEffect(() => {
    let cancelled = false;
    setMapActivities([]);
    setMapSyncing(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await fetchAllMatchingActivities(buildFilters());
        if (!cancelled) setMapActivities(data);
      } catch (err) {
        console.error('Map activities error:', err);
        if (!cancelled) setMapActivities([]);
      } finally {
        if (!cancelled) setMapSyncing(false);
      }
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [buildFilters]);

  const handleFacilityClick = (facilityId) => {
    setSelectedFacility(selectedFacility === facilityId ? null : facilityId);
  };
  const clearFilters = () => {
    setSelectedCategories([]); setSelectedAgeGroups([]); setSelectedDay(null);
    setCostType(null); setSelectedFacility(null); setGroupBy(null); setPage(1);
  };
  const hasActiveFilters = selectedCategories.length > 0 || selectedAgeGroups.length > 0 || selectedDay || costType || selectedFacility;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* FILTERS ON TOP */}
      <FilterBar
        categories={categories}
        selectedCategories={selectedCategories} onCategoryChange={setSelectedCategories}
        selectedAgeGroups={selectedAgeGroups} onAgeGroupChange={setSelectedAgeGroups}
        selectedDay={selectedDay} onDayChange={setSelectedDay}
        costType={costType} onCostTypeChange={setCostType}
        selectedFacility={selectedFacility} onFacilityChange={setSelectedFacility}
        groupBy={groupBy} onGroupByChange={setGroupBy}
        hasActiveFilters={hasActiveFilters} onClearFilters={clearFilters}
        totalCount={totalCount}
        facilities={facilities}
      />

      {/* MAP IN MIDDLE */}
      <div className="w-full" style={{ height: 'clamp(250px, 40vh, 500px)' }}>
        <MapView
          facilities={facilities}
          userLocation={userLocation}
          center={DEFAULT_CENTER}
          selectedFacility={selectedFacility}
          onFacilityClick={handleFacilityClick}
          activities={mapActivities}
          mapSyncing={mapSyncing}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* ACTIVITY LIST BELOW */}
      <div className="flex-1 bg-white">
        <ActivityList
          activities={listActivities} loading={loading} error={error} totalCount={totalCount}
          page={page} pageSize={PAGE_SIZE} onPageChange={setPage}
          groupBy={groupBy} selectedFacility={selectedFacility} onFacilityClick={handleFacilityClick}
        />
      </div>

      <footer className="bg-gray-100 border-t border-gray-200 py-3 px-4 text-center text-xs text-gray-400">
        RecFindOBM \u2014 Data from Town of Oakville. Not affiliated with the Town of Oakville.
      </footer>
    </div>
  );
}
