import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { COLORS, RADII, formatRupiah } from '../constants/theme';

export interface CartItemProps {
  id: string;
  menuId: string;
  name: string;
  modifiersText?: string;
  pricePerUnit: number;
  quantity: number;
  subtotal: number;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
}

export const CartItem: React.FC<CartItemProps> = ({
  id,
  name,
  modifiersText,
  pricePerUnit,
  quantity,
  subtotal,
  onIncrement,
  onDecrement,
}) => {
  return (
    <View style={styles.card}>
      {/* Top Row: Name and Subtotal */}
      <View style={styles.topRow}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.subtotal}>{formatRupiah(subtotal)}</Text>
      </View>

      {/* Modifiers Row */}
      {modifiersText ? (
        <Text style={styles.modifiers} numberOfLines={1}>
          {modifiersText}
        </Text>
      ) : null}

      {/* Bottom Row: Price per unit and Stepper */}
      <View style={styles.bottomRow}>
        <Text style={styles.unitPrice}>{`${formatRupiah(pricePerUnit)} / item`}</Text>

        <View style={styles.stepperContainer}>
          <Pressable
            onPress={() => onDecrement(id)}
            style={({ pressed }) => [styles.stepperBtnMinus, pressed && styles.stepperPressed]}
            hitSlop={8}
          >
            <Text style={styles.minusText}>−</Text>
          </Pressable>

          <Text style={styles.quantityText}>{quantity}</Text>

          <Pressable
            onPress={() => onIncrement(id)}
            style={({ pressed }) => [styles.stepperBtnPlus, pressed && styles.stepperPressed]}
            hitSlop={8}
          >
            <Text style={styles.plusText}>+</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: '#E9E4DC',
    borderRadius: RADII.card,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.brandEspresso,
    flex: 1,
    marginRight: 8,
  },
  subtotal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  modifiers: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
    paddingTop: 8,
    marginTop: 4,
  },
  unitPrice: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperBtnMinus: {
    width: 30,
    height: 30,
    borderRadius: RADII.stepper,
    backgroundColor: COLORS.stepperBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnPlus: {
    width: 30,
    height: 30,
    borderRadius: RADII.stepper,
    backgroundColor: COLORS.brandEspresso,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
  minusText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  plusText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quantityText: {
    minWidth: 20,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
});

