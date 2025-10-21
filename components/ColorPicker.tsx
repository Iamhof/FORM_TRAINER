import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';
import { COLORS, SPACING } from '@/constants/theme';

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const PRESET_COLORS = [
  { name: 'Red', hex: COLORS.accents.red },
  { name: 'Orange', hex: COLORS.accents.orange },
  { name: 'Yellow', hex: COLORS.accents.yellow },
  { name: 'Green', hex: COLORS.accents.green },
  { name: 'Teal', hex: COLORS.accents.teal },
  { name: 'Blue', hex: COLORS.accents.blue },
  { name: 'Purple', hex: COLORS.accents.purple },
  { name: 'Pink', hex: COLORS.accents.pink },
];

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onColorSelect }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Theme Color</Text>
      <Text style={styles.subtitle}>Select a color that represents your fitness journey</Text>
      
      <ScrollView 
        style={styles.colorGrid}
        contentContainerStyle={styles.colorGridContent}
        showsVerticalScrollIndicator={false}
      >
        {PRESET_COLORS.map((color) => {
          const isSelected = selectedColor.toLowerCase() === color.hex.toLowerCase();
          
          return (
            <TouchableOpacity
              key={color.hex}
              style={styles.colorItemContainer}
              onPress={() => onColorSelect(color.hex)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.colorCircle,
                { backgroundColor: color.hex },
                isSelected && styles.selectedCircle
              ]}>
                {isSelected && (
                  <View style={styles.checkContainer}>
                    <Check size={24} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </View>
              <Text style={styles.colorName}>{color.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  colorGrid: {
    flex: 1,
  },
  colorGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  colorItemContainer: {
    width: '22%',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  colorCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  selectedCircle: {
    borderWidth: 3,
    borderColor: COLORS.textPrimary,
  },
  checkContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
});

export default ColorPicker;
