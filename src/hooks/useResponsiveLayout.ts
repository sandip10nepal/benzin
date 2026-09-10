import { useWindowDimensions, DimensionValue } from 'react-native';

export interface ResponsiveLayoutMetrics {
  width: number;
  height: number;
  isPortrait: boolean;
  isLandscape: boolean;
  isMobilePhone: boolean;
  isTablet: boolean;
  isWideTabletLandscape: boolean;
  isDesktop: boolean;
  menuNumColumns: number;
  cardWidthPercent: DimensionValue;
  maxModalWidth: DimensionValue;
  contentPadding: number;
  headerHeight: number;
  fontSizeScale: number;
}

export function useResponsiveLayout(): ResponsiveLayoutMetrics {
  const dimensions = useWindowDimensions();
  const width = dimensions.width || 390;
  const height = dimensions.height || 844;

  const isPortrait = height > width;
  const isLandscape = !isPortrait;

  // Device Classification Hierarchy (Width-driven with orientation context)
  const minDimension = Math.min(width, height);
  const maxDimension = Math.max(width, height);

  const isMobilePhone = width < 600 || (minDimension < 600 && maxDimension < 960);
  const isTablet = width >= 600 && width < 1024;
  const isDesktop = width >= 1024;
  const isWideTabletLandscape = isTablet && isLandscape && width >= 900;

  // Dynamic Grid Columns & Card Widths based on available container width
  let menuNumColumns = 2;
  let cardWidthPercent: DimensionValue = '48%';

  if (width < 360) {
    // Ultra-small phones (iPhone SE 320px)
    menuNumColumns = 1;
    cardWidthPercent = '100%';
  } else if (width < 600) {
    // Standard Mobile Phones (360px - 599px)
    menuNumColumns = isPortrait ? 2 : 2;
    cardWidthPercent = '48%';
  } else if (width < 900) {
    // Tablet Portrait (600px - 899px)
    menuNumColumns = 2;
    cardWidthPercent = '48%';
  } else if (width < 1200) {
    // Tablet Landscape & Laptops (900px - 1199px)
    menuNumColumns = 3;
    cardWidthPercent = '31.8%';
  } else {
    // Large Desktop & 4K Displays (1200px+)
    menuNumColumns = 4;
    cardWidthPercent = '23.5%';
  }

  // Modals & Drawers Sizing
  let maxModalWidth: DimensionValue = '92%';
  if (isMobilePhone) {
    maxModalWidth = '95%';
  } else if (isTablet) {
    maxModalWidth = 600;
  } else {
    maxModalWidth = 680;
  }

  // Content Padding & Touch Sizing Metrics
  const contentPadding = isMobilePhone ? 12 : isTablet ? 20 : 28;
  const headerHeight = isMobilePhone ? 56 : 68;
  const fontSizeScale = isMobilePhone ? 0.9 : isTablet ? 1.0 : 1.1;

  return {
    width,
    height,
    isPortrait,
    isLandscape,
    isMobilePhone,
    isTablet,
    isWideTabletLandscape,
    isDesktop,
    menuNumColumns,
    cardWidthPercent,
    maxModalWidth,
    contentPadding,
    headerHeight,
    fontSizeScale,
  };
}
