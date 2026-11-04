export const COLORS = {
  bgCanvas: '#F7F5F0',
  bgSidebar: '#1D0F0A',
  borderSidebar: '#3D2318',
  bgHeader: '#FBF9F5',
  borderHeader: '#E3DCD5',
  bgCard: '#FFFFFF',
  bgCartPanel: '#F3EFEA',
  borderCartPanel: '#E2DBD3',
  brandCrimson: '#C62828',
  brandCrimsonHover: '#B71C1C',
  brandEspresso: '#2C1810',
  textMuted: '#6A5E59',
  textPlaceholder: 'rgba(168, 156, 151, 0.7)',
  textInverted: '#FFFFFF',
  textInvertedMuted: 'rgba(251, 249, 245, 0.75)',
  statusOnline: '#10B981',
  statusOnlineBg: '#ECFDF5',
  statusOnlineBorder: '#A7F3D0',
  statusOnlineText: '#047857',
  statusOffline: '#F59E0B',
  statusOfflineBg: '#FEF3C7',
  statusOfflineBorder: '#FDE68A',
  statusOfflineText: '#B45309',
  statusReady: '#059669',
  alertDangerBg: '#FEF2F2',
  alertDangerBorder: '#FECACA',
  alertDangerText: '#C62828',
  alertLogout: '#FCA5A5',
  borderSubtle: '#F1EBE4',
  borderDefault: '#E0D9D1',
  stepperBg: '#EFECE6',
};

export const RADII = {
  stepper: 10,
  btn: 14,
  card: 20,
  pill: 9999,
};

export const formatRupiah = (amount: number): string => {
  return `Rp ${amount.toLocaleString('id-ID')}`;
};

