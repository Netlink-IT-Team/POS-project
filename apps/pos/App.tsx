import React, { useState, useMemo, useEffect } from 'react';
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
import { TransactionHistoryModal } from './src/components/TransactionHistoryModal';
import { StockScreen } from './src/screens/StockScreen';
import { SettlementScreen } from './src/screens/SettlementScreen';
import { LoginScreen, CashierProfile } from './src/screens/LoginScreen';
import { DEFAULT_CATEGORIES, INITIAL_PRODUCTS } from './src/constants/mockData';
import { INITIAL_STOCKS } from './src/constants/mockStocks';
import { CartLineItem, MenuItem, PaymentMethod, ShiftTransaction } from './src/types';
import { BoothStockRecord, ShiftUsageSummary } from './src/types/stock';
import { COLORS, formatRupiah } from './src/constants/theme';
import { offlineQueue } from './src/services/offlineQueue';
import { api } from './src/services/api';
import { AuditPhotoUploadModal } from './src/components/stock/AuditPhotoUploadModal';
import { calculateCartDeductions } from './src/constants/recipes';

const STOCK_STORAGE_KEY = 'kopiko_booth_stocks_v1';
const SHIFT_SALES_KEY = 'kopiko_shift_sales_v1';
const SHIFT_USAGE_KEY = 'kopiko_shift_usage_v1';
const SHIFT_TX_STORAGE_KEY = 'kopiko_shift_transactions_v1';
const SHIFT_INITIAL_CASH_KEY = 'kopiko_shift_initial_cash_v1';

const loadPersistedInitialCash = (): number => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(SHIFT_INITIAL_CASH_KEY);
      if (stored) {
        const parsed = parseFloat(stored);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
    }
  } catch (e) {
    console.warn('[ShiftCash] Gagal membaca storage lokal:', e);
  }
  return 200000;
};

const loadPersistedShiftTransactions = (): ShiftTransaction[] => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(SHIFT_TX_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (e) {
    console.warn('[ShiftTx] Gagal membaca storage lokal:', e);
  }
  return [];
};

const loadPersistedStocks = (): BoothStockRecord[] => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(STOCK_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('[Stocks] Gagal membaca storage lokal:', e);
  }
  return INITIAL_STOCKS;
};

const loadPersistedShiftSales = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(SHIFT_SALES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch (e) {
    console.warn('[ShiftSales] Gagal membaca storage lokal:', e);
  }
  return {
    cashSales: 754000,
    qrisSales: 1240000,
    transactionsCount: 42,
  };
};

const loadPersistedShiftUsage = (): ShiftUsageSummary => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(SHIFT_USAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch (e) {
    console.warn('[ShiftUsage] Gagal membaca storage lokal:', e);
  }
  return {
    coldCups: 38,
    hotCups: 4,
    lids: 42,
    espressoKg: 0.792,
    milkLiters: 4.56,
    arenLiters: 0.95,
    croissantPcs: 3,
    totalTransactions: 42,
  };
};

