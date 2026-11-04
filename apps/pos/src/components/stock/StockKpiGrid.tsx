import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StockMetricsSummary } from '../../types/stock';
import { COLORS, RADII, formatRupiah } from '../../constants/theme';

export interface StockKpiGridProps {
  metrics: StockMetricsSummary;
}

export const StockKpiGrid: React.FC<StockKpiGridProps> = ({ metrics }) => {
  return (
    <View style={styles.container}>
      {/* 1. Total Items Card */}
      <View style={[styles.card, styles.cardWhite]}>
        <View style={styles.topRow}>
          <Text style={styles.cardLabel}>Total Item Terdaftar</Text>
          <Text style={styles.cardIcon}>📦</Text>
        </View>
        <Text style={styles.metricValue}>{metrics.totalItems}</Text>
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Bahan Baku & Packaging</Text>
          <Text style={styles.badgeActive}>100% SKU Aktif</Text>
        </View>
      </View>

      {/* 2. Low Stock Warning Card */}
      <View style={[styles.card, styles.cardWhite]}>
        <View style={styles.topRow}>
          <Text style={[styles.cardLabel, { color: COLORS.statusOfflineText }]}>
            Stok Menipis
          </Text>
          <Text style={styles.cardIcon}>⚠️</Text>
        </View>
        <Text style={[styles.metricValue, { color: COLORS.statusOfflineText }]}>
          {metrics.lowStockCount}
        </Text>
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Di bawah batas minimum</Text>
          <Text style={[styles.badgeWarning]}>Perlu Restock</Text>
        </View>
      </View>

      {/* 3. Out of Stock Critical Card */}
      <View style={[styles.card, styles.cardCritical]}>
        <View style={styles.topRow}>
          <Text style={[styles.cardLabel, { color: '#93000A' }]}>Stok Kosong / Habis</Text>
          <Text style={styles.cardIcon}>🚫</Text>
        </View>
        <Text style={[styles.metricValue, { color: '#93000A' }]}>
          {metrics.outOfStockCount}
        </Text>
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: '#93000A' }]}>
            Menu terkait otomatis non-aktif
          </Text>
        </View>
      </View>

      {/* 4. Stock Valuation Card */}
      <View style={[styles.card, styles.cardWhite]}>
        <View style={styles.topRow}>
          <Text style={styles.cardLabel}>Estimasi Nilai Stok</Text>
          <Text style={styles.cardIcon}>💰</Text>
        </View>
        <Text style={styles.metricValuation}>{formatRupiah(metrics.estimatedValuation)}</Text>
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>COGS Valuasi Booth • Hari ini</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    borderRadius: RADII.card,
    padding: 16,
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardWhite: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E6E0D8',
  },
  cardCritical: {
    backgroundColor: 'rgba(255, 218, 214, 0.45)',
    borderColor: '#F87171',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brandEspresso,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardIcon: {
    fontSize: 16,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.brandEspresso,
    marginVertical: 2,
  },
  metricValuation: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.brandEspresso,
    marginVertical: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  badgeActive: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.statusOnlineText,
    backgroundColor: COLORS.statusOnlineBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.pill,
  },
  badgeWarning: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.statusOfflineText,
    backgroundColor: COLORS.statusOfflineBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.pill,
  },
});

