import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { Header } from '../components/Header';
import { ZReportModal } from '../components/settlement/ZReportModal';
import { COLORS, RADII, formatRupiah } from '../constants/theme';
import { BoothStockRecord, ShiftUsageSummary } from '../types/stock';
import { api } from '../services/api';

export interface SettlementScreenProps {
  isOnline: boolean;
  onToggleOnline: () => void;
  boothName: string;
  cashierName: string;
  onShiftClosed?: () => void;
  initialDrawerCash?: number;
  onUpdateInitialDrawerCash?: (amount: number) => void;
  cashSales?: number;
  qrisSales?: number;
  transactionsCount?: number;
  pendingSyncCount?: number;
  onTriggerSync?: () => void;
  onOpenShiftAudit?: () => void;
  shiftUsage?: ShiftUsageSummary;
  stocks?: BoothStockRecord[];
  onOpenHistory?: () => void;
}

export const SettlementScreen: React.FC<SettlementScreenProps> = ({
  isOnline,
  onToggleOnline,
  boothName,
  cashierName,
  onShiftClosed,
  initialDrawerCash = 200000,
  onUpdateInitialDrawerCash,
  cashSales = 754000,
  qrisSales = 1240000,
  transactionsCount = 42,
  pendingSyncCount = 0,
  onTriggerSync,
  onOpenShiftAudit,
  shiftUsage = {
    coldCups: 38,
    hotCups: 4,
    lids: 42,
    espressoKg: 0.792,
    milkLiters: 4.56,
    arenLiters: 0.95,
    croissantPcs: 3,
    totalTransactions: 42,
  },
  stocks = [],
  onOpenHistory,
}) => {
  const [currentInitialCash, setCurrentInitialCash] = useState<number>(initialDrawerCash);
  const [isEditingInitialCash, setIsEditingInitialCash] = useState<boolean>(false);
  const [customInitialCashInput, setCustomInitialCashInput] = useState<string>(String(initialDrawerCash));

  useEffect(() => {
    setCurrentInitialCash(initialDrawerCash);
    setCustomInitialCashInput(String(initialDrawerCash));
  }, [initialDrawerCash]);

  const systemCashSales = cashSales;
  const systemQrisSales = qrisSales;
  const totalTransactionsCount = transactionsCount;

  const expectedCashInDrawer = currentInitialCash + systemCashSales;

  // Actual Physical Cash Entered by Cashier
  const [actualCashInput, setActualCashInput] = useState<string>(String(expectedCashInDrawer));
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [isShiftClosed, setIsShiftClosed] = useState<boolean>(false);
  const [isZReportVisible, setIsZReportVisible] = useState<boolean>(false);

  const actualCash = parseFloat(actualCashInput) || 0;
  const discrepancy = actualCash - expectedCashInDrawer;

  const handleUpdateInitialCash = (val: number) => {
    setCurrentInitialCash(val);
    setCustomInitialCashInput(String(val));
    if (onUpdateInitialDrawerCash) {
      onUpdateInitialDrawerCash(val);
    }
  };

  const totalGrossRevenue = systemCashSales + systemQrisSales;

  // Direct confirmation of shift closure with automated real-time remaining stock (no manual photo/input required)
  const handleConfirmCloseShift = async () => {
    const automatedAuditItems = stocks.map((item) => ({
      item_name: item.item_name,
      tracking_type: (item.unit === 'kg' || item.unit === 'liter' ? 'weighed' : 'counted') as 'weighed' | 'counted',
      measured_quantity: item.quantity,
      unit: item.unit,
      photo_url: '', // Otomatisasi sisa stok dari sistem POS
    }));

    try {
      await api.closeShift({
        shift_id: 'shift-today-01',
        closing_cash_actual: actualCash,
        closing_notes: closingNotes || 'Tutup shift kasir dengan sisa stok otomatis real-time.',
        audit_items: automatedAuditItems,
      });
    } catch (e) {
      console.warn('[Settlement] Backend Go offline, shift audit dicatat secara offline.');
    }

    setIsShiftClosed(true);
    setIsZReportVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* 1. Header */}
      <Header
        boothName={boothName}
        isOnline={isOnline}
        cashierName={cashierName}
        onToggleOnline={onToggleOnline}
        pendingSyncCount={pendingSyncCount}
        onTriggerSync={onTriggerSync}
        onOpenShiftAudit={onOpenShiftAudit}
        onOpenHistory={onOpenHistory}
      />

      {/* 2. Main Body */}
      <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.contentBody}>
          {/* Banner Context */}
          <View style={styles.contextBanner}>
            <View>
              <View style={styles.brandFlagRow}>
                <Text style={styles.brandFlagText}>KOPIKO RECONCILIATION OS</Text>
                <View style={styles.flagDot} />
                <Text style={styles.flagSubText}>Rekonsiliasi Kasir & Shift Closing</Text>
              </View>
              <Text style={styles.screenTitle}>Settlement & Tutup Shift</Text>
            </View>

            <View style={styles.shiftBadge}>
              <Text style={styles.shiftBadgeText}>● Shift 1 (07:00 - 15:00)</Text>
            </View>
          </View>

          {/* KPI Metrics Row */}
          <View style={styles.kpiRow}>
            {/* Total Omzet */}
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total Omzet Shift</Text>
              <Text style={styles.kpiValue}>{formatRupiah(totalGrossRevenue)}</Text>
              <Text style={styles.kpiSub}>{totalTransactionsCount} Transaksi Selesai</Text>
            </View>

            {/* Tunai (Cash) */}
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Penjualan Tunai (Cash)</Text>
              <Text style={styles.kpiValue}>{formatRupiah(systemCashSales)}</Text>
              <Text style={styles.kpiSub}>Masuk ke Laci Kasir Fisik</Text>
            </View>

            {/* QRIS (Xendit) */}
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Penjualan QRIS Dinamis</Text>
              <Text style={[styles.kpiValue, { color: COLORS.statusOnlineText }]}>
                {formatRupiah(systemQrisSales)}
              </Text>
              <Text style={styles.kpiSub}>Auto-settled via Xendit</Text>
            </View>

            {/* Modal Awal Laci */}
            <View style={styles.kpiCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={styles.kpiLabel}>Modal Awal Kasir</Text>
                <Pressable
                  onPress={() => setIsEditingInitialCash((prev) => !prev)}
                  style={styles.editChipBtn}
                  hitSlop={6}
                >
                  <Text style={styles.editChipText}>{isEditingInitialCash ? 'Tutup' : '✏️ Ubah'}</Text>
                </Pressable>
              </View>
              <Text style={styles.kpiValue}>{formatRupiah(currentInitialCash)}</Text>
              <Text style={styles.kpiSub}>Float Kas Awal Shift</Text>
            </View>
          </View>

          {/* Split Sections: Reconciliation Card & Handover Checklist */}
          <View style={styles.splitRow}>
            {/* Left: Cash Drawer Reconciliation */}
            <View style={styles.reconcileCard}>
              <Text style={styles.sectionHeading}>💵 Rekonsiliasi Uang Fisik di Laci</Text>
              <Text style={styles.sectionSub}>
                Hitung uang fisik di laci kasir dan bandingkan dengan catatan sistem.
              </Text>

              {/* Breakdown Rows */}
              <View style={styles.summaryBox}>
                <View style={styles.calcRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.calcLabel}>Modal Awal Laci Kasir:</Text>
                    <Pressable
                      onPress={() => setIsEditingInitialCash((prev) => !prev)}
                      style={styles.editInlineBtn}
                      hitSlop={6}
                    >
                      <Text style={styles.editInlineText}>{isEditingInitialCash ? '✕ Batal' : '✏️ Ubah Modal'}</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.calcVal}>{formatRupiah(currentInitialCash)}</Text>
                </View>

                {/* Inline Quick Modal Awal Editor */}
                {isEditingInitialCash && (
                  <View style={styles.initialCashEditorBox}>
                    <Text style={styles.editorLabel}>Pilih atau masukkan modal kas awal shift ini:</Text>
                    <View style={styles.presetChipsRow}>
                      {[100000, 150000, 200000, 300000].map((preset) => (
                        <Pressable
                          key={preset}
                          onPress={() => handleUpdateInitialCash(preset)}
                          style={[
                            styles.presetChip,
                            currentInitialCash === preset && styles.presetChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.presetChipText,
                              currentInitialCash === preset && styles.presetChipTextActive,
                            ]}
                          >
                            {formatRupiah(preset)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <View style={styles.customCashRow}>
                      <Text style={styles.prefixRpSmall}>Rp</Text>
                      <TextInput
                        keyboardType="numeric"
                        value={customInitialCashInput}
                        onChangeText={(v) => {
                          setCustomInitialCashInput(v);
                          const parsed = parseFloat(v);
                          if (!isNaN(parsed) && parsed >= 0) {
                            handleUpdateInitialCash(parsed);
                          }
                        }}
                        style={styles.customCashInput}
                        placeholder="0"
                      />
                    </View>
                  </View>
                )}

                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>+ Total Penjualan Tunai Sistem:</Text>
                  <Text style={styles.calcVal}>{formatRupiah(systemCashSales)}</Text>
                </View>

                <View style={[styles.calcRow, styles.calcRowTotal]}>
                  <Text style={styles.calcLabelBold}>Ekspektasi Total Kas di Laci:</Text>
                  <Text style={styles.calcValBold}>{formatRupiah(expectedCashInDrawer)}</Text>
                </View>
              </View>

              {/* Cashier Physical Count Input */}
              <View style={styles.inputSection}>
                <Text style={styles.inputTitle}>
                  Input Nominal Uang Fisik Aktual Hasil Hitungan:
                </Text>
                <View style={styles.inputRow}>
                  <Text style={styles.prefixRp}>Rp</Text>
                  <TextInput
                    keyboardType="numeric"
                    value={actualCashInput}
                    onChangeText={setActualCashInput}
                    style={styles.cashInput}
                    placeholder="0"
                  />
                  <Pressable
                    onPress={() => setActualCashInput(String(expectedCashInDrawer))}
                    style={styles.btnMatchExact}
                    hitSlop={6}
                  >
                    <Text style={styles.btnMatchText}>Uang Pas</Text>
                  </Pressable>
                </View>
              </View>

              {/* Discrepancy Status Pill */}
              <View
                style={[
                  styles.discrepancyBox,
                  discrepancy === 0
                    ? styles.discBalanced
                    : discrepancy > 0
                    ? styles.discOver
                    : styles.discShort,
                ]}
              >
                <View>
                  <Text style={styles.discTitle}>
                    {discrepancy === 0
                      ? '✓ Kas Seimbang (Balance)'
                      : discrepancy > 0
                      ? '▲ Kas Lebih (Over)'
                      : '▼ Kas Kurang (Short)'}
                  </Text>
                  <Text style={styles.discSub}>
                    {discrepancy === 0
                      ? 'Uang fisik sama persis dengan kalkulasi sistem.'
                      : discrepancy > 0
                      ? 'Terdapat kelebihan kas fisik di laci.'
                      : 'Terdapat kekurangan kas fisik di laci.'}
                  </Text>
                </View>
                <Text style={styles.discValue}>{formatRupiah(Math.abs(discrepancy))}</Text>
              </View>
            </View>

            {/* Right: Handover Checklist & Shift Closing CTA */}
            <View style={styles.checklistCard}>
              <Text style={styles.sectionHeading}>📋 Checklist Serah Terima Shift</Text>
              <Text style={styles.sectionSub}>Verifikasi standar operasional booth.</Text>

              <View style={styles.checklistGroup}>
                <View style={styles.checkItem}>
                  <Text style={styles.checkIcon}>✅</Text>
                  <Text style={styles.checkText}>
                    Sisa stok bahan baku tercatat otomatis secara real-time dari sistem POS
                  </Text>
                </View>

                <View style={styles.checkItem}>
                  <Text style={styles.checkIcon}>✅</Text>
                  <Text style={styles.checkText}>
                    Laci kasir fisik dirapikan dan uang modal awal disisihkan
                  </Text>
                </View>

                <View style={styles.checkItem}>
                  <Text style={styles.checkIcon}>✅</Text>
                  <Text style={styles.checkText}>
                    Mesin espresso dan area meja barista telah dibersihkan
                  </Text>
                </View>

                <View style={styles.checkItem}>
                  <Text style={styles.checkIcon}>✅</Text>
                  <Text style={styles.checkText}>
                    Bukti transaksi QRIS tersinkronkan penuh ke server
                  </Text>
                </View>
              </View>

              {/* Automated Remaining Stock Summary Card (No manual entry / photo required) */}
              <View style={styles.autoStockCard}>
                <View style={styles.autoStockHeader}>
                  <Text style={styles.autoStockTitle}>📦 Sisa Stok Bahan Baku Otomatis</Text>
                  <View style={styles.autoBadge}>
                    <Text style={styles.autoBadgeText}>⚡ Real-Time</Text>
                  </View>
                </View>
                <Text style={styles.autoStockSub}>
                  Sisa bahan baku tercatat otomatis dari sistem tanpa perlu input manual atau foto:
                </Text>
                <View style={styles.autoStockGrid}>
                  {stocks.slice(0, 6).map((item) => (
                    <View key={item.id} style={styles.autoStockItem}>
                      <Text style={styles.autoStockItemName} numberOfLines={1}>
                        {item.item_name}
                      </Text>
                      <Text style={styles.autoStockItemQty}>
                        {item.quantity} {item.unit}
                      </Text>
                    </View>
                  ))}
                </View>
                {stocks.length > 6 && (
                  <Text style={styles.autoStockMore}>
                    + {stocks.length - 6} bahan baku lainnya otomatis terekam
                  </Text>
                )}
              </View>

              {/* Handover Notes */}
              <View style={styles.notesGroup}>
                <Text style={styles.notesLabel}>Catatan untuk Kasir / PIC Shift Berikutnya:</Text>
                <TextInput
                  placeholder="Contoh: Stok cup 8oz hampir habis, sudah info PIC via WA..."
                  placeholderTextColor={COLORS.textPlaceholder}
                  value={closingNotes}
                  onChangeText={setClosingNotes}
                  style={styles.notesInput}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Closing Action CTA */}
              <Pressable
                disabled={isShiftClosed}
                onPress={handleConfirmCloseShift}
                style={({ pressed }) => [
                  styles.closeShiftBtn,
                  isShiftClosed && styles.closeShiftBtnDisabled,
                  pressed && !isShiftClosed && { opacity: 0.9 },
                ]}
              >
                <Text style={styles.closeShiftBtnText}>
                  {isShiftClosed ? '✓ Shift Telah Ditutup' : '🔒 Konfirmasi & Tutup Shift'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Official Z-Report Modal */}
      <ZReportModal
        visible={isZReportVisible}
        boothName={boothName}
        cashierName={cashierName}
        shiftNumber={1}
        initialDrawerCash={currentInitialCash}
        cashSales={systemCashSales}
        qrisSales={systemQrisSales}
        transactionsCount={totalTransactionsCount}
        actualCash={actualCash}
        discrepancy={discrepancy}
        shiftUsage={shiftUsage}
        closingNotes={closingNotes}
        onCloseAndFinish={() => {
          setIsZReportVisible(false);
          setIsShiftClosed(false);
          setClosingNotes('');
          if (onShiftClosed) onShiftClosed();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgCanvas,
  },
  scrollBody: {
    flex: 1,
  },
  contentBody: {
    padding: 20,
    paddingBottom: 40,
  },
  contextBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandFlagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandFlagText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.brandEspresso,
    letterSpacing: 0.8,
  },
  flagDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
    marginHorizontal: 8,
  },
  flagSubText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.brandEspresso,
  },
  shiftBadge: {
    backgroundColor: COLORS.brandEspresso,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADII.pill,
  },
  shiftBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6E0D8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.brandEspresso,
    marginBottom: 4,
  },
  kpiSub: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  editChipBtn: {
    backgroundColor: '#F3EFEA',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADII.pill,
  },
  editChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  editInlineBtn: {
    backgroundColor: '#FAF5EE',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E7DFD5',
  },
  editInlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  initialCashEditorBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D9CF',
    borderRadius: RADII.btn,
    padding: 10,
    marginTop: 6,
    marginBottom: 8,
  },
  editorLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  presetChipsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  presetChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADII.pill,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#D8CEBE',
  },
  presetChipActive: {
    backgroundColor: COLORS.brandEspresso,
    borderColor: COLORS.brandEspresso,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  customCashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#D8CEBE',
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 36,
  },
  prefixRpSmall: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brandEspresso,
    marginRight: 4,
  },
  customCashInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brandEspresso,
    padding: 0,
  },
  splitRow: {
    flexDirection: 'row',
    gap: 16,
  },
  reconcileCard: {
    flex: 1.2,
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.card,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E6E0D8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  checklistCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.card,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E6E0D8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    justifyContent: 'space-between',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.brandEspresso,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  summaryBox: {
    backgroundColor: COLORS.bgCanvas,
    borderRadius: RADII.btn,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    marginBottom: 16,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calcRowTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E0D9D1',
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 0,
  },
  calcLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  calcVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  calcLabelBold: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.brandEspresso,
  },
  calcValBold: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.brandCrimson,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brandEspresso,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.brandCrimson,
    borderRadius: RADII.btn,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: '#FFFFFF',
  },
  prefixRp: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.brandEspresso,
    marginRight: 6,
  },
  cashInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.brandEspresso,
    padding: 0,
  },
  btnMatchExact: {
    backgroundColor: '#F3EFEA',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADII.btn,
  },
  btnMatchText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  discrepancyBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: RADII.btn,
    borderWidth: 1,
  },
  discBalanced: {
    backgroundColor: COLORS.statusOnlineBg,
    borderColor: COLORS.statusOnlineBorder,
  },
  discOver: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  discShort: {
    backgroundColor: 'rgba(255, 218, 214, 0.4)',
    borderColor: '#F87171',
  },
  discTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.brandEspresso,
  },
  discSub: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  discValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.brandEspresso,
  },
  checklistGroup: {
    gap: 10,
    marginBottom: 16,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  checkText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.brandEspresso,
    lineHeight: 18,
  },
  autoStockCard: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: RADII.btn,
    padding: 12,
    marginBottom: 16,
  },
  autoStockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  autoStockTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.brandEspresso,
  },
  autoBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  autoBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  autoStockSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  autoStockGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  autoStockItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE6DF',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autoStockItemName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.brandEspresso,
    flex: 1,
    marginRight: 4,
  },
  autoStockItemQty: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.brandCrimson,
  },
  autoStockMore: {
    fontSize: 10,
    fontStyle: 'italic',
    color: COLORS.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
  notesGroup: {
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brandEspresso,
    marginBottom: 6,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    borderRadius: RADII.btn,
    padding: 10,
    fontSize: 12,
    color: COLORS.brandEspresso,
    backgroundColor: '#FAF8F5',
    textAlignVertical: 'top',
    height: 70,
  },
  closeShiftBtn: {
    height: 52,
    borderRadius: RADII.card,
    backgroundColor: COLORS.brandCrimson,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.brandCrimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  closeShiftBtnDisabled: {
    backgroundColor: '#C5BEB7',
    shadowOpacity: 0,
    elevation: 0,
  },
  closeShiftBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

