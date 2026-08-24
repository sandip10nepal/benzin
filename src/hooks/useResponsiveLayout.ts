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

  // Device Classification
  const minDimension = Math.min(width, height);
  const maxDimension = Math.max(width, height);

  const isMobilePhone = minDimension < 600 && maxDimension < 960;
  const isTablet = minDimension >= 600 && minDimension < 1024;
  const isDesktop = width >= 1024 || (isLandscape && width >= 1100);

  const isWideTabletLandscape = isTablet && isLandscape && width >= 900;

  // Dynamic Grid Columns & Card Widths
  let menuNumColumns = 2;
  let cardWidthPercent: DimensionValue = '48%';

  if (isMobilePhone) {
    if (isPortrait) {
      if (width < 360) {
        menuNumColumns = 1;
        cardWidthPercent = '100%';
      } else {
        menuNumColumns = 2;
        cardWidthPercent = '48%';
      }
    } else {
      // Mobile Landscape
      menuNumColumns = 2;
      cardWidthPercent = '48%';
    }
  } else if (isTablet) {
    if (isLandscape) {
      menuNumColumns = 3;
      cardWidthPercent = '31.8%';
    } else {
      menuNumColumns = 2;
      cardWidthPercent = '48%';
    }
  } else if (isDesktop) {
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

  // Content Padding & Scaled Sizing
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
