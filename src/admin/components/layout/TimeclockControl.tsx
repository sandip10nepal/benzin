import React, { useState, useEffect } from 'react';

interface TimeclockControlProps {
  initialClockedIn?: boolean;
  onClockChange?: (clockedIn: boolean) => void;
}

export const TimeclockControl: React.FC<TimeclockControlProps> = ({
  initialClockedIn = false,
  onClockChange,
}) => {
  const [isClockedIn, setIsClockedIn] = useState<boolean>(initialClockedIn);
  const [seconds, setSeconds] = useState<number>(0);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isClockedIn) {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isClockedIn]);

  const toggleShiftClock = () => {
    const nextState = !isClockedIn;
    setIsClockedIn(nextState);
    if (onClockChange) {
      onClockChange(nextState);
    }
  };

  const formatTimer = (totalSecs: number) => {
    const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <button
      id="headerTimeclockBtn"
      className="btn"
      onClick={toggleShiftClock}
      title="Toggle Clock In / Clock Out for current user"
      style={{
        padding: '6px 14px',
        borderRadius: '12px',
        fontWeight: 800,
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        border: isClockedIn ? '1.5px solid var(--success)' : '1px solid var(--line)',
        background: isClockedIn ? 'rgba(16, 185, 129, 0.08)' : 'var(--card2)',
      }}
    >
      <div
        id="headerClockDot"
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: isClockedIn ? 'var(--success)' : 'var(--muted)',
          boxShadow: isClockedIn ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none',
          transition: 'all 0.25s ease',
        }}
      />
      <div style={{ textAlign: 'left' }}>
        <div
          id="headerShiftTimerText"
          style={{
            fontSize: '12px',
            fontWeight: 800,
            fontFamily: 'monospace',
            color: isClockedIn ? 'var(--success)' : 'var(--cream)',
            letterSpacing: '0.5px',
          }}
        >
          {formatTimer(seconds)}
        </div>
        <div
          id="headerClockBtnText"
          style={{
            fontSize: '9px',
            fontWeight: 800,
            textTransform: 'uppercase',
            color: isClockedIn ? 'var(--success)' : 'var(--muted)',
            letterSpacing: '0.5px',
          }}
        >
          {isClockedIn ? 'CLOCK OUT' : 'CLOCK IN'}
        </div>
      </div>
    </button>
  );
};
