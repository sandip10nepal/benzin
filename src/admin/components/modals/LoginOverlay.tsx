import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';

interface LoginOverlayProps {
  isOpen: boolean;
  onClose?: () => void;
  onLoginSuccess?: (userData: any, restaurantData: any) => void;
}

export const LoginOverlay: React.FC<LoginOverlayProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'pin' | 'email'>('pin');
  const [venueCode, setVenueCode] = useState(() => {
    return (
      localStorage.getItem('benzin_restaurant_code') ||
      localStorage.getItem('benzin_selected_slug') ||
      ''
    );
  });
  const [venueVerified, setVenueVerified] = useState(false);
  const [verifiedRestaurant, setVerifiedRestaurant] = useState<any>(null);
  const [venueStatus, setVenueStatus] = useState('');
  const [isVerifyingVenue, setIsVerifyingVenue] = useState(false);

  const [staffOptions, setStaffOptions] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [pin, setPin] = useState('');

  const [managerEmail, setManagerEmail] = useState('');
  const [managerPass, setManagerPass] = useState('');
  const [managerVenueCode, setManagerVenueCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const doVerifyVenue = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) {
      setVenueStatus('Please enter a valid Venue ID');
      setVenueVerified(false);
      return;
    }
    setIsVerifyingVenue(true);
    setVenueStatus('Verifying venue with database...');
    setErrorMessage('');
    try {
      const data = await apiClient.verifyVenue(codeToVerify.trim());
      if (data.success && data.restaurant) {
        setVenueVerified(true);
        setVerifiedRestaurant(data.restaurant);
        setVenueStatus(`✓ Verified Venue: ${data.restaurant.name}`);
        const staff = Array.isArray(data.staff) ? data.staff : [];
        setStaffOptions(staff);
        if (staff.length > 0) {
          const savedUserId = localStorage.getItem('benzin_user_id');
          const matching = staff.find((s: any) => s.id === savedUserId);
          setSelectedStaffId(matching ? matching.id : staff[0].id);
        }
      } else {
        setVenueVerified(false);
        setVenueStatus(data.error || 'Invalid Venue ID');
      }
    } catch (e: any) {
      setVenueVerified(false);
      setVenueStatus('Network error verifying venue: ' + e.message);
    } finally {
      setIsVerifyingVenue(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const code =
        venueCode ||
        localStorage.getItem('benzin_restaurant_code') ||
        localStorage.getItem('benzin_selected_slug') ||
        '';
      setVenueCode(code);
      if (code) {
        doVerifyVenue(code);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStaffPinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueVerified || !venueCode.trim()) {
      alert('Please enter and verify a valid Venue ID first.');
      return;
    }
    if (!selectedStaffId) {
      alert('Please select your staff account.');
      return;
    }
    if (!pin || pin.length < 4) {
      alert('Please enter your 4-digit Staff PIN.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const rCode = verifiedRestaurant?.restaurant_code || venueCode.trim();
      const data = await apiClient.staffLogin({
        restaurant_code: rCode,
        user_id: selectedStaffId,
        pin: pin.trim(),
      });

      if (data.success && data.user) {
        if (data.token) localStorage.setItem('benzin_jwt_token', data.token);
        localStorage.setItem('benzin_user_id', data.user.id || data.user._id || '');
        localStorage.setItem('benzin_user_name', data.user.name);
        localStorage.setItem('benzin_user_role', data.user.role);
        localStorage.setItem('benzin_user_pin', pin.trim());

        const rObj = data.restaurant || verifiedRestaurant;
        if (rObj) {
          localStorage.setItem('benzin_restaurant_id', rObj.id || rObj._id || '');
          localStorage.setItem('benzin_selected_slug', rObj.slug || '');
          localStorage.setItem('benzin_restaurant_code', rObj.restaurant_code || '');
          localStorage.setItem('benzin_restaurant_name', rObj.name || '');
        }

        if (onLoginSuccess) {
          onLoginSuccess(data.user, rObj);
        }
        if (onClose) onClose();
      } else {
        setErrorMessage(data.error || data.message || 'Staff verification failed: Invalid PIN');
      }
    } catch (err: any) {
      setErrorMessage('Network error verifying staff PIN: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManagerEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerEmail.trim() || !managerPass.trim()) {
      alert('Please enter your manager email and passcode.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const rCode = managerVenueCode.trim() || verifiedRestaurant?.restaurant_code || venueCode.trim();
      const data = await apiClient.managerLogin({
        email: managerEmail.trim(),
        password: managerPass.trim(),
        restaurant_code: rCode || undefined,
      });

      if (data.success && data.user) {
        if (data.token) localStorage.setItem('benzin_jwt_token', data.token);
        localStorage.setItem('benzin_user_id', data.user.id || data.user._id || '');
        localStorage.setItem('benzin_user_name', data.user.name);
        localStorage.setItem('benzin_user_role', data.user.role);
        localStorage.setItem('benzin_user_pin', managerPass.trim());

        const rObj = data.restaurant || verifiedRestaurant;
        if (rObj) {
          localStorage.setItem('benzin_restaurant_id', rObj.id || rObj._id || '');
          localStorage.setItem('benzin_selected_slug', rObj.slug || '');
          localStorage.setItem('benzin_restaurant_code', rObj.restaurant_code || '');
          localStorage.setItem('benzin_restaurant_name', rObj.name || '');
        }

        if (onLoginSuccess) {
          onLoginSuccess(data.user, rObj);
        }
        if (onClose) onClose();
      } else {
        setErrorMessage(data.error || data.message || 'Manager authentication failed. Please check credentials.');
      }
    } catch (err: any) {
      setErrorMessage('Network error during manager login: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="benzinLoginOverlay"
      style={{
        display: 'flex',
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay-bg, rgba(5, 7, 10, 0.85))',
        backdropFilter: 'blur(24px)',
        zIndex: 99999,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          boxSizing: 'border-box',
          background: 'var(--card, #151D2A)',
          border: '1.5px solid var(--line, #233044)',
          borderRadius: '24px',
          padding: 'clamp(20px, 5vw, 32px)',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          color: 'var(--cream, #FFFFFF)',
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.6))' }}>
            <defs>
              <linearGradient id="benzinGradLoginReact" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0099FF" />
                <stop offset="50%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#E5B13A" />
              </linearGradient>
            </defs>
            <path d="M12 2.5 L20.22 7.25 V16.75 L12 21.5 L3.78 16.75 V7.25 Z" stroke="url(#benzinGradLoginReact)" strokeWidth="2.2" strokeLinejoin="round" fill="rgba(0,153,255,0.06)" />
            <circle cx="12" cy="12" r="5" stroke="url(#benzinGradLoginReact)" strokeWidth="1.8" fill="none" />
            <circle cx="12" cy="2.5" r="1.6" fill="#38BDF8" />
            <circle cx="20.22" cy="7.25" r="1.6" fill="#38BDF8" />
            <circle cx="20.22" cy="16.75" r="1.6" fill="#38BDF8" />
            <circle cx="12" cy="21.5" r="1.6" fill="#E5B13A" />
            <circle cx="3.78" cy="16.75" r="1.6" fill="#E5B13A" />
            <circle cx="3.78" cy="7.25" r="1.6" fill="#38BDF8" />
          </svg>
          <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#3b82f6', letterSpacing: '2px', textTransform: 'uppercase', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
            BENZIN
          </h2>
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--card2, #0d131f)', padding: '4px', borderborderRadius: '12px', border: '1px solid var(--line, #233044)', marginBottom: '24px' }}>
          <button
            type="button"
            className={`sub-tab ${mode === 'pin' ? 'active' : ''}`}
            id="loginTab-pin"
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: mode === 'pin' ? '#0ea5e9' : 'transparent',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
            }}
            onClick={() => {
              setMode('pin');
              setErrorMessage('');
            }}
          >
            Staff
          </button>
          <button
            type="button"
            className={`sub-tab ${mode === 'email' ? 'active' : ''}`}
            id="loginTab-email"
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: mode === 'email' ? '#0ea5e9' : 'transparent',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
            }}
            onClick={() => {
              setMode('email');
              setErrorMessage('');
            }}
          >
            Manager
          </button>
        </div>

        {errorMessage && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#f87171',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '16px',
              textAlign: 'left',
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Mode 1: Staff PIN Login */}
        {mode === 'pin' && (
          <form id="loginFormPin" onSubmit={handleStaffPinLogin}>
            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--gold, #E5B13A)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                Venue ID *
              </label>
              <div className="login-venue-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
                <input
                  type="text"
                  id="loginVenueCode"
                  placeholder="Enter Venue ID"
                  value={venueCode}
                  onChange={(e) => setVenueCode(e.target.value)}
                  style={{
                    flex: '1 1 130px',
                    minWidth: '110px',
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px',
                    background: 'var(--card2, #0d131f)',
                    border: '1.5px solid var(--line, #233044)',
                    borderRadius: '10px',
                    color: 'var(--cream, #FFFFFF)',
                    fontSize: '15px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary touch-target"
                  disabled={isVerifyingVenue}
                  onClick={() => doVerifyVenue(venueCode)}
                  style={{
                    padding: '12px 14px',
                    fontWeight: 800,
                    fontSize: '13px',
                    flex: '1 1 auto',
                    justifyContent: 'center',
                    minHeight: '44px',
                    whiteSpace: 'nowrap',
                    background: '#0ea5e9',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                  }}
                >
                  {isVerifyingVenue ? 'Verifying...' : 'Verify Venue'}
                </button>
              </div>
              {venueStatus && (
                <div
                  id="loginVenueStatus"
                  style={{
                    marginTop: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: venueVerified ? '#10b981' : '#E5B13A',
                  }}
                >
                  {venueStatus}
                </div>
              )}
            </div>

            {venueVerified && (
              <div id="loginStaffFieldsContainer" style={{ display: 'block' }}>
                <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                    Staff Name *
                  </label>
                  <select
                    id="loginStaffSelect"
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'var(--card2, #0d131f)',
                      border: '1.5px solid var(--line, #233044)',
                      borderRadius: '10px',
                      color: 'var(--cream, #FFFFFF)',
                      fontSize: '15px',
                      fontWeight: 700,
                    }}
                  >
                    {staffOptions.map((s) => (
                      <option key={s.id} value={s.id} style={{ background: '#151D2A', color: '#FFF' }}>
                        {s.name} ({s.position || s.role || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                    4-Digit PIN *
                  </label>
                  <input
                    type="password"
                    id="loginPinInput"
                    maxLength={4}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    autoComplete="current-password"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '14px',
                      background: 'var(--card2, #0d131f)',
                      border: '2px solid var(--gold, #E5B13A)',
                      borderRadius: '12px',
                      color: 'var(--cream, #FFFFFF)',
                      fontSize: '24px',
                      fontWeight: 800,
                      letterSpacing: '8px',
                      textAlign: 'center',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      padding: '14px',
                      fontSize: '15px',
                      fontWeight: 800,
                      background: '#0ea5e9',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)',
                      opacity: isSubmitting ? 0.7 : 1,
                    }}
                  >
                    {isSubmitting ? 'Opening Dashboard...' : 'Open Dashboard'}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* Mode 2: Manager Email + Password */}
        {mode === 'email' && (
          <form id="loginFormEmail" onSubmit={handleManagerEmailLogin}>
            <div style={{ marginBottom: '14px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--gold, #E5B13A)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Owner / Manager Email *
              </label>
              <input
                type="email"
                id="loginManagerEmailInput"
                placeholder="owner@domain.com"
                value={managerEmail}
                onChange={(e) => setManagerEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  boxSizing: 'border-box',
                  background: 'var(--card2, #0d131f)',
                  border: '1px solid var(--line, #233044)',
                  borderRadius: '10px',
                  color: 'var(--cream, #FFFFFF)',
                  fontSize: '14px',
                }}
              />
            </div>
            <div style={{ marginBottom: '14px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Passcode / Password * (4-Digit PIN e.g. 1234 or 2448)
              </label>
              <input
                type="password"
                id="loginManagerPassInput"
                placeholder="Enter 4-Digit Passcode"
                value={managerPass}
                onChange={(e) => setManagerPass(e.target.value)}
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '12px',
                  boxSizing: 'border-box',
                  background: 'var(--card2, #0d131f)',
                  border: '1px solid var(--line, #233044)',
                  borderRadius: '10px',
                  color: 'var(--cream, #FFFFFF)',
                  fontSize: '14px',
                }}
              />
            </div>
            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Venue Code (Optional if email is unique)
              </label>
              <input
                type="text"
                id="loginManagerVenueCode"
                placeholder="Enter Venue Code or Slug"
                value={managerVenueCode}
                onChange={(e) => setManagerVenueCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  boxSizing: 'border-box',
                  background: 'var(--card2, #0d131f)',
                  border: '1px solid var(--line, #233044)',
                  borderRadius: '10px',
                  color: 'var(--cream, #FFFFFF)',
                  fontSize: '14px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 800,
                background: '#0ea5e9',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Opening Dashboard...' : 'Open Dashboard'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
