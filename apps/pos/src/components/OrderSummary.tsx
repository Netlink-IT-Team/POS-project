import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { COLORS, RADII, formatRupiah } from '../constants/theme';
import { PaymentMethod } from '../types';

export interface OrderSummaryProps {
  itemCount: number;
  subtotal: number;
  totalAmount: number;
  selectedPaymentMethod: PaymentMethod;
  onSelectPaymentMethod: (method: PaymentMethod) => void;
  onProceedToPayment: () => void;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  itemCount,
  subtotal,
  totalAmount,
  selectedPaymentMethod,
  onSelectPaymentMethod,
  onProceedToPayment,
}) => {
  const isReady = itemCount > 0;

  return (
    <View style={styles.container}>
      {/* Subtotal Row */}
      <View style={styles.subtotalRow}>
        <Text style={styles.subtotalLabel}>{`Subtotal (${itemCount} item)`}</Text>
        <Text style={styles.subtotalAmount}>{formatRupiah(subtotal)}</Text>
      </View>

      {/* Total Payment Block */}
      <View style={styles.totalRow}>
        <View>
          <Text style={styles.totalOverline}>TOTAL PEMBAYARAN</Text>
          <Text style={[styles.statusText, !isReady && { color: COLORS.textMuted }]}>
            {isReady ? '● Siap diproses' : '○ Keranjang kosong'}
          </Text>
        </View>
        <Text style={styles.totalPrice}>{formatRupiah(totalAmount)}</Text>
      </View>

      {/* Payment Method Selector (QRIS / Tunai) */}
      <View style={styles.paymentMethodRow}>
        <Pressable
          disabled={!isReady}
          onPress={() => onSelectPaymentMethod('qris')}
          style={({ pressed }) => [
            styles.paymentOption,
            selectedPaymentMethod === 'qris' && styles.paymentOptionActive,
            !isReady && styles.paymentOptionDisabled,
            pressed && isReady && { opacity: 0.8 },
          ]}
          hitSlop={8}
        >
          <Text style={styles.paymentIcon}>📱</Text>
          <Text
            style={[
              styles.paymentLabel,
              selectedPaymentMethod === 'qris' && styles.paymentLabelActive,
            ]}
          >
            QRIS (Xendit)
          </Text>
        </Pressable>

        <Pressable
          disabled={!isReady}
          onPress={() => onSelectPaymentMethod('cash')}
          style={({ pressed }) => [
            styles.paymentOption,
            selectedPaymentMethod === 'cash' && styles.paymentOptionActive,
            !isReady && styles.paymentOptionDisabled,
            pressed && isReady && { opacity: 0.8 },
          ]}
          hitSlop={8}
        >
          <Text style={styles.paymentIcon}>💵</Text>
          <Text
            style={[
              styles.paymentLabel,
              selectedPaymentMethod === 'cash' && styles.paymentLabelActive,
            ]}
          >
            Tunai / Cash
          </Text>
        </Pressable>
      </View>

      {/* Main Checkout CTA Button */}
      <Pressable
        disabled={!isReady}
        onPress={onProceedToPayment}
        style={({ pressed }) => [
          styles.ctaButton,
          !isReady && styles.ctaButtonDisabled,
          pressed && isReady && styles.ctaButtonPressed,
        ]}
      >
        <Text style={styles.ctaText}>
          {isReady
            ? `Bayar via ${selectedPaymentMethod === 'qris' ? 'QRIS' : 'Tunai'}`
            : 'Pilih Menu untuk Membayar'}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1,
    borderTopColor: '#E8E2DA',
    padding: 18,
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subtotalLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  subtotalAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ECE5DD',
    paddingTop: 12,
    marginBottom: 14,
  },
  totalOverline: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.statusReady,
    marginTop: 2,
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.brandCrimson,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: RADII.btn,
    backgroundColor: COLORS.bgCanvas,
    borderWidth: 1.5,
    borderColor: COLORS.borderDefault,
    gap: 6,
  },
  paymentOptionActive: {
    borderColor: COLORS.brandCrimson,
    backgroundColor: 'rgba(198, 40, 40, 0.05)',
  },
  paymentOptionDisabled: {
    opacity: 0.45,
  },
  paymentIcon: {
    fontSize: 16,
  },
  paymentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.brandEspresso,
  },
  paymentLabelActive: {
    color: COLORS.brandCrimson,
    fontWeight: '700',
  },
  ctaButton: {
    height: 54,
    borderRadius: RADII.card,
    backgroundColor: COLORS.brandCrimson,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.brandCrimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonDisabled: {
    backgroundColor: '#D1CAC3',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaButtonPressed: {
    backgroundColor: COLORS.brandCrimsonHover,
    transform: [{ scale: 0.985 }],
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});

