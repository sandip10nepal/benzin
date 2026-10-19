import React, { useState } from 'react';

interface StaffSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchAccount: (pin: string) => void;
}

export const StaffSwitchModal: React.FC<StaffSwitchModalProps> = ({
  isOpen,
  onClose,
  onSwitchAccount,
}) => {
  const [pin, setPin] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      alert('Please enter a valid 4-digit staff PIN');
      return;
    }
    onSwitchAccount(pin);
    setPin('');
  };

  return (
    <div
      id="staffSwitchModal"
      style={{
        display: 'flex',
        position: 'fixed',
        inset: 0,
        background: 'rgba(14,10,8,0.92)',
        backdropFilter: 'blur(16px)',
        zIndex: 100000,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          background: 'var(--card)',
          border: '1.5px solid var(--gold)',
          borderRadius: '20px',
          padding: '24px',
          textAlign: 'center',
          boxShadow: '0 16px 50px rgba(0,0,0,0.8)',
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cream)', marginBottom: '4px' }}>
          Switch Staff Account
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '16px' }}>
          Enter your 4-digit staff PIN to switch active dashboard session:
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            id="staffSwitchPinInput"
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
              marginBottom: '16px',
            }}
          />

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', fontWeight: 800 }}
            >
              Switch Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
