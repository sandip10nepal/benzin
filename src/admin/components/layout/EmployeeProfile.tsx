import React from 'react';
import { User } from 'lucide-react';
import { StaffUser } from '../../types';

interface EmployeeProfileProps {
  user: StaffUser;
  onClick?: () => void;
}

export const EmployeeProfile: React.FC<EmployeeProfileProps> = ({ user, onClick }) => {
  return (
    <div
      id="loggedInUserBox"
      onClick={onClick}
      style={{
        background: 'var(--card)',
        border: '1.5px solid var(--gold)',
        borderRadius: '10px',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      title="Tap to view your staff profile & work hours"
    >
      <User style={{ width: '16px', height: '16px', color: 'var(--gold)' }} />
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div id="headerStaffName" style={{ fontSize: '12px', fontWeight: 800, color: 'var(--cream)' }}>
            {user.name || 'Owner'}
          </div>
          <span
            id="headerSwitchIcon"
            style={{
              fontSize: '10px',
              color: 'var(--gold)',
              fontWeight: 800,
              display: 'inline',
              transition: 'transform 0.2s ease',
            }}
          >
            ⇄
          </span>
        </div>
        <div
          id="headerStaffRole"
          style={{
            fontSize: '10px',
            color: 'var(--muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {user.position || user.role.toUpperCase() || 'OWNER'}
        </div>
      </div>
    </div>
  );
};
