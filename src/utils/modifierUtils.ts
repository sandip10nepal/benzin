import { MenuItem, SelectedModifier, ModifierGroup } from '../types';

/**
 * Checks if a menu item requires the customer to pick a modifier option (e.g. sauce selection for wings).
 */
export const itemRequiresModifierSelection = (item?: MenuItem | null): boolean => {
  if (!item) return false;
  
  const isWings = item.category_id === 'CAT_WINGS' || 
    (Array.isArray(item.category_ids) && item.category_ids.includes('CAT_WINGS')) ||
    (item.name || '').toLowerCase().includes('wing');

  if (isWings) return true;

  const groups: ModifierGroup[] = item.modifierGroups || (item as any).modifier_groups || [];
  return groups.some((g: any) => {
    if ((g.id === 'MOD_HOOKAH_ENHANCEMENTS' || (g.name || '').toLowerCase().includes('enhancement')) && !g.required) {
      return false;
    }
    const isRequired = Boolean(g.required) || 
      (g.min_selection !== undefined && g.min_selection > 0) || 
      (g.minSelect !== undefined && g.minSelect > 0);
    const isSauce = (g.name || '').toLowerCase().includes('sauce');
    return isRequired || (isWings && isSauce && Array.isArray(g.options) && g.options.length > 0);
  });
};

/**
 * Identifies if an item is missing any required modifier choice (e.g. sauce choice).
 * Returns the first missing ModifierGroup, or null if all required selections are satisfied.
 */
export const getMissingRequiredModifierGroup = (
  item?: MenuItem | null, 
  selectedModifiers: SelectedModifier[] = []
): ModifierGroup | null => {
  if (!item) return null;
  const groups: ModifierGroup[] = item.modifierGroups || (item as any).modifier_groups || [];
  const isWings = item.category_id === 'CAT_WINGS' || 
    (Array.isArray(item.category_ids) && item.category_ids.includes('CAT_WINGS')) ||
    (item.name || '').toLowerCase().includes('wing');

  for (const group of groups) {
    if ((group.id === 'MOD_HOOKAH_ENHANCEMENTS' || (group.name || '').toLowerCase().includes('enhancement')) && !group.required) {
      continue;
    }
    const groupNameLower = (group.name || '').toLowerCase();
    const isSauce = groupNameLower.includes('sauce');
    const isRequired = Boolean(group.required) || 
      ((group as any).min_selection !== undefined && (group as any).min_selection > 0) || 
      (group.minSelect !== undefined && group.minSelect > 0) ||
      (isWings && isSauce);

    if (isRequired) {
      const grpId = group.id || (group as any)._id || group.name;
      const hasSelection = selectedModifiers.some(
        m => (m.groupId === grpId || m.groupName === group.name) && Boolean(m.optionName || m.optionId)
      );
      if (!hasSelection) {
        return group;
      }
    }
  }

  // Fallback if wings item has no groups populated yet
  if (isWings && groups.length === 0) {
    return {
      id: 'grp_wing_sauces',
      name: 'Sauce Choices',
      required: true,
      options: [],
    };
  }

  return null;
};

/**
 * Returns a human-friendly action text for the button (e.g. "+ CHOOSE SAUCE", "+ CUSTOMIZE", "+ ADD").
 */
export const getActionLabelForItem = (item: MenuItem): string => {
  const isWings = item.category_id === 'CAT_WINGS' || 
    (Array.isArray(item.category_ids) && item.category_ids.includes('CAT_WINGS')) ||
    (item.name || '').toLowerCase().includes('wing');

  const groups: ModifierGroup[] = item.modifierGroups || (item as any).modifier_groups || [];
  const hasSauceGroup = groups.some(g => (g.name || '').toLowerCase().includes('sauce'));

  if (isWings || hasSauceGroup) {
    return '+ CHOOSE SAUCE';
  }
  if (itemRequiresModifierSelection(item)) {
    return '+ CUSTOMIZE';
  }
  return '+ ADD';
};
