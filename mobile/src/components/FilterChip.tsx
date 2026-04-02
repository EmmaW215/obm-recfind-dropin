import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

interface FilterChipProps {
  label: string;
  value?: string;
  isActive?: boolean;
  onPress: () => void;
  onClear?: () => void;
  showClearButton?: boolean;
}

/**
 * FilterChip - A clickable filter tag component
 * 
 * Displays the filter name and current value.
 * Shows a clear button when filter is active.
 */
export function FilterChip({
  label,
  value,
  isActive = false,
  onPress,
  onClear,
  showClearButton = true,
}: FilterChipProps) {
  const displayText = value ? `${label}: ${value}` : label;

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        isActive && styles.chipActive,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.chipText,
          isActive && styles.chipTextActive,
        ]}
        numberOfLines={1}
      >
        {displayText}
      </Text>
      
      {isActive && showClearButton && onClear && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={(e) => {
            e.stopPropagation();
            onClear();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={16} color={colors.textInverse} />
        </TouchableOpacity>
      )}
      
      {!isActive && (
        <Ionicons
          name="chevron-down"
          size={14}
          color={colors.textTertiary}
          style={styles.chevron}
        />
      )}
    </TouchableOpacity>
  );
}

interface FilterChipGroupProps {
  children: React.ReactNode;
}

/**
 * FilterChipGroup - Container for multiple filter chips
 */
export function FilterChipGroup({ children }: FilterChipGroupProps) {
  return <View style={styles.chipGroup}>{children}</View>;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
    maxWidth: 150,
  },
  chipTextActive: {
    color: colors.textInverse,
  },
  clearButton: {
    marginLeft: 6,
  },
  chevron: {
    marginLeft: 4,
  },
  chipGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

