import React from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import { MenuItem } from '../types';
import { ProductCard } from './ProductCard';
import { COLORS } from '../constants/theme';

export interface ProductGridProps {
  products: MenuItem[];
  onAddToCart: (product: MenuItem) => void;
  onCardPress?: (product: MenuItem) => void;
  emptySearchQuery?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onAddToCart,
  onCardPress,
  emptySearchQuery,
}) => {
  if (products.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitle}>Menu tidak ditemukan</Text>
        <Text style={styles.emptySubtitle}>
          {emptySearchQuery
            ? `Tidak ada menu yang sesuai dengan "${emptySearchQuery}"`
            : 'Periksa kata kunci atau ganti filter kategori'}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      numColumns={3}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <View style={styles.cardWrapper}>
          <ProductCard
            product={item}
            onAddToCart={onAddToCart}
            onCardPress={onCardPress}
          />
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 28,
  },
  columnWrapper: {
    gap: 14,
    marginBottom: 14,
  },
  cardWrapper: {
    flex: 1,
    maxWidth: '32.5%',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.brandEspresso,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 320,
  },
});

