import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, Pressable } from 'react-native';
import { PaymentMethod } from '../types';
import { COLORS, RADII, formatRupiah } from '../constants/theme';

export interface PaymentModalProps {
  visible: boolean;
  orderNumber: string;
  queueNumber: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  isOnline: boolean;
  onClose: () => void;
  onConfirmSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  orderNumber,
  queueNumber,
  totalAmount,
  paymentMethod,
  isOnline,
  onClose,
  onConfirmSuccess,
}) => {
  const [cashReceived, setCashReceived] = useState<number>(totalAmount);

  // Suggestions for cash payments
  const cashSuggestions = [
    totalAmount,
    Math.ceil(totalAmount / 10000) * 10000,
    Math.ceil(totalAmount / 50000) * 50000,
    100000,
  ].filter((v, idx, arr) => arr.indexOf(v) === idx && v >= totalAmount);

  const change = Math.max(0, cashReceived - totalAmount);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Modal Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {paymentMethod === 'qris' ? 'Pembayaran QRIS Dinamis' : 'Pembayaran Tunai'}
              </Text>
              <Text style={styles.subtitle}>
                {`Pesanan #${orderNumber} • Antrean #${queueNumber}`}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* Amount Box */}
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Total Tagihan</Text>
            <Text style={styles.amountValue}>{formatRupiah(totalAmount)}</Text>
          </View>

          {/* Body based on payment method */}
          {paymentMethod === 'qris' ? (
            <View style={styles.qrisContainer}>
              <View style={styles.qrBox}>
                <Text style={styles.qrMockCode}>▦ QRIS XENDIT ▦</Text>
                <Text style={styles.qrSub}>Scan via BCA, Mandiri, GoPay, OVO, ShopeePay</Text>
              </View>
              <Text style={styles.ttlText}>
                {isOnline
                  ? '⏱️ Berlaku 15 menit • Auto-verifikasi Webhook'
                  : '⚠️ Mode Offline: Menggunakan QRIS Statis Booth'}
              </Text>
            </View>
          ) : (
            <View style={styles.cashContainer}>
              <Text style={styles.cashSectionTitle}>Pilih Nominal Uang Diterima:</Text>
              <View style={styles.cashOptionsRow}>
                {cashSuggestions.map((amount) => {
                  const isSelected = cashReceived === amount;
                  return (
                    <Pressable
                      key={amount}
                      onPress={() => setCashReceived(amount)}
                      style={[
                        styles.cashChip,
                        isSelected && styles.cashChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.cashChipText,
                          isSelected && styles.cashChipTextSelected,
                        ]}
                      >
                        {amount === totalAmount ? 'Uang Pas' : formatRupiah(amount)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.changeBox}>
                <Text style={styles.changeLabel}>Kembalian:</Text>
                <Text style={styles.changeValue}>{formatRupiah(change)}</Text>
              </View>
            </View>
          )}

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.cancelText}>Batalkan</Text>
            </Pressable>

            <Pressable
              onPress={onConfirmSuccess}
              style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.confirmText}>Selesaikan Transaksi</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(29, 15, 10, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.card,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.brandEspresso,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 14,
    color: COLORS.brandEspresso,
    fontWeight: '700',
  },
  amountBox: {
    backgroundColor: COLORS.bgCanvas,
    borderRadius: RADII.btn,
    padding: 14,
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.brandCrimson,
  },
  qrisContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  qrBox: {
    width: 240,
    height: 200,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: COLORS.brandEspresso,
    borderRadius: RADII.btn,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 12,
  },
  qrMockCode: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
    color: COLORS.brandEspresso,
    marginBottom: 8,
  },
  qrSub: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  ttlText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  cashContainer: {
    paddingVertical: 4,
  },
  cashSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brandEspresso,
    marginBottom: 8,
  },
  cashOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  cashChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADII.btn,
    backgroundColor: '#F7F5F0',
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  cashChipSelected: {
    backgroundColor: 'rgba(198, 40, 40, 0.1)',
    borderColor: COLORS.brandCrimson,
  },
  cashChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.brandEspresso,
  },
  cashChipTextSelected: {
    color: COLORS.brandCrimson,
    fontWeight: '700',
  },
  changeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3EFEA',
    padding: 12,
    borderRadius: RADII.btn,
    marginBottom: 14,
  },
  changeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.brandEspresso,
  },
  changeValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.statusReady,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADII.btn,
    backgroundColor: '#EFECE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  confirmBtn: {
    flex: 2,
    height: 48,
    borderRadius: RADII.btn,
    backgroundColor: COLORS.brandCrimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

