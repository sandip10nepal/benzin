import React from 'react';
import { UserRole } from '../../types';

interface BadgeProps {
  role?: UserRole;
  label?: string;
  variant?: 'gold' | 'teal' | 'ember' | 'danger' | 'success' | 'muted';
}

const ROLE_STYLES: Record<UserRole, { label: string; color: string; bg: string }> = {
  owner: { label: 'Owner', color: 'var(--gold)', bg: 'var(--gold-glow)' },
  manager: { label: 'Manager', color: 'var(--teal)', bg: 'var(--teal-glow)' },
  host: { label: 'Host', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
  server: { label: 'Server', color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.15)' },
  bartender: { label: 'Bartender', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
  chef: { label: 'Chef', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
  hookah_maker: { label: 'Hookah Maker', color: '#ff5a1f', bg: 'rgba(255, 90, 31, 0.15)' },
  cashier: { label: 'Cashier', color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.15)' },
  kitchen: { label: 'Kitchen', color: 'var(--text-muted)', bg: 'rgba(148, 163, 184, 0.15)' },
};

export const Badge: React.FC<BadgeProps> = ({ role, label, variant }) => {
  if (role) {
    const style = ROLE_STYLES[role] || { label: role, color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.1)' };
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 10px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: style.color,
          backgroundColor: style.bg,
          border: `1px solid ${style.color}33`,
        }}
      >
        {style.label}
      </span>
    );
  }

  const colorVar = variant ? `var(--${variant})` : 'var(--brand-primary)';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: colorVar,
        backgroundColor: `${colorVar}22`,
        border: `1px solid ${colorVar}44`,
      }}
    >
      {label}
    </span>
  );
};
