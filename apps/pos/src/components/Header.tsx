import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { COLORS, RADII } from '../constants/theme';

export interface HeaderProps {
  boothName: string;
  isOnline: boolean;
  cashierName: string;
  onToggleOnline?: () => void;
  pendingSyncCount?: number;
  onTriggerSync?: () => void;
  onOpenShiftAudit?: () => void;
  onOpenHistory?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  boothName,
  isOnline,
  cashierName,
  onToggleOnline,
  pendingSyncCount = 0,
  onTriggerSync,
  onOpenShiftAudit,
  onOpenHistory,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <View style={styles.container}>
      {/* Left: Booth identity & Connection status */}
      <View style={styles.leftGroup}>
        {/* Booth Tag */}
        <View style={styles.boothPill}>
          <Text style={styles.pinIcon}>📍</Text>
          <Text style={styles.boothName}>{boothName}</Text>
        </View>

        {/* Network status pill */}
        <Pressable
          onPress={onToggleOnline}
          style={({ pressed }) => [
            styles.statusPill,
            isOnline ? styles.statusOnline : styles.statusOffline,
            pressed && { opacity: 0.8 },
          ]}
          hitSlop={8}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? COLORS.statusOnline : COLORS.statusOffline },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isOnline ? COLORS.statusOnlineText : COLORS.statusOfflineText },
            ]}
          >
            {isOnline ? 'Online POS' : 'Offline POS (Lokal)'}
          </Text>
        </Pressable>

        {/* Offline Queue Sync Indicator */}
        {pendingSyncCount > 0 ? (
          <Pressable
            onPress={onTriggerSync}
            style={({ pressed }) => [styles.syncBadge, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.syncBadgeText}>
              ⚠️ {pendingSyncCount} Antrean Sync 🔄
            </Text>
          </Pressable>
        ) : (
          <View style={styles.syncedBadge}>
            <Text style={styles.syncedBadgeText}>✓ Cloud Synced</Text>
          </View>
        )}
      </View>

      {/* Right: Audit trigger & Cashier identity */}
      <View style={styles.rightGroup}>
        {onOpenHistory && (
          <Pressable
            onPress={onOpenHistory}
            style={({ pressed }) => [styles.historyBtn, pressed && { opacity: 0.85 }]}
            hitSlop={6}
          >
            <Text style={styles.historyBtnText}>📋 Riwayat Transaksi</Text>
          </Pressable>
        )}

        {onOpenShiftAudit && (
          <Pressable
            onPress={onOpenShiftAudit}
            style={({ pressed }) => [styles.auditTriggerBtn, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.auditTriggerText}>⚖️ Verifikasi / Buka Shift</Text>
          </Pressable>
        )}

        <View style={styles.cashierInfo}>
          <Text style={styles.cashierName}>{cashierName}</Text>
          <Text style={styles.cashierRole}>Kasir Operasional</Text>
        </View>

        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{getInitials(cashierName)}</Text>
          </View>
          <View style={styles.avatarPresence} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 72,
    backgroundColor: COLORS.bgHeader,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderHeader,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  boothPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brandEspresso,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADII.pill,
  },
  pinIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  boothName: {
    color: '#FBF9F5',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADII.pill,
    borderWidth: 1,
  },
  statusOnline: {
    backgroundColor: COLORS.statusOnlineBg,
    borderColor: COLORS.statusOnlineBorder,
  },
  statusOffline: {
    backgroundColor: COLORS.statusOfflineBg,
    borderColor: COLORS.statusOfflineBorder,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cashierInfo: {
    alignItems: 'flex-end',
  },
  cashierName: {
    color: COLORS.brandEspresso,
    fontSize: 14,
    fontWeight: '700',
  },
  cashierRole: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.brandEspresso,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  avatarPresence: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.statusOnline,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  syncBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: RADII.pill,
  },
  syncBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  syncedBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: RADII.pill,
  },
  syncedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  historyBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.brandEspresso,
    borderRadius: RADII.btn,
    marginRight: 6,
  },
  historyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.brandEspresso,
  },
  auditTriggerBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F3EFEA',
    borderWidth: 1,
    borderColor: '#E2DBD3',
    borderRadius: RADII.btn,
  },
  auditTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
});

