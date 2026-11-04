import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, Pressable, TextInput, Alert } from 'react-native';
import { BoothStockRecord } from '../../types/stock';
import { COLORS, RADII } from '../../constants/theme';

export interface StockAdjustModalProps {
  visible: boolean;
  item: BoothStockRecord | null;
  onClose: () => void;
  onSave: (itemId: string, newQuantity: number, reason: string) => void;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  visible,
  item,
  onClose,
  onSave,
}) => {
  const [mode, setMode] = useState<'add' | 'recount' | 'waste'>('add');
  const [inputValue, setInputValue] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (visible && item) {
      setInputValue('');
      setNotes('');
      setMode('add');
    }
  }, [visible, item]);

  if (!item) return null;

  const handleConfirm = () => {
    const val = parseFloat(inputValue);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Input Tidak Valid', 'Masukkan nominal angka yang valid dan lebih dari 0.');
      return;
    }

    let calculatedQty = item.quantity;
    if (mode === 'add') {
      calculatedQty = item.quantity + val;
    } else if (mode === 'recount') {
      calculatedQty = val;
    } else if (mode === 'waste') {
      calculatedQty = Math.max(0, item.quantity - val);
    }

    onSave(
      item.id,
      calculatedQty,
      notes || (mode === 'add' ? 'Penerimaan Stok Masuk' : mode === 'waste' ? 'Stok Rusak/Waste' : 'Audit Opname')
    );
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Update Stok Bahan Baku</Text>
              <Text style={styles.subtitle}>
                {item.item_name} ({item.sku})
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* Current Stock Banner */}
          <View style={styles.stockBanner}>
            <Text style={styles.bannerLabel}>Sisa Stok Saat Ini:</Text>
            <Text style={styles.bannerValue}>
              {item.quantity.toFixed(1)} <Text style={{ fontSize: 13 }}>{item.unit}</Text>
            </Text>
          </View>

          {/* Mode Tabs */}
          <View style={styles.modeTabsRow}>
            <Pressable
              onPress={() => setMode('add')}
              style={[styles.modeTab, mode === 'add' && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, mode === 'add' && styles.modeTabTextActive]}>
                + Stok Masuk
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setMode('recount')}
              style={[styles.modeTab, mode === 'recount' && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, mode === 'recount' && styles.modeTabTextActive]}>
                ⚖️ Hasil Timbang
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setMode('waste')}
              style={[styles.modeTab, mode === 'waste' && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, mode === 'waste' && styles.modeTabTextActive]}>
                🗑️ Rusak / Waste
              </Text>
            </Pressable>
          </View>

          {/* Input Quantity */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {mode === 'add'
                ? `Jumlah Stok Masuk (${item.unit}):`
                : mode === 'recount'
                ? `Total Aktual Baru (${item.unit}):`
                : `Jumlah Rusak / Terbuang (${item.unit}):`}
            </Text>
            <TextInput
              keyboardType="numeric"
              placeholder={`Contoh: 5 (${item.unit})`}
              value={inputValue}
              onChangeText={setInputValue}
              style={styles.textInput}
              autoFocus
            />
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Keterangan / Dokumen Surat Jalan:</Text>
            <TextInput
              placeholder="Misal: Kiriman Gudang Utama DC #4 / Rusak saat unboxing"
              value={notes}
              onChangeText={setNotes}
              style={[styles.textInput, { height: 42 }]}
            />
          </View>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Batal</Text>
            </Pressable>
            <Pressable onPress={handleConfirm} style={styles.confirmBtn}>
              <Text style={styles.confirmText}>Simpan Perubahan</Text>
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
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.brandEspresso,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 13,
    color: COLORS.brandEspresso,
    fontWeight: '700',
  },
  stockBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bgCanvas,
    padding: 12,
    borderRadius: RADII.btn,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  bannerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  bannerValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.brandEspresso,
  },
  modeTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADII.btn,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2DBD3',
  },
  modeTabActive: {
    backgroundColor: COLORS.brandCrimson,
    borderColor: COLORS.brandCrimson,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brandEspresso,
    marginBottom: 6,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    borderRadius: RADII.btn,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.brandEspresso,
    backgroundColor: '#FFFFFF',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
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

