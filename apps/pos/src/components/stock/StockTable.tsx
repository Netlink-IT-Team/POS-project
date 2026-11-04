import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { BoothStockRecord, StockCategoryEnum } from '../../types/stock';
import { COLORS, RADII } from '../../constants/theme';

export interface StockTableProps {
  stocks: BoothStockRecord[];
  onOpenAdjust: (item: BoothStockRecord) => void;
}

export const StockTable: React.FC<StockTableProps> = ({ stocks, onOpenAdjust }) => {
  const getCategoryLabel = (category: StockCategoryEnum): string => {
    switch (category) {
      case 'powder':
        return 'Powder & Beans';
      case 'syrup':
        return 'Syrup';
      case 'milk':
        return 'Dairy / Milk';
      case 'galon':
        return 'Galon Air';
      case 'packaging':
        return 'Packaging';
      case 'lid':
        return 'Cup Lid';
      case 'sealer':
        return 'Sealer Roll';
      default:
        return category;
    }
  };

  const renderStatusBadge = (item: BoothStockRecord) => {
    if (item.quantity === 0) {
      return (
        <View style={[styles.badge, styles.badgeDanger]}>
          <Text style={styles.badgeDangerText}>Kosong</Text>
        </View>
      );
    }
    if (item.quantity <= item.min_threshold) {
      return (
        <View style={[styles.badge, styles.badgeWarning]}>
          <Text style={styles.badgeWarningText}>Menipis</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, styles.badgeSafe]}>
        <Text style={styles.badgeSafeText}>Aman</Text>
      </View>
    );
  };

  return (
    <View style={styles.tableCard}>
      {/* Table Header */}
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.thText, styles.colItem]}>BAHAN / ITEM & SKU</Text>
        <Text style={[styles.thText, styles.colCategory]}>KATEGORI</Text>
        <Text style={[styles.thText, styles.colQty]}>SISA STOK AKTUAL</Text>
        <Text style={[styles.thText, styles.colReorder]}>REORDER POINT</Text>
        <Text style={[styles.thText, styles.colStatus]}>STATUS</Text>
        <Text style={[styles.thText, styles.colAction]}>AKSI CEPAT</Text>
      </View>

      {/* Table Body */}
      {stocks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Tidak ada item stok yang sesuai filter.</Text>
        </View>
      ) : (
        <ScrollView style={styles.tableBodyScroll} showsVerticalScrollIndicator={false}>
          {stocks.map((item, index) => {
            const isOutOfStock = item.quantity === 0;
            return (
              <View
                key={item.id}
                style={[
                  styles.tableRow,
                  index % 2 === 1 && styles.tableRowEven,
                  isOutOfStock && styles.rowOutOfStock,
                ]}
              >
                {/* 1. Item Name & SKU */}
                <View style={styles.colItem}>
                  <Text style={styles.itemNameText} numberOfLines={1}>
                    {item.item_name}
                  </Text>
                  <Text style={styles.skuText}>{item.sku}</Text>
                </View>

                {/* 2. Category */}
                <View style={styles.colCategory}>
                  <Text style={styles.categoryText}>{getCategoryLabel(item.category)}</Text>
                </View>

                {/* 3. Current Quantity */}
                <View style={styles.colQty}>
                  <Text
                    style={[
                      styles.qtyNumber,
                      isOutOfStock && { color: COLORS.brandCrimson },
                    ]}
                  >
                    {item.quantity.toFixed(1)}{' '}
                    <Text style={styles.unitText}>{item.unit}</Text>
                  </Text>
                </View>

                {/* 4. Min Threshold */}
                <View style={styles.colReorder}>
                  <Text style={styles.reorderText}>
                    {item.min_threshold.toFixed(1)} {item.unit}
                  </Text>
                </View>

                {/* 5. Status Badge */}
                <View style={[styles.colStatus, { alignItems: 'center' }]}>
                  {renderStatusBadge(item)}
                </View>

                {/* 6. Action Button */}
                <View style={[styles.colAction, { alignItems: 'flex-end' }]}>
                  <Pressable
                    onPress={() => onOpenAdjust(item)}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      isOutOfStock ? styles.actionBtnRestock : styles.actionBtnAdjust,
                      pressed && { opacity: 0.8 },
                    ]}
                    hitSlop={8}
                  >
                    <Text
                      style={
                        isOutOfStock
                          ? styles.actionBtnTextRestock
                          : styles.actionBtnTextAdjust
                      }
                    >
                      {isOutOfStock ? '+ Restock Masuk' : '⚙️ Sesuaikan'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Table Footer */}
      <View style={styles.tableFooter}>
        <Text style={styles.footerCountText}>
          Menampilkan <Text style={{ fontWeight: '700' }}>{stocks.length}</Text> item bahan
          baku
        </Text>
        <Text style={styles.footerTipText}>
          💡 Timbang gramatur bubuk/sirup saat buka dan tutup shift
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tableCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.card,
    borderWidth: 1,
    borderColor: '#E6E0D8',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFECE6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0D9D1',
  },
  thText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.brandEspresso,
    letterSpacing: 0.5,
  },
  colItem: {
    flex: 2.4,
  },
  colCategory: {
    flex: 1.2,
  },
  colQty: {
    flex: 1.3,
  },
  colReorder: {
    flex: 1.1,
  },
  colStatus: {
    flex: 1.0,
    alignItems: 'center',
  },
  colAction: {
    flex: 1.4,
    alignItems: 'flex-end',
  },
  tableBodyScroll: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  tableRowEven: {
    backgroundColor: '#FAF8F5',
  },
  rowOutOfStock: {
    backgroundColor: 'rgba(254, 242, 242, 0.4)',
  },
  itemNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.brandEspresso,
    marginBottom: 2,
  },
  skuText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  qtyNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.brandEspresso,
  },
  unitText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  reorderText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADII.pill,
    borderWidth: 1,
    minWidth: 64,
    alignItems: 'center',
  },
  badgeSafe: {
    backgroundColor: COLORS.statusOnlineBg,
    borderColor: COLORS.statusOnlineBorder,
  },
  badgeSafeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.statusOnlineText,
  },
  badgeWarning: {
    backgroundColor: COLORS.statusOfflineBg,
    borderColor: COLORS.statusOfflineBorder,
  },
  badgeWarningText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.statusOfflineText,
  },
  badgeDanger: {
    backgroundColor: 'rgba(255, 218, 214, 0.5)',
    borderColor: '#F87171',
  },
  badgeDangerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93000A',
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADII.btn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnAdjust: {
    backgroundColor: '#EFECE6',
    borderWidth: 1,
    borderColor: '#E0D9D1',
  },
  actionBtnTextAdjust: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  actionBtnRestock: {
    backgroundColor: COLORS.brandCrimson,
  },
  actionBtnTextRestock: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  tableFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FAF8F5',
    borderTopWidth: 1,
    borderTopColor: '#E6E0D8',
  },
  footerCountText: {
    fontSize: 12,
    color: COLORS.brandEspresso,
  },
  footerTipText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});
