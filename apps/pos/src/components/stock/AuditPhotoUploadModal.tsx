import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { COLORS, RADII, formatRupiah } from '../../constants/theme';
import { BoothStockRecord } from '../../types/stock';

export interface AuditItemState {
  itemName: string;
  trackingType: 'weighed' | 'counted';
  unit: string;
  measuredQuantity: string;
}

export interface AuditPhotoUploadModalProps {
  visible: boolean;
  stage: 'opening' | 'closing';
  cashierName: string;
  boothName: string;
  stocks?: BoothStockRecord[];
  initialCashDrawer?: number;
  onClose: () => void;
  onSubmitAudit: (data: {
    cashDrawer: number;
    auditItems: Array<{
      item_name: string;
      tracking_type: 'weighed' | 'counted';
      measured_quantity: number;
      unit: string;
      photo_url: string;
    }>;
    notes?: string;
  }) => Promise<void>;
}

const DEFAULT_AUDIT_ITEMS: AuditItemState[] = [
  { itemName: 'Kopiko Espresso Blend', trackingType: 'weighed', unit: 'kg', measuredQuantity: '5.0' },
  { itemName: 'Aren Organic Liquid', trackingType: 'weighed', unit: 'kg', measuredQuantity: '3.0' },
  { itemName: 'Fresh Milk Greenfields', trackingType: 'weighed', unit: 'liter', measuredQuantity: '8.0' },
  { itemName: 'Cold Cup 12oz PET', trackingType: 'counted', unit: 'pcs', measuredQuantity: '100' },
  { itemName: 'Hot Cup 8oz Paper', trackingType: 'counted', unit: 'pcs', measuredQuantity: '50' },
  { itemName: 'Cup Lids & Caps', trackingType: 'counted', unit: 'pcs', measuredQuantity: '120' },
];

