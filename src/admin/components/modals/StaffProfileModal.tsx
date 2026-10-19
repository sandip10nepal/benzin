import React from 'react';
import { StaffUser } from '../../types';

interface StaffProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: StaffUser | null;
  onFulfillPayrollShift?: (shiftId: string) => void;
}

export const StaffProfileModal: React.FC<StaffProfileModalProps> = ({
  isOpen,
  onClose,
  employee,
  onFulfillPayrollShift,
}) => {
  if (!isOpen || !employee) return null;

  const isClockedIn = Boolean(employee.isClockedIn);
  const wage = employee.hourlyWage || 18;
  const initial = (employee.name || 'S').charAt(0).toUpperCase();

  // Mocked/calculated timecard data matching legacy admin structure
  const hrsWeek = 34.5;
  const payWeek = hrsWeek * wage;
  const hrsMonth = 142.0;
  const payMonth = hrsMonth * wage;
  const hrs6Months = 810.0;
  const pay6Months = hrs6Months * wage;

  const samplePayrollShifts = [
    {
      id: 'shift_1',
      date: 'Oct 12 - Oct 18',
      hours: 34.5,
      payout: payWeek,
      status: 'pending',
    },
    {
      id: 'shift_2',
      date: 'Oct 05 - Oct 11',
      hours: 38.0,
      payout: 38 * wage,
      status: 'fulfilled',
    },
  ];

  const sampleClockLogs = [
    {
      date: 'Today',
      clockIn: '04:15 PM',
      clockOut: isClockedIn ? 'In Progress' : '11:45 PM',
      hours: isClockedIn ? 'Active' : '7.5 hrs',
    },
    {
      date: 'Yesterday',
      clockIn: '03:50 PM',
      clockOut: '12:10 AM',
      hours: '8.3 hrs',
    },
    {
      date: 'Oct 16',
      clockIn: '04:00 PM',
      clockOut: '11:30 PM',
      hours: '7.5 hrs',
    },
  ];

  return (
    <div
      id="staffProfileModal"
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
          maxWidth: '720px',
          maxHeight: '88vh',
          overflowY: 'auto',
          background: 'var(--card)',
          border: '1.5px solid var(--gold)',
          borderRadius: '24px',
          padding: '28px',
          textAlign: 'left',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px',
            borderBottom: '1px solid var(--line)',
            paddingBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              id="profAvatar"
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(59,130,246,0.15)',
                border: '2.5px solid #3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: '#3b82f6',
                fontWeight: 900,
              }}
            >
              {initial}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 id="profName" style={{ color: 'var(--cream)', fontSize: '20px', fontWeight: 900, margin: 0 }}>
                  {employee.name}
                </h2>
                <span
                  id="profStatusBadge"
                  style={{
                    background: isClockedIn ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                    color: isClockedIn ? 'var(--success)' : 'var(--muted)',
                    border: `1px solid ${isClockedIn ? 'var(--success)' : 'var(--line)'}`,
                    borderRadius: '20px',
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: 800,
                  }}
                >
                  {isClockedIn ? 'CLOCKED IN' : 'OFF SHIFT'}
                </span>
              </div>
              <div style={{ marginTop: '4px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span
                  id="profPosition"
                  style={{
                    background: 'rgba(229,177,58,0.1)',
                    color: 'var(--gold)',
                    border: '1.5px solid var(--gold)',
                    borderRadius: '20px',
                    padding: '2px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  {employee.role}
                </span>
                <span id="profPayRate" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--gold)' }}>
                  ${wage.toFixed(2)} / hr
                </span>
                {employee.email && (
                  <span
                    id="profEmail"
                    style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 700, display: 'inline-block' }}
                  >
                    ✉️ {employee.email}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            className="btn"
            onClick={onClose}
            style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 800 }}
          >
            ✕ Close
          </button>
        </div>

        {/* 3 Hours Worked Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              background: 'var(--card2)',
              border: '1px solid var(--line)',
              borderRadius: '14px',
              padding: '14px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>
              Total Hours (This Week)
            </div>
            <div id="profHrsWeek" style={{ fontSize: '22px', fontWeight: 900, color: 'var(--cream)', marginTop: '4px' }}>
              {hrsWeek.toFixed(2)} hrs
            </div>
            <div id="profPayWeek" style={{ fontSize: '12px', fontWeight: 800, color: 'var(--gold)', marginTop: '2px' }}>
              ${payWeek.toFixed(2)}
            </div>
          </div>

          <div
            style={{
              background: 'var(--card2)',
              border: '1px solid var(--line)',
              borderRadius: '14px',
              padding: '14px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>
              Total Hours (This Month)
            </div>
            <div id="profHrsMonth" style={{ fontSize: '22px', fontWeight: 900, color: 'var(--cream)', marginTop: '4px' }}>
              {hrsMonth.toFixed(2)} hrs
            </div>
            <div id="profPayMonth" style={{ fontSize: '12px', fontWeight: 800, color: 'var(--gold)', marginTop: '2px' }}>
              ${payMonth.toFixed(2)}
            </div>
          </div>

          <div
            style={{
              background: 'var(--card2)',
              border: '1px solid var(--line)',
              borderRadius: '14px',
              padding: '14px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>
              Total Hours (6 Months)
            </div>
            <div id="profHrs6Months" style={{ fontSize: '22px', fontWeight: 900, color: 'var(--cream)', marginTop: '4px' }}>
              {hrs6Months.toFixed(2)} hrs
            </div>
            <div id="profPay6Months" style={{ fontSize: '12px', fontWeight: 800, color: 'var(--gold)', marginTop: '2px' }}>
              ${pay6Months.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Weekly Payroll & Fulfillment Section */}
        <div style={{ marginBottom: '24px' }}>
          <h4
            style={{
              color: 'var(--gold)',
              fontSize: '14px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Weekly Payroll &amp; Fulfillment</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'none' }}>
              Manager Actions
            </span>
          </h4>
          <div
            id="profWeeklyPayrollList"
            style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}
          >
            {samplePayrollShifts.map((shift) => (
              <div
                key={shift.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: 'var(--card2)',
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--cream)', fontSize: '13px' }}>{shift.date}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                    {shift.hours} hrs worked • Payout:{' '}
                    <strong style={{ color: 'var(--gold)' }}>${shift.payout.toFixed(2)}</strong>
                  </div>
                </div>
                {shift.status === 'pending' ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      if (onFulfillPayrollShift) onFulfillPayrollShift(shift.id);
                      alert(`Weekly payroll fulfilled for ${employee.name}`);
                    }}
                    style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 800 }}
                  >
                    ✓ Fulfill Shift
                  </button>
                ) : (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: 'var(--success)',
                      background: 'rgba(34,197,94,0.15)',
                      padding: '4px 10px',
                      borderRadius: '8px',
                    }}
                  >
                    PAID / FULFILLED
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Clock In / Clock Out Shift Logs */}
        <div>
          <h4
            style={{
              color: 'var(--cream)',
              fontSize: '14px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '10px',
            }}
          >
            Clock In / Clock Out Logs
          </h4>
          <div
            id="profClockLogsList"
            style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}
          >
            {sampleClockLogs.map((log, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: 'var(--card2)',
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                  fontSize: '12px',
                }}
              >
                <div>
                  <span style={{ fontWeight: 800, color: 'var(--cream)' }}>{log.date}</span>
                  <span style={{ color: 'var(--muted)', marginLeft: '12px' }}>
                    🟢 {log.clockIn} → 🔴 {log.clockOut}
                  </span>
                </div>
                <span style={{ fontWeight: 800, color: 'var(--gold)' }}>{log.hours}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
