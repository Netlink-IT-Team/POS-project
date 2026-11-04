import React from 'react';
import { StyleSheet, Text, View, Modal, Pressable, ScrollView, Alert } from 'react-native';
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
    Alert.alert(
      'Mencetak Struk Fisik',
      `Perintah cetak Bluetooth Thermal Printer terkirim untuk Pesanan #${orderNumber}.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCloseAndReset}>
      <View style={styles.backdrop}>
        <View style={styles.receiptContainer}>
          {/* Thermal Paper Card */}
          <View style={styles.paper}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.paperContent}>
              {/* Header Struk */}
              <View style={styles.brandHeader}>
                <Text style={styles.brandTitle}>KOPIKO</Text>
                <Text style={styles.brandSub}>INDONESIAN ROASTED COFFEE</Text>
                <Text style={styles.boothAddress}>{boothName}</Text>
                <Text style={styles.metaRowText}>Mall Senayan Ground Floor #01, Jakarta</Text>
              </View>

              <View style={styles.dashedDivider} />

              {/* Order Info */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>No. Pesanan:</Text>
                <Text style={styles.infoValue}>#{orderNumber}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>No. Antrean:</Text>
                <Text style={[styles.infoValue, { color: COLORS.brandCrimson }]}>
                  {queueNumber}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Waktu:</Text>
                <Text style={styles.infoValue}>{transactionTime} WIB</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Kasir:</Text>
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

              {/* Summary */}
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Subtotal</Text>
                <Text style={styles.calcVal}>{formatRupiah(subtotal)}</Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Pajak PB1 (10% Inc.)</Text>
                <Text style={styles.calcVal}>Rp 0</Text>
              </View>

              <View style={[styles.calcRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>TOTAL BAYAR</Text>
                <Text style={styles.totalVal}>{formatRupiah(totalAmount)}</Text>
              </View>

              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Metode Bayar:</Text>
                <Text style={styles.calcVal}>
                  {paymentMethod === 'qris' ? 'QRIS Dinamis (Xendit)' : 'Tunai (Cash)'}
                </Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Status:</Text>
                <Text style={[styles.calcVal, { color: COLORS.statusReady }]}>LUNAS (PAID)</Text>
              </View>

              <View style={styles.dashedDivider} />

              {/* Barcode & Footer Message */}
              <View style={styles.barcodeSection}>
                <Text style={styles.barcodeText}>||||| | ||||| |||| |||||| ||||| |||||</Text>
                <Text style={styles.barcodeSub}>TRX-{Date.now().toString().slice(-8)}</Text>
                <Text style={styles.thankyouText}>Terima kasih atas kunjungan Anda!</Text>
                <Text style={styles.brandFooter}>www.kopiko.id • Layanan Konsumen: 1500-KPK</Text>
              </View>
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <Pressable onPress={handlePrint} style={styles.btnPrint}>
              <Text style={styles.btnPrintText}>🖨️ Cetak Struk</Text>
            </Pressable>

            <Pressable onPress={onCloseAndReset} style={styles.btnNewOrder}>
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
    width: 400,
    maxHeight: '92%',
  },
  paper: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.btn,
    padding: 24,
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
    marginBottom: 10,
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
    marginTop: 6,
  },
  metaRowText: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#D1CAC3',
    borderStyle: 'dashed',
    marginVertical: 12,
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
    fontSize: 15,
    fontWeight: '900',
    color: '#000000',
  },
  barcodeSection: {
    alignItems: 'center',
    paddingTop: 4,
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
    marginBottom: 8,
  },
  thankyouText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111111',
  },
  brandFooter: {
    fontSize: 9,
    color: '#777777',
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
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  btnNewOrder: {
    flex: 1.3,
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
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

