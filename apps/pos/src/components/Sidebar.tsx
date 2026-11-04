import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { COLORS, RADII } from '../constants/theme';

export interface SidebarProps {
  activeRoute: 'menu' | 'stok' | 'settlement';
  onNavigate: (route: 'menu' | 'stok' | 'settlement') => void;
  onLogout?: () => void;
  boothName?: string;
  width?: number;
  compact?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeRoute,
  onNavigate,
  onLogout,
  width,
  compact,
}) => {
  const navItems: Array<{ id: 'menu' | 'stok' | 'settlement'; label: string; icon: string }> = [
    { id: 'menu', label: 'Menu POS', icon: '☕' },
    { id: 'stok', label: 'Stok Opname', icon: '📦' },
    { id: 'settlement', label: 'Settlement', icon: '🧾' },
  ];

  return (
    <View
      style={[
        styles.container,
        width !== undefined ? { width } : null,
        compact ? styles.containerCompact : null,
      ]}
    >
      {/* Brand Header */}
      <View style={[styles.brandHeader, compact && { marginBottom: 16 }]}>
        <View style={[styles.logoBadge, compact && { paddingVertical: 4, paddingHorizontal: 10 }]}>
          <Text style={[styles.logoText, compact && { fontSize: 16, letterSpacing: 1.5 }]}>
            KOPIKO
          </Text>
        </View>
        <Text style={[styles.subBrandText, compact && { fontSize: 10 }]}>POS Terminal</Text>
      </View>

      {/* Nav Items */}
      <View style={styles.navList}>
        {navItems.map((item) => {
          const isActive = activeRoute === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => onNavigate(item.id)}
              style={({ pressed }) => [
                styles.navItem,
                isActive ? styles.navItemActive : styles.navItemInactive,
                pressed && styles.navItemPressed,
              ]}
              hitSlop={8}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text
                style={[
                  styles.navLabel,
                  isActive ? styles.navLabelActive : styles.navLabelInactive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Bottom Footer (Log Out) */}
      <View style={styles.footer}>
        <Pressable
          onPress={onLogout}
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
          hitSlop={{ top: 12, bottom: 20, left: 12, right: 12 }}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 240,
    backgroundColor: COLORS.bgSidebar,
    borderRightWidth: 1,
    borderRightColor: COLORS.borderSidebar,
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  containerCompact: {
    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 28,
  },
  brandHeader: {
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  logoBadge: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: RADII.btn,
    marginBottom: 6,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  subBrandText: {
    color: 'rgba(251, 249, 245, 0.6)',
    fontSize: 12,
    fontWeight: '600',
    paddingLeft: 4,
  },
  navList: {
    flex: 1,
    gap: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADII.btn,
    minHeight: 48,
  },
  navItemActive: {
    backgroundColor: COLORS.brandCrimson,
    shadowColor: COLORS.brandCrimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  navItemInactive: {
    backgroundColor: 'transparent',
  },
  navItemPressed: {
    opacity: 0.85,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  navIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  navLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  navLabelActive: {
    color: '#FFFFFF',
  },
  navLabelInactive: {
    color: COLORS.textInvertedMuted,
    fontWeight: '600',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADII.btn,
    backgroundColor: 'rgba(252, 165, 165, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(252, 165, 165, 0.25)',
    minHeight: 48,
  },
  logoutBtnPressed: {
    backgroundColor: 'rgba(252, 165, 165, 0.28)',
    transform: [{ scale: 0.97 }],
  },
  logoutIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  logoutText: {
    color: COLORS.alertLogout,
    fontSize: 14,
    fontWeight: '600',
  },
});

