import React, { useState } from 'react';
import { UserPlus, CheckCircle } from 'lucide-react';
import { StaffUser } from '../types';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  hourlyRate: string;
  hourlyWage?: number;
  isClockedIn: boolean;
  weeklyHours: string;
  email?: string;
  pin?: string;
}

const INITIAL_STAFF: StaffMember[] = [
  { id: 'st_1', name: 'Farhan Cavalli', role: 'OWNER / GENERAL MANAGER', hourlyRate: 'Salary', hourlyWage: 35, isClockedIn: true, weeklyHours: '42.5 hrs', email: 'owner@cavalli.com', pin: '2448' },
  { id: 'st_2', name: 'Alex Morales', role: 'FLOOR MANAGER & HOOKAH MASTER', hourlyRate: '$22.00/hr', hourlyWage: 22, isClockedIn: true, weeklyHours: '36.0 hrs', email: 'alex@cavalli.com', pin: '1111' },
  { id: 'st_3', name: 'Suwasna Gorkhali', role: 'SENIOR SERVER & CASHIER', hourlyRate: '$18.00/hr', hourlyWage: 18, isClockedIn: true, weeklyHours: '34.5 hrs', pin: '1234' },
  { id: 'st_4', name: 'Sarah Khan', role: 'SERVER & CASHIER', hourlyRate: '$16.50/hr', hourlyWage: 16.5, isClockedIn: true, weeklyHours: '28.0 hrs', pin: '2222' },
  { id: 'st_5', name: 'David Ramirez', role: 'SERVER & BARISTA', hourlyRate: '$15.00/hr', hourlyWage: 15, isClockedIn: false, weeklyHours: '24.5 hrs', pin: '3333' },
  { id: 'st_6', name: 'Tariq Al-Mansoor', role: 'HOOKAH PREPARATION SPECIALIST', hourlyRate: '$18.00/hr', hourlyWage: 18, isClockedIn: false, weeklyHours: '31.0 hrs', pin: '4444' },
];

interface StaffViewProps {
  currentUser?: StaffUser;
  onOpenAddEmployee?: () => void;
  onOpenStaffProfile?: (employee: StaffUser) => void;
  onFulfillWeeklyPayroll?: () => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  onOpenAddEmployee,
  onOpenStaffProfile,
  onFulfillWeeklyPayroll,
}) => {
  const [staffList] = useState<StaffMember[]>(INITIAL_STAFF);
  const [payrollPendingText, setPayrollPendingText] = useState('$2,860.00 (162 hrs)');

  const totalEmployees = staffList.length;
  const clockedIn = staffList.filter((s) => s.isClockedIn).length;

  const handleFulfill = () => {
    if (confirm('Fulfill weekly payroll and mark shifts as paid?')) {
      if (onFulfillWeeklyPayroll) onFulfillWeeklyPayroll();
      setPayrollPendingText('$0.00 (0 shifts)');
      alert('✓ Weekly payroll fulfilled successfully!');
    }
  };

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
              {payrollPendingText}
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
            onClick={handleFulfill}
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
          <button
            className="btn btn-primary"
            onClick={onOpenAddEmployee}
            style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <UserPlus style={{ width: '14px', height: '14px' }} />
            <span>+ Add Staff</span>
          </button>
        </div>

        <div id="employeeListBody" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {staffList.map((s) => (
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
                  {s.role} • {s.hourlyRate}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold)' }}>{s.weeklyHours}</span>
                <button
                  className="btn"
                  onClick={() =>
                    onOpenStaffProfile &&
                    onOpenStaffProfile({
                      id: s.id,
                      name: s.name,
                      role: s.role,
                      isClockedIn: s.isClockedIn,
                      hourlyWage: s.hourlyWage,
                      email: s.email,
                      pin: s.pin,
                    })
                  }
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
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
