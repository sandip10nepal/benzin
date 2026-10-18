import React from 'react';
import { UserPlus, CheckCircle } from 'lucide-react';
import { StaffUser } from '../types';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  hourlyRate: string;
  isClockedIn: boolean;
  weeklyHours: string;
}

const STAFF_MEMBERS: StaffMember[] = [
  { id: 'st_1', name: 'Farhan Cavalli', role: 'OWNER / GENERAL MANAGER', hourlyRate: 'Salary', isClockedIn: true, weeklyHours: '42.5 hrs' },
  { id: 'st_2', name: 'Alex Morales', role: 'FLOOR MANAGER & HOOKAH MASTER', hourlyRate: '$22.00/hr', isClockedIn: true, weeklyHours: '36.0 hrs' },
  { id: 'st_3', name: 'Sarah Khan', role: 'SENIOR SERVER & CASHIER', hourlyRate: '$16.50/hr', isClockedIn: true, weeklyHours: '28.0 hrs' },
  { id: 'st_4', name: 'David Ramirez', role: 'SERVER & BARISTA', hourlyRate: '$15.00/hr', isClockedIn: false, weeklyHours: '24.5 hrs' },
  { id: 'st_5', name: 'Tariq Al-Mansoor', role: 'HOOKAH PREPARATION SPECIALIST', hourlyRate: '$18.00/hr', isClockedIn: false, weeklyHours: '31.0 hrs' },
];

interface StaffViewProps {
  currentUser?: StaffUser;
}

export const StaffView: React.FC<StaffViewProps> = () => {
  const totalEmployees = STAFF_MEMBERS.length;
  const clockedIn = STAFF_MEMBERS.filter((s) => s.isClockedIn).length;

  return (
    <div id="staffPageLayout" style={{ display: 'block' }}>
      {/* Quick Shift Summary & Weekly Payroll Fulfillment */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--line)',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <div style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
            TOTAL EMPLOYEES
          </div>
          <div id="totalStaffCount" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--cream)', marginTop: '4px' }}>
            {totalEmployees}
          </div>
        </div>

        <div
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--line)',
            borderRadius: '12px',
            padding: '16px',
            borderLeft: '3px solid var(--success)',
          }}
        >
          <div style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
            🟢 CURRENTLY CLOCKED IN
          </div>
          <div id="activeClockedInCount" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
            {clockedIn} Staff
          </div>
        </div>

        <div
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--gold)',
            borderRadius: '12px',
            padding: '14px 16px',
            borderLeft: '4px solid var(--gold)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gridColumn: 'span 2',
          }}
        >
          <div>
            <div style={{ color: 'var(--gold)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              💰 UNFULFILLED WEEKLY PAYROLL
            </div>
            <div id="weeklyPayrollPendingText" style={{ fontSize: '20px', fontWeight: 900, color: 'var(--cream)', marginTop: '2px' }}>
              $2,860.00 (162 hrs)
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{
              background: 'var(--gold)',
              color: '#000',
              fontWeight: 800,
              padding: '8px 14px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={() => alert('Payroll fulfillment processed!')}
            title="Mark weekly shift timecards as fulfilled and process payout"
          >
            <CheckCircle style={{ width: '16px', height: '16px' }} />
            <span>Fulfill Weekly Payroll</span>
          </button>
        </div>
      </div>

      <div
        style={{
          background: 'var(--card)',
          border: '1.5px solid var(--line)',
          borderRadius: '16px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ color: 'var(--gold)', fontSize: '16px', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>
            Employee Roster
          </h3>
          <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 800 }}>
            <UserPlus style={{ width: '14px', height: '14px' }} /> Add Staff
          </button>
        </div>

        <div id="employeeListBody" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {STAFF_MEMBERS.map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                background: 'var(--card2)',
                border: '1px solid var(--line)',
                borderRadius: '12px',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--cream)' }}>{s.name}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: s.isClockedIn ? 'rgba(16,185,129,0.18)' : 'rgba(148,163,184,0.15)',
                      color: s.isClockedIn ? 'var(--success)' : 'var(--muted)',
                    }}
                  >
                    {s.isClockedIn ? 'CLOCKED IN' : 'OFF SHIFT'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                  {s.role} &bull; {s.hourlyRate}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold)' }}>{s.weeklyHours}</span>
                <button className="btn" style={{ padding: '6px 12px', fontSize: '12px' }}>
                  View Timecard
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
