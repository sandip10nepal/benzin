import React, { useState, useEffect } from 'react';
import { StaffUser } from '../../types';
import { apiClient } from '../../api/client';

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
  const [timecards, setTimecards] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && employee?.id) {
      apiClient.getTimecards(employee.id)
        .then((cards) => setTimecards(Array.isArray(cards) ? cards : []))
        .catch(() => setTimecards([]));
    }
  }, [isOpen, employee?.id]);

  if (!isOpen || !employee) return null;

  const isClockedIn = Boolean(employee.isClockedIn);
  const wage = Number(employee.hourlyWage) || 0;
  const initial = (employee.name || 'S').charAt(0).toUpperCase();

  // Calculate real hours and pay from database timecards
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
  const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;

  const calcHoursInPeriod = (since: number) => {
    return timecards
      .filter((tc: any) => new Date(tc.clock_in).getTime() >= since)
      .reduce((sum: number, tc: any) => sum + (Number(tc.total_hours) || 0), 0);
  };

  const hrsWeek = calcHoursInPeriod(oneWeekAgo);
  const payWeek = hrsWeek * wage;
  const hrsMonth = calcHoursInPeriod(oneMonthAgo);
  const payMonth = hrsMonth * wage;
  const hrs6Months = calcHoursInPeriod(sixMonthsAgo);
  const pay6Months = hrs6Months * wage;

  const payrollShifts = timecards.map((tc: any, idx: number) => {
    const hours = Number(tc.total_hours) || 0;
    const dt = new Date(tc.clock_in);
    const dateStr = !isNaN(dt.getTime())
      ? dt.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
      : `Shift #${idx + 1}`;
    return {
      id: tc._id || tc.id || `shift_${idx}`,
      date: dateStr,
      hours: Math.round(hours * 10) / 10,
      payout: Math.round(hours * wage * 100) / 100,
      status: tc.is_paid || tc.fulfilled ? 'fulfilled' : 'pending',
    };
  });

  const clockLogs = timecards.slice(0, 5).map((tc: any) => {
    const inDate = new Date(tc.clock_in);
    const outDate = tc.clock_out ? new Date(tc.clock_out) : null;
    return {
      date: !isNaN(inDate.getTime()) ? inDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Date',
      clockIn: !isNaN(inDate.getTime()) ? inDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
      clockOut: outDate && !isNaN(outDate.getTime()) ? outDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (tc.is_active ? 'In Progress' : 'Completed'),
      hours: tc.total_hours ? `${tc.total_hours} hrs` : (tc.is_active ? 'Active' : '0 hrs'),
    };
  });

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
            {payrollShifts.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: '13px', padding: '12px', textAlign: 'center' }}>
                No completed payroll shifts recorded in database.
              </div>
            ) : (
              payrollShifts.map((shift) => (
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
              ))
            )}
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
            {clockLogs.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: '13px', padding: '12px', textAlign: 'center' }}>
                No clock punch logs recorded yet.
              </div>
            ) : (
              clockLogs.map((log, idx) => (
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
            ))
          )}
          </div>
        </div>
      </div>
    </div>
  );
};
