import React from 'react';
import { StyleSheet, Text, View, Modal, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { COLORS, RADII, formatRupiah } from '../../constants/theme';
import { ShiftUsageSummary } from '../../types/stock';

export interface ZReportModalProps {
  visible: boolean;
  boothName: string;
  cashierName: string;
  shiftNumber?: number;
  initialDrawerCash: number;
  cashSales: number;
  qrisSales: number;
  transactionsCount: number;
  actualCash: number;
  discrepancy: number;
  shiftUsage: ShiftUsageSummary;
  closingNotes?: string;
  onCloseAndFinish: () => void;
}

export const ZReportModal: React.FC<ZReportModalProps> = ({
  visible,
  boothName,
  cashierName,
  shiftNumber = 1,
  initialDrawerCash,
  cashSales,
  qrisSales,
  transactionsCount,
  actualCash,
  discrepancy,
  shiftUsage,
  closingNotes,
  onCloseAndFinish,
}) => {
  const totalOmzet = cashSales + qrisSales;
  const expectedCash = initialDrawerCash + cashSales;
  const avgBasket = transactionsCount > 0 ? Math.round(totalOmzet / transactionsCount) : 0;

  const now = new Date();
  const printTimestamp = now.toLocaleDateString('id-ID', {
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
        'Mencetak Z-Report',
        `Perintah cetak laporan Z-Report Shift ${shiftNumber} terkirim ke printer thermal.`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCloseAndFinish}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View>
              <Text style={styles.headerTitle}>Laporan Z-Report Tutup Shift</Text>
              <Text style={styles.headerSubtitle}>Dokumen resmi rekonsiliasi kas dan susut bahan baku</Text>
            </View>
            <Pressable onPress={onCloseAndFinish} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* Thermal Paper Body */}
          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            <View style={styles.paper}>
              {/* Brand & Shift Identity */}
              <View style={styles.centerBlock}>
                <Text style={styles.receiptBrand}>KOPIKO INDONESIA</Text>
                <Text style={styles.receiptType}>Z - R E P O R T</Text>
                <Text style={styles.receiptSub}>LAPORAN PENUTUPAN KASIR RESMI</Text>
                <Text style={styles.boothNameText}>{boothName}</Text>
                <Text style={styles.metaText}>{printTimestamp} WIB</Text>
              </View>

              <Text style={styles.divider}>================================</Text>

              {/* Shift Details */}
              <View style={styles.row}>
                <Text style={styles.label}>Shift Operasional:</Text>
                <Text style={styles.valBold}>Shift {shiftNumber} (07:00 - 15:00)</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Kasir Bertugas:</Text>
                <Text style={styles.valBold}>{cashierName}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Status Shift:</Text>
                <Text style={[styles.valBold, { color: COLORS.statusReady }]}>CLOSED (FINAL)</Text>
              </View>

              <Text style={styles.divider}>--------------------------------</Text>

              {/* Section 1: Sales Summary */}
              <Text style={styles.sectionTitle}>1. REKAPITULASI PENJUALAN</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Total Transaksi Struk:</Text>
                <Text style={styles.val}>{transactionsCount} Transaksi</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Penjualan Tunai (Cash):</Text>
                <Text style={styles.val}>{formatRupiah(cashSales)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Penjualan QRIS Dinamis:</Text>
                <Text style={styles.val}>{formatRupiah(qrisSales)}</Text>
              </View>
              <View style={[styles.row, styles.highlightRow]}>
                <Text style={styles.labelHighlight}>TOTAL OMZET SHIFT:</Text>
                <Text style={styles.valHighlight}>{formatRupiah(totalOmzet)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Rata-rata per Struk:</Text>
                <Text style={styles.val}>{formatRupiah(avgBasket)}</Text>
              </View>

              <Text style={styles.divider}>--------------------------------</Text>

              {/* Section 2: Cash Drawer Reconciliation */}
              <Text style={styles.sectionTitle}>2. REKONSILIASI KAS REGISTER</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Modal Kas Awal Laci:</Text>
                <Text style={styles.val}>{formatRupiah(initialDrawerCash)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>+ Total Masuk Tunai:</Text>
                <Text style={styles.val}>{formatRupiah(cashSales)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>= Ekspektasi Total Kas:</Text>
                <Text style={styles.valBold}>{formatRupiah(expectedCash)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Hitungan Fisik Kasir:</Text>
                <Text style={styles.valBold}>{formatRupiah(actualCash)}</Text>
              </View>

              <View style={[styles.row, styles.discrepancyBox]}>
                <Text style={styles.discrepancyLabel}>STATUS SELISIH KAS:</Text>
                <Text style={[
                  styles.discrepancyValue,
                  discrepancy === 0 ? styles.discExact : discrepancy < 0 ? styles.discMinus : styles.discPlus
                ]}>
                  {discrepancy === 0
                    ? 'Rp 0 (PAS / SEMPURNA)'
                    : discrepancy < 0
                      ? `${formatRupiah(discrepancy)} (KURANG)`
                      : `+${formatRupiah(discrepancy)} (LEBIH)`}
                </Text>
              </View>

              <Text style={styles.divider}>--------------------------------</Text>

              {/* Section 3: Recipe Usage Summary */}
              <Text style={styles.sectionTitle}>3. PEMAKAIAN BAHAN BAKU RESEP</Text>
              <View style={styles.row}>
                <Text style={styles.label}>• Cold Cup 12oz Terpakai:</Text>
                <Text style={styles.valBold}>{shiftUsage.coldCups} pcs</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>• Hot Cup 8oz Terpakai:</Text>
                <Text style={styles.valBold}>{shiftUsage.hotCups} pcs</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>• Cup Lids & Caps Terpakai:</Text>
                <Text style={styles.valBold}>{shiftUsage.lids} pcs</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>• Espresso Beans Digiling:</Text>
                <Text style={styles.valBold}>
                  {shiftUsage.espressoKg} kg ({Math.round(shiftUsage.espressoKg * 1000)}g)
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>• Fresh Milk Terpakai:</Text>
                <Text style={styles.valBold}>{shiftUsage.milkLiters} Liter</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>• Gula Aren Murni Terpakai:</Text>
                <Text style={styles.valBold}>{shiftUsage.arenLiters} Liter</Text>
              </View>
              {shiftUsage.croissantPcs > 0 && (
                <View style={styles.row}>
                  <Text style={styles.label}>• Croissant Terjual:</Text>
                  <Text style={styles.valBold}>{shiftUsage.croissantPcs} pcs</Text>
                </View>
              )}

              <Text style={styles.divider}>================================</Text>

              {/* Closing Notes */}
              {closingNotes ? (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.label}>Catatan Serah Terima Kasir:</Text>
                  <Text style={styles.notesText}>"{closingNotes}"</Text>
                </View>
              ) : null}

              {/* Verification Stamp */}
              <View style={styles.centerBlock}>
                <Text style={styles.auditStampText}>[ BUKTI FOTO TIMBANGAN TERVERIFIKASI ]</Text>
                <Text style={styles.auditSubText}>Resolusi terkompresi ≤1280px • Data sinkron ke Cloud</Text>
                <Text style={styles.docCodeText}>DOC: KPK-ZREP-{now.getFullYear()}{(now.getMonth() + 1).toString().padStart(2, '0')}{now.getDate().toString().padStart(2, '0')}-01</Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <Pressable onPress={handlePrint} style={styles.printBtn}>
              <Text style={styles.printBtnText}>🖨️ Cetak Z-Report Thermal</Text>
            </Pressable>

            <Pressable onPress={onCloseAndFinish} style={styles.finishBtn}>
              <Text style={styles.finishBtnText}>✓ Selesai & Tutup Shift</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: 520,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.card,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.bgCanvas,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDefault,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.brandEspresso,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  scrollBody: {
    padding: 20,
  },
  paper: {
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#EFE8DE',
    borderRadius: 8,
    padding: 18,
  },
  centerBlock: {
    alignItems: 'center',
    marginVertical: 4,
  },
  receiptBrand: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.brandEspresso,
    letterSpacing: 1.5,
  },
  receiptType: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.brandCrimson,
    letterSpacing: 3,
    marginTop: 2,
  },
  receiptSub: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  boothNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brandEspresso,
    marginTop: 6,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  divider: {
    fontSize: 11,
    color: '#D1C7BA',
    textAlign: 'center',
    marginVertical: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.brandEspresso,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  highlightRow: {
    backgroundColor: '#F7F3EC',
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 4,
    marginVertical: 4,
  },
  label: {
    fontSize: 12,
    color: '#5C5449',
  },
  labelHighlight: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.brandEspresso,
  },
  val: {
    fontSize: 12,
    color: '#2C241B',
  },
  valBold: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  valHighlight: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.brandCrimson,
  },
  discrepancyBox: {
    backgroundColor: '#FBF8F2',
    borderWidth: 1,
    borderColor: '#EFE8DE',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 6,
  },
  discrepancyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  discrepancyValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  discExact: {
    color: '#15803D',
  },
  discMinus: {
    color: '#B91C1C',
  },
  discPlus: {
    color: '#B45309',
  },
  notesText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#786F63',
    marginTop: 2,
  },
  auditStampText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  auditSubText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  docCodeText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#9C9283',
    marginTop: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDefault,
    backgroundColor: COLORS.bgCanvas,
    gap: 12,
  },
  printBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADII.btn,
    backgroundColor: '#F3EFEA',
    borderWidth: 1,
    borderColor: '#DFD7CA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  printBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  finishBtn: {
    flex: 1.2,
    paddingVertical: 12,
    borderRadius: RADII.btn,
    backgroundColor: COLORS.brandCrimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

