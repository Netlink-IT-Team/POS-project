import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, Pressable, TextInput } from 'react-native';
import { MenuItem } from '../types';
import { COLORS, RADII, formatRupiah } from '../constants/theme';

export interface ModifierSelection {
  temperature: 'Ice' | 'Hot';
  iceLevel: 'Normal Ice' | 'Less Ice' | 'No Ice';
  sugarLevel: 'Normal Sugar' | 'Less Sugar' | 'No Sugar';
  extraShot: boolean;
  notes: string;
  quantity: number;
}

export interface ModifierModalProps {
  visible: boolean;
  product: MenuItem | null;
  onClose: () => void;
  onAddToCartWithModifiers: (
    product: MenuItem,
    modifiersText: string,
    finalPricePerUnit: number,
    quantity: number
  ) => void;
}

export const ModifierModal: React.FC<ModifierModalProps> = ({
  visible,
  product,
  onClose,
  onAddToCartWithModifiers,
}) => {
  const [temperature, setTemperature] = useState<'Ice' | 'Hot'>('Ice');
  const [iceLevel, setIceLevel] = useState<'Normal Ice' | 'Less Ice' | 'No Ice'>('Normal Ice');
  const [sugarLevel, setSugarLevel] = useState<'Normal Sugar' | 'Less Sugar' | 'No Sugar'>('Normal Sugar');
  const [extraShot, setExtraShot] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Reset defaults when product changes
  useEffect(() => {
    if (visible && product) {
      setTemperature(product.categoryId === 'pastry' ? 'Hot' : 'Ice');
      setIceLevel('Normal Ice');
      setSugarLevel('Normal Sugar');
      setExtraShot(false);
      setNotes('');
      setQuantity(1);
    }
  }, [visible, product]);

  if (!product) return null;

  const isBeverage = product.categoryId !== 'pastry';
  const extraShotCost = extraShot ? 5000 : 0;
  const unitPrice = product.price + extraShotCost;
  const totalSubtotal = unitPrice * quantity;

  const handleConfirm = () => {
    // Generate modifier summary string (e.g. "Normal Ice • Less Sugar • Extra Shot")
    const parts: string[] = [];
    if (isBeverage) {
      if (temperature === 'Hot') {
        parts.push('Hot');
      } else {
        parts.push(iceLevel);
      }
      parts.push(sugarLevel);
      if (extraShot) parts.push('+ Extra Shot');
    } else {
      parts.push('Warmed');
    }

    if (notes.trim()) {
      parts.push(`"${notes.trim()}"`);
    }

    const modifierText = parts.join(' • ');
    onAddToCartWithModifiers(product, modifierText, unitPrice, quantity);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productTitle} numberOfLines={1}>
                {product.name}
              </Text>
              <Text style={styles.productSku}>
                {product.sku} • {formatRupiah(product.price)}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {isBeverage ? (
            <View style={styles.modifierBody}>
              {/* 1. Suhu (Ice / Hot) */}
              <View style={styles.sectionRow}>
                <Text style={styles.sectionLabel}>Suhu Minuman:</Text>
                <View style={styles.optionsRow}>
                  {(['Ice', 'Hot'] as const).map((temp) => {
                    const isSelected = temperature === temp;
                    return (
                      <Pressable
                        key={temp}
                        onPress={() => setTemperature(temp)}
                        style={[styles.pillOption, isSelected && styles.pillOptionActive]}
                      >
                        <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                          {temp === 'Ice' ? '❄️ Dingin (Ice)' : '♨️ Panas (Hot)'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* 2. Level Es (Hanya jika Dingin) */}
              {temperature === 'Ice' && (
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionLabel}>Level Es (Ice Level):</Text>
                  <View style={styles.optionsRow}>
                    {(['Normal Ice', 'Less Ice', 'No Ice'] as const).map((lvl) => {
                      const isSelected = iceLevel === lvl;
                      return (
                        <Pressable
                          key={lvl}
                          onPress={() => setIceLevel(lvl)}
                          style={[styles.chipOption, isSelected && styles.chipOptionActive]}
                        >
                          <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                            {lvl}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* 3. Level Gula (Sweetness) */}
              <View style={styles.sectionRow}>
                <Text style={styles.sectionLabel}>Tingkat Manis (Sugar Level):</Text>
                <View style={styles.optionsRow}>
                  {(['Normal Sugar', 'Less Sugar', 'No Sugar'] as const).map((sug) => {
                    const isSelected = sugarLevel === sug;
                    return (
                      <Pressable
                        key={sug}
                        onPress={() => setSugarLevel(sug)}
                        style={[styles.chipOption, isSelected && styles.chipOptionActive]}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {sug}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* 4. Add-on Extra Espresso Shot */}
              <View style={styles.sectionRow}>
                <Text style={styles.sectionLabel}>Tambahan (Add-ons):</Text>
                <Pressable
                  onPress={() => setExtraShot((prev) => !prev)}
                  style={[styles.addonCard, extraShot && styles.addonCardActive]}
                >
                  <View style={styles.addonLeft}>
                    <Text style={styles.addonIcon}>☕</Text>
                    <Text style={[styles.addonTitle, extraShot && styles.addonTitleActive]}>
                      Extra Espresso Shot
                    </Text>
                  </View>
                  <Text style={[styles.addonPrice, extraShot && styles.addonPriceActive]}>
                    +Rp 5.000
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.pastryBody}>
              <Text style={styles.pastryTip}>
                🥐 Pastry akan disajikan hangat (*Warmed*) secara default oleh barista.
              </Text>
            </View>
          )}

          {/* Catatan Barista */}
          <View style={styles.notesSection}>
            <Text style={styles.sectionLabel}>Catatan Khusus Barista:</Text>
            <TextInput
              placeholder="Contoh: Pisahkan es batu, cup sedotan terpisah..."
              placeholderTextColor={COLORS.textPlaceholder}
              value={notes}
              onChangeText={setNotes}
              style={styles.notesInput}
            />
          </View>

          {/* Quantity Stepper & Add to Cart Footer */}
          <View style={styles.footerRow}>
            {/* Stepper */}
            <View style={styles.quantityContainer}>
              <Pressable
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                style={styles.stepBtn}
                hitSlop={6}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </Pressable>
              <Text style={styles.quantityText}>{quantity}</Text>
              <Pressable
                onPress={() => setQuantity((q) => q + 1)}
                style={styles.stepBtn}
                hitSlop={6}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </Pressable>
            </View>

            {/* CTA Add Button */}
            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.submitBtnText}>
                Tambah Pesanan • {formatRupiah(totalSubtotal)}
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
    backgroundColor: 'rgba(29, 15, 10, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.card,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#ECE5DD',
    paddingBottom: 14,
    marginBottom: 16,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.brandEspresso,
  },
  productSku: {
    fontSize: 13,
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
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  modifierBody: {
    gap: 14,
  },
  sectionRow: {
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brandEspresso,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillOption: {
    flex: 1,
    height: 42,
    borderRadius: RADII.btn,
    backgroundColor: '#F7F5F0',
    borderWidth: 1.5,
    borderColor: COLORS.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillOptionActive: {
    backgroundColor: 'rgba(198, 40, 40, 0.08)',
    borderColor: COLORS.brandCrimson,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.brandEspresso,
  },
  pillTextActive: {
    color: COLORS.brandCrimson,
    fontWeight: '700',
  },
  chipOption: {
    flex: 1,
    height: 38,
    borderRadius: RADII.btn,
    backgroundColor: '#F7F5F0',
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOptionActive: {
    backgroundColor: COLORS.brandEspresso,
    borderColor: COLORS.brandEspresso,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.brandEspresso,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  addonCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 44,
    borderRadius: RADII.btn,
    backgroundColor: '#F7F5F0',
    borderWidth: 1.5,
    borderColor: COLORS.borderDefault,
    paddingHorizontal: 14,
  },
  addonCardActive: {
    borderColor: COLORS.brandCrimson,
    backgroundColor: 'rgba(198, 40, 40, 0.08)',
  },
  addonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addonIcon: {
    fontSize: 15,
  },
  addonTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.brandEspresso,
  },
  addonTitleActive: {
    color: COLORS.brandCrimson,
    fontWeight: '700',
  },
  addonPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  addonPriceActive: {
    color: COLORS.brandCrimson,
  },
  pastryBody: {
    paddingVertical: 14,
  },
  pastryTip: {
    fontSize: 13,
    color: COLORS.textMuted,
    backgroundColor: '#F7F5F0',
    padding: 12,
    borderRadius: RADII.btn,
  },
  notesSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  notesInput: {
    height: 40,
    borderRadius: RADII.btn,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    paddingHorizontal: 12,
    fontSize: 13,
    color: COLORS.brandEspresso,
    backgroundColor: '#FAF8F5',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#ECE5DD',
    paddingTop: 16,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EFEA',
    borderRadius: RADII.btn,
    padding: 4,
    gap: 8,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: RADII.stepper,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  quantityText: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.brandEspresso,
  },
  submitBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADII.card,
    backgroundColor: COLORS.brandCrimson,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.brandCrimson,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

