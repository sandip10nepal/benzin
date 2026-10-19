import React from 'react';
import { User } from 'lucide-react';
import { StaffUser } from '../../types';

interface EmployeeProfileProps {
  user: StaffUser;
  onClickProfile?: () => void;
  onClickSwitch?: () => void;
}

export const EmployeeProfile: React.FC<EmployeeProfileProps> = ({
  user,
  onClickProfile,
  onClickSwitch,
}) => {
  return (
    <div
      id="loggedInUserBox"
      onClick={onClickProfile}
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
            onClick={(e) => {
              e.stopPropagation();
              if (onClickSwitch) onClickSwitch();
            }}
            title="Switch staff account"
            style={{
              fontSize: '11px',
              color: 'var(--gold)',
              fontWeight: 900,
              display: 'inline-block',
              padding: '0 2px',
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
