import React, { useState } from 'react';
import { StaffUser } from '../../types';

interface LoginOverlayProps {
  isOpen: boolean;
  onClose?: () => void;
  staffList?: StaffUser[];
  onStaffLogin?: (staff: StaffUser) => void;
  onManagerLogin?: (email: string, pass: string) => void;
}

export const LoginOverlay: React.FC<LoginOverlayProps> = ({
  isOpen,
  onClose,
  staffList = [
    { id: 'u1', name: 'Suwasna Gorkhali', role: 'server', isClockedIn: true },
    { id: 'u2', name: 'Owner', role: 'owner', isClockedIn: true },
    { id: 'u3', name: 'Alex M.', role: 'manager', isClockedIn: true },
  ],
  onStaffLogin,
  onManagerLogin,
}) => {
  const [mode, setMode] = useState<'pin' | 'email'>('pin');
  const [venueCode, setVenueCode] = useState('CAVALLI');
  const [venueVerified, setVenueVerified] = useState(true);
  const [venueStatus, setVenueStatus] = useState('✓ Venue Verified: Cavalli Lounge');
  const [selectedStaffId, setSelectedStaffId] = useState(staffList[0]?.id || '');
  const [pin, setPin] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPass, setManagerPass] = useState('');
  const [managerVenueCode, setManagerVenueCode] = useState('');

  if (!isOpen) return null;

  const handleVerifyVenue = () => {
    if (!venueCode.trim()) {
      setVenueStatus('⚠️ Please enter a venue code');
      setVenueVerified(false);
      return;
    }
    setVenueVerified(true);
    setVenueStatus(`✓ Venue Verified: ${venueCode.toUpperCase()}`);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      alert('Please enter a 4-digit staff PIN');
      return;
    }
    const staff = staffList.find((s) => s.id === selectedStaffId) || staffList[0];
    if (onStaffLogin && staff) {
      onStaffLogin(staff);
    }
    if (onClose) onClose();
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerEmail.trim() || !managerPass.trim()) {
      alert('Please enter email and passcode');
      return;
    }
    if (onManagerLogin) {
      onManagerLogin(managerEmail, managerPass);
    }
    if (onClose) onClose();
  };

  return (
    <div
      id="benzinLoginOverlay"
      style={{
        display: 'flex',
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay-bg)',
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
          background: 'var(--card)',
          border: '1.5px solid var(--line)',
          borderRadius: '24px',
          padding: 'clamp(18px, 5vw, 32px)',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          color: 'var(--cream)',
        }}
      >
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
          <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#3b82f6', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>
            BENZIN
          </h2>
        </div>

        {/* Mode Switcher (Staff PIN vs Manager Email) */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            background: 'var(--card2)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid var(--line)',
            marginBottom: '24px',
          }}
        >
          <button
            className={`sub-tab ${mode === 'pin' ? 'active' : ''}`}
            id="loginTab-pin"
            style={{ flex: 1, textAlign: 'center' }}
            onClick={() => setMode('pin')}
          >
            Staff
          </button>
          <button
            className={`sub-tab ${mode === 'email' ? 'active' : ''}`}
            id="loginTab-email"
            style={{ flex: 1, textAlign: 'center' }}
            onClick={() => setMode('email')}
          >
            Manager
          </button>
        </div>

        {/* Mode 1: Staff 8-Digit Floor Code or Restaurant Code + Staff PIN */}
        {mode === 'pin' && (
          <div id="loginFormPin">
            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                Venue ID *
              </label>
              <div className="login-venue-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
                <input
                  type="text"
                  id="loginVenueCode"
                  placeholder="Enter Venue ID"
                  value={venueCode}
                  onChange={(e) => setVenueCode(e.target.value.toUpperCase())}
                  style={{
                    flex: '1 1 130px',
                    minWidth: '110px',
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px',
                    background: 'var(--card2)',
                    border: '1.5px solid var(--line)',
                    borderRadius: '10px',
                    color: 'var(--cream)',
                    fontSize: '15px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary touch-target"
                  onClick={handleVerifyVenue}
                  style={{ padding: '12px 14px', fontWeight: 800, fontSize: '13px', flex: '1 1 auto', justifyContent: 'center', minHeight: '44px', whiteSpace: 'nowrap' }}
                >
                  Verify Venue
                </button>
              </div>
              <div id="loginVenueStatus" style={{ marginTop: '6px', fontSize: '12px', fontWeight: 700, color: venueVerified ? 'var(--success)' : 'var(--gold)' }}>
                {venueStatus}
              </div>
            </div>

            {venueVerified && (
              <form onSubmit={handlePinSubmit} id="loginStaffFieldsContainer">
                <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                    Name *
                  </label>
                  <select
                    id="loginStaffSelect"
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'var(--card2)',
                      border: '1.5px solid var(--line)',
                      borderRadius: '10px',
                      color: 'var(--cream)',
                      fontSize: '15px',
                      fontWeight: 700,
                    }}
                  >
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                    Pin *
                  </label>
                  <input
                    type="password"
                    id="loginPinInput"
                    maxLength={4}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '14px',
                      background: 'var(--card2)',
                      border: '2px solid var(--gold)',
                      borderRadius: '12px',
                      color: 'var(--cream)',
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
                    style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px', fontWeight: 800 }}
                  >
                    Open Dashboard
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Mode 2: Manager / Owner Unified Login */}
        {mode === 'email' && (
          <form onSubmit={handleEmailSubmit} id="loginFormEmail">
            <div style={{ marginBottom: '14px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Owner / Manager Email *
              </label>
              <input
                type="email"
                id="loginManagerEmailInput"
                placeholder="name@cavalli.com"
                value={managerEmail}
                onChange={(e) => setManagerEmail(e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'var(--card2)', border: '1px solid var(--line)', borderRadius: '10px', color: 'var(--cream)', fontSize: '14px' }}
              />
            </div>
            <div style={{ marginBottom: '14px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Passcode / Password * (4-Digit PIN e.g. 2448)
              </label>
              <input
                type="password"
                id="loginManagerPassInput"
                placeholder="Enter 4-Digit Passcode"
                value={managerPass}
                onChange={(e) => setManagerPass(e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'var(--card2)', border: '1px solid var(--line)', borderRadius: '10px', color: 'var(--cream)', fontSize: '14px' }}
              />
            </div>
            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Venue Code (Optional if email is unique)
              </label>
              <input
                type="text"
                id="loginManagerVenueCode"
                placeholder="e.g. 4821 or leave blank"
                value={managerVenueCode}
                onChange={(e) => setManagerVenueCode(e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'var(--card2)', border: '1px solid var(--line)', borderRadius: '10px', color: 'var(--cream)', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px', fontWeight: 800 }}
            >
              Open Dashboard
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
