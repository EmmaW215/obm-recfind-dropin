import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

// ============================================================================
// Types
// ============================================================================

export interface FilterOption {
  id: string;
  name: string;
}

export interface FilterState {
  cities: string[];
  locations: string[];
  activityTypes: string[];
  ageGroups: string[];
  dateFrom: string | null;
  dateTo: string | null;
}

export const DEFAULT_FILTER_STATE: FilterState = {
  cities: [],
  locations: [],
  activityTypes: [],
  ageGroups: [],
  dateFrom: null,
  dateTo: null,
};

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters: FilterState;
  cityOptions: FilterOption[];
  locationOptions: FilterOption[];
  activityTypeOptions: FilterOption[];
  ageGroupOptions: FilterOption[];
}

// ============================================================================
// FilterModal Component
// ============================================================================

export function FilterModal({
  visible,
  onClose,
  onApply,
  initialFilters,
  cityOptions,
  locationOptions,
  activityTypeOptions,
  ageGroupOptions,
}: FilterModalProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  // Reset filters when modal opens
  useEffect(() => {
    if (visible) {
      setFilters(initialFilters);
    }
  }, [visible, initialFilters]);

  const toggleSelection = (
    field: keyof Pick<FilterState, "cities" | "locations" | "activityTypes" | "ageGroups">,
    value: string
  ) => {
    setFilters((prev) => {
      const current = prev[field];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter((v) => v !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const clearAllFilters = () => {
    setFilters(DEFAULT_FILTER_STATE);
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const hasActiveFilters =
    filters.cities.length > 0 ||
    filters.locations.length > 0 ||
    filters.activityTypes.length > 0 ||
    filters.ageGroups.length > 0 ||
    filters.dateFrom !== null ||
    filters.dateTo !== null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filters</Text>
          <TouchableOpacity
            onPress={clearAllFilters}
            style={styles.headerButton}
            disabled={!hasActiveFilters}
          >
            <Text
              style={[
                styles.clearText,
                !hasActiveFilters && styles.clearTextDisabled,
              ]}
            >
              Clear All
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Sections */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* City Selection */}
          <FilterSection title="City" icon="location-outline">
            <MultiSelectGrid
              options={cityOptions}
              selected={filters.cities}
              onToggle={(id) => toggleSelection("cities", id)}
            />
          </FilterSection>

          {/* Location Selection */}
          <FilterSection title="Community Center" icon="business-outline">
            <MultiSelectGrid
              options={locationOptions}
              selected={filters.locations}
              onToggle={(id) => toggleSelection("locations", id)}
              columns={1}
            />
          </FilterSection>

          {/* Activity Type */}
          <FilterSection title="Activity Type" icon="fitness-outline">
            <MultiSelectGrid
              options={activityTypeOptions}
              selected={filters.activityTypes}
              onToggle={(id) => toggleSelection("activityTypes", id)}
            />
          </FilterSection>

          {/* Age Group */}
          <FilterSection title="Age Group" icon="people-outline">
            <MultiSelectGrid
              options={ageGroupOptions}
              selected={filters.ageGroups}
              onToggle={(id) => toggleSelection("ageGroups", id)}
            />
          </FilterSection>

          {/* Date Range - Placeholder for future implementation */}
          <FilterSection title="Date Range" icon="calendar-outline">
            <View style={styles.dateRangeContainer}>
              <Text style={styles.dateRangePlaceholder}>
                Date range filter coming soon...
              </Text>
            </View>
          </FilterSection>

          {/* Bottom Spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Apply Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface FilterSectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
}

function FilterSection({ title, icon, children }: FilterSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon as any} size={20} color={colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

interface MultiSelectGridProps {
  options: FilterOption[];
  selected: string[];
  onToggle: (id: string) => void;
  columns?: number;
}

function MultiSelectGrid({
  options,
  selected,
  onToggle,
  columns = 2,
}: MultiSelectGridProps) {
  return (
    <View style={[styles.optionsGrid, columns === 1 && styles.optionsGridSingle]}>
      {options.map((option) => {
        const isSelected = selected.includes(option.id);
        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionItem,
              columns === 1 && styles.optionItemFull,
              isSelected && styles.optionItemSelected,
            ]}
            onPress={() => onToggle(option.id)}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              <View
                style={[
                  styles.checkbox,
                  isSelected && styles.checkboxSelected,
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={14} color={colors.textInverse} />
                )}
              </View>
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}
                numberOfLines={1}
              >
                {option.name}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    minWidth: 70,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  cancelText: {
    fontSize: 16,
    color: colors.primary,
  },
  clearText: {
    fontSize: 16,
    color: colors.error,
    textAlign: "right",
  },
  clearTextDisabled: {
    color: colors.gray400,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginLeft: 8,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  optionsGridSingle: {
    flexDirection: "column",
  },
  optionItem: {
    width: "50%",
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  optionItemFull: {
    width: "100%",
  },
  optionItemSelected: {},
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.gray400,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  optionTextSelected: {
    color: colors.textPrimary,
    fontWeight: "500",
  },
  dateRangeContainer: {
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateRangePlaceholder: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textInverse,
  },
});

