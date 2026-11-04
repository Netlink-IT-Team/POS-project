import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { COLORS, RADII } from '../constants/theme';

export interface CartHeaderProps {
  orderNumber: string;
  queueNumber: string;
  isCartEmpty?: boolean;
  onClearCart: () => void;
}

export const CartHeader: React.FC<CartHeaderProps> = ({
  orderNumber,
  queueNumber,
  isCartEmpty,
  onClearCart,
}) => {
  return (
    <View style={styles.container}>
      {/* Left: Order and Queue information */}
      <View style={styles.leftGroup}>
        <View style={styles.titleRow}>
          <Text style={styles.orderTitle}>Pesanan #{orderNumber}</Text>
          <View style={styles.queueBadge}>
            <Text style={styles.queueText}>Antrean #{queueNumber}</Text>
          </View>
        </View>
        <Text style={styles.subtext}>Kopiko POS Checkout Draft</Text>
      </View>

      {/* Right: Trash / Clear Cart Action */}
      <Pressable
        disabled={isCartEmpty}
        onPress={onClearCart}
        style={({ pressed }) => [
          styles.clearButton,
          isCartEmpty && styles.clearButtonDisabled,
          pressed && !isCartEmpty && styles.clearButtonPressed,
        ]}
        hitSlop={8}
      >
        <Text style={[styles.trashIcon, isCartEmpty && { opacity: 0.3 }]}>🗑️</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 72,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E2DA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  leftGroup: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  queueBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(198, 40, 40, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(198, 40, 40, 0.2)',
  },
  queueText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brandCrimson,
  },
  subtext: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  clearButton: {
    width: 38,
    height: 38,
    borderRadius: RADII.btn,
    backgroundColor: COLORS.alertDangerBg,
    borderWidth: 1,
    borderColor: COLORS.alertDangerBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonDisabled: {
    opacity: 0.4,
    borderColor: '#EAE5DE',
    backgroundColor: '#F7F5F0',
  },
  clearButtonPressed: {
    backgroundColor: '#FEE2E2',
    transform: [{ scale: 0.94 }],
  },
  trashIcon: {
    fontSize: 15,
  },
});

