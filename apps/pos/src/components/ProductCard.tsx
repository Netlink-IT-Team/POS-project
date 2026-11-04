import React from 'react';
import { StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { MenuItem } from '../types';
import { COLORS, RADII, formatRupiah } from '../constants/theme';

export interface ProductCardProps {
  product: MenuItem;
  onAddToCart: (product: MenuItem) => void;
  onCardPress?: (product: MenuItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onCardPress,
}) => {
  const isAvailable = product.isAvailable !== false && product.isActive !== false;

  const renderBadge = () => {
    if (!product.badge) return null;

    let badgeBg = COLORS.brandCrimson;
    let badgeText = '#FFFFFF';

    if (product.badge === 'Manual Brew') {
      badgeBg = COLORS.brandEspresso;
      badgeText = '#FBF9F5';
    } else if (product.badge === 'Snack') {
      badgeBg = '#92400E';
      badgeText = '#FFFFFF';
    }

    return (
      <View style={[styles.badge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.badgeText, { color: badgeText }]}>{product.badge}</Text>
      </View>
    );
  };

  return (
    <Pressable
      onPress={() => isAvailable && (onCardPress ? onCardPress(product) : onAddToCart(product))}
      style={({ pressed }) => [
        styles.card,
        !isAvailable && styles.cardDisabled,
        pressed && isAvailable && styles.cardPressed,
      ]}
    >
      {/* Media Image & Badges */}
      <View style={styles.mediaContainer}>
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderIcon}>☕</Text>
          </View>
        )}

        {renderBadge()}

        {!isAvailable && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Habis</Text>
          </View>
        )}
      </View>

      {/* Information Area */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {product.name}
        </Text>
        {product.description && (
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>
        )}
      </View>

      {/* Pricing & Add Action Footer */}
      <View style={styles.footer}>
        <Text style={styles.price}>{formatRupiah(product.price)}</Text>
        <Pressable
          disabled={!isAvailable}
          onPress={() => onAddToCart(product)}
          style={({ pressed }) => [
            styles.addButton,
            !isAvailable && styles.addButtonDisabled,
            pressed && isAvailable && styles.addButtonPressed,
          ]}
          hitSlop={8}
        >
          <Text style={styles.addIcon}>+</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: '#E6E0D8',
    borderRadius: RADII.card,
    overflow: 'hidden',
    height: 310,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardDisabled: {
    opacity: 0.55,
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
  },
  mediaContainer: {
    height: 145,
    width: '100%',
    backgroundColor: '#EAE5DE',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECE7E1',
  },
  placeholderIcon: {
    fontSize: 36,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: RADII.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(44, 24, 16, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  infoContainer: {
    paddingHorizontal: 14,
    paddingTop: 12,
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.brandEspresso,
    marginBottom: 4,
    lineHeight: 20,
  },
  description: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.brandEspresso,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: RADII.btn,
    backgroundColor: COLORS.brandEspresso,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#C5BEB7',
  },
  addButtonPressed: {
    transform: [{ scale: 0.92 }],
    backgroundColor: COLORS.brandCrimson,
  },
  addIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FBF9F5',
    marginTop: -1,
  },
});
