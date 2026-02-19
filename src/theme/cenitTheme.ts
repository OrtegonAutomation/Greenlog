// ============================================================
// Tema corporativo CENIT (GREENLOG)
// Paleta verde que refleja la identidad ambiental de CENIT
// ============================================================
import { BrandVariants, createLightTheme, Theme } from '@fluentui/react-components';

const cenitBrand: BrandVariants = {
  10: '#010D01',
  20: '#032403',
  30: '#063906',
  40: '#0A5010',
  50: '#0D6612',
  60: '#117D16',
  70: '#16991B',
  80: '#1CB322',  // Brand principal (botones, links activos)
  90: '#25CC2C',
  100: '#40D946',
  110: '#60E266',
  120: '#83EA87',
  130: '#A6F0A9',
  140: '#C5F5C7',
  150: '#E0FAE1',
  160: '#F1FDF1',
};

export const cenitTheme: Theme = {
  ...createLightTheme(cenitBrand),
  // Plus Jakarta Sans como fuente base — más amigable y moderna
  fontFamilyBase: "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif",
  // Tokens de radio ajustados para look más redondeado
  borderRadiusMedium: '10px',
  borderRadiusLarge: '14px',
  borderRadiusXLarge: '20px',
};

// Colores semánticos extendidos para CENIT
// Colores semánticos extendidos para CENIT
export const CENIT_COLORS = {
  // Verdes (Identidad Secundaria / Acciones Positivas)
  green: '#8CC63F',   // Verde "Cenit" vibrante (logo)
  greenMid: '#7AB82F',
  greenDark: '#5A9E1C',
  greenBg: '#F4FCE3',   // Fondo muy suave tintado
  greenBgSoft: '#F7FDF0',

  // Azules (Identidad Corporativa Principal)
  blueBrand: '#0033A0',   // Azul Corporativo Profundo
  blueLight: '#0056D2',   // Azul Brillante para hovers/acentos
  blueDark: '#002266',   // Azul Oscuro para fondos
  blueBg: '#E6F0FF',
  blueBgSoft: '#F0F6FF',

  // Estado en ejecución
  orange: '#F59E0B',
  orangeBg: '#FFFBEB',
  orangeSoft: '#FEF3C7',

  // Errores / Alta prioridad
  red: '#EF4444',
  redBg: '#FEF2F2',

  // Neutrales
  grayText: '#1F2937',
  graySub: '#4B5563',
  grayBorder: '#E5E7EB',
  grayBg: '#F9FAFB',

  // Gradientes Exclusivos
  // Sidebar: De azul oscuro corporativo a un verde profundo
  sidebarGradient: 'linear-gradient(170deg, #002266 0%, #004b87 60%, #0056D2 100%)',

  // Hero: Gradiente suave y tecnológico
  heroGradient: 'linear-gradient(135deg, #0033A0 0%, #0056d2 50%, #8CC63F 100%)',

  // Cards floating effect
  cardShadow: '0 10px 30px -5px rgba(0, 51, 160, 0.08)',
  cardHoverShadow: '0 20px 40px -5px rgba(0, 51, 160, 0.15)',
};
