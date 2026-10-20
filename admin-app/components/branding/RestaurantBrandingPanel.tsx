import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  Link as LinkIcon,
  CheckCircle,
  X,
  Palette,
  Image as ImageIcon,
  Save,
  AlertCircle,
  RefreshCw,
  Building,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { THEME_PRESETS, ThemePresetId, RestaurantBranding } from '@shared/types/branding';

interface RestaurantBrandingPanelProps {
  userRole?: string;
  onBrandingUpdated?: (updated: any) => void;
}

export const RestaurantBrandingPanel: React.FC<RestaurantBrandingPanelProps> = ({
  userRole = 'staff',
  onBrandingUpdated,
}) => {
  const isManagerOrOwner = ['owner', 'manager', 'platform_admin', 'admin'].includes(userRole);

  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoInputType, setLogoInputType] = useState<'upload' | 'url'>('upload');
  const [externalLogoInput, setExternalLogoInput] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<ThemePresetId>('cavalli_classic');
  const [brandingColors, setBrandingColors] = useState<Partial<RestaurantBranding>>({
    primary_color: '#0099FF',
    secondary_color: '#E5B13A',
    accent_color: '#14B8A6',
    background_color: '#0C0806',
    card_color: '#19120E',
    text_color: '#F8F1EA',
    muted_color: '#9C8C7E',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Load current restaurant configuration
  const loadRestaurantData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getRestaurantDetails();
      if (res.success && res.restaurant) {
        const r = res.restaurant;
        setRestaurantId(r._id || r.id);
        setRestaurantName(r.name || '');

        const b = r.branding || {};
        setLogoUrl(b.logo_url || null);
        if (b.logo_url && b.logo_url.startsWith('http')) {
          setExternalLogoInput(b.logo_url);
        }

        const preset = (b.theme_preset as ThemePresetId) || 'cavalli_classic';
        setSelectedTheme(preset);

        setBrandingColors({
          primary_color: b.primary_color || THEME_PRESETS[preset]?.branding.primary_color || '#0099FF',
          secondary_color: b.secondary_color || THEME_PRESETS[preset]?.branding.secondary_color || '#E5B13A',
          accent_color: b.accent_color || THEME_PRESETS[preset]?.branding.accent_color || '#14B8A6',
          background_color: b.background_color || THEME_PRESETS[preset]?.branding.background_color || '#0C0806',
          card_color: b.card_color || THEME_PRESETS[preset]?.branding.card_color || '#19120E',
          text_color: b.text_color || THEME_PRESETS[preset]?.branding.text_color || '#F8F1EA',
          muted_color: b.muted_color || THEME_PRESETS[preset]?.branding.muted_color || '#9C8C7E',
        });
      }
    } catch (err: any) {
      console.warn('Failed to load restaurant branding:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurantData();
  }, []);

  // Handle Preset Theme Switch
  const handleSelectPreset = (presetId: ThemePresetId) => {
    if (!isManagerOrOwner) return;
    setSelectedTheme(presetId);
    const preset = THEME_PRESETS[presetId];
    if (preset) {
      setBrandingColors({
        ...brandingColors,
        ...preset.branding,
        theme_preset: presetId,
      });
    }
  };

  // Handle Logo Upload File Selection
  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isManagerOrOwner) return;
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setFeedback(null);
      const res = await apiClient.uploadMediaFile(file, 'logo');
      if (res.success && res.url) {
        setLogoUrl(res.url);
        setFeedback({ type: 'success', message: 'Logo uploaded and optimized successfully!' });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to upload logo' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Logo upload error' });
    } finally {
      setUploading(false);
    }
  };

  // Handle External Logo URL Apply
  const handleApplyExternalUrl = () => {
    if (!isManagerOrOwner) return;
    if (!externalLogoInput.trim()) {
      setFeedback({ type: 'error', message: 'Enter a valid image URL.' });
      return;
    }
    if (!externalLogoInput.startsWith('https://')) {
      setFeedback({ type: 'error', message: 'External logo must use secure https:// protocol.' });
      return;
    }
    setLogoUrl(externalLogoInput.trim());
    setFeedback({ type: 'success', message: 'External logo applied.' });
  };

  // Remove Logo
  const handleRemoveLogo = () => {
    if (!isManagerOrOwner) return;
    setLogoUrl(null);
    setExternalLogoInput('');
  };

  // Save All Branding Settings
  const handleSaveBranding = async () => {
    if (!isManagerOrOwner || !restaurantId) return;

    try {
      setSaving(true);
      setFeedback(null);

      const finalBranding: RestaurantBranding = {
        primary_color: brandingColors.primary_color || '#0099FF',
        secondary_color: brandingColors.secondary_color || '#E5B13A',
        accent_color: brandingColors.accent_color || '#14B8A6',
        background_color: brandingColors.background_color || '#0C0806',
        card_color: brandingColors.card_color || '#19120E',
        text_color: brandingColors.text_color || '#F8F1EA',
        muted_color: brandingColors.muted_color || '#9C8C7E',
        logo_url: logoUrl || null,
        font_family: 'ui-rounded',
        theme_preset: selectedTheme,
      };

      const res = await apiClient.updateRestaurantBranding(restaurantId, finalBranding, restaurantName);
      if (res.success) {
        setFeedback({ type: 'success', message: 'Branding and theme settings saved successfully!' });
        if (typeof window !== 'undefined' && restaurantName) {
          localStorage.setItem('benzin_restaurant_name', restaurantName);
        }
        if (onBrandingUpdated) {
          onBrandingUpdated(res.restaurant);
        }
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to update branding settings.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Network error saving branding.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: '16px',
        marginBottom: '24px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      }}
    >
      {/* Header Bar: Display Restaurant Brand, Logo & Theme with Clear Edit Option */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: isExpanded ? '1px solid var(--line)' : 'none',
          background: 'linear-gradient(180deg, rgba(229,177,58,0.06) 0%, transparent 100%)',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={restaurantName || 'Restaurant Brand'}
              style={{
                width: '42px',
                height: '42px',
                objectFit: 'contain',
                borderRadius: '10px',
                border: '1.5px solid rgba(255,255,255,0.12)',
                background: 'rgba(0,0,0,0.3)',
                padding: '2px',
                flexShrink: 0,
              }}
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
                const fallback = document.getElementById('benzinDefaultBrandLogo');
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}

          {/* Benzin Logo Fallback when restaurant has not configured a custom logo */}
          <div
            id="benzinDefaultBrandLogo"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(0,153,255,0.08)',
              border: '1.5px solid rgba(56,189,248,0.3)',
              display: logoUrl ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            title="Benzin Default Brand Logo"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="benzinBrandCardGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0099FF" />
                  <stop offset="50%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#E5B13A" />
                </linearGradient>
              </defs>
              <path
                d="M12 2.5 L20.22 7.25 V16.75 L12 21.5 L3.78 16.75 V7.25 Z"
                stroke="url(#benzinBrandCardGrad)"
                strokeWidth="2.2"
                strokeLinejoin="round"
                fill="rgba(0,153,255,0.06)"
              />
              <circle cx="12" cy="12" r="5" stroke="url(#benzinBrandCardGrad)" strokeWidth="1.8" fill="none" />
              <circle cx="20.22" cy="7.25" r="1.6" fill="#38BDF8" />
              <circle cx="20.22" cy="16.75" r="1.6" fill="#38BDF8" />
              <circle cx="12" cy="21.5" r="1.6" fill="#E5B13A" />
              <circle cx="3.78" cy="16.75" r="1.6" fill="#E5B13A" />
              <circle cx="3.78" cy="7.25" r="1.6" fill="#38BDF8" />
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--cream)', letterSpacing: '0.2px' }}>
                {restaurantName || (typeof window !== 'undefined' ? localStorage.getItem('benzin_restaurant_name') : null) || 'Cavalli Lounge'}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  background: 'rgba(0,153,255,0.12)',
                  color: '#38BDF8',
                  border: '1px solid rgba(56,189,248,0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38BDF8' }} />
                {THEME_PRESETS[selectedTheme]?.name || 'Cavalli Classic (Benzin Default)'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-secondary touch-target"
            id="editRestaurantBrandBtn"
            style={{
              fontSize: '12px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            <Palette style={{ width: '14px', height: '14px' }} />
            <span>{isExpanded ? 'Done Editing' : 'Edit Brand & Theme'}</span>
          </button>
        </div>
      </div>

      {/* Expandable Customization Body */}
      {isExpanded && (
        <div style={{ padding: '20px' }}>
          {feedback && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '18px',
                fontSize: '13px',
                fontWeight: 600,
                background: feedback.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                color: feedback.type === 'success' ? '#10B981' : '#EF4444',
                border: `1px solid ${feedback.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}
            >
              {feedback.type === 'success' ? (
                <CheckCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              ) : (
                <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {!isManagerOrOwner && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.25)',
                color: '#F59E0B',
                fontSize: '12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle style={{ width: '16px', height: '16px' }} />
              <span>You are viewing in staff read-only mode. Manager or Owner permissions are required to change branding.</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* Left Column: Logo & Restaurant Name */}
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                    letterSpacing: '0.5px',
                  }}
                >
                  Restaurant Name
                </label>
                <div style={{ position: 'relative' }}>
                  <Building
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '11px',
                      width: '16px',
                      height: '16px',
                      color: 'var(--muted)',
                    }}
                  />
                  <input
                    type="text"
                    value={restaurantName}
                    disabled={!isManagerOrOwner}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="Enter Restaurant Name"
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      background: 'var(--card2)',
                      border: '1px solid var(--line)',
                      borderRadius: '8px',
                      color: 'var(--cream)',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  />
                </div>
              </div>

              {/* Logo Management Section */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                    letterSpacing: '0.5px',
                  }}
                >
                  Restaurant Logo
                </label>

                {/* Logo Preview & Removal Card */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px',
                    background: 'var(--card2)',
                    border: '1px solid var(--line)',
                    borderRadius: '10px',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '8px',
                      background: brandingColors.background_color || '#0C0806',
                      border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Restaurant Logo Preview"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <ImageIcon style={{ width: '28px', height: '28px', color: 'var(--muted)' }} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cream)' }}>
                      {logoUrl ? 'Active Logo Loaded' : 'No Logo Configured'}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--muted)',
                        marginTop: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {logoUrl || ''}
                    </div>

                    {logoUrl && isManagerOrOwner && (
                      <button
                        onClick={handleRemoveLogo}
                        style={{
                          marginTop: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        <X style={{ width: '12px', height: '12px' }} />
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>

                {/* Option Tabs: Upload vs External URL */}
                {isManagerOrOwner && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setLogoInputType('upload')}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: logoInputType === 'upload' ? '1px solid var(--gold)' : '1px solid var(--line)',
                        background: logoInputType === 'upload' ? 'rgba(229,177,58,0.12)' : 'var(--card2)',
                        color: logoInputType === 'upload' ? 'var(--gold)' : 'var(--muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <Upload style={{ width: '13px', height: '13px' }} />
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoInputType('url')}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: logoInputType === 'url' ? '1px solid var(--gold)' : '1px solid var(--line)',
                        background: logoInputType === 'url' ? 'rgba(229,177,58,0.12)' : 'var(--card2)',
                        color: logoInputType === 'url' ? 'var(--gold)' : 'var(--muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <LinkIcon style={{ width: '13px', height: '13px' }} />
                      External URL
                    </button>
                  </div>
                )}

                {/* File Upload Mode */}
                {isManagerOrOwner && logoInputType === 'upload' && (
                  <div style={{ position: 'relative' }}>
                    <input
                      type="file"
                      id="brandingLogoFileInput"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleLogoFileUpload}
                      disabled={uploading}
                      style={{
                        width: '100%',
                        fontSize: '12px',
                        color: 'var(--muted)',
                        padding: '8px',
                        background: 'var(--card2)',
                        border: '1px dashed var(--line)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    />
                    {uploading && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--gold)',
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <RefreshCw style={{ width: '12px', height: '12px', animation: 'spin 1s linear infinite' }} />
                        Optimizing & uploading to GCS...
                      </div>
                    )}
                  </div>
                )}

                {/* External URL Mode */}
                {isManagerOrOwner && logoInputType === 'url' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="https://.../logo.png"
                      value={externalLogoInput}
                      onChange={(e) => setExternalLogoInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: 'var(--card2)',
                        border: '1px solid var(--line)',
                        borderRadius: '8px',
                        color: 'var(--cream)',
                        fontSize: '13px',
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary touch-target"
                      onClick={handleApplyExternalUrl}
                      style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 700 }}
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Customer Frontend Themes */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                  letterSpacing: '0.5px',
                }}
              >
                Customer Frontend Theme Preset
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                {(Object.keys(THEME_PRESETS) as ThemePresetId[]).map((key) => {
                  const preset = THEME_PRESETS[key];
                  const isSelected = selectedTheme === key;
                  return (
                    <div
                      key={key}
                      onClick={() => handleSelectPreset(key)}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(0,153,255,0.08)' : 'var(--card2)',
                        border: isSelected ? '2px solid #0099FF' : '1px solid var(--line)',
                        cursor: isManagerOrOwner ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: isSelected ? '#0099FF' : 'var(--cream)' }}>
                          {preset.name}
                        </span>
                        {isSelected && <CheckCircle style={{ width: '14px', height: '14px', color: '#0099FF' }} />}
                      </div>

                      <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '8px', lineHeight: '1.3' }}>
                        {preset.description}
                      </div>

                      {/* Swatch preview */}
                      <div style={{ display: 'flex', gap: '4px', height: '10px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ flex: 2, background: preset.branding.background_color }} />
                        <div style={{ flex: 1, background: preset.branding.primary_color }} />
                        <div style={{ flex: 1, background: preset.branding.secondary_color }} />
                        <div style={{ flex: 1, background: preset.branding.accent_color }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live Customer Header Preview Bar */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Live Diner Display Preview
                </div>
                <div
                  style={{
                    borderRadius: '10px',
                    padding: '14px',
                    background: brandingColors.background_color || '#0C0806',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo Preview"
                        style={{ height: '24px', maxWidth: '100px', objectFit: 'contain' }}
                      />
                    ) : (
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 800,
                          color: brandingColors.primary_color || '#0099FF',
                          letterSpacing: '2px',
                        }}
                      >
                        {restaurantName.toUpperCase() || 'CAVALLI'}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: brandingColors.card_color || '#19120E',
                        color: brandingColors.text_color || '#F8F1EA',
                        border: `1px solid ${brandingColors.secondary_color || '#E5B13A'}40`,
                      }}
                    >
                      Table #1
                    </div>
                    <button
                      style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 800,
                        border: 'none',
                        background: brandingColors.primary_color || '#0099FF',
                        color: '#FFFFFF',
                      }}
                    >
                      Order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          {isManagerOrOwner && (
            <div
              style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid var(--line)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary touch-target"
                onClick={loadRestaurantData}
                disabled={saving}
                style={{ fontSize: '13px', padding: '8px 16px' }}
              >
                Reset
              </button>
              <button
                type="button"
                className="btn btn-primary touch-target"
                onClick={handleSaveBranding}
                disabled={saving}
                style={{
                  fontSize: '13px',
                  padding: '8px 20px',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {saving ? (
                  <>
                    <RefreshCw style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save style={{ width: '14px', height: '14px' }} />
                    Save Branding Settings
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
