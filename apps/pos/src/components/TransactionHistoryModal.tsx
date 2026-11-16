import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, Modal, Pressable, ScrollView, TextInput } from 'react-native';
import { ShiftTransaction } from '../types';
import { COLORS, RADII, formatRupiah } from '../constants/theme';

export interface TransactionHistoryModalProps {
  visible: boolean;
  transactions: ShiftTransaction[];
  onClose: () => void;
  onReprintReceipt: (transaction: ShiftTransaction) => void;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  visible,
  transactions,
  onClose,
  onReprintReceipt,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Total summary of current shift transactions
  const totalOmzet = useMemo(() => {
    return transactions.reduce((acc, tx) => acc + tx.totalAmount, 0);
  }, [transactions]);

  // Filtered transactions by order number, queue number, or item name
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const query = searchQuery.toLowerCase().trim();
    return transactions.filter((tx) => {
      const matchOrder = tx.orderNumber.toLowerCase().includes(query);
      const matchQueue = tx.queueNumber.toLowerCase().includes(query);
      const matchItems = tx.items.some((item) => item.name.toLowerCase().includes(query));
      return matchOrder || matchQueue || matchItems;
    });
  }, [transactions, searchQuery]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>📋 Riwayat Transaksi Shift Berjalan</Text>
              <Text style={styles.subtitle}>
                {`${transactions.length} pesanan tercatat • Total Omzet: ${formatRupiah(totalOmzet)}`}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              placeholder="Cari no. pesanan (#104), no. antrean (04), atau menu..."
              placeholderTextColor={COLORS.textPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                <Text style={styles.clearSearchText}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* Transaction List */}
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🧾</Text>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'Pesanan Tidak Ditemukan' : 'Belum Ada Transaksi di Shift Ini'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `Tidak ada transaksi yang cocok dengan kata kunci "${searchQuery}".`
                  : 'Setiap pesanan yang diselesaikan akan otomatis tercatat dan dapat dicetak ulang di sini.'}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.listContainer}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {filteredTransactions.map((tx) => (
                <View key={tx.id} style={styles.card}>
                  {/* Top Bar of Card */}
                  <View style={styles.cardHeader}>
                    <View style={styles.orderIdentGroup}>
                      <View style={styles.queueBadge}>
                        <Text style={styles.queueBadgeText}>Antrean {tx.queueNumber}</Text>
                      </View>
                      <Text style={styles.orderNumberText}>Pesanan #{tx.orderNumber}</Text>
                      <Text style={styles.timeText}>{tx.timestamp} WIB</Text>
                    </View>

                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>✓ LUNAS</Text>
                    </View>
                  </View>

                  {/* Items Summary */}
                  <View style={styles.itemsBlock}>
                    {tx.items.map((item, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemQuantity}>{item.quantity}×</Text>
                        <View style={styles.itemDetails}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          {item.modifiersText ? (
                            <Text style={styles.itemModifiers}>{item.modifiersText}</Text>
                          ) : null}
                        </View>
                        <Text style={styles.itemSubtotal}>{formatRupiah(item.subtotal)}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Divider */}
                  <View style={styles.divider} />

                  {/* Card Footer: Payment info & Reprint CTA */}
                  <View style={styles.cardFooter}>
                    <View style={styles.paymentMeta}>
                      <Text style={styles.paymentMethodLabel}>
                        {tx.paymentMethod === 'qris'
                          ? `📱 QRIS Dinamis (${tx.qrisRef || 'Xendit'})`
                          : `💵 Tunai (Diterima: ${formatRupiah(tx.cashReceived || tx.totalAmount)}${
                              (tx.change || 0) > 0 ? `, Kembali: ${formatRupiah(tx.change || 0)}` : ''
                            })`}
                      </Text>
                      <Text style={styles.totalAmountLabel}>
                        Total: <Text style={styles.totalAmountValue}>{formatRupiah(tx.totalAmount)}</Text>
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => onReprintReceipt(tx)}
                      style={({ pressed }) => [styles.btnReprint, pressed && { opacity: 0.85 }]}
                      hitSlop={6}
                    >
                      <Text style={styles.btnReprintText}>🖨️ Cetak Ulang Struk</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Footer Bar */}
          <View style={styles.modalFooter}>
            <Text style={styles.footerHint}>
              💡 Struk fisik dapat dicetak ulang kapan saja tanpa membatalkan transaksi.
            </Text>
            <Pressable onPress={onClose} style={styles.btnCloseBottom}>
              <Text style={styles.btnCloseBottomText}>Tutup</Text>
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
    backgroundColor: 'rgba(29, 15, 10, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: 660,
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.card,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F5F0',
    borderRadius: RADII.btn,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 14,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 13,
    color: COLORS.brandEspresso,
    padding: 0,
    outlineStyle: 'none',
  } as any,
  clearSearchText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.brandEspresso,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 380,
    lineHeight: 18,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
    gap: 12,
  },
  card: {
    backgroundColor: '#FAF8F5',
    borderRadius: RADII.btn,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderIdentGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  queueBadge: {
    backgroundColor: COLORS.brandCrimson,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  queueBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  orderNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.brandEspresso,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  itemsBlock: {
    gap: 6,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemQuantity: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.brandCrimson,
    width: 24,
  },
  itemDetails: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  itemModifiers: {
    fontSize: 10,
    color: '#666666',
    fontStyle: 'italic',
    marginTop: 1,
  },
  itemSubtotal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  divider: {
    height: 1,
    backgroundColor: '#EAE6DF',
    marginVertical: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMeta: {
    flex: 1,
    marginRight: 12,
  },
  paymentMethodLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  totalAmountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  totalAmountValue: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.brandCrimson,
  },
  btnReprint: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADII.btn,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.brandEspresso,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnReprintText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.brandEspresso,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFECE6',
  },
  footerHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    flex: 1,
    marginRight: 12,
  },
  btnCloseBottom: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: '#EFECE6',
    borderRadius: RADII.btn,
  },
  btnCloseBottomText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
});

