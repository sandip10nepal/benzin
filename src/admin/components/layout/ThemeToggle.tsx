import React from 'react';

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggleTheme }) => {
  return (
    <button
      className="btn"
      id="themeToggleBtn"
      onClick={onToggleTheme}
      style={{
        padding: '8px 12px',
        fontSize: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      title="Toggle Light/Dark Theme"
    >
      <span id="themeIcon" style={{ display: 'inline-block', transition: 'transform 0.3s ease' }}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </span>{' '}
      <span id="themeLabel" style={{ marginLeft: '4px' }}>
        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </span>
    </button>
  );
};
