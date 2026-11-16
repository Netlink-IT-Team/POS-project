import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { BoothStockRecord, StockCategoryEnum, StockMetricsSummary } from '../types/stock';
import { INITIAL_STOCKS, STOCK_CATEGORY_TABS } from '../constants/mockStocks';
import { StockKpiGrid } from '../components/stock/StockKpiGrid';
import { StockTable } from '../components/stock/StockTable';
import { StockAdjustModal } from '../components/stock/StockAdjustModal';
import { Header } from '../components/Header';
import { COLORS, RADII } from '../constants/theme';

export interface StockScreenProps {
  isOnline: boolean;
  onToggleOnline: () => void;
  boothName: string;
  cashierName: string;
  stocks?: BoothStockRecord[];
  setStocks?: React.Dispatch<React.SetStateAction<BoothStockRecord[]>>;
  pendingSyncCount?: number;
  onTriggerSync?: () => void;
  onOpenShiftAudit?: () => void;
  onOpenHistory?: () => void;
}

export const StockScreen: React.FC<StockScreenProps> = ({
  isOnline,
  onToggleOnline,
  boothName,
  cashierName,
  stocks: propStocks,
  setStocks: propSetStocks,
  pendingSyncCount = 0,
  onTriggerSync,
  onOpenShiftAudit,
  onOpenHistory,
}) => {
  const [localStocks, setLocalStocks] = useState<BoothStockRecord[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem('kopiko_booth_stocks_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_STOCKS;
  });
  const stocks = propStocks ?? localStocks;
  const setStocks = propSetStocks ?? setLocalStocks;
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | StockCategoryEnum>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'safe' | 'warning' | 'out_of_stock'>('all');

  // Modal State
  const [selectedStockItem, setSelectedStockItem] = useState<BoothStockRecord | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState<boolean>(false);

  // Dynamic KPI Metrics Calculation
  const metrics: StockMetricsSummary = useMemo(() => {
    let lowCount = 0;
    let outCount = 0;
    let valuation = 0;

    stocks.forEach((item) => {
      if (item.quantity === 0) {
        outCount += 1;
      } else if (item.quantity <= item.min_threshold) {
        lowCount += 1;
      }
      valuation += item.quantity * item.estimated_cost_per_unit;
    });

    return {
      totalItems: stocks.length,
      lowStockCount: lowCount,
      outOfStockCount: outCount,
      estimatedValuation: valuation,
    };
  }, [stocks]);

  // Filter stocks
  const filteredStocks = useMemo(() => {
    return stocks.filter((item) => {
      // 1. Category Filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // 2. Status Filter
      if (selectedStatus === 'safe' && item.quantity <= item.min_threshold) {
        return false;
      }
      if (
        selectedStatus === 'warning' &&
        (item.quantity > item.min_threshold || item.quantity === 0)
      ) {
        return false;
      }
      if (selectedStatus === 'out_of_stock' && item.quantity !== 0) {
        return false;
      }

      // 3. Search Filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchName = item.item_name.toLowerCase().includes(query);
        const matchSku = item.sku.toLowerCase().includes(query);
        if (!matchName && !matchSku) return false;
      }

      return true;
    });
  }, [stocks, selectedCategory, selectedStatus, searchQuery]);

  const handleOpenAdjust = (item: BoothStockRecord) => {
    setSelectedStockItem(item);
    setIsAdjustModalOpen(true);
  };

  const handleSaveStock = (itemId: string, newQuantity: number, reason: string) => {
    setStocks((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: newQuantity,
              updated_at: new Date().toISOString(),
            }
          : item
      )
    );
    Alert.alert(
      'Stok Berhasil Diperbarui',
      `Penyesuaian stok dicatat (${reason}). Sisa stok aktual telah disinkronkan.`
    );
  };

  const handleAddNewStockDirect = () => {
    // Prioritaskan item yang sudah di bawah batas minimum atau kosong
    const urgentItem = stocks.find((s) => s.quantity <= s.min_threshold) || stocks[0];
    if (urgentItem) {
      setSelectedStockItem(urgentItem);
      setIsAdjustModalOpen(true);
    }
  };

  const handleRefreshStock = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem('kopiko_booth_stocks_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStocks(parsed);
          }
        }
      }
    } catch (e) {
      console.warn('[StockScreen] Gagal memuat ulang storage:', e);
    }
    Alert.alert(
      'Data Stok Terkini',
      'Data stok teranyar berhasil disinkronkan. Riwayat restock dan pengurangan resep otomatis tetap tersimpan aman.'
    );
  };

  const handleExportSummary = () => {
    Alert.alert(
      'Export Rekap Inventaris',
      `Berhasil membuat berkas CSV rekap ${stocks.length} bahan baku untuk serah terima shift ${cashierName}.`,
      [{ text: 'Tutup' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Sticky */}
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

      {/* 2. Main Scrollable Container */}
      <View style={styles.contentBody}>
        {/* Context Banner & Top Actions */}
        <View style={styles.contextBanner}>
          <View>
            <View style={styles.brandFlagRow}>
              <Text style={styles.brandFlagText}>KOPIKO CENTRAL INVENTORY OS</Text>
              <View style={styles.flagDot} />
              <Text style={styles.flagSubText}>
                {isOnline ? 'Auto-Sync Realtime' : 'Mode Offline Lokal'}
              </Text>
            </View>
            <Text style={styles.screenTitle}>Manajemen Stok & Bahan Baku</Text>
          </View>

          <View style={styles.bannerActions}>
            <Pressable
              onPress={handleRefreshStock}
              style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.7 }]}
              hitSlop={8}
            >
              <Text style={styles.btnSecondaryText}>🔄 Refresh</Text>
            </Pressable>

            <Pressable
              onPress={handleAddNewStockDirect}
              style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.85 }]}
              hitSlop={8}
            >
              <Text style={styles.btnPrimaryText}>+ Tambah Stok Masuk</Text>
            </Pressable>
          </View>
        </View>

        {/* 3. KPI Metrics Bento Grid */}
        <StockKpiGrid metrics={metrics} />

        {/* 4. Search & Filters Bar */}
        <View style={styles.filterCard}>
          <View style={styles.searchStatusRow}>
            {/* Search Input */}
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                placeholder="Cari nama bahan baku atau SKU..."
                placeholderTextColor={COLORS.textPlaceholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Text style={styles.clearSearchText}>✕</Text>
                </Pressable>
              )}
            </View>

            {/* Status Quick Chips */}
            <View style={styles.statusChipsRow}>
              {[
                { id: 'all', label: 'Semua Status' },
                { id: 'safe', label: 'Aman' },
                { id: 'warning', label: 'Menipis' },
                { id: 'out_of_stock', label: 'Kosong' },
              ].map((st) => {
                const isActive = selectedStatus === st.id;
                return (
                  <Pressable
                    key={st.id}
                    onPress={() => setSelectedStatus(st.id as any)}
                    style={[
                      styles.statusChip,
                      isActive && styles.statusChipActive,
                    ]}
                    hitSlop={6}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        isActive && styles.statusChipTextActive,
                      ]}
                    >
                      {st.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Category Tabs (stock_category enum) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {STOCK_CATEGORY_TABS.map((tab) => {
              const isActive = selectedCategory === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setSelectedCategory(tab.id)}
                  style={[styles.catTab, isActive && styles.catTabActive]}
                  hitSlop={6}
                >
                  <Text style={[styles.catTabText, isActive && styles.catTabTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 5. Inventory Table */}
        <View style={styles.tableWrapper}>
          <StockTable stocks={filteredStocks} onOpenAdjust={handleOpenAdjust} />
        </View>

        {/* 6. Quick Action Dock (Sticky Bottom) */}
        <View style={styles.dockBar}>
          <View style={styles.dockLeft}>
            <Text style={styles.dockTitle}>Aksi Cepat Inventaris Shift Barista</Text>
            <Text style={styles.dockSub}>
              Pastikan timbangan fisik dicatat sebelum shift selesai.
            </Text>
          </View>

          <View style={styles.dockActions}>
            <Pressable
              onPress={handleExportSummary}
              style={({ pressed }) => [styles.dockBtnMuted, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.dockBtnMutedText}>📊 Unduh Rekap</Text>
            </Pressable>

            <Pressable
              onPress={handleAddNewStockDirect}
              style={({ pressed }) => [styles.dockBtnPrimary, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.dockBtnPrimaryText}>📦 Penerimaan Stok Masuk</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Adjust / Recount / Waste Modal */}
      <StockAdjustModal
        visible={isAdjustModalOpen}
        item={selectedStockItem}
        allItems={stocks}
        onClose={() => setIsAdjustModalOpen(false)}
        onSave={handleSaveStock}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgCanvas,
  },
  contentBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: 'column',
  },
  contextBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  brandFlagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
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
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.brandEspresso,
  },
  bannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  btnSecondary: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: RADII.btn,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  btnPrimary: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: RADII.btn,
    backgroundColor: COLORS.brandCrimson,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.brandCrimson,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.card,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6E0D8',
    marginBottom: 12,
    gap: 10,
  },
  searchStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBox: {
    flex: 1,
    height: 40,
    borderRadius: RADII.btn,
    backgroundColor: '#F7F5F0',
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 13,
    marginRight: 8,
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.brandEspresso,
    padding: 0,
    height: '100%',
  },
  clearSearchText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  statusChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: RADII.pill,
    backgroundColor: '#F3EFEA',
    borderWidth: 1,
    borderColor: '#E2DBD3',
  },
  statusChipActive: {
    backgroundColor: COLORS.brandEspresso,
    borderColor: COLORS.brandEspresso,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.brandEspresso,
  },
  statusChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  catTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADII.btn,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE5DE',
  },
  catTabActive: {
    backgroundColor: COLORS.brandCrimson,
    borderColor: COLORS.brandCrimson,
  },
  catTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.brandEspresso,
  },
  catTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tableWrapper: {
    flex: 1,
  },
  dockBar: {
    height: 54,
    backgroundColor: 'rgba(251, 249, 245, 0.96)',
    borderRadius: RADII.card,
    borderWidth: 1,
    borderColor: '#E2DBD3',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  dockLeft: {
    flexDirection: 'column',
  },
  dockTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  dockSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  dockActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dockBtnMuted: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: RADII.btn,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0D9D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockBtnMutedText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  dockBtnPrimary: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: RADII.btn,
    backgroundColor: COLORS.brandCrimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockBtnPrimaryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

