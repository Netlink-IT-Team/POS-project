import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { BoothStockRecord } from '../../types/stock';
import { COLORS, RADII } from '../../constants/theme';

export interface StockAdjustModalProps {
  visible: boolean;
  item: BoothStockRecord | null;
  allItems?: BoothStockRecord[];
  onClose: () => void;
  onSave: (itemId: string, newQuantity: number, reason: string) => void;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  visible,
  item,
  allItems = [],
  onClose,
  onSave,
}) => {
  const [selectedItem, setSelectedItem] = useState<BoothStockRecord | null>(item);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [unitOverride, setUnitOverride] = useState<string>('');
  const [mode, setMode] = useState<'add' | 'recount' | 'waste'>('add');
  const [inputValue, setInputValue] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (visible) {
      const active = item || (allItems.length > 0 ? allItems[0] : null);
      setSelectedItem(active);
      setUnitOverride(active ? active.unit : 'pcs');
      setInputValue('');
      setNotes('');
      setMode('add');
      setIsDropdownOpen(false);
    }
  }, [visible, item, allItems]);

  const currentItem = selectedItem || item;
  if (!currentItem) return null;

  const activeUnit = unitOverride || currentItem.unit;
  const numVal = parseFloat(inputValue.replace(',', '.')) || 0;
  const isOutOfStock = currentItem.quantity === 0;
  const isLowStock = currentItem.quantity <= currentItem.min_threshold;

  // Preset chips based on active unit (pcs, kg, liter, galon)
  const getPresets = (): number[] => {
    if (activeUnit === 'pcs') return [10, 25, 50, 100];
    if (activeUnit === 'kg' || activeUnit === 'liter') return [1, 2, 5, 10];
    if (activeUnit === 'galon' || activeUnit === 'pack' || activeUnit === 'roll') return [1, 2, 4, 8];
    return [1, 5, 10, 20];
  };

  const stepIncrement = activeUnit === 'pcs' ? 5 : 1;

  const handleAddPreset = (amount: number) => {
    const next = numVal + amount;
    setInputValue(String(next));
  };

  const handleStep = (delta: number) => {
    const next = Math.max(0, Math.round((numVal + delta) * 10) / 10);
    setInputValue(next > 0 ? String(next) : '');
  };

  // Live Calculated Quantity
  let calculatedQty = currentItem.quantity;
  if (mode === 'add') {
    calculatedQty = currentItem.quantity + numVal;
  } else if (mode === 'recount') {
    calculatedQty = numVal;
  } else if (mode === 'waste') {
    calculatedQty = Math.max(0, currentItem.quantity - numVal);
  }

  const handleConfirm = () => {
    const val = parseFloat(inputValue.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      Alert.alert('Input Tidak Valid', 'Masukkan nominal angka yang valid dan lebih dari 0.');
      return;
    }

    onSave(
      currentItem.id,
      calculatedQty,
      notes ||
        (mode === 'add'
          ? `Penerimaan Restock (${val} ${activeUnit})`
          : mode === 'waste'
          ? 'Stok Rusak/Waste'
          : 'Audit Opname Fisik')
    );
    onClose();
  };

  const quickNotes = [
    'Kiriman DC Gudang',
    'Restock Rutin Shift',
    'Pembelian Darurat',
    'Penyesuaian Fisik',
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'powder':
        return '☕';
      case 'milk':
        return '🥛';
      case 'syrup':
        return '🍯';
      case 'galon':
        return '🚰';
      case 'packaging':
      case 'lid':
        return '📦';
      case 'sealer':
        return '🏷️';
      default:
        return '📋';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* 1. Modal Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {mode === 'add' ? '📦 Input Restock Bahan Masuk' : '⚙️ Penyesuaian Stok'}
              </Text>
              <Text style={styles.subtitle}>Pilih bahan baku dan masukkan kuantitas barang yang diterima</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* 2. Raw Material Selector / Dropdown Trigger */}
          <View style={styles.selectorSection}>
            <Text style={styles.sectionLabel}>PILIH BAHAN BAKU YANG AKAN DI-RESTOCK:</Text>
            <Pressable
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}
              style={styles.dropdownTrigger}
            >
              <View style={styles.dropdownLeft}>
                <Text style={styles.dropdownIcon}>{getCategoryIcon(currentItem.category)}</Text>
                <View>
                  <Text style={styles.dropdownItemTitle}>{currentItem.item_name}</Text>
                  <Text style={styles.dropdownItemSub}>
                    SKU: {currentItem.sku} • Satuan Default:{' '}
                    <Text style={{ fontWeight: '800', color: COLORS.brandCrimson }}>
                      {currentItem.unit.toUpperCase()}
                    </Text>{' '}
                    • Sisa: {currentItem.quantity.toFixed(1)} {currentItem.unit}
                  </Text>
                </View>
              </View>
              <View style={styles.dropdownActionBadge}>
                <Text style={styles.dropdownActionText}>
                  {isDropdownOpen ? '▲ Tutup Pilihan' : '▼ Ganti Bahan Baku'}
                </Text>
              </View>
            </Pressable>

            {/* Dropdown Options List */}
            {isDropdownOpen && (
              <View style={styles.dropdownContainer}>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  {(allItems.length > 0 ? allItems : [currentItem]).map((stock) => {
                    const isSelected = stock.id === currentItem.id;
                    const stockLow = stock.quantity <= stock.min_threshold;
                    return (
                      <Pressable
                        key={stock.id}
                        onPress={() => {
                          setSelectedItem(stock);
                          setUnitOverride(stock.unit);
                          setInputValue('');
                          setIsDropdownOpen(false);
                        }}
                        style={[
                          styles.dropdownRow,
                          isSelected && styles.dropdownRowSelected,
                        ]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <Text style={{ fontSize: 18 }}>{getCategoryIcon(stock.category)}</Text>
                          <View>
                            <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>
                              {stock.item_name}
                            </Text>
                            <Text style={styles.optionSub}>
                              SKU: {stock.sku} • Sisa: {stock.quantity.toFixed(1)} {stock.unit} (Min: {stock.min_threshold.toFixed(1)})
                            </Text>
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <View
                            style={[
                              styles.unitBadgeSmall,
                              isSelected && { backgroundColor: COLORS.brandCrimson },
                            ]}
                          >
                            <Text
                              style={[
                                styles.unitBadgeSmallText,
                                isSelected && { color: '#FFFFFF' },
                              ]}
                            >
                              {stock.unit}
                            </Text>
                          </View>
                          {stockLow && (
                            <Text style={styles.lowStockWarningText}>● Perlu Restock</Text>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* 3. Stock Status Banner */}
          <View
            style={[
              styles.stockBanner,
              isOutOfStock
                ? styles.bannerDanger
                : isLowStock
                ? styles.bannerWarning
                : styles.bannerSafe,
            ]}
          >
            <View>
              <Text style={styles.bannerSubTitle}>SISA STOK AKTUAL</Text>
              <Text style={styles.bannerMainVal}>
                {currentItem.quantity.toFixed(1)}{' '}
                <Text style={{ fontSize: 13, fontWeight: '700' }}>{activeUnit}</Text>
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.bannerSubTitle}>BATAS MINIMAL REORDER</Text>
              <Text style={styles.bannerThresholdVal}>
                {currentItem.min_threshold.toFixed(1)} {activeUnit}
              </Text>
              <Text
                style={[
                  styles.statusTag,
                  isOutOfStock
                    ? styles.tagDanger
                    : isLowStock
                    ? styles.tagWarning
                    : styles.tagSafe,
                ]}
              >
                {isOutOfStock
                  ? '● Stok Habis'
                  : isLowStock
                  ? '● Melewati Batas Minimum'
                  : '● Stok Aman'}
              </Text>
            </View>
          </View>

          {/* 4. Unit Selector (Pilihan Satuan: pcs, kg, liter, galon) */}
          <View style={styles.unitSelectorSection}>
            <Text style={styles.sectionLabel}>PILIHAN JENIS SATUAN / BERAT:</Text>
            <View style={styles.unitChipsRow}>
              {[
                { id: 'pcs', label: 'pcs (Cup/Lid/Item)' },
                { id: 'kg', label: 'kg (Bubuk/Kopi)' },
                { id: 'liter', label: 'liter (Susu/Sirup)' },
                { id: 'galon', label: 'galon (Air Mineral)' },
                { id: 'pack', label: 'pack (Biskuit)' },
                { id: 'roll', label: 'roll (Sealer)' },
              ].map((u) => {
                const isSelected = activeUnit === u.id;
                return (
                  <Pressable
                    key={u.id}
                    onPress={() => setUnitOverride(u.id)}
                    style={[styles.unitChip, isSelected && styles.unitChipSelected]}
                  >
                    <Text
                      style={[
                        styles.unitChipText,
                        isSelected && styles.unitChipTextSelected,
                      ]}
                    >
                      {u.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 5. Mode Tabs */}
          <View style={styles.modeTabsRow}>
            <Pressable
              onPress={() => setMode('add')}
              style={[styles.modeTab, mode === 'add' && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, mode === 'add' && styles.modeTabTextActive]}>
                + Restock Masuk
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setMode('recount')}
              style={[styles.modeTab, mode === 'recount' && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, mode === 'recount' && styles.modeTabTextActive]}>
                ⚖️ Timbang Ulang
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setMode('waste')}
              style={[styles.modeTab, mode === 'waste' && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, mode === 'waste' && styles.modeTabTextActive]}>
                🗑️ Rusak / Buang
              </Text>
            </Pressable>
          </View>

          {/* 6. Stepper & Numeric Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {mode === 'add'
                ? `Jumlah Restock Masuk (${activeUnit}):`
                : mode === 'recount'
                ? `Kuantitas Fisik Riil (${activeUnit}):`
                : `Jumlah Rusak / Terbuang (${activeUnit}):`}
            </Text>

            <View style={styles.stepperInputRow}>
              <Pressable
                onPress={() => handleStep(-stepIncrement)}
                style={styles.stepBtn}
                hitSlop={6}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </Pressable>

              <TextInput
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.textPlaceholder}
                value={inputValue}
                onChangeText={setInputValue}
                style={styles.textInputMain}
                autoFocus
              />

              <Pressable
                onPress={() => handleStep(stepIncrement)}
                style={styles.stepBtn}
                hitSlop={6}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </Pressable>
            </View>

            {/* Quick Increment Chips */}
            {mode === 'add' && (
              <View style={styles.presetChipsRow}>
                <Text style={styles.presetLabel}>Tambah Cepat:</Text>
                {getPresets().map((preset) => (
                  <Pressable
                    key={preset}
                    onPress={() => handleAddPreset(preset)}
                    style={styles.presetChip}
                  >
                    <Text style={styles.presetChipText}>
                      +{preset} {activeUnit}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* 7. Live Calculation Preview Box */}
          <View style={styles.calcPreviewBox}>
            <View style={styles.calcPreviewHeader}>
              <Text style={styles.calcPreviewTitle}>📊 HASIL PERHITUNGAN STOK BARU</Text>
              <Text style={styles.calcPreviewResult}>
                {calculatedQty.toFixed(1)} {activeUnit}
              </Text>
            </View>
            <Text style={styles.calcPreviewSub}>
              {mode === 'add'
                ? `Sisa saat ini (${currentItem.quantity.toFixed(1)}) + Masuk (+${numVal.toFixed(1)}) = Total baru: ${calculatedQty.toFixed(1)} ${activeUnit}`
                : mode === 'recount'
                ? `Stok diubah dari ${currentItem.quantity.toFixed(1)} menjadi ${calculatedQty.toFixed(1)} ${activeUnit}`
                : `Sisa saat ini (${currentItem.quantity.toFixed(1)}) - Dibuang (-${numVal.toFixed(1)}) = Sisa baru: ${calculatedQty.toFixed(1)} ${activeUnit}`}
            </Text>
            {mode === 'add' && calculatedQty > currentItem.min_threshold && isLowStock && (
              <Text style={styles.recoverySuccessText}>
                ✅ Restock ini mencukupi dan mengembalikan stok ke batas aman!
              </Text>
            )}
          </View>

          {/* 8. Notes & Quick Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Catatan / Dokumen Pengiriman:</Text>
            <TextInput
              placeholder="Contoh: No. Surat Jalan DC #4, Pengiriman Supplier, dll."
              placeholderTextColor={COLORS.textPlaceholder}
              value={notes}
              onChangeText={setNotes}
              style={styles.textInputNotes}
            />
            <View style={styles.quickNotesRow}>
              {quickNotes.map((qNote) => (
                <Pressable
                  key={qNote}
                  onPress={() => setNotes(qNote)}
                  style={[styles.quickNoteChip, notes === qNote && styles.quickNoteChipActive]}
                >
                  <Text
                    style={[
                      styles.quickNoteText,
                      notes === qNote && styles.quickNoteTextActive,
                    ]}
                  >
                    {qNote}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 9. Footer Actions */}
          <View style={styles.footerRow}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Batalkan</Text>
            </Pressable>
            <Pressable onPress={handleConfirm} style={styles.confirmBtn}>
              <Text style={styles.confirmText}>
                {mode === 'add'
                  ? `Simpan Restock (+${numVal} ${activeUnit})`
                  : 'Simpan Perubahan Stok'}
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
    backgroundColor: 'rgba(29, 15, 10, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: 540,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.card,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
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
  selectorSection: {
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: RADII.btn,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dropdownIcon: {
    fontSize: 22,
  },
  dropdownItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.brandEspresso,
  },
  dropdownItemSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 1,
  },
  dropdownActionBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
  },
  dropdownActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  dropdownContainer: {
    marginTop: 4,
    maxHeight: 180,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADII.btn,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownScroll: {
    padding: 4,
  },
  dropdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownRowSelected: {
    backgroundColor: '#FEF2F2',
  },
  optionName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  optionNameSelected: {
    color: COLORS.brandCrimson,
  },
  optionSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  unitBadgeSmall: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  unitBadgeSmallText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  lowStockWarningText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
    marginTop: 2,
  },
  stockBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: RADII.btn,
    marginBottom: 10,
    borderWidth: 1,
  },
  bannerDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  bannerWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  bannerSafe: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  bannerSubTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  bannerMainVal: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.brandEspresso,
  },
  bannerThresholdVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  statusTag: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  tagDanger: {
    color: '#DC2626',
  },
  tagWarning: {
    color: '#D97706',
  },
  tagSafe: {
    color: '#16A34A',
  },
  unitSelectorSection: {
    marginBottom: 10,
  },
  unitChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  unitChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  unitChipSelected: {
    backgroundColor: COLORS.brandEspresso,
    borderColor: COLORS.brandEspresso,
  },
  unitChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  unitChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modeTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: RADII.btn,
    backgroundColor: '#F5F2EB',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2DBD3',
  },
  modeTabActive: {
    backgroundColor: COLORS.brandCrimson,
    borderColor: COLORS.brandCrimson,
  },
  modeTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brandEspresso,
    marginBottom: 4,
  },
  stepperInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 42,
    height: 42,
    borderRadius: RADII.btn,
    backgroundColor: '#F3EFEA',
    borderWidth: 1,
    borderColor: '#E2DBD3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.brandEspresso,
    lineHeight: 24,
  },
  textInputMain: {
    flex: 1,
    height: 42,
    borderWidth: 1.5,
    borderColor: COLORS.brandEspresso,
    borderRadius: RADII.btn,
    paddingHorizontal: 12,
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.brandEspresso,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
  },
  presetChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  presetLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  presetChip: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 999,
  },
  presetChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C2410C',
  },
  calcPreviewBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: RADII.btn,
    padding: 10,
    marginBottom: 10,
  },
  calcPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  calcPreviewTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  calcPreviewResult: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.brandEspresso,
  },
  calcPreviewSub: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },
  recoverySuccessText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
    marginTop: 2,
  },
  textInputNotes: {
    height: 38,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    borderRadius: RADII.btn,
    paddingHorizontal: 10,
    fontSize: 12,
    color: COLORS.brandEspresso,
    backgroundColor: '#FFFFFF',
  },
  quickNotesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  quickNoteChip: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickNoteChipActive: {
    backgroundColor: '#E2E8F0',
    borderColor: '#94A3B8',
  },
  quickNoteText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#475569',
  },
  quickNoteTextActive: {
    color: COLORS.brandEspresso,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: RADII.btn,
    backgroundColor: '#EFECE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  confirmBtn: {
    flex: 2,
    height: 44,
    borderRadius: RADII.btn,
    backgroundColor: COLORS.brandCrimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
