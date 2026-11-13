import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { COLORS, RADII } from '../constants/theme';
import { api } from '../services/api';

export interface CashierProfile {
  id: string;
  name: string;
  role: string;
  pin: string;
  boothName: string;
}

export interface LoginScreenProps {
  onLoginSuccess: (cashier: CashierProfile) => void;
}

const DEFAULT_CASHIERS: CashierProfile[] = [
  {
    id: 'usr-1',
    name: 'Alex Martins',
    role: 'Kasir Shift 1',
    pin: '1234',
    boothName: 'Booth Mall Senayan #01',
  },
  {
    id: 'usr-2',
    name: 'Siti Rahma',
    role: 'Kasir Shift 2',
    pin: '2345',
    boothName: 'Booth Mall Senayan #01',
  },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [selectedCashier, setSelectedCashier] = useState<CashierProfile>(DEFAULT_CASHIERS[0]);
  const [pin, setPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setErrorMessage('');

      // Auto check when 4 digits reached
      if (newPin.length === 4) {
        // Try Go Backend login first
        api.login(newPin, selectedCashier.boothName)
          .then((res) => {
            onLoginSuccess({
              id: res.profile.id,
              name: res.profile.full_name,
              role: res.profile.role,
              pin: newPin,
              boothName: res.booth.name,
            });
          })
          .catch(() => {
            // Local fallback validation if backend is offline
            if (newPin === selectedCashier.pin) {
              onLoginSuccess(selectedCashier);
            } else {
              setErrorMessage('PIN Salah. Coba lagi (Demo PIN: 1234)');
              setTimeout(() => setPin(''), 600);
            }
          });
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setErrorMessage('');
    }
  };

  const handleClear = () => {
    setPin('');
    setErrorMessage('');
  };

  return (
    <View style={styles.container}>
      {/* Left Branding Panel */}
      <View style={styles.brandPanel}>
        <View style={styles.brandBadge}>
          <Text style={styles.brandLogo}>KOPIKO</Text>
        </View>
        <Text style={styles.terminalTitle}>Point of Sale Terminal</Text>
        <Text style={styles.boothTag}>📍 {selectedCashier.boothName}</Text>

        <View style={styles.shiftCard}>
          <Text style={styles.shiftLabel}>STATUS TERMINAL</Text>
          <Text style={styles.shiftStatus}>● Siap Digunakan</Text>
          <Text style={styles.shiftNote}>
            Silakan pilih nama kasir dan masukkan 4 digit PIN untuk membuka sesi shift.
          </Text>
        </View>

        {/* Cashier Selector */}
        <View style={styles.cashierList}>
          <Text style={styles.cashierListTitle}>PILIH AKUN KASIR:</Text>
          {DEFAULT_CASHIERS.map((cashier) => {
            const isSelected = selectedCashier.id === cashier.id;
            return (
              <Pressable
                key={cashier.id}
                onPress={() => {
                  setSelectedCashier(cashier);
                  setPin('');
                  setErrorMessage('');
                }}
                style={[
                  styles.cashierOption,
                  isSelected && styles.cashierOptionSelected,
                ]}
              >
                <View style={styles.cashierAvatar}>
                  <Text style={styles.avatarText}>{cashier.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cashierName, isSelected && { color: '#FFFFFF' }]}>
                    {cashier.name}
                  </Text>
                  <Text style={styles.cashierRole}>{cashier.role}</Text>
                </View>
                {isSelected && <Text style={styles.checkIcon}>✓</Text>}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Right Numpad PIN Panel */}
      <View style={styles.numpadPanel}>
        <View style={styles.numpadContent}>
          <Text style={styles.numpadTitle}>Masukkan PIN Kasir</Text>
          <Text style={styles.numpadSub}>
            Masuk sebagai <Text style={{ fontWeight: '700' }}>{selectedCashier.name}</Text>
          </Text>

          {/* Masked PIN Indicator */}
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map((index) => {
              const filled = pin.length > index;
              return (
                <View
                  key={index}
                  style={[
                    styles.pinDot,
                    filled && styles.pinDotFilled,
                    errorMessage ? styles.pinDotError : null,
                  ]}
                />
              );
            })}
          </View>

          {/* Error / Hint Message */}
          <View style={styles.messageBox}>
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : (
              <Text style={styles.hintText}>💡 PIN Demo: {selectedCashier.pin}</Text>
            )}
          </View>

          {/* Numpad Grid */}
          <View style={styles.keypad}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['C', '0', '⌫'],
            ].map((row, rIdx) => (
              <View key={rIdx} style={styles.keypadRow}>
                {row.map((key) => {
                  const isAction = key === 'C' || key === '⌫';
                  return (
                    <Pressable
                      key={key}
                      onPress={() => {
                        if (key === 'C') handleClear();
                        else if (key === '⌫') handleDelete();
                        else handleKeyPress(key);
                      }}
                      style={({ pressed }) => [
                        styles.keyButton,
                        isAction && styles.keyButtonAction,
                        pressed && styles.keyPressed,
                      ]}
                      hitSlop={8}
                    >
                      <Text
                        style={[
                          styles.keyText,
                          isAction && styles.keyTextAction,
                        ]}
                      >
                        {key}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.bgCanvas,
  },
  brandPanel: {
    width: 360,
    backgroundColor: COLORS.bgSidebar,
    padding: 32,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.borderSidebar,
  },
  brandBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADII.btn,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  brandLogo: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  terminalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  boothTag: {
    fontSize: 13,
    color: 'rgba(251, 249, 245, 0.75)',
    fontWeight: '600',
    marginBottom: 24,
  },
  shiftCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: RADII.btn,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  shiftLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(251, 249, 245, 0.6)',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  shiftStatus: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.statusOnline,
    marginBottom: 6,
  },
  shiftNote: {
    fontSize: 12,
    color: 'rgba(251, 249, 245, 0.7)',
    lineHeight: 18,
  },
  cashierList: {
    gap: 8,
  },
  cashierListTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(251, 249, 245, 0.5)',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cashierOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADII.btn,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 12,
  },
  cashierOptionSelected: {
    backgroundColor: 'rgba(198, 40, 40, 0.35)',
    borderColor: COLORS.brandCrimson,
  },
  cashierAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.brandEspresso,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  cashierName: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(251, 249, 245, 0.9)',
  },
  cashierRole: {
    fontSize: 11,
    color: 'rgba(251, 249, 245, 0.6)',
  },
  checkIcon: {
    color: COLORS.brandCrimson,
    fontSize: 16,
    fontWeight: '800',
  },
  numpadPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgCanvas,
    padding: 24,
  },
  numpadContent: {
    width: 340,
    alignItems: 'center',
  },
  numpadTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.brandEspresso,
    marginBottom: 4,
  },
  numpadSub: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  pinDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.borderDefault,
    backgroundColor: '#FFFFFF',
  },
  pinDotFilled: {
    backgroundColor: COLORS.brandCrimson,
    borderColor: COLORS.brandCrimson,
  },
  pinDotError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  messageBox: {
    height: 24,
    justifyContent: 'center',
    marginBottom: 18,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  hintText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  keypad: {
    width: '100%',
    gap: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  keyButton: {
    flex: 1,
    height: 64,
    borderRadius: RADII.btn,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E0D8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  keyButtonAction: {
    backgroundColor: '#EFECE6',
  },
  keyPressed: {
    backgroundColor: '#E5E1D8',
    transform: [{ scale: 0.95 }],
  },
  keyText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.brandEspresso,
  },
  keyTextAction: {
    fontSize: 18,
    color: COLORS.textMuted,
  },
});

