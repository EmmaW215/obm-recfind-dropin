import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { useAppStore } from "../store/appStore";
import { api, SearchParams } from "../services/api";
import {
  FilterChip,
  FilterChipGroup,
  FilterModal,
  FilterState,
  FilterOption,
  DEFAULT_FILTER_STATE,
} from "../components";

// ============================================================================
// Types
// ============================================================================

interface Program {
  id: string;
  name: string;
  location_id: string;
  location_name: string;
  city: string;
  activity_type: string;
  age_group: string;
  date: string;
  start_time: string;
  end_time: string;
  fee: number | null;
  spots_available: number | null;
  spots_total: number | null;
  registration_url?: string;
}

// Activity type icons
const activityIcons: Record<string, string> = {
  swim: "🏊",
  fitness: "🧘",
  skating: "⛸️",
  sports: "🏀",
  other: "🎯",
};

// ============================================================================
// SearchScreen Component
// ============================================================================

export function SearchScreen() {
  const { selectedCity } = useAppStore();

  // Filter modal state
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTER_STATE,
    cities: selectedCity ? [selectedCity.toLowerCase()] : [],
  });

  // Filter options
  const [cityOptions, setCityOptions] = useState<FilterOption[]>([]);
  const [locationOptions, setLocationOptions] = useState<FilterOption[]>([]);
  const [activityTypeOptions, setActivityTypeOptions] = useState<FilterOption[]>([]);
  const [ageGroupOptions, setAgeGroupOptions] = useState<FilterOption[]>([]);

  // Programs state
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Update filters when selectedCity changes from HomeScreen
  useEffect(() => {
    if (selectedCity) {
      setFilters((prev) => ({
        ...prev,
        cities: [selectedCity.toLowerCase()],
      }));
    }
  }, [selectedCity]);

  // Load programs when filters change
  useEffect(() => {
    loadPrograms();
  }, [filters]);

  // Load locations when selected cities change
  useEffect(() => {
    loadLocationsForCities();
  }, [filters.cities]);

  const loadFilterOptions = async () => {
    try {
      const [cities, activityTypes, ageGroups] = await Promise.all([
        api.getCities(),
        api.getActivityTypes(),
        api.getAgeGroups(),
      ]);
      setCityOptions(cities);
      setActivityTypeOptions(activityTypes);
      setAgeGroupOptions(ageGroups);
    } catch (e) {
      console.error("Failed to load filter options:", e);
    }
  };

  const loadLocationsForCities = async () => {
    try {
      if (filters.cities.length === 0) {
        // Load all locations
        const allLocations = await api.getLocations();
        setLocationOptions(
          allLocations.map((loc: any) => ({ id: loc.id, name: loc.name }))
        );
      } else {
        // Load locations for selected cities
        const locationPromises = filters.cities.map((city) => api.getLocations(city));
        const locationArrays = await Promise.all(locationPromises);
        const allLocations = locationArrays.flat();
        setLocationOptions(
          allLocations.map((loc: any) => ({ id: loc.id, name: loc.name }))
        );
      }
    } catch (e) {
      console.error("Failed to load locations:", e);
    }
  };

  const loadPrograms = async () => {
    setLoading(true);
    try {
      const params: SearchParams = {};

      // Apply filters
      if (filters.cities.length > 0) {
        params.cities = filters.cities;
      }
      if (filters.locations.length > 0) {
        params.locations = filters.locations;
      }
      if (filters.activityTypes.length > 0) {
        params.activityTypes = filters.activityTypes;
      }
      if (filters.ageGroups.length > 0) {
        params.ageGroups = filters.ageGroups;
      }
      if (filters.dateFrom) {
        params.dateFrom = filters.dateFrom;
      }
      if (filters.dateTo) {
        params.dateTo = filters.dateTo;
      }

      const data = await api.searchPrograms(params);
      setPrograms(data.programs);
    } catch (e) {
      console.error("Failed to load programs:", e);
    }
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPrograms();
    setRefreshing(false);
  }, [filters]);

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const clearFilter = (field: keyof FilterState) => {
    setFilters((prev) => ({
      ...prev,
      [field]: Array.isArray(prev[field]) ? [] : null,
    }));
  };

  // Get display text for filter chips
  const getFilterDisplayText = (
    field: keyof FilterState,
    options: FilterOption[]
  ): string | undefined => {
    const values = filters[field];
    if (!values || (Array.isArray(values) && values.length === 0)) {
      return undefined;
    }
    if (Array.isArray(values)) {
      if (values.length === 1) {
        const option = options.find((o) => o.id === values[0]);
        return option?.name;
      }
      return `${values.length} selected`;
    }
    return undefined;
  };

  // Count active filters
  const activeFilterCount =
    (filters.cities.length > 0 ? 1 : 0) +
    (filters.locations.length > 0 ? 1 : 0) +
    (filters.activityTypes.length > 0 ? 1 : 0) +
    (filters.ageGroups.length > 0 ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  // Handle card press - open registration URL in browser
  const handleCardPress = async (program: Program) => {
    if (program.registration_url) {
      try {
        const supported = await Linking.canOpenURL(program.registration_url);
        if (supported) {
          await Linking.openURL(program.registration_url);
        } else {
          Alert.alert(
            "Cannot Open Link",
            "Unable to open the registration page. Please try again later."
          );
        }
      } catch (error) {
        console.error("Error opening URL:", error);
        Alert.alert("Error", "Failed to open the registration page.");
      }
    }
  };

  const renderItem = ({ item }: { item: Program }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => handleCardPress(item)}
    >
      <View style={styles.iconBox}>
        <Text style={styles.icon}>
          {activityIcons[item.activity_type] || activityIcons.other}
        </Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.location} numberOfLines={1}>
          {item.location_name}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.time}>{item.start_time}</Text>
          <Text style={styles.date}>{item.date}</Text>
          {item.fee != null && item.fee > 0 && (
            <Text style={styles.fee}>${item.fee.toFixed(2)}</Text>
          )}
          {item.spots_available !== null && (
            <Text
              style={[
                styles.spots,
                {
                  color:
                    item.spots_available > 10
                      ? colors.spotsHigh
                      : item.spots_available > 3
                      ? colors.spotsMedium
                      : item.spots_available > 0
                      ? colors.spotsLow
                      : colors.spotsFull,
                },
              ]}
            >
              {item.spots_available > 0
                ? `${item.spots_available} spots`
                : "Full"}
            </Text>
          )}
        </View>
      </View>
      {/* External link icon to indicate clicking opens browser */}
      <Ionicons
        name={item.registration_url ? "open-outline" : "chevron-forward"}
        size={20}
        color={item.registration_url ? colors.primary : colors.gray300}
      />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color={colors.gray400} />
      <Text style={styles.emptyTitle}>No programs found</Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your filters to see more results
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Search Programs</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="options-outline" size={22} color={colors.primary} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          {programs.length} programs found
        </Text>
      </View>

      {/* Filter Chips */}
      <FilterChipGroup>
        <FilterChip
          label="City"
          value={getFilterDisplayText("cities", cityOptions)}
          isActive={filters.cities.length > 0}
          onPress={() => setFilterModalVisible(true)}
          onClear={() => clearFilter("cities")}
        />
        <FilterChip
          label="Location"
          value={getFilterDisplayText("locations", locationOptions)}
          isActive={filters.locations.length > 0}
          onPress={() => setFilterModalVisible(true)}
          onClear={() => clearFilter("locations")}
        />
        <FilterChip
          label="Activity"
          value={getFilterDisplayText("activityTypes", activityTypeOptions)}
          isActive={filters.activityTypes.length > 0}
          onPress={() => setFilterModalVisible(true)}
          onClear={() => clearFilter("activityTypes")}
        />
        <FilterChip
          label="Age"
          value={getFilterDisplayText("ageGroups", ageGroupOptions)}
          isActive={filters.ageGroups.length > 0}
          onPress={() => setFilterModalVisible(true)}
          onClear={() => clearFilter("ageGroups")}
        />
      </FilterChipGroup>

      {/* Program List */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={programs}
          keyExtractor={(item, index) => `${item.id}_${index}`}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            programs.length === 0 && styles.listEmpty,
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
        cityOptions={cityOptions}
        locationOptions={locationOptions}
        activityTypeOptions={activityTypeOptions}
        ageGroupOptions={ageGroupOptions}
      />
    </SafeAreaView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textInverse,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textTertiary,
    marginTop: 2,
  },
  loader: {
    flex: 1,
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  listEmpty: {
    flex: 1,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  location: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 2,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  time: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  date: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  fee: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  spots: {
    fontSize: 13,
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: 8,
  },
});
