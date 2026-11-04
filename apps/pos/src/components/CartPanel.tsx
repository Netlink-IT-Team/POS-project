import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { CartLineItem, PaymentMethod } from '../types';
import { COLORS } from '../constants/theme';
import { CartHeader } from './CartHeader';
import { CartItem } from './CartItem';
import { OrderSummary } from './OrderSummary';

export interface CartPanelProps {
  orderNumber: string;
  queueNumber: string;
  items: CartLineItem[];
  subtotal: number;
  totalAmount: number;
  selectedPaymentMethod: PaymentMethod;
  onSelectPaymentMethod: (method: PaymentMethod) => void;
  onIncrementItem: (id: string) => void;
  onDecrementItem: (id: string) => void;
  onClearCart: () => void;
  onProceedToPayment: () => void;
  width?: number;
  compact?: boolean;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  orderNumber,
  queueNumber,
  items,
  subtotal,
  totalAmount,
  selectedPaymentMethod,
  onSelectPaymentMethod,
  onIncrementItem,
  onDecrementItem,
  onClearCart,
  onProceedToPayment,
  width,
  compact,
}) => {
  const isCartEmpty = items.length === 0;

  return (
    <View style={[styles.container, width !== undefined ? { width } : null]}>
      {/* 1. Cart Header */}
      <CartHeader
        orderNumber={orderNumber}
        queueNumber={queueNumber}
        isCartEmpty={isCartEmpty}
        onClearCart={onClearCart}
      />

      {/* 2. Scrollable Cart Items List */}
      <View style={styles.itemListContainer}>
        {isCartEmpty ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛍️</Text>
            <Text style={styles.emptyTitle}>Keranjang Belanja Kosong</Text>
            <Text style={styles.emptySubtitle}>
              Pilih menu kopi atau snack dari katalog di sebelah kiri untuk memulai pesanan.
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollList}
          >
            {items.map((item) => (
              <CartItem
                key={item.id}
                id={item.id}
                menuId={item.menuId}
                name={item.name}
                modifiersText={item.modifiersText}
                pricePerUnit={item.pricePerUnit}
                quantity={item.quantity}
                subtotal={item.subtotal}
                onIncrement={onIncrementItem}
                onDecrement={onDecrementItem}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* 3. Sticky Order Summary Checkout Footer */}
      <OrderSummary
        itemCount={items.reduce((acc, curr) => acc + curr.quantity, 0)}
        subtotal={subtotal}
        totalAmount={totalAmount}
        selectedPaymentMethod={selectedPaymentMethod}
        onSelectPaymentMethod={onSelectPaymentMethod}
        onProceedToPayment={onProceedToPayment}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 380,
    height: '100%',
    backgroundColor: COLORS.bgCartPanel,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.borderCartPanel,
    flexDirection: 'column',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: -3, height: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 4,
  },
  itemListContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  scrollList: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 42,
    marginBottom: 12,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.brandEspresso,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});

