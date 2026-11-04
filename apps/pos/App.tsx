import React, { useState, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, SafeAreaView, Alert, useWindowDimensions } from 'react-native';
import { Sidebar } from './src/components/Sidebar';
import { Header } from './src/components/Header';
import { SearchInput } from './src/components/SearchInput';
import { CategoryChips } from './src/components/CategoryChips';
import { ProductGrid } from './src/components/ProductGrid';
import { CartPanel } from './src/components/CartPanel';
import { PaymentModal } from './src/components/PaymentModal';
import { ModifierModal } from './src/components/ModifierModal';
import { ReceiptModal } from './src/components/ReceiptModal';
import { StockScreen } from './src/screens/StockScreen';
import { SettlementScreen } from './src/screens/SettlementScreen';
import { LoginScreen, CashierProfile } from './src/screens/LoginScreen';
import { DEFAULT_CATEGORIES, INITIAL_PRODUCTS } from './src/constants/mockData';
import { CartLineItem, MenuItem, PaymentMethod } from './src/types';
import { COLORS } from './src/constants/theme';

export default function App() {
  const { width } = useWindowDimensions();

  // Responsive Breakpoints for Tablet Sizes (Small 7"-8" vs Large 10"-11")
  const isSmallTablet = width < 1020;
  const sidebarWidth = isSmallTablet ? 190 : 240;
  const cartWidth = isSmallTablet ? 320 : 380;

  // Auth / Login Session State (Item 1)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [activeCashier, setActiveCashier] = useState<CashierProfile>({
    id: 'usr-1',
    name: 'Alex Martins',
    role: 'Kasir Shift 1',
    pin: '1234',
    boothName: 'Booth Mall Senayan #01',
  });

  // Navigation & Network State
  const [activeRoute, setActiveRoute] = useState<'menu' | 'stok' | 'settlement'>('menu');
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Catalog Filter State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart & Order State
  const [orderNumber, setOrderNumber] = useState<number>(104);
  const [queueNumber, setQueueNumber] = useState<number>(4);
  const [cartItems, setCartItems] = useState<CartLineItem[]>([
    {
      id: 'cart-init-1',
      menuId: 'prod-1',
      name: 'Kopiko Aren Latte',
      modifiersText: 'Normal Ice • Less Sugar',
      pricePerUnit: 28000,
      quantity: 2,
      subtotal: 56000,
    },
  ]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('qris');
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState<boolean>(false);

  // Digital Receipt State (Item 2)
  const [isReceiptVisible, setIsReceiptVisible] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<{
    orderNumber: string;
    queueNumber: string;
    items: CartLineItem[];
    subtotal: number;
    totalAmount: number;
    paymentMethod: PaymentMethod;
  }>({
    orderNumber: '104',
    queueNumber: '04',
    items: [],
    subtotal: 0,
    totalAmount: 0,
    paymentMethod: 'qris',
  });

  // Modifier Modal State
  const [selectedProductForModifier, setSelectedProductForModifier] = useState<MenuItem | null>(null);
  const [isModifierModalVisible, setIsModifierModalVisible] = useState<boolean>(false);

  // Filter products by category and search keyword
  const filteredProducts = useMemo(() => {
    return INITIAL_PRODUCTS.filter((product) => {
      const matchCategory =
        selectedCategoryId === 'all' || product.categoryId === selectedCategoryId;
      const matchSearch =
        searchQuery.trim() === '' ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [selectedCategoryId, searchQuery]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  }, [cartItems]);

  const totalAmount = subtotal;

  // Open Modifier Modal
  const handleOpenModifier = (product: MenuItem) => {
    setSelectedProductForModifier(product);
    setIsModifierModalVisible(true);
  };

  // Add Item to Cart with Customized Modifiers
  const handleAddToCartWithModifiers = (
    product: MenuItem,
    modifiersText: string,
    finalPricePerUnit: number,
    quantity: number
  ) => {
    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.menuId === product.id && item.modifiersText === modifiersText
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + quantity;
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          subtotal: newQty * existing.pricePerUnit,
        };
        return updated;
      } else {
        const newItem: CartLineItem = {
          id: `cart-${Date.now()}-${product.id}`,
          menuId: product.id,
          name: product.name,
          modifiersText,
          pricePerUnit: finalPricePerUnit,
          quantity,
          subtotal: finalPricePerUnit * quantity,
        };
        return [...prevItems, newItem];
      }
    });
  };

  const handleIncrementItem = (id: string) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + 1;
          return {
            ...item,
            quantity: newQty,
            subtotal: newQty * item.pricePerUnit,
          };
        }
        return item;
      })
    );
  };

  const handleDecrementItem = (id: string) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity - 1;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.pricePerUnit,
            };
          }
          return item;
        })
        .filter((item): item is CartLineItem => item !== null)
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleProceedToPayment = () => {
    if (cartItems.length === 0) return;
    setIsPaymentModalVisible(true);
  };

  // Payment Confirmation -> Triggers Receipt Modal (Item 2)
  const handleConfirmPaymentSuccess = () => {
    setIsPaymentModalVisible(false);

    // Save completed order details for receipt
    setCompletedOrder({
      orderNumber: String(orderNumber),
      queueNumber: String(queueNumber).padStart(2, '0'),
      items: [...cartItems],
      subtotal,
      totalAmount,
      paymentMethod: selectedPaymentMethod,
    });

    // Open receipt modal
    setIsReceiptVisible(true);
  };

  const handleCloseReceiptAndReset = () => {
    setIsReceiptVisible(false);
    setCartItems([]);
    setOrderNumber((prev) => prev + 1);
    setQueueNumber((prev) => prev + 1);
  };

  // Render Login Screen if not authenticated (Item 1)
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <LoginScreen
          onLoginSuccess={(cashier) => {
            setActiveCashier(cashier);
            setIsLoggedIn(true);
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.rootLayout}>
        {/* 1. Left Persistent Navigation Sidebar (Adaptive Width) */}
        <Sidebar
          activeRoute={activeRoute}
          width={sidebarWidth}
          compact={isSmallTablet}
          onNavigate={(route) => setActiveRoute(route)}
          onLogout={() => setIsLoggedIn(false)}
        />

        {/* 2. Route Switching: Menu POS vs Stock Opname vs Settlement */}
        {activeRoute === 'stok' ? (
          <View style={styles.screenContainer}>
            <StockScreen
              isOnline={isOnline}
              onToggleOnline={() => setIsOnline((prev) => !prev)}
              boothName={activeCashier.boothName}
              cashierName={activeCashier.name}
            />
          </View>
        ) : activeRoute === 'settlement' ? (
          <View style={styles.screenContainer}>
            <SettlementScreen
              isOnline={isOnline}
              onToggleOnline={() => setIsOnline((prev) => !prev)}
              boothName={activeCashier.boothName}
              cashierName={activeCashier.name}
              onShiftClosed={() => setActiveRoute('menu')}
            />
          </View>
        ) : (
          <View style={styles.mainContent}>
            {/* Top Bar Header */}
            <Header
              boothName={activeCashier.boothName}
              isOnline={isOnline}
              cashierName={activeCashier.name}
              onToggleOnline={() => setIsOnline((prev) => !prev)}
            />

            {/* Operational Horizontal Split (Left: Catalog, Right: Cart Panel) */}
            <View style={styles.splitBody}>
              {/* Catalog Center Area (Flex: 1, Spacious) */}
              <View style={[styles.catalogSection, isSmallTablet && { paddingHorizontal: 12 }]}>
                {/* Search Bar Row */}
                <View style={styles.searchRow}>
                  <SearchInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onClear={() => setSearchQuery('')}
                  />
                </View>

                {/* Horizontal Category Chips */}
                <View style={styles.chipsRow}>
                  <CategoryChips
                    categories={DEFAULT_CATEGORIES}
                    selectedCategoryId={selectedCategoryId}
                    onSelectCategory={setSelectedCategoryId}
                  />
                </View>

                {/* 3-Column Product Catalog Grid with Modifier Trigger */}
                <View style={styles.gridContainer}>
                  <ProductGrid
                    products={filteredProducts}
                    onAddToCart={handleOpenModifier}
                    onCardPress={handleOpenModifier}
                    emptySearchQuery={searchQuery}
                  />
                </View>
              </View>

              {/* Cart & Checkout Panel (Adaptive Width: 320px on small tablet / 380px on 1280px) */}
              <CartPanel
                width={cartWidth}
                compact={isSmallTablet}
                orderNumber={String(orderNumber)}
                queueNumber={String(queueNumber).padStart(2, '0')}
                items={cartItems}
                subtotal={subtotal}
                totalAmount={totalAmount}
                selectedPaymentMethod={selectedPaymentMethod}
                onSelectPaymentMethod={setSelectedPaymentMethod}
                onIncrementItem={handleIncrementItem}
                onDecrementItem={handleDecrementItem}
                onClearCart={handleClearCart}
                onProceedToPayment={handleProceedToPayment}
              />
            </View>
          </View>
        )}
      </View>

      {/* 3. Barista Modifier Modal (Suhu, Level Es, Level Gula, Extra Shot) */}
      <ModifierModal
        visible={isModifierModalVisible}
        product={selectedProductForModifier}
        onClose={() => setIsModifierModalVisible(false)}
        onAddToCartWithModifiers={handleAddToCartWithModifiers}
      />

      {/* 4. Payment Processing Modal (QRIS / Tunai) */}
      <PaymentModal
        visible={isPaymentModalVisible}
        orderNumber={String(orderNumber)}
        queueNumber={String(queueNumber).padStart(2, '0')}
        totalAmount={totalAmount}
        paymentMethod={selectedPaymentMethod}
        isOnline={isOnline}
        onClose={() => setIsPaymentModalVisible(false)}
        onConfirmSuccess={handleConfirmPaymentSuccess}
      />

      {/* 5. Digital Thermal Receipt Modal (Item 2) */}
      <ReceiptModal
        visible={isReceiptVisible}
        orderNumber={completedOrder.orderNumber}
        queueNumber={completedOrder.queueNumber}
        items={completedOrder.items}
        subtotal={completedOrder.subtotal}
        totalAmount={completedOrder.totalAmount}
        paymentMethod={completedOrder.paymentMethod}
        cashierName={activeCashier.name}
        boothName={activeCashier.boothName}
        onCloseAndReset={handleCloseReceiptAndReset}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgCanvas,
  },
  rootLayout: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.bgCanvas,
    overflow: 'hidden',
  },
  screenContainer: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: COLORS.bgCanvas,
  },
  splitBody: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  catalogSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    flexDirection: 'column',
  },
  searchRow: {
    marginBottom: 12,
  },
  chipsRow: {
    marginBottom: 14,
  },
  gridContainer: {
    flex: 1,
  },
});
