import { useWindowDimensions, DimensionValue } from 'react-native';

export interface ResponsiveLayoutMetrics {
  width: number;
  height: number;
  isLandscape: boolean;
  isTablet: boolean;
  isWideTabletLandscape: boolean;
  menuNumColumns: number;
  cardWidthPercent: DimensionValue;
  maxModalWidth: number;
  contentPadding: number;
}

export function useResponsiveLayout(): ResponsiveLayoutMetrics {
  const dimensions = useWindowDimensions();
  
  // Kiosk App is strictly locked to Landscape orientation
  const width = Math.max(dimensions.width, dimensions.height);
  const height = Math.min(dimensions.width, dimensions.height);

  const isLandscape = true;
  const isTablet = width >= 768 || (height >= 600 && width >= 900);
  const isWideTabletLandscape = isTablet && width >= 1000;

  // Grid columns calculation
  let menuNumColumns = 2;
  let cardWidthPercent: DimensionValue = '48%';

  if (isTablet) {
    if (isWideTabletLandscape) {
      // In wide tablet landscape split mode: 3 columns for main grid next to cart panel
      menuNumColumns = 3;
      cardWidthPercent = '31.8%';
    } else if (isLandscape) {
      menuNumColumns = 4;
      cardWidthPercent = '23.8%';
    } else {
      // iPad Portrait
      menuNumColumns = 3;
      cardWidthPercent = '31.8%';
    }
  }

  const maxModalWidth = isTablet ? 680 : 540;
  const contentPadding = isTablet ? (isLandscape ? 28 : 24) : 16;

  return {
    width,
    height,
    isLandscape,
    isTablet,
    isWideTabletLandscape,
    menuNumColumns,
    cardWidthPercent,
    maxModalWidth,
    contentPadding,
  };
}
