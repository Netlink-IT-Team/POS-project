import React from 'react';
import { StyleSheet, Text, View, Modal, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { CartLineItem, PaymentMethod } from '../types';
import { COLORS, RADII, formatRupiah } from '../constants/theme';

export interface ReceiptModalProps {
  visible: boolean;
  orderNumber: string;
  queueNumber: string;
  items: CartLineItem[];
  subtotal: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  change?: number;
  qrisRef?: string;
  cashierName: string;
  boothName: string;
  onCloseAndReset: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  visible,
  orderNumber,
  queueNumber,
  items,
  subtotal,
  totalAmount,
  paymentMethod,
  cashReceived = totalAmount,
  change = 0,
  qrisRef,
  cashierName,
  boothName,
  onCloseAndReset,
}) => {
  const transactionTime = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    } else {
      Alert.alert(
        'Mencetak Struk Fisik Thermal',
        `Perintah cetak Bluetooth Thermal Printer terkirim untuk Pesanan #${orderNumber}.`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCloseAndReset}>
      {/* Thermal Print Stylesheet for Web/Browser */}
      {Platform.OS === 'web' && (
        <style>{`
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
            }
            body * {
              visibility: hidden !important;
            }
            #thermal-receipt-paper, #thermal-receipt-paper * {
              visibility: visible !important;
            }
            #thermal-receipt-paper {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 78mm !important;
              max-width: 78mm !important;
              margin: 0 auto !important;
              padding: 4mm !important;
              box-shadow: none !important;
              border: none !important;
              background: #ffffff !important;
              color: #000000 !important;
            }
          }
        `}</style>
      )}

      <View style={styles.backdrop}>
        <View style={styles.receiptContainer}>
          {/* Thermal Paper Card */}
          <View nativeID="thermal-receipt-paper" style={styles.paper}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.paperContent}>
              {/* Header Struk */}
              <View style={styles.brandHeader}>
                <Text style={styles.brandTitle}>KOPIKO</Text>
                <Text style={styles.brandSub}>INDONESIAN ROASTED COFFEE</Text>
                <Text style={styles.boothAddress}>{boothName}</Text>
                <Text style={styles.metaRowText}>Mall Senayan Ground Floor #01, Jakarta</Text>
              </View>

              <View style={styles.dashedDivider} />

              {/* Large Queue Box (Barista Priority View) */}
              <View style={styles.queueCallout}>
                <Text style={styles.queueCalloutLabel}>NOMOR ANTREAN</Text>
                <Text style={styles.queueCalloutNumber}>{queueNumber}</Text>
              </View>

              <View style={styles.dashedDivider} />

              {/* Order Info */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>No. Pesanan:</Text>
                <Text style={styles.infoValue}>#{orderNumber}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Waktu Transaksi:</Text>
                <Text style={styles.infoValue}>{transactionTime} WIB</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Kasir Bertugas:</Text>
                <Text style={styles.infoValue}>{cashierName}</Text>
              </View>

              <View style={styles.dashedDivider} />

              {/* Line Items */}
              <View style={styles.itemsList}>
                {items.map((item, idx) => (
                  <View key={idx} style={styles.itemBlock}>
                    <View style={styles.itemMainRow}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemSubtotal}>{formatRupiah(item.subtotal)}</Text>
                    </View>
                    <View style={styles.itemSubRow}>
                      <Text style={styles.itemModifiers}>{item.modifiersText || '-'}</Text>
                      <Text style={styles.itemQtyPrice}>
                        {item.quantity} × {formatRupiah(item.pricePerUnit)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.dashedDivider} />

              {/* Financial Calculations */}
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Subtotal Produk</Text>
                <Text style={styles.calcVal}>{formatRupiah(subtotal)}</Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Pajak Restoran PB1 (Inc.)</Text>
                <Text style={styles.calcVal}>Rp 0</Text>
              </View>

              <View style={[styles.calcRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>TOTAL BAYAR</Text>
                <Text style={styles.totalVal}>{formatRupiah(totalAmount)}</Text>
              </View>

              {/* Payment Method Breakdown */}
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Metode Pembayaran:</Text>
                <Text style={styles.calcVal}>
                  {paymentMethod === 'qris' ? 'QRIS Dinamis (Xendit)' : 'Tunai (Cash)'}
                </Text>
              </View>

              {paymentMethod === 'cash' ? (
                <>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Uang Tunai Diterima:</Text>
                    <Text style={styles.calcVal}>{formatRupiah(cashReceived)}</Text>
                  </View>
                  <View style={[styles.calcRow, styles.changeHighlightRow]}>
                    <Text style={styles.changeLabelBold}>KEMBALIAN:</Text>
                    <Text style={styles.changeValBold}>{formatRupiah(change)}</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Ref Transaksi QRIS:</Text>
                    <Text style={styles.calcVal}>{qrisRef || `XND-${orderNumber}`}</Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Status Verifikasi:</Text>
                    <Text style={[styles.calcVal, { color: COLORS.statusReady }]}>LUNAS (PAID)</Text>
                  </View>
                </>
              )}

              <View style={styles.dashedDivider} />

              {/* Barcode & Thermal Footer */}
              <View style={styles.barcodeSection}>
                <Text style={styles.barcodeText}>||||| | ||||| |||| |||||| ||||| |||||</Text>
                <Text style={styles.barcodeSub}>TRX-{Date.now().toString().slice(-8)}</Text>
                <Text style={styles.thankyouText}>Terima kasih atas kunjungan Anda!</Text>
                <Text style={styles.receiptFooterNotice}>
                  Simpan struk fisik ini sebagai bukti pembelian yang sah.
                </Text>
                <Text style={styles.brandFooter}>www.kopiko.id • Layanan Konsumen: 1500-KPK</Text>
              </View>
            </ScrollView>
          </View>

          {/* Touch-Friendly Action Buttons */}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={handlePrint}
              style={({ pressed }) => [styles.btnPrint, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.btnPrintText}>🖨️ Cetak Struk Thermal</Text>
            </Pressable>

            <Pressable
              onPress={onCloseAndReset}
              style={({ pressed }) => [styles.btnNewOrder, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.btnNewOrderText}>✓ Pesanan Baru</Text>
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
    backgroundColor: 'rgba(29, 15, 10, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  receiptContainer: {
    width: 420,
    maxHeight: '94%',
  },
  paper: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.btn,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  paperContent: {
    paddingBottom: 4,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#000000',
  },
  brandSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#555555',
    letterSpacing: 1,
    marginTop: 2,
  },
  boothAddress: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111',
    marginTop: 4,
  },
  metaRowText: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
  },
  queueCallout: {
    alignItems: 'center',
    backgroundColor: '#F9F7F4',
    paddingVertical: 8,
    borderRadius: 6,
    marginVertical: 2,
  },
  queueCalloutLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#666666',
    letterSpacing: 1,
  },
  queueCalloutNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.brandCrimson,
    marginTop: 2,
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#D1CAC3',
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111111',
  },
  itemsList: {
    gap: 8,
  },
  itemBlock: {
    marginBottom: 4,
  },
  itemMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111',
    flex: 1,
    marginRight: 6,
  },
  itemSubtotal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111',
  },
  itemSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  itemModifiers: {
    fontSize: 10,
    color: '#666666',
    fontStyle: 'italic',
  },
  itemQtyPrice: {
    fontSize: 10,
    color: '#666666',
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  calcLabel: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
  },
  calcVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111111',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 6,
    marginTop: 6,
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
  },
  totalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
  },
  changeHighlightRow: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 2,
  },
  changeLabelBold: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  changeValBold: {
    fontSize: 13,
    fontWeight: '900',
    color: '#15803D',
  },
  barcodeSection: {
    alignItems: 'center',
    paddingTop: 2,
  },
  barcodeText: {
    fontSize: 14,
    letterSpacing: 3,
    fontWeight: '800',
    color: '#333333',
  },
  barcodeSub: {
    fontSize: 9,
    color: '#666666',
    marginTop: 2,
    marginBottom: 6,
  },
  thankyouText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111111',
  },
  receiptFooterNotice: {
    fontSize: 9,
    color: '#777777',
    marginTop: 2,
  },
  brandFooter: {
    fontSize: 8.5,
    color: '#999999',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  btnPrint: {
    flex: 1,
    height: 48,
    borderRadius: RADII.btn,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.brandEspresso,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrintText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  btnNewOrder: {
    flex: 1.2,
    height: 48,
    borderRadius: RADII.btn,
    backgroundColor: COLORS.brandCrimson,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.brandCrimson,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  btnNewOrderText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
