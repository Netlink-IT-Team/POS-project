import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, Modal, Pressable, TextInput, Platform, ActivityIndicator } from 'react-native';
import { PaymentMethod } from '../types';
import { COLORS, RADII, formatRupiah } from '../constants/theme';
import { api } from '../services/api';

export interface PaymentSuccessData {
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  change?: number;
  qrisRef?: string;
}

export interface PaymentModalProps {
  visible: boolean;
  orderNumber: string;
  queueNumber: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  isOnline: boolean;
  onClose: () => void;
  onConfirmSuccess: (data: PaymentSuccessData) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  orderNumber,
  queueNumber,
  totalAmount,
  paymentMethod: initialPaymentMethod,
  isOnline,
  onClose,
  onConfirmSuccess,
}) => {
  const [activeMethod, setActiveMethod] = useState<PaymentMethod>(initialPaymentMethod);
  const [cashInput, setCashInput] = useState<string>(String(totalAmount));
  
  // Dynamic QRIS states
  const [qrisStatus, setQrisStatus] = useState<'generating' | 'waiting' | 'paid' | 'expired'>('waiting');
  const [qrisTtlSeconds, setQrisTtlSeconds] = useState<number>(180); // 3 minutes TTL
  const [qrisInvoiceId, setQrisInvoiceId] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Synchronize state when modal opens
  useEffect(() => {
    if (visible) {
      setActiveMethod(initialPaymentMethod);
      setCashInput(String(totalAmount));
      setQrisStatus('waiting');
      setQrisTtlSeconds(180);
      const generatedInv = `XND-${Date.now().toString().slice(-6)}`;
      setQrisInvoiceId(generatedInv);
    }
  }, [visible, initialPaymentMethod, totalAmount]);

  // QRIS Countdown Timer
  useEffect(() => {
    if (!visible || activeMethod !== 'qris' || qrisStatus !== 'waiting') return;

    const timer = setInterval(() => {
      setQrisTtlSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setQrisStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, activeMethod, qrisStatus]);

  // Polling for QRIS payment status if online
  useEffect(() => {
    if (!visible || activeMethod !== 'qris' || qrisStatus !== 'waiting' || !isOnline || !qrisInvoiceId) {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const res = await api.getTransactionStatus(qrisInvoiceId);
        if (res && (res.status === 'completed' || res.status === 'PAID')) {
          setQrisStatus('paid');
          setTimeout(() => {
            onConfirmSuccess({
              paymentMethod: 'qris',
              qrisRef: qrisInvoiceId,
            });
          }, 800);
        }
      } catch (e) {
        // Silent catch for polling
      }
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [visible, activeMethod, qrisStatus, isOnline, qrisInvoiceId, onConfirmSuccess]);

  // Cash Calculations
  const cashReceived = Number(cashInput.replace(/[^0-9]/g, '')) || 0;
  const isCashSufficient = cashReceived >= totalAmount;
  const change = Math.max(0, cashReceived - totalAmount);
  const shortfall = Math.max(0, totalAmount - cashReceived);

  // Quick Cash Denominations
  const quickSuggestions = useMemo(() => {
    const suggestions: number[] = [totalAmount];
    const ceil10k = Math.ceil(totalAmount / 10000) * 10000;
    const ceil50k = Math.ceil(totalAmount / 50000) * 50000;
    if (ceil10k > totalAmount) suggestions.push(ceil10k);
    if (ceil50k > totalAmount && ceil50k !== ceil10k) suggestions.push(ceil50k);
    [20000, 50000, 100000].forEach((note) => {
      if (note >= totalAmount && !suggestions.includes(note)) {
        suggestions.push(note);
      }
    });
    return suggestions.sort((a, b) => a - b);
  }, [totalAmount]);

  const handleAddCash = (amountToAdd: number) => {
    const current = Number(cashInput.replace(/[^0-9]/g, '')) || 0;
    setCashInput(String(current + amountToAdd));
  };

  // Simulate QRIS Payment (Demo & Cashier Fast-Track)
  const handleSimulateQrisPayment = async () => {
    setIsSimulating(true);
    try {
      if (isOnline && qrisInvoiceId) {
        await api.simulatePayment(qrisInvoiceId).catch(() => null);
      }
      setQrisStatus('paid');
      setTimeout(() => {
        setIsSimulating(false);
        onConfirmSuccess({
          paymentMethod: 'qris',
          qrisRef: qrisInvoiceId,
        });
      }, 700);
    } catch {
      setQrisStatus('paid');
      setIsSimulating(false);
      onConfirmSuccess({
        paymentMethod: 'qris',
        qrisRef: qrisInvoiceId,
      });
    }
  };

  const handleRegenerateQris = () => {
    setQrisStatus('waiting');
    setQrisTtlSeconds(180);
    setQrisInvoiceId(`XND-${Date.now().toString().slice(-6)}`);
  };

  const handleConfirmCashPayment = () => {
    if (!isCashSufficient) return;
    onConfirmSuccess({
      paymentMethod: 'cash',
      cashReceived,
      change,
    });
  };

  const formattedTtl = `${Math.floor(qrisTtlSeconds / 60)
    .toString()
    .padStart(2, '0')}:${(qrisTtlSeconds % 60).toString().padStart(2, '0')}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Pembayaran Kasir</Text>
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
            <Text style={styles.amountLabel}>Total Tagihan Pelanggan</Text>
            <Text style={styles.amountValue}>{formatRupiah(totalAmount)}</Text>
          </View>

          {/* Payment Method Switcher Tabs */}
          <View style={styles.methodTabs}>
            <Pressable
              onPress={() => setActiveMethod('cash')}
              style={[styles.methodTab, activeMethod === 'cash' && styles.methodTabActive]}
            >
              <Text
                style={[
                  styles.methodTabText,
                  activeMethod === 'cash' && styles.methodTabTextActive,
                ]}
              >
                💵 Tunai (Cash)
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveMethod('qris')}
              style={[styles.methodTab, activeMethod === 'qris' && styles.methodTabActive]}
            >
              <Text
                style={[
                  styles.methodTabText,
                  activeMethod === 'qris' && styles.methodTabTextActive,
                ]}
              >
                📱 QRIS Dinamis (Xendit)
              </Text>
            </Pressable>
          </View>

          {/* Body: CASH WORKFLOW */}
          {activeMethod === 'cash' ? (
            <View style={styles.cashContainer}>
              {/* Quick Preset Buttons */}
              <Text style={styles.sectionSubtitle}>Pilih Nominal Cepat:</Text>
              <View style={styles.quickOptionsRow}>
                {quickSuggestions.map((amount) => {
                  const isSelected = cashReceived === amount;
                  return (
                    <Pressable
                      key={amount}
                      onPress={() => setCashInput(String(amount))}
                      style={[styles.quickChip, isSelected && styles.quickChipSelected]}
                    >
                      <Text
                        style={[
                          styles.quickChipText,
                          isSelected && styles.quickChipTextSelected,
                        ]}
                      >
                        {amount === totalAmount ? 'Uang Pas' : formatRupiah(amount)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Flexible Custom Cash Input */}
              <View style={styles.customCashRow}>
                <View style={styles.inputPrefixBox}>
                  <Text style={styles.inputPrefix}>Rp</Text>
                  <TextInput
                    keyboardType="numeric"
                    value={cashInput}
                    onChangeText={setCashInput}
                    style={styles.cashTextInput}
                    placeholder="0"
                    placeholderTextColor={COLORS.textPlaceholder}
                    selectTextOnFocus
                  />
                </View>
                <Pressable onPress={() => setCashInput('')} style={styles.btnClearCash} hitSlop={6}>
                  <Text style={styles.btnClearText}>Clear (C)</Text>
                </Pressable>
              </View>

              {/* Quick Increment Chips (+10k, +20k, +50k) */}
              <View style={styles.incrementRow}>
                <Text style={styles.incrementHint}>Tambah:</Text>
                <Pressable onPress={() => handleAddCash(10000)} style={styles.incBtn}>
                  <Text style={styles.incBtnText}>+10rb</Text>
                </Pressable>
                <Pressable onPress={() => handleAddCash(20000)} style={styles.incBtn}>
                  <Text style={styles.incBtnText}>+20rb</Text>
                </Pressable>
                <Pressable onPress={() => handleAddCash(50000)} style={styles.incBtn}>
                  <Text style={styles.incBtnText}>+50rb</Text>
                </Pressable>
              </View>

              {/* Change / Shortfall Live Status Box */}
              <View
                style={[
                  styles.changeStatusBox,
                  isCashSufficient ? styles.boxBalanced : styles.boxShortfall,
                ]}
              >
                <View>
                  <Text
                    style={[
                      styles.changeStatusLabel,
                      isCashSufficient ? styles.labelBalanced : styles.labelShortfall,
                    ]}
                  >
                    {isCashSufficient ? 'Uang Kembalian:' : 'Uang Masih Kurang:'}
                  </Text>
                  <Text style={styles.changeStatusSub}>
                    {isCashSufficient
                      ? 'Harap serahkan uang kembalian ke pelanggan.'
                      : 'Nominal tunai belum mencukupi total tagihan.'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.changeStatusVal,
                    isCashSufficient ? styles.valBalanced : styles.valShortfall,
                  ]}
                >
                  {formatRupiah(isCashSufficient ? change : shortfall)}
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.footer}>
                <Pressable onPress={onClose} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Batalkan</Text>
                </Pressable>
                <Pressable
                  disabled={!isCashSufficient}
                  onPress={handleConfirmCashPayment}
                  style={({ pressed }) => [
                    styles.confirmBtn,
                    !isCashSufficient && styles.confirmBtnDisabled,
                    pressed && isCashSufficient && { opacity: 0.9 },
                  ]}
                >
                  <Text style={styles.confirmText}>
                    {isCashSufficient ? '✓ Selesaikan Pembayaran Tunai' : 'Uang Belum Cukup'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            /* Body: QRIS DINAMIS REAL-TIME */
            <View style={styles.qrisContainer}>
              {qrisStatus === 'paid' ? (
                <View style={styles.qrisSuccessBox}>
                  <Text style={styles.successIcon}>✅</Text>
                  <Text style={styles.successTitle}>PEMBAYARAN DITERIMA!</Text>
                  <Text style={styles.successSub}>
                    QRIS Terverifikasi LUNAS via Xendit Webhook
                  </Text>
                  <View style={styles.qrisSuccessBadge}>
                    <Text style={styles.qrisSuccessBadgeText}>REF: {qrisInvoiceId}</Text>
                  </View>
                </View>
              ) : qrisStatus === 'expired' ? (
                <View style={styles.qrisExpiredBox}>
                  <Text style={styles.expiredIcon}>⏱️</Text>
                  <Text style={styles.expiredTitle}>QRIS Kedaluwarsa</Text>
                  <Text style={styles.expiredSub}>
                    Batas waktu 3 menit pembayaran telah habis.
                  </Text>
                  <Pressable onPress={handleRegenerateQris} style={styles.btnRegenerate}>
                    <Text style={styles.btnRegenerateText}>🔄 Buat QRIS Baru</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.qrisActiveContent}>
                  {/* Dynamic QR Mock Layout */}
                  <View style={styles.qrCodeCard}>
                    <View style={styles.qrHeader}>
                      <Text style={styles.qrHeaderTitle}>QRIS DINAMIS</Text>
                      <Text style={styles.qrHeaderMerchant}>KOPIKO BOOTH</Text>
                    </View>

                    {/* QR Matrix Visual */}
                    <View style={styles.qrVisualBox}>
                      <Text style={styles.qrMockSymbol}>▊▊ ▊▊ ▊▊ ▊▊</Text>
                      <Text style={styles.qrInvoiceCode}>{qrisInvoiceId}</Text>
                      <Text style={styles.qrMockSymbol}>▊▊ ▊▊ ▊▊ ▊▊</Text>
                    </View>

                    <Text style={styles.qrFooterText}>
                      Scan via BCA, Mandiri, GoPay, OVO, ShopeePay, Dana
                    </Text>
                  </View>

                  {/* Real-Time Countdown & Status */}
                  <View style={styles.qrisMetaRow}>
                    <View style={styles.ttlBadge}>
                      <Text style={styles.ttlLabel}>Batas Waktu Bayar:</Text>
                      <Text style={styles.ttlValue}>{formattedTtl}</Text>
                    </View>

                    <View style={styles.statusLivePill}>
                      <View style={styles.statusPulsingDot} />
                      <Text style={styles.statusLiveText}>Menunggu Pelanggan...</Text>
                    </View>
                  </View>

                  {/* Fast Simulation / Test Action for Cashier */}
                  <Pressable
                    disabled={isSimulating}
                    onPress={handleSimulateQrisPayment}
                    style={({ pressed }) => [
                      styles.btnSimulate,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    {isSimulating ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.btnSimulateText}>
                        ⚡ Simulasikan Scan & Bayar QRIS (Demo)
                      </Text>
                    )}
                  </Pressable>

                  {!isOnline && (
                    <Text style={styles.offlineHint}>
                      ⚠️ Mode Offline: Menggunakan QRIS Statis Booth. Pastikan notifikasi dana masuk di HP operasional.
                    </Text>
                  )}

                  {/* Cancel / Close Footer */}
                  <View style={[styles.footer, { marginTop: 12 }]}>
                    <Pressable onPress={onClose} style={styles.cancelBtn}>
                      <Text style={styles.cancelText}>Tutup / Batalkan</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(29, 15, 10, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.card,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.brandCrimson,
  },
  methodTabs: {
    flexDirection: 'row',
    backgroundColor: '#F3EFEA',
    borderRadius: RADII.btn,
    padding: 3,
    marginBottom: 16,
    gap: 4,
  },
  methodTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.btn - 2,
  },
  methodTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  methodTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  methodTabTextActive: {
    color: COLORS.brandEspresso,
  },
  cashContainer: {
    paddingVertical: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brandEspresso,
    marginBottom: 6,
  },
  quickOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  quickChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADII.btn,
    backgroundColor: '#F7F5F0',
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  quickChipSelected: {
    backgroundColor: 'rgba(198, 40, 40, 0.1)',
    borderColor: COLORS.brandCrimson,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.brandEspresso,
  },
  quickChipTextSelected: {
    color: COLORS.brandCrimson,
    fontWeight: '800',
  },
  customCashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  inputPrefixBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F5F0',
    borderRadius: RADII.btn,
    borderWidth: 1.5,
    borderColor: COLORS.borderDefault,
    paddingHorizontal: 12,
  },
  inputPrefix: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.brandEspresso,
    marginRight: 6,
  },
  cashTextInput: {
    flex: 1,
    height: 44,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.brandEspresso,
    outlineStyle: 'none',
  } as any,
  btnClearCash: {
    paddingHorizontal: 12,
    height: 44,
    borderRadius: RADII.btn,
    backgroundColor: '#EFECE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnClearText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  incrementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  incrementHint: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  incBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADII.btn,
    backgroundColor: '#EBE7E0',
  },
  incBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  changeStatusBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADII.btn,
    borderWidth: 1,
    marginBottom: 14,
  },
  boxBalanced: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  boxShortfall: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  changeStatusLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  labelBalanced: {
    color: '#15803D',
  },
  labelShortfall: {
    color: '#B91C1C',
  },
  changeStatusSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  changeStatusVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  valBalanced: {
    color: '#15803D',
  },
  valShortfall: {
    color: '#B91C1C',
  },
  qrisContainer: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  qrisActiveContent: {
    width: '100%',
    alignItems: 'center',
  },
  qrCodeCard: {
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.btn,
    borderWidth: 2,
    borderColor: COLORS.brandEspresso,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  qrHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  qrHeaderTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.brandCrimson,
  },
  qrHeaderMerchant: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  qrVisualBox: {
    width: 170,
    height: 140,
    backgroundColor: '#FDFBF7',
    borderWidth: 1,
    borderColor: '#DFD7CA',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  qrMockSymbol: {
    fontSize: 18,
    color: COLORS.brandEspresso,
    letterSpacing: 3,
  },
  qrInvoiceCode: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.brandCrimson,
    marginVertical: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  qrFooterText: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  qrisMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  ttlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ttlLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  ttlValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.brandCrimson,
  },
  statusLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  statusPulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  statusLiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  btnSimulate: {
    width: '100%',
    height: 44,
    backgroundColor: '#1E293B',
    borderRadius: RADII.btn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSimulateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
  },
  offlineHint: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B45309',
    marginTop: 8,
    textAlign: 'center',
  },
  qrisSuccessBox: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#15803D',
    marginBottom: 4,
  },
  successSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  qrisSuccessBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADII.btn,
  },
  qrisSuccessBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  qrisExpiredBox: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  expiredIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  expiredTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B91C1C',
    marginBottom: 4,
  },
  expiredSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 14,
  },
  btnRegenerate: {
    backgroundColor: COLORS.brandEspresso,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADII.btn,
  },
  btnRegenerateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: RADII.btn,
    backgroundColor: '#EFECE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  confirmBtn: {
    flex: 2,
    height: 46,
    borderRadius: RADII.btn,
    backgroundColor: COLORS.brandCrimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#D1C7BA',
  },
  confirmText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
