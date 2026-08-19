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
  Dices,
  Check
} from 'lucide-react-native';
import { useRestaurantTheme } from '../../theme/ThemeContext';
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // Active Mix Chamber State (Flavors added by user)
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

  // Mix Balance Metrics (Sweetness, Freshness, Fruitiness, Intensity, Coolness)
  const mixBalance = useMemo(() => {
    if (selectedFlavors.length === 0) {
      return { sweetness: 0, freshness: 0, fruitiness: 0, intensity: 0, coolness: 0 };
    }
    const count = selectedFlavors.length;
    return {
      sweetness: Math.round(selectedFlavors.reduce((a, b) => a + b.sweetness, 0) / count),
      freshness: Math.round(selectedFlavors.reduce((a, b) => a + b.freshness, 0) / count),
      fruitiness: Math.round(selectedFlavors.reduce((a, b) => a + b.fruitiness, 0) / count),
      intensity: Math.round(selectedFlavors.reduce((a, b) => a + b.intensity, 0) / count),
      coolness: Math.round(selectedFlavors.reduce((a, b) => a + b.coolness, 0) / count),
    };
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

  // Add flavor to chamber (Max 5 limit)
  const handleAddFlavor = (flavor: HookahFlavor) => {
    if (selectedFlavors.some(f => f.id === flavor.id)) return;
    if (selectedFlavors.length >= 5) {
      alert("Let's keep it balanced! Maximum 5 flavors allowed in a custom bowl.");
      return;
    }
    const newFlavors = [...selectedFlavors, flavor];
    setSelectedFlavors(newFlavors);
    setCustomMixName(generateMixName(newFlavors));
  };

  // Explicit Removal of flavor from custom bowl composition
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
    const count = Math.floor(Math.random() * 2) + 2; // 2 or 3 flavors
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
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.backgroundColor, borderColor: '#E5B13A', borderWidth: 2 }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.borderColor }]}>
            <View style={styles.headerTitleGroup}>
              <View style={[styles.labIconBg, { backgroundColor: 'rgba(0,153,255,0.15)' }]}>
                <Text style={{ fontSize: 26 }}>🧪</Text>
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.textColor }]}>
                  BENZIN | CAVALLI FLAVOR LABORATORY
                </Text>
              </View>

            </View>

            {/* Close Modal Action */}
            <View style={styles.headerRightActions}>
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                <X size={20} color={theme.textColor} />
              </TouchableOpacity>
            </View>
          </View>

          {/* MAIN LABORATORY BODY */}
          <View style={styles.labBody}>
            {/* LEFT SIDE: FLAVOR SELECTION & SEARCH */}
            <View style={styles.flavorExplorerSide}>
              {/* Simplified Search Bar */}
              <View style={styles.filterControlBlock}>
                <View style={[styles.searchBox, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
                  <Search size={22} color={theme.mutedTextColor} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.textColor }]}
                    placeholder="Search Flavors"
                    placeholderTextColor={theme.mutedTextColor}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>

              {/* Clean Flavor Cards Grid (Name + Description Only) */}
              <ScrollView contentContainerStyle={styles.flavorCardsGrid} showsVerticalScrollIndicator={false}>
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
                        isAdded && { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 2.5 }
                      ]}
                    >
                      <View style={styles.flavorCardTop}>
                        <Text style={{ fontSize: 28, marginBottom: 4 }}>{flavor.emoji}</Text>
                      </View>

                      <Text style={[styles.flavorName, { color: theme.textColor }]}>{flavor.name}</Text>
                      <Text style={[styles.flavorDesc, { color: theme.mutedTextColor }]} numberOfLines={2}>
                        {flavor.description}
                      </Text>

                      {/* Add/Remove Action Button */}
                      <TouchableOpacity
                        onPress={() => isAdded ? handleRemoveFlavor(flavor.id) : handleAddFlavor(flavor)}
                        style={[
                          styles.cardAddBtn,
                          { 
                            backgroundColor: isAdded ? 'rgba(239,68,68,0.12)' : 'transparent', 
                            borderColor: isAdded ? '#EF4444' : '#22C55E', 
                            borderWidth: 1.5, 
                            marginTop: 8 
                          }
                        ]}
                      >
                        {isAdded ? (
                          <>
                            <Trash2 size={13} color="#EF4444" />
                            <Text style={[styles.cardAddBtnText, { color: '#EF4444' }]}>REMOVE FLAVOR</Text>
                          </>
                        ) : (
                          <>
                            <Plus size={13} color="#22C55E" />
                            <Text style={[styles.cardAddBtnText, { color: '#22C55E' }]}>ADD TO BOWL</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* RIGHT SIDE: THE VISUAL MIXING BOWL & REMOVAL CONTROLS */}
            <View style={[styles.mixingChamberSide, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
              {/* Mix Name Header */}
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

              {/* THE VISUAL MIXING BOWL CHAMBER WITH EXPLICIT REMOVE BUTTONS */}
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

                          {/* EXPLICIT REMOVE BUTTON FOR EACH FLAVOR LAYER */}
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

              {/* DIRECTLY UNDER HEAT MANAGEMENT BOWL: SURPRISE ME & CLEAR BOWL */}
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
                      shadowColor: '#E5B13A',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.35,
                      shadowRadius: 8,
                      elevation: 6
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

              {/* DIRECTLY UNDER SURPRISE ME & CLEAR BOWL: ADD CUSTOM BOWL TO ORDER */}
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
          </View>
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
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  actionPillText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labBody: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  flavorExplorerSide: {
    flex: 1.3,
  },
  filterControlBlock: {
    marginBottom: 12,
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    height: 54,
    borderRadius: 18,
    borderWidth: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  catPillsRow: {
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  flavorCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 20,
  },
  flavorCard: {
    width: '48.5%',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 12,
    justifyContent: 'space-between',
  },
  flavorCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tagGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  miniTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniTagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  flavorName: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 2,
  },
  flavorDesc: {
    fontSize: 11,
    lineHeight: 15,
    height: 30,
    marginBottom: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  metricVal: {
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 4,
  },
  cardAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
  },
  cardAddBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  mixingChamberSide: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    justifyContent: 'space-between',
  },
  chamberHeader: {
    marginBottom: 10,
  },
  chamberTitleLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  mixNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mixNameText: {
    fontSize: 20,
    fontWeight: '900',
  },
  editIcon: {
    fontSize: 14,
  },
  mixNameInput: {
    fontSize: 18,
    fontWeight: '900',
    borderBottomWidth: 1.5,
    paddingVertical: 2,
  },
  visualBowlContainer: {
    height: 240,
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.06)',
    position: 'relative',
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
    padding: 20,
  },
  emptyChamberTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  emptyChamberSub: {
    fontSize: 12,
    textAlign: 'center',
  },
  bowlLiquidLayers: {
    flex: 1,
  },
  flavorLayer: {
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.3)',
  },
  layerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  layerEmoji: {
    fontSize: 16,
  },
  layerName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    flex: 1,
  },
  layerPct: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginRight: 8,
  },
  removeLayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  removeLayerText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  bowlActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  chamberFooter: {
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  priceVal: {
    fontSize: 20,
    fontWeight: '900',
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
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
