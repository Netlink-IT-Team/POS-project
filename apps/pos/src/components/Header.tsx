import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { COLORS, RADII } from '../constants/theme';

export interface HeaderProps {
  boothName: string;
  isOnline: boolean;
  cashierName: string;
  onToggleOnline?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  boothName,
  isOnline,
  cashierName,
  onToggleOnline,
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
      </View>

      {/* Right: Cashier identity */}
      <View style={styles.rightGroup}>
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
});