export default function App() {
  const { width } = useWindowDimensions();

  // Responsive Breakpoints for Tablet Sizes (Small 7"-8" vs Large 10"-11")
  const isSmallTablet = width < 1020;
  const sidebarWidth = isSmallTablet ? 190 : 240;
  const cartWidth = isSmallTablet ? 320 : 380;

  // Auth / Login Session State (Item 1)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
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
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => offlineQueue.getQueue().length);
  const [isOpeningAuditVisible, setIsOpeningAuditVisible] = useState<boolean>(false);

  // Live Shared Stock & Shift Sales State (Persistent across browser refresh)
  const [stocks, setStocks] = useState<BoothStockRecord[]>(loadPersistedStocks);
  const [shiftSales, setShiftSales] = useState<{
    cashSales: number;
    qrisSales: number;
    transactionsCount: number;
  }>(loadPersistedShiftSales);
  const [shiftUsage, setShiftUsage] = useState<ShiftUsageSummary>(loadPersistedShiftUsage);
  const [shiftTransactions, setShiftTransactions] = useState<ShiftTransaction[]>(loadPersistedShiftTransactions);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState<boolean>(false);
  const [initialDrawerCash, setInitialDrawerCash] = useState<number>(loadPersistedInitialCash);

  // Automatically sync stocks to localStorage on any change (restock or recipe deduction)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(stocks));
      }
    } catch (e) {
      console.error('[Stocks] Gagal menyimpan stok:', e);
    }
  }, [stocks]);

  // Persist shiftSales to localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(SHIFT_SALES_KEY, JSON.stringify(shiftSales));
      }
    } catch (e) {
      console.error('[ShiftSales] Gagal menyimpan shift sales:', e);
    }
  }, [shiftSales]);

  // Persist shiftUsage to localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(SHIFT_USAGE_KEY, JSON.stringify(shiftUsage));
      }
    } catch (e) {
      console.error('[ShiftUsage] Gagal menyimpan shift usage:', e);
    }
  }, [shiftUsage]);

  // Persist shiftTransactions to localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(SHIFT_TX_STORAGE_KEY, JSON.stringify(shiftTransactions));
      }
    } catch (e) {
      console.error('[ShiftTx] Gagal menyimpan riwayat transaksi:', e);
    }
  }, [shiftTransactions]);

  // Persist initialDrawerCash to localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(SHIFT_INITIAL_CASH_KEY, String(initialDrawerCash));
      }
    } catch (e) {
      console.error('[ShiftCash] Gagal menyimpan modal awal kas:', e);
    }
  }, [initialDrawerCash]);

  // Catalog Filter State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart & Order State
  const [orderNumber, setOrderNumber] = useState<number>(101);
  const [queueNumber, setQueueNumber] = useState<number>(1);
  const [cartItems, setCartItems] = useState<CartLineItem[]>([]);
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
    cashReceived?: number;
    change?: number;
    qrisRef?: string;
  }>({
    orderNumber: '104',
    queueNumber: '04',
    items: [],
    subtotal: 0,
    totalAmount: 0,
    paymentMethod: 'qris',
    cashReceived: 0,
    change: 0,
    qrisRef: '',
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

  // Payment Confirmation -> Triggers Receipt Modal & Updates Stock + Settlement
  const handleConfirmPaymentSuccess = (paymentData?: {
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    change?: number;
    qrisRef?: string;
  }) => {
    setIsPaymentModalVisible(false);

    const method = paymentData?.paymentMethod || selectedPaymentMethod;
    const cashRec = paymentData?.cashReceived ?? totalAmount;
    const changeAmt = paymentData?.change ?? 0;
    const refCode = paymentData?.qrisRef || `XND-${orderNumber}`;

    // 1. Save completed order details for receipt
    setCompletedOrder({
      orderNumber: String(orderNumber),
      queueNumber: String(queueNumber).padStart(2, '0'),
      items: [...cartItems],
      subtotal,
      totalAmount,
      paymentMethod: method,
      cashReceived: cashRec,
      change: changeAmt,
      qrisRef: refCode,
    });

    // 1b. Record to Shift Transactions History for re-printing anytime
    const newTx: ShiftTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orderNumber: String(orderNumber),
      queueNumber: String(queueNumber).padStart(2, '0'),
      items: [...cartItems],
      subtotal,
      totalAmount,
      paymentMethod: method,
      cashReceived: cashRec,
      change: changeAmt,
      qrisRef: refCode,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      cashierName: activeCashier.name,
    };
    setShiftTransactions((prev) => [newTx, ...prev]);

    // 2. Decrement physical stock accurately using recipe BOM
    const deductions = calculateCartDeductions(cartItems);

    setStocks((prevStocks) =>
      prevStocks.map((stock) => {
        const deductQty = deductions[stock.sku];
        if (deductQty && deductQty > 0) {
          return {
            ...stock,
            quantity: Math.max(0, Math.round((stock.quantity - deductQty) * 1000) / 1000),
            updated_at: new Date().toISOString(),
          };
        }
        return stock;
      })
    );

    // 2b. Accumulate shift recipe usage for Z-Report & Audit
    setShiftUsage((prev) => ({
      ...prev,
      coldCups: prev.coldCups + (deductions['PKG-C12-01'] || 0),
      hotCups: prev.hotCups + (deductions['PKG-H8-01'] || 0),
      lids: prev.lids + (deductions['LID-H8-01'] || 0),
      espressoKg: Math.round((prev.espressoKg + (deductions['RAW-ESP-01'] || 0) + (deductions['RAW-GYO-01'] || 0)) * 1000) / 1000,
      milkLiters: Math.round((prev.milkLiters + (deductions['RAW-MLK-01'] || 0)) * 1000) / 1000,
      arenLiters: Math.round((prev.arenLiters + (deductions['RAW-ARN-01'] || 0)) * 1000) / 1000,
      croissantPcs: prev.croissantPcs + (deductions['RAW-CRS-01'] || 0),
      totalTransactions: prev.totalTransactions + 1,
    }));

    // 3. Update Shift Sales & Reconciliation for Settlement Screen
    setShiftSales((prev) => ({
      cashSales: method === 'cash' ? prev.cashSales + totalAmount : prev.cashSales,
      qrisSales: method === 'qris' ? prev.qrisSales + totalAmount : prev.qrisSales,
      transactionsCount: prev.transactionsCount + 1,
    }));

    // 4. Send transaction to Go Backend API (:8080) or queue locally if offline
    const idempotencyKey = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const txPayload = {
      idempotency_key: idempotencyKey,
      booth_id: 'booth-01',
      shift_id: 'shift-today-01',
      cashier_id: activeCashier.id,
      payment_method: method,
      status: 'completed' as const,
      total_amount: totalAmount,
      offline_created_at: new Date().toISOString(),
      items: cartItems.map((item) => ({
        menu_id: item.menuId,
        quantity: item.quantity,
        price_per_unit: item.pricePerUnit,
        modifiers: item.modifiersText,
      })),
    };

    if (isOnline) {
      api.createTransaction(
        {
          booth_id: 'booth-01',
          shift_id: 'shift-today-01',
          payment_method: method,
          total_amount: totalAmount,
          cash_received: method === 'cash' ? cashRec : 0,
          items: txPayload.items,
        },
        idempotencyKey
      )
        .then((data) => {
          console.log('[Kopiko POS] Transaksi tercatat di Go Backend:', data);
        })
        .catch((err) => {
          console.warn('[Kopiko POS] Server offline, memasukkan ke antrean lokal:', err);
          offlineQueue.enqueue(txPayload);
          setPendingSyncCount(offlineQueue.getQueue().length);
        });
    } else {
      offlineQueue.enqueue(txPayload);
      setPendingSyncCount(offlineQueue.getQueue().length);
    }

    // Open receipt modal
    setIsReceiptVisible(true);
  };

  const handleTriggerSync = async () => {
    try {
      const res = await offlineQueue.syncToServer(activeCashier.boothName);
      setPendingSyncCount(res.remaining);
      if (res.syncedCount > 0) {
        Alert.alert(
          'Sinkronisasi Berhasil',
          `${res.syncedCount} transaksi offline berhasil disinkronkan ke server pusat.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Info Antrean', 'Semua transaksi sudah tersinkronisasi.', [{ text: 'OK' }]);
      }
    } catch (err: any) {
      Alert.alert(
        'Sinkronisasi Tertunda',
        'Gagal menghubungi server Go backend. Transaksi tetap tersimpan aman di tablet.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSubmitOpeningAudit = async (data: {
    cashDrawer: number;
    auditItems: Array<{
      item_name: string;
      tracking_type: 'weighed' | 'counted';
      measured_quantity: number;
      unit: string;
      photo_url: string;
    }>;
    notes?: string;
  }) => {
    // 1. Simpan modal kas awal yang ditentukan kasir
    setInitialDrawerCash(data.cashDrawer);

    try {
      await api.openShift({
        booth_id: 'booth-01',
        cashier_id: activeCashier.id,
        shift_number: 1,
        opening_cash: data.cashDrawer,
        audit_items: data.auditItems,
      });
      Alert.alert(
        'Buka Shift Berhasil',
        `Shift dibuka dengan modal awal laci ${formatRupiah(data.cashDrawer)} dan sisa stok shift sebelumnya terverifikasi otomatis.`
      );
    } catch (err) {
      Alert.alert(
        'Shift Dibuka Secara Lokal',
        `Modal awal kasir ${formatRupiah(data.cashDrawer)} dan sisa stok shift sebelumnya tersimpan di tablet (backend Go offline).`
      );
    }
    setIsOpeningAuditVisible(false);
  };

  const handleCloseReceiptAndReset = () => {
    setIsReceiptVisible(false);
    setCartItems([]);
    setOrderNumber((prev) => prev + 1);
    setQueueNumber((prev) => prev + 1);
  };

  // Shift Closure Cycle: Reset omzet & recipe BOM usage to 0, clear cart, and auto logout to PIN screen
  const handleShiftClosed = () => {
    // 1. Reset Shift Omzet & Count to 0
    setShiftSales({
      cashSales: 0,
      qrisSales: 0,
      transactionsCount: 0,
    });

    // 2. Reset Cumulative Recipe Ingredient Usage to 0
    setShiftUsage({
      coldCups: 0,
      hotCups: 0,
      lids: 0,
      espressoKg: 0,
      milkLiters: 0,
      arenLiters: 0,
      croissantPcs: 0,
      totalTransactions: 0,
    });

    // 2b. Reset shift transactions history for next shift
    setShiftTransactions([]);

    // 3. Clear cart and reset order queue
    setCartItems([]);
    setQueueNumber(1);

    // 4. Return route to menu
    setActiveRoute('menu');

    // 5. Automatically log out to PIN Login Screen for next shift cashier
    setIsLoggedIn(false);

    // 6. Pre-arm opening audit modal so next shift cashier is prompted immediately after login
    setIsOpeningAuditVisible(true);
  };

  // Re-print selected past receipt from Shift Transactions History
  const handleReprintOrder = (tx: ShiftTransaction) => {
    setCompletedOrder({
      orderNumber: tx.orderNumber,
      queueNumber: tx.queueNumber,
      items: tx.items,
      subtotal: tx.subtotal,
      totalAmount: tx.totalAmount,
      paymentMethod: tx.paymentMethod,
      cashReceived: tx.cashReceived,
      change: tx.change,
      qrisRef: tx.qrisRef,
    });
    setIsHistoryModalVisible(false);
    setIsReceiptVisible(true);
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
              stocks={stocks}
              setStocks={setStocks}
              pendingSyncCount={pendingSyncCount}
              onTriggerSync={handleTriggerSync}
              onOpenShiftAudit={() => setIsOpeningAuditVisible(true)}
              onOpenHistory={() => setIsHistoryModalVisible(true)}
            />
          </View>
        ) : activeRoute === 'settlement' ? (
          <View style={styles.screenContainer}>
            <SettlementScreen
              isOnline={isOnline}
              onToggleOnline={() => setIsOnline((prev) => !prev)}
              boothName={activeCashier.boothName}
              cashierName={activeCashier.name}
              cashSales={shiftSales.cashSales}
              qrisSales={shiftSales.qrisSales}
              transactionsCount={shiftSales.transactionsCount}
              initialDrawerCash={initialDrawerCash}
              onUpdateInitialDrawerCash={setInitialDrawerCash}
              shiftUsage={shiftUsage}
              stocks={stocks}
              onShiftClosed={handleShiftClosed}
              pendingSyncCount={pendingSyncCount}
              onTriggerSync={handleTriggerSync}
              onOpenShiftAudit={() => setIsOpeningAuditVisible(true)}
              onOpenHistory={() => setIsHistoryModalVisible(true)}
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
              pendingSyncCount={pendingSyncCount}
              onTriggerSync={handleTriggerSync}
              onOpenShiftAudit={() => setIsOpeningAuditVisible(true)}
              onOpenHistory={() => setIsHistoryModalVisible(true)}
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
        cashReceived={completedOrder.cashReceived}
        change={completedOrder.change}
        qrisRef={completedOrder.qrisRef}
        cashierName={activeCashier.name}
        boothName={activeCashier.boothName}
        onCloseAndReset={handleCloseReceiptAndReset}
      />

      {/* 6. Opening Shift Physical Stock & Weight Audit Modal */}
      <AuditPhotoUploadModal
        visible={isOpeningAuditVisible}
        stage="opening"
        cashierName={activeCashier.name}
        boothName={activeCashier.boothName}
        stocks={stocks}
        initialCashDrawer={initialDrawerCash}
        onClose={() => setIsOpeningAuditVisible(false)}
        onSubmitAudit={handleSubmitOpeningAudit}
      />

      {/* 7. Shift Transaction History Modal & Re-Print Struk */}
      <TransactionHistoryModal
        visible={isHistoryModalVisible}
        transactions={shiftTransactions}
        onClose={() => setIsHistoryModalVisible(false)}
        onReprintReceipt={handleReprintOrder}
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