export const AuditPhotoUploadModal: React.FC<AuditPhotoUploadModalProps> = ({
  visible,
  stage,
  cashierName,
  boothName,
  stocks = [],
  initialCashDrawer,
  onClose,
  onSubmitAudit,
}) => {
  const isOpening = stage === 'opening';
  const defaultCash = initialCashDrawer !== undefined ? String(initialCashDrawer) : isOpening ? '200000' : '954000';
  const [cashDrawer, setCashDrawer] = useState<string>(defaultCash);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize audit items from stocks (automation dari sisa shift sebelumnya)
  const mapStocksToAuditItems = (items: BoothStockRecord[]): AuditItemState[] => {
    if (items && items.length > 0) {
      return items.map((item) => ({
        itemName: item.item_name,
        trackingType: (item.unit === 'kg' || item.unit === 'liter' ? 'weighed' : 'counted') as 'weighed' | 'counted',
        unit: item.unit,
        measuredQuantity: String(item.quantity),
      }));
    }
    return DEFAULT_AUDIT_ITEMS;
  };

  const [auditItems, setAuditItems] = useState<AuditItemState[]>(() => mapStocksToAuditItems(stocks));

  // Sync state whenever modal is opened or stocks/initialCashDrawer update
  useEffect(() => {
    if (visible) {
      if (initialCashDrawer !== undefined) {
        setCashDrawer(String(initialCashDrawer));
      }
      if (stocks && stocks.length > 0) {
        setAuditItems(mapStocksToAuditItems(stocks));
      }
    }
  }, [visible, stocks, initialCashDrawer]);

  const handleUpdateQuantity = (index: number, val: string) => {
    setAuditItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], measuredQuantity: val };
      return updated;
    });
  };

  const handleSubmit = async () => {
    const cashVal = parseFloat(cashDrawer) || 0;
    if (cashVal < 0) {
      Alert.alert('Error', 'Nominal kas laci tidak valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitAudit({
        cashDrawer: cashVal,
        auditItems: auditItems.map((item) => ({
          item_name: item.itemName,
          tracking_type: item.trackingType,
          measured_quantity: parseFloat(item.measuredQuantity) || 0,
          unit: item.unit,
          photo_url: '', // Tanpa input gambar
        })),
        notes: notes.trim() || undefined,
      });
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert('Gagal Simpan Audit', err.message || 'Terjadi kesalahan');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.stageBadge,
                    isOpening ? styles.stageBadgeOpen : styles.stageBadgeClose,
                  ]}
                >
                  <Text style={styles.stageBadgeText}>
                    {isOpening ? '● VERIFIKASI BUKA SHIFT' : '● AUDIT SISA STOK SHIFT'}
                  </Text>
                </View>
                <Text style={styles.boothTag}>📍 {boothName}</Text>
              </View>
              <Text style={styles.title}>
                {isOpening ? 'Keterangan Sisa Stok & Buka Shift' : 'Catatan Stok Tutup Shift'}
              </Text>
              <Text style={styles.subtitle}>
                Kasir: <Text style={{ fontWeight: '700', color: COLORS.brandEspresso }}>{cashierName}</Text> • Sisa stok otomatis tersinkronisasi dari sistem POS.
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* 1. Cash Drawer Float Section */}
            <View style={styles.cashSection}>
              <Text style={styles.sectionLabel}>
                {isOpening ? '💵 MODAL AWAL LACI KASIR (FLOAT):' : '💵 SALDO UANG FISIK DI LACI:'}
              </Text>

              {/* Quick Preset Buttons for Cash Drawer */}
              {isOpening && (
                <View style={styles.presetChipsRow}>
                  {[100000, 150000, 200000, 300000].map((preset) => (
                    <Pressable
                      key={preset}
                      onPress={() => setCashDrawer(String(preset))}
                      style={[
                        styles.presetChip,
                        parseFloat(cashDrawer) === preset && styles.presetChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          parseFloat(cashDrawer) === preset && styles.presetChipTextActive,
                        ]}
                      >
                        {formatRupiah(preset)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <View style={styles.cashInputRow}>
                <Text style={styles.rpPrefix}>Rp</Text>
                <TextInput
                  keyboardType="numeric"
                  value={cashDrawer}
                  onChangeText={setCashDrawer}
                  style={styles.cashInput}
                  placeholder="0"
                />
              </View>
              <Text style={styles.cashHelp}>
                {isOpening
                  ? 'Modal awal kas laci kasir untuk uang kembalian shift (misal Rp 150.000 atau Rp 300.000) agar perhitungan selisih kas di settlement presisi.'
                  : 'Hitung dan masukkan seluruh uang tunai fisik yang ada di dalam laci kasir saat ini.'}
              </Text>
            </View>

            {/* 2. Automated Stock Status Section */}
            <View style={styles.stockSection}>
              {/* Automation Notification Banner */}
              <View style={styles.autoStockBanner}>
                <View style={styles.autoStockHeader}>
                  <Text style={styles.autoStockTitle}>📦 Keterangan Sisa Stok Buka Shift</Text>
                  <View style={styles.autoStockPill}>
                    <Text style={styles.autoStockPillText}>✓ Otomatis dari Shift Lalu</Text>
                  </View>
                </View>
                <Text style={styles.autoStockDesc}>
                  Daftar di bawah adalah sisa bahan baku & packaging riil saat shift sebelumnya selesai. Angka dapat disesuaikan kasir jika terdapat selisih fisik riil di booth.
                </Text>
              </View>

              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.colHeader, { flex: 2.2 }]}>Nama Bahan Baku / Packaging</Text>
                <Text style={[styles.colHeader, { flex: 1.2, textAlign: 'center' }]}>Tipe Kontrol</Text>
                <Text style={[styles.colHeader, { flex: 1.4, textAlign: 'right' }]}>Sisa Stok Buka Shift</Text>
              </View>

              {/* Stock List Rows */}
              <View style={styles.tableBody}>
                {auditItems.map((item, index) => {
                  const qtyNum = parseFloat(item.measuredQuantity) || 0;
                  const isLow = qtyNum <= (item.unit === 'kg' ? 1.0 : item.unit === 'liter' ? 1.0 : 20);

                  return (
                    <View
                      key={item.itemName}
                      style={[styles.stockRow, index % 2 === 1 && styles.stockRowAlt]}
                    >
                      <View style={{ flex: 2.2 }}>
                        <Text style={styles.rowItemName}>{item.itemName}</Text>
                        <Text style={[styles.rowItemStatus, isLow ? styles.statusLow : styles.statusSafe]}>
                          {isLow ? '⚠️ Sisa Menipis' : '✓ Stok Siap Jual'}
                        </Text>
                      </View>

                      <View style={{ flex: 1.2, alignItems: 'center' }}>
                        <View style={styles.typeBadge}>
                          <Text style={styles.typeBadgeText}>
                            {item.trackingType === 'weighed' ? '⚖️ Ditimbang' : '🔢 Dihitung'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.qtyContainer}>
                        <TextInput
                          keyboardType="numeric"
                          value={item.measuredQuantity}
                          onChangeText={(v) => handleUpdateQuantity(index, v)}
                          style={styles.qtyInput}
                        />
                        <Text style={styles.unitText}>{item.unit}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* 3. Shift Notes & Stock Discrepancy Remarks */}
            <View style={styles.notesSection}>
              <Text style={styles.sectionLabel}>📝 CATATAN KONDISI / SISA STOK SHIFT (OPSIONAL):</Text>
              <TextInput
                placeholder="Tulis catatan jika ada bahan yang susut, habis, atau kondisi booth saat buka shift..."
                value={notes}
                onChangeText={setNotes}
                style={styles.notesInput}
                multiline
                numberOfLines={2}
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Batalkan</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.confirmBtn, isSubmitting && { opacity: 0.6 }]}
            >
              <Text style={styles.confirmText}>
                {isSubmitting
                  ? 'Menyimpan Shift...'
                  : isOpening
                  ? '✓ Konfirmasi & Buka Shift'
                  : '✓ Konfirmasi & Tutup Shift'}
              </Text>
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
    backgroundColor: 'rgba(29, 15, 10, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: 680,
    maxHeight: '94%',
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.card,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  stageBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  stageBadgeOpen: {
    backgroundColor: '#DCFCE7',
  },
  stageBadgeClose: {
    backgroundColor: '#FEF3C7',
  },
  stageBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  boothTag: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.brandEspresso,
  },
  subtitle: {
    fontSize: 12,
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
  scrollBody: {
    maxHeight: 520,
  },
  cashSection: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E7E0D8',
    borderRadius: RADII.btn,
    padding: 14,
    marginBottom: 16,
  },
  presetChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  presetChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADII.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5CCC1',
  },
  presetChipActive: {
    backgroundColor: COLORS.brandEspresso,
    borderColor: COLORS.brandEspresso,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.brandEspresso,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cashInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.brandEspresso,
    borderRadius: RADII.btn,
    paddingHorizontal: 12,
    height: 44,
  },
  rpPrefix: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.brandEspresso,
    marginRight: 6,
  },
  cashInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.brandEspresso,
  },
  cashHelp: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  stockSection: {
    marginBottom: 16,
  },
  autoStockBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: RADII.btn,
    padding: 12,
    marginBottom: 12,
  },
  autoStockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  autoStockTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  autoStockPill: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: RADII.pill,
  },
  autoStockPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  autoStockDesc: {
    fontSize: 11,
    color: '#14532D',
    lineHeight: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3EFEA',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  colHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.brandEspresso,
    letterSpacing: 0.3,
  },
  tableBody: {
    borderWidth: 1,
    borderColor: '#E8E2D9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE6',
    backgroundColor: '#FFFFFF',
  },
  stockRowAlt: {
    backgroundColor: '#FAFAF8',
  },
  rowItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  rowItemStatus: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  statusSafe: {
    color: '#166534',
  },
  statusLow: {
    color: '#B45309',
  },
  typeBadge: {
    backgroundColor: '#F3EFEA',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.brandEspresso,
  },
  qtyContainer: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  qtyInput: {
    width: 68,
    height: 34,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.brandEspresso,
    backgroundColor: '#FFFFFF',
    padding: 0,
  },
  unitText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    minWidth: 28,
  },
  notesSection: {
    marginBottom: 16,
  },
  notesInput: {
    height: 52,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADII.btn,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: COLORS.brandEspresso,
    backgroundColor: '#FAF8F5',
    textAlignVertical: 'top',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
  confirmText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
