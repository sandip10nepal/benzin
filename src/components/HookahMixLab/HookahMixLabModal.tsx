import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  TextInput 
} from 'react-native';
import { 
  X, 
  Search, 
  Plus, 
  Trash2, 
  ArrowRight,
  Dices
} from 'lucide-react-native';
import { useRestaurantTheme } from '../../theme/ThemeContext';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { 
  HookahFlavor, 
  FlavorInMix, 
  MenuItem, 
  SelectedModifier 
} from '../../types';
import { HOOKAH_FLAVORS_DATABASE } from '../../data/hookahMixData';

interface HookahMixLabModalProps {
  visible: boolean;
  onClose: () => void;
  onAddMixToCart: (item: MenuItem, quantity: number, modifiers: SelectedModifier[], specialNotes?: string) => void;
}

export const HookahMixLabModal: React.FC<HookahMixLabModalProps> = ({
  visible,
  onClose,
  onAddMixToCart,
}) => {
  const { theme } = useRestaurantTheme();
  const layout = useResponsiveLayout();
  const isMobile = layout.isMobilePhone;

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Mix Chamber State
  const [selectedFlavors, setSelectedFlavors] = useState<HookahFlavor[]>([
    HOOKAH_FLAVORS_DATABASE.find(f => f.id === 'f_pan')!,
    HOOKAH_FLAVORS_DATABASE.find(f => f.id === 'f_spearmint')!,
    HOOKAH_FLAVORS_DATABASE.find(f => f.id === 'f_kiwi')!,
  ]);
  const [customMixName, setCustomMixName] = useState<string>('ROYAL GREEN EMPEROR');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);

  if (!visible) return null;

  // Calculate percentages dynamically
  const flavorsInMix: FlavorInMix[] = useMemo(() => {
    const total = selectedFlavors.length;
    if (total === 0) return [];
    const basePct = Math.floor(100 / total);
    const remainder = 100 - basePct * total;

    return selectedFlavors.map((flavor, idx) => ({
      flavor,
      percentage: idx === 0 ? basePct + remainder : basePct,
    }));
  }, [selectedFlavors]);

  // Auto Name Generator
  const generateMixName = (flavors: HookahFlavor[]) => {
    if (flavors.length === 0) return 'MY CUSTOM HOOKAH MIX';
    const names = flavors.map(f => f.name.toLowerCase());
    if (names.some(n => n.includes('pan')) && names.some(n => n.includes('mint'))) {
      return 'ROYAL GREEN EMPEROR';
    }
    if (names.some(n => n.includes('peach')) || names.some(n => n.includes('mango'))) {
      return 'TROPICAL CAVALLI SUNSET';
    }
    if (names.some(n => n.includes('blue'))) {
      return 'BLUE FROSTBITE';
    }
    if (names.some(n => n.includes('apple'))) {
      return 'IMPERIAL APPLE CRUSH';
    }
    return `${flavors[0].name.toUpperCase()} CREATION`;
  };

  // Add flavor to chamber
  const handleAddFlavor = (flavor: HookahFlavor) => {
    if (selectedFlavors.some(f => f.id === flavor.id)) return;
    if (selectedFlavors.length >= 5) {
      alert("Maximum 5 flavors allowed in a custom bowl.");
      return;
    }
    const newFlavors = [...selectedFlavors, flavor];
    setSelectedFlavors(newFlavors);
    setCustomMixName(generateMixName(newFlavors));
  };

  // Remove flavor from custom bowl
  const handleRemoveFlavor = (flavorId: string) => {
    const newFlavors = selectedFlavors.filter(f => f.id !== flavorId);
    setSelectedFlavors(newFlavors);
    if (newFlavors.length > 0) {
      setCustomMixName(generateMixName(newFlavors));
    }
  };

  // Surprise Me Randomizer
  const handleSurpriseMe = () => {
    const shuffled = [...HOOKAH_FLAVORS_DATABASE].sort(() => 0.5 - Math.random());
    const count = Math.floor(Math.random() * 2) + 2;
    const randomMix = shuffled.slice(0, count);
    setSelectedFlavors(randomMix);
    setCustomMixName(generateMixName(randomMix));
  };

  // Clear Entire Mix
  const handleClearMix = () => {
    setSelectedFlavors([]);
    setCustomMixName('MY CUSTOM BOWL');
  };

  // Filtered Flavors by Search Query
  const filteredFlavors = useMemo(() => {
    return HOOKAH_FLAVORS_DATABASE.filter(f => {
      return searchQuery.trim() === '' || 
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    });
  }, [searchQuery]);

  // Submit Mix to Cart
  const handleAddMixToCart = () => {
    if (selectedFlavors.length === 0) return;

    const compositionDesc = flavorsInMix
      .map(f => `${f.flavor.name} ${f.percentage}%`)
      .join(' • ');

    const customHookahItem: MenuItem = {
      id: `custom_mix_${Date.now()}`,
      name: customMixName || 'Custom Hookah Mix',
      price: 35.0,
      description: `Custom Laboratory Bowl: ${compositionDesc}`,
      category: 'hookah',
      subcategory: 'Mix Lab Creation',
      badge: '🧪 CUSTOM MIX',
      imageKey: 'hookah_anarkali',
    };

    onAddMixToCart(customHookahItem, 1, [], `Composition: ${compositionDesc}`);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, isMobile && { padding: 6 }]}>
        <View style={[
          styles.container, 
          { backgroundColor: theme.backgroundColor, borderColor: '#E5B13A', borderWidth: 2 },
          isMobile && { width: '100%', height: '98%', borderRadius: 16 }
        ]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.borderColor }, isMobile && { paddingHorizontal: 12, paddingVertical: 10 }]}>
            <View style={styles.headerTitleGroup}>
              <View style={[styles.labIconBg, { backgroundColor: 'rgba(0,153,255,0.15)' }, isMobile && { width: 36, height: 36 }]}>
                <Text style={{ fontSize: isMobile ? 20 : 26 }}>🧪</Text>
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={[styles.headerTitle, { color: theme.textColor, fontSize: isMobile ? 14 : 18 }]} numberOfLines={1}>
                  FLAVOR LABORATORY
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.08)' }, isMobile && { width: 32, height: 32 }]}>
              <X size={isMobile ? 16 : 20} color={theme.textColor} />
            </TouchableOpacity>
          </View>

          {/* MAIN LABORATORY BODY (Scrollable on mobile) */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.labBody,
              isMobile && { flexDirection: 'column', padding: 10, gap: 14 }
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* MIXING BOWL (Rendered FIRST on Mobile for fast feedback) */}
            {isMobile && (
              <View style={[styles.mixingChamberSide, { backgroundColor: theme.cardColor, borderColor: theme.borderColor, padding: 12 }]}>
                <View style={styles.chamberHeader}>
                  <Text style={[styles.mixNameText, { color: theme.textColor, fontSize: 16 }]}>{customMixName}</Text>
                </View>

                <View style={[styles.visualBowlContainer, { borderColor: theme.secondaryColor, height: 160, marginBottom: 8 }]}>
                  <View style={styles.bowlTopRim}>
                    <Text style={styles.rimText}>HEAT MANAGEMENT BOWL</Text>
                  </View>

                  {flavorsInMix.length === 0 ? (
                    <View style={styles.emptyChamber}>
                      <Text style={{ fontSize: 32, marginBottom: 4 }}>🧪</Text>
                      <Text style={[styles.emptyChamberTitle, { color: theme.textColor, fontSize: 13 }]}>
                        YOUR BOWL IS EMPTY
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.bowlLiquidLayers}>
                      {flavorsInMix.map((item, idx) => (
                        <View
                          key={item.flavor?.id || `mix_layer_mob_${idx}`}
                          style={[
                            styles.flavorLayer,
                            { backgroundColor: item.flavor.color, flex: item.percentage / 100, paddingHorizontal: 10 }
                          ]}
                        >
                          <View style={styles.layerInfoRow}>
                            <Text style={{ fontSize: 14 }}>{item.flavor.emoji}</Text>
                            <Text style={[styles.layerName, { fontSize: 11 }]} numberOfLines={1}>{item.flavor.name}</Text>
                            <Text style={[styles.layerPct, { fontSize: 12 }]}>{item.percentage}%</Text>
                            <TouchableOpacity
                              onPress={() => handleRemoveFlavor(item.flavor.id)}
                              style={[styles.removeLayerBtn, { paddingHorizontal: 6, paddingVertical: 2 }]}
                            >
                              <Trash2 size={12} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <TouchableOpacity
                    onPress={handleSurpriseMe}
                    activeOpacity={0.8}
                    style={[styles.actionPill, { backgroundColor: '#E5B13A', flex: 1, paddingVertical: 10 }]}
                  >
                    <Dices size={16} color="#000000" />
                    <Text style={{ color: '#000000', fontWeight: '900', fontSize: 12 }}>🎲 SURPRISE ME</Text>
                  </TouchableOpacity>

                  {selectedFlavors.length > 0 && (
                    <TouchableOpacity
                      onPress={handleClearMix}
                      style={[styles.actionPill, { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: '#EF4444', paddingHorizontal: 12 }]}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  onPress={handleAddMixToCart}
                  disabled={selectedFlavors.length === 0}
                  activeOpacity={0.88}
                  style={[
                    styles.addMixToOrderBtn,
                    { backgroundColor: '#10B981', paddingVertical: 12 },
                    selectedFlavors.length === 0 && { opacity: 0.4 }
                  ]}
                >
                  <Text style={[styles.addMixText, { fontSize: 12 }]}>ADD BOWL TO ORDER ($35.00)</Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            {/* FLAVOR SELECTION & SEARCH */}
            <View style={styles.flavorExplorerSide}>
              <View style={styles.filterControlBlock}>
                <View style={[styles.searchBox, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }, isMobile && { height: 44, paddingVertical: 6 }]}>
                  <Search size={18} color={theme.mutedTextColor} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.textColor, fontSize: 13 }]}
                    placeholder="Search Flavors"
                    placeholderTextColor={theme.mutedTextColor}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>

              {/* Flavor Cards Grid */}
              <View style={styles.flavorCardsGrid}>
                {filteredFlavors.map((flavor, idx) => {
                  const isAdded = selectedFlavors.some(f => f.id === flavor.id);
                  return (
                    <TouchableOpacity
                      key={flavor.id || `flavor_${idx}`}
                      activeOpacity={0.85}
                      onPress={() => isAdded ? handleRemoveFlavor(flavor.id) : handleAddFlavor(flavor)}
                      style={[
                        styles.flavorCard,
                        { backgroundColor: theme.cardColor, borderColor: theme.borderColor },
                        isMobile && { width: '100%', padding: 10 },
                        isAdded && { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 2 }
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={{ fontSize: isMobile ? 24 : 28 }}>{flavor.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.flavorName, { color: theme.textColor, fontSize: isMobile ? 13 : 14 }]}>{flavor.name}</Text>
                          <Text style={[styles.flavorDesc, { color: theme.mutedTextColor, fontSize: isMobile ? 10 : 11, height: isMobile ? 26 : 30 }]} numberOfLines={2}>
                            {flavor.description}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => isAdded ? handleRemoveFlavor(flavor.id) : handleAddFlavor(flavor)}
                        style={[
                          styles.cardAddBtn,
                          { 
                            backgroundColor: isAdded ? 'rgba(239,68,68,0.12)' : 'transparent', 
                            borderColor: isAdded ? '#EF4444' : '#22C55E', 
                            borderWidth: 1.5, 
                            marginTop: 6,
                            paddingVertical: 6
                          }
                        ]}
                      >
                        {isAdded ? (
                          <>
                            <Trash2 size={12} color="#EF4444" />
                            <Text style={[styles.cardAddBtnText, { color: '#EF4444', fontSize: 10 }]}>REMOVE</Text>
                          </>
                        ) : (
                          <>
                            <Plus size={12} color="#22C55E" />
                            <Text style={[styles.cardAddBtnText, { color: '#22C55E', fontSize: 10 }]}>+ ADD TO BOWL</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* DESKTOP RIGHT SIDE MIXING CHAMBER */}
            {!isMobile && (
              <View style={[styles.mixingChamberSide, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
                <View style={styles.chamberHeader}>
                  {isEditingName ? (
                    <TextInput
                      style={[styles.mixNameInput, { color: theme.textColor, borderColor: theme.primaryColor }]}
                      value={customMixName}
                      onChangeText={setCustomMixName}
                      onBlur={() => setIsEditingName(false)}
                      autoFocus
                    />
                  ) : (
                    <TouchableOpacity onPress={() => setIsEditingName(true)} style={styles.mixNameRow}>
                      <Text style={[styles.mixNameText, { color: theme.textColor }]}>{customMixName}</Text>
                      <Text style={[styles.editIcon, { color: theme.mutedTextColor }]}>✏️</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={[styles.visualBowlContainer, { borderColor: theme.secondaryColor, flex: 1, marginBottom: 12 }]}>
                  <View style={styles.bowlTopRim}>
                    <Text style={styles.rimText}>HEAT MANAGEMENT BOWL</Text>
                  </View>

                  {flavorsInMix.length === 0 ? (
                    <View style={styles.emptyChamber}>
                      <Text style={{ fontSize: 44, marginBottom: 8 }}>🧪</Text>
                      <Text style={[styles.emptyChamberTitle, { color: theme.textColor }]}>
                        YOUR BOWL IS EMPTY
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.bowlLiquidLayers}>
                      {flavorsInMix.map((item, idx) => (
                        <View
                          key={item.flavor?.id || `mix_layer_${idx}`}
                          style={[
                            styles.flavorLayer,
                            { backgroundColor: item.flavor.color, flex: item.percentage / 100 }
                          ]}
                        >
                          <View style={styles.layerInfoRow}>
                            <Text style={styles.layerEmoji}>{item.flavor.emoji}</Text>
                            <Text style={styles.layerName} numberOfLines={1}>{item.flavor.name}</Text>
                            <Text style={styles.layerPct}>{item.percentage}%</Text>

                            <TouchableOpacity
                              onPress={() => handleRemoveFlavor(item.flavor.id)}
                              style={styles.removeLayerBtn}
                            >
                              <Trash2 size={14} color="#FFFFFF" />
                              <Text style={styles.removeLayerText}>REMOVE</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.bowlActionsRow}>
                  <TouchableOpacity
                    onPress={handleSurpriseMe}
                    activeOpacity={0.8}
                    style={[
                      styles.actionPill, 
                      { 
                        backgroundColor: '#E5B13A', 
                        borderColor: '#E5B13A', 
                        flex: 1, 
                        paddingVertical: 12,
                      }
                    ]}
                  >
                    <Dices size={20} color="#000000" />
                    <Text style={[styles.actionPillText, { color: '#000000', fontWeight: '900', letterSpacing: 1 }]}>
                      🎲 SURPRISE ME
                    </Text>
                  </TouchableOpacity>

                  {selectedFlavors.length > 0 && (
                    <TouchableOpacity
                      onPress={handleClearMix}
                      style={[styles.actionPill, { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: '#EF4444', flex: 1 }]}
                    >
                      <Trash2 size={20} color="#EF4444" />
                      <Text style={[styles.actionPillText, { color: '#EF4444' }]}>CLEAR BOWL</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  onPress={handleAddMixToCart}
                  disabled={selectedFlavors.length === 0}
                  activeOpacity={0.88}
                  style={[
                    styles.addMixToOrderBtn,
                    { backgroundColor: '#10B981', marginTop: 10 },
                    selectedFlavors.length === 0 && { opacity: 0.4 }
                  ]}
                >
                  <Text style={styles.addMixText}>ADD CUSTOM BOWL TO ORDER ($35.00)</Text>
                  <ArrowRight size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  container: {
    width: '98%',
    height: '94%',
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  labIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labBody: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  flavorExplorerSide: {
    flex: 1.3,
  },
  filterControlBlock: {
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontWeight: '600',
  },
  flavorCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 20,
  },
  flavorCard: {
    width: '48.5%',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    justifyContent: 'space-between',
  },
  flavorName: {
    fontWeight: '900',
  },
  flavorDesc: {
    lineHeight: 14,
    marginTop: 2,
  },
  cardAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
  },
  cardAddBtnText: {
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mixingChamberSide: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    justifyContent: 'space-between',
  },
  chamberHeader: {
    marginBottom: 8,
  },
  mixNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mixNameText: {
    fontWeight: '900',
  },
  mixNameInput: {
    fontSize: 18,
    fontWeight: '900',
    borderBottomWidth: 1.5,
    paddingVertical: 2,
  },
  visualBowlContainer: {
    borderRadius: 18,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  bowlTopRim: {
    backgroundColor: 'rgba(229,177,58,0.2)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  rimText: {
    color: '#E5B13A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  emptyChamber: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyChamberTitle: {
    fontWeight: '900',
  },
  bowlLiquidLayers: {
    flex: 1,
  },
  flavorLayer: {
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.3)',
  },
  layerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  layerName: {
    color: '#FFFFFF',
    fontWeight: '900',
    flex: 1,
  },
  layerPct: {
    color: '#FFFFFF',
    fontWeight: '900',
    marginRight: 6,
  },
  removeLayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    borderRadius: 6,
  },
  bowlActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  addMixToOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  addMixText: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
