import { ArrowLeft, Bell, Bot, LogOut, ShoppingBag, Sparkles, Sun, Moon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRestaurantTheme } from '../../theme/ThemeContext';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { ConversationStep } from '../../types';
import { BenzinLogo } from '../ui/BenzinLogo';

interface BenzinHeaderProps {
  onGoHome?: () => void;
  onOpenCart?: () => void;
  onOpenCallServer?: () => void;
  onOpenHost?: (initialStep?: ConversationStep) => void;
  onLogOut?: () => void;
  cartCount?: number;
  showBackButton?: boolean;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  hostSpeechText?: string;
}

export const BenzinHeader: React.FC<BenzinHeaderProps> = ({
  onGoHome,
  onOpenCart,
  onOpenCallServer,
  onOpenHost,
  onLogOut,
  cartCount = 0,
  showBackButton = false,
  onBack,
  hostSpeechText,
}) => {
  const { theme, themeMode, toggleThemeMode } = useRestaurantTheme();
  const { isMobilePhone, contentPadding, headerHeight } = useResponsiveLayout();

  return (
    <View style={[
      styles.headerContainer,
      {
        backgroundColor: theme.backgroundColor,
        borderBottomColor: theme.borderColor,
        height: headerHeight,
        paddingHorizontal: contentPadding,
      }
    ]}>
      {/* Left side: Back Button OR Table Indicator */}
      <View style={[styles.leftSection, isMobilePhone && { minWidth: 'auto' }]}>
        {showBackButton && onBack ? (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={[styles.backBtn, { backgroundColor: theme.cardColor, borderColor: theme.borderColor, paddingHorizontal: isMobilePhone ? 10 : 16 }]}
          >
            <ArrowLeft size={isMobilePhone ? 16 : 20} color={theme.textColor} />
            {!isMobilePhone && <Text style={[styles.backText, { color: theme.textColor }]}>BACK</Text>}
          </TouchableOpacity>
        ) : onLogOut ? (
          <TouchableOpacity
            onPress={onLogOut}
            activeOpacity={0.7}
            style={[styles.backBtn, { backgroundColor: theme.cardColor, borderColor: theme.borderColor, paddingHorizontal: isMobilePhone ? 8 : 14 }]}
          >
            <LogOut size={isMobilePhone ? 14 : 16} color={theme.secondaryColor} />
            <Text style={[styles.backText, { color: theme.secondaryColor, fontSize: isMobilePhone ? 10 : 11, fontWeight: '800' }]}>
              TBL {theme.tableNumber}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Center: BENZIN | RESTAURANT NAME */}
      <View style={styles.centerSection}>
        <TouchableOpacity onPress={onGoHome} activeOpacity={0.8} style={{ alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <BenzinLogo size={isMobilePhone ? "micro" : "small"} showSubtitle={false} />
            <Text style={{ color: theme.secondaryColor, fontWeight: '700', fontSize: isMobilePhone ? 14 : 18, marginHorizontal: isMobilePhone ? 4 : 6 }}>
              |
            </Text>
            <Text style={{ color: theme.textColor, fontWeight: '900', fontSize: isMobilePhone ? 14 : 20, letterSpacing: 0.8 }}>
              {theme.name || 'CAVALLI'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Right side: Dark/Bright Theme Toggle, AI Digital Host Icon, Call Server & Cart Trigger */}
      <View style={[styles.rightSection, isMobilePhone && { minWidth: 'auto', gap: 6 }]}>
        {/* Dark/Bright Theme Mode Toggle Button */}
        <TouchableOpacity
          onPress={toggleThemeMode}
          activeOpacity={0.8}
          style={[styles.actionBtn, { backgroundColor: theme.cardColor, borderColor: theme.borderColor, paddingHorizontal: isMobilePhone ? 8 : 14 }]}
        >
          {themeMode === 'dark' ? (
            <Sun size={isMobilePhone ? 15 : 17} color={theme.secondaryColor} />
          ) : (
            <Moon size={isMobilePhone ? 15 : 17} color={theme.primaryColor} />
          )}
        </TouchableOpacity>
        
        {/* Persistent AI Digital Host Button */}
        {onOpenHost && (
          <TouchableOpacity
            onPress={() => onOpenHost()}
            activeOpacity={0.8}
            style={[styles.actionBtn, styles.hostBtn, { borderColor: '#E5B13A', paddingHorizontal: isMobilePhone ? 8 : 14 }]}
          >
            <View style={{ position: 'relative' }}>
              <Bot size={isMobilePhone ? 16 : 18} color="#F3E5AB" />
              <Sparkles size={isMobilePhone ? 7 : 9} color="#E5B13A" style={{ position: 'absolute', top: -3, right: -3 }} />
            </View>
            {!isMobilePhone && (
              <Text style={[styles.actionBtnText, { color: '#F3E5AB', maxWidth: 140 }]} numberOfLines={1}>
                {hostSpeechText || `Host AI`}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {onOpenCallServer && (
          <TouchableOpacity
            onPress={onOpenCallServer}
            activeOpacity={0.8}
            style={[styles.actionBtn, styles.callServerBtn, { borderColor: theme.accentColor, paddingHorizontal: isMobilePhone ? 8 : 14 }]}
          >
            <Bell size={isMobilePhone ? 16 : 18} color={theme.accentColor} />
            {!isMobilePhone && (
              <Text style={[styles.actionBtnText, { color: theme.accentColor }]}>
                CALL SERVER
              </Text>
            )}
          </TouchableOpacity>
        )}

        {onOpenCart && (
          <TouchableOpacity
            onPress={onOpenCart}
            activeOpacity={0.8}
            style={[styles.actionBtn, styles.cartBtn, { backgroundColor: theme.primaryColor, paddingHorizontal: isMobilePhone ? 10 : 14 }]}
          >
            <ShoppingBag size={isMobilePhone ? 16 : 18} color="#FFFFFF" />
            {!isMobilePhone && (
              <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>
                MY ORDER
              </Text>
            )}
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    zIndex: 50,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  backText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'flex-end',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
  },
  hostBtn: {
    borderWidth: 1.5,
    backgroundColor: '#3E2413',
  },
  callServerBtn: {
    borderWidth: 1.5,
    backgroundColor: 'rgba(20,184,166,0.08)',
  },
  cartBtn: {
    shadowColor: '#0099FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cartBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  cartBadgeText: {
    color: '#0099FF',
    fontSize: 10,
    fontWeight: '900',
  },
});
