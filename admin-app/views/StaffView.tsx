import React, { useState, useEffect } from 'react';
import { UserPlus, CheckCircle, Edit2, Trash2, User } from 'lucide-react';
import { StaffUser } from '../types';
import { apiClient } from '../api/client';

export interface EmployeeRecord {
  id: string;
  name: string;
  role: string;
  position: string;
  hourly_rate?: number | null;
  email?: string | null;
  phone?: string | null;
  is_clocked_in: boolean;
  active_shift?: any;
  createdAt?: string;
}

interface StaffViewProps {
  currentUser?: StaffUser;
  onOpenAddEmployee?: () => void;
  onOpenEditEmployee?: (employee: EmployeeRecord) => void;
  onOpenStaffProfile?: (employee: StaffUser) => void;
  onFulfillWeeklyPayroll?: () => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  onOpenAddEmployee,
  onOpenEditEmployee,
  onOpenStaffProfile,
  onFulfillWeeklyPayroll,
}) => {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [payrollSummary, setPayrollSummary] = useState<{
    total_pending_payroll: number;
    unfulfilled_shifts_count: number;
  }>({ total_pending_payroll: 0, unfulfilled_shifts_count: 0 });
  const [loading, setLoading] = useState(true);
  const [fulfilling, setFulfilling] = useState(false);

  // Fetch live staff and payroll summary from database
  const loadData = async () => {
    try {
      setLoading(true);
      const [empList, pSummary] = await Promise.all([
        apiClient.getEmployees(),
        apiClient.getPayrollSummary().catch(() => null),
      ]);

      if (Array.isArray(empList)) {
        setEmployees(empList);
      }

      if (pSummary) {
        setPayrollSummary({
          total_pending_payroll: Number(pSummary.total_pending_payroll) || 0,
          unfulfilled_shifts_count: Number(pSummary.unfulfilled_shifts ?? pSummary.unfulfilled_shifts_count) || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching live employees from MongoDB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalEmployees = employees.length;
  const clockedIn = employees.filter((s) => s.is_clocked_in).length;

  const handleFulfill = async () => {
    if (!confirm('Fulfill weekly payroll and mark shifts as paid in the database?')) return;
    try {
      setFulfilling(true);
      const res = await apiClient.fulfillWeeklyPayroll();
      if (res && res.success) {
        alert('✓ Weekly payroll fulfilled successfully!');
        if (onFulfillWeeklyPayroll) onFulfillWeeklyPayroll();
        await loadData();
      } else {
        alert('Could not fulfill payroll: ' + (res?.message || 'Server error'));
      }
    } catch (err: any) {
      alert('Error fulfilling payroll: ' + err.message);
    } finally {
      setFulfilling(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, emp: EmployeeRecord) => {
    e.stopPropagation();
    if (emp.role === 'owner') {
      alert('The Owner account cannot be removed.');
      return;
    }
    if (!confirm(`Are you sure you want to remove "${emp.name}" from staff roster?`)) return;
    try {
      const res = await apiClient.deleteEmployee(emp.id);
      if (res && res.success) {
        setEmployees((prev) => prev.filter((item) => item.id !== emp.id));
      } else {
        alert('Could not remove employee: ' + (res?.message || 'Server error'));
      }
    } catch (err: any) {
      alert('Error removing employee: ' + err.message);
    }
  };

  const getRoleLabel = (emp: EmployeeRecord) => {
    const role = (emp.role || '').toLowerCase();
    const pos = (emp.position || '').toLowerCase();

    if (role === 'owner' || pos.includes('owner')) return 'OWNER';
    if (role === 'manager' || pos.includes('manager')) return 'MANAGER';
    if (pos.includes('server') && pos.includes('cashier')) return 'CASHIER / SERVER';
    if (role === 'cashier' || pos.includes('cashier')) return 'CASHIER / SERVER';
    if (role === 'server' || pos.includes('server')) return 'SERVER';
    if (role === 'chef' || pos.includes('chef') || pos.includes('kitchen')) return 'KITCHEN CHEF';
    if (role === 'bartender' || pos.includes('bar')) return 'LEAD BARTENDER';
    if (role === 'hookah_maker' || pos.includes('hookah')) return 'HOOKAH SPECIALIST';
    return (emp.position || emp.role || 'STAFF').toUpperCase();
  };

  const getRoleColor = (roleLabel: string) => {
    if (roleLabel === 'OWNER') return '#38bdf8';
    if (roleLabel === 'MANAGER') return '#10b981';
    if (roleLabel.includes('CASHIER') || roleLabel.includes('SERVER')) return '#10b981';
    return '#38bdf8';
  };

  return (
    <div id="staffPageLayout" style={{ display: 'block' }}>
      {/* Quick Shift Summary & Weekly Payroll Fulfillment Header Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {/* Card 1: Total Employees */}
        <div
          style={{
            background: '#151D2A',
            border: '1.5px solid #233044',
            borderRadius: '16px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              color: '#94a3b8',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
            }}
          >
            TOTAL EMPLOYEES
          </div>
          <div
            id="totalStaffCount"
            style={{
              fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
              fontSize: '32px',
              fontWeight: 900,
              color: '#FFFFFF',
              marginTop: '4px',
              lineHeight: 1,
            }}
          >
            {totalEmployees}
          </div>
        </div>

        {/* Card 2: Currently Clocked In */}
        <div
          style={{
            background: '#151D2A',
            border: '1.5px solid #233044',
            borderLeft: '4px solid #10b981',
            borderRadius: '16px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              color: '#10b981',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🟢</span>
            <span>CURRENTLY CLOCKED IN</span>
          </div>
          <div
            id="activeClockedInCount"
            style={{
              fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
              fontSize: '32px',
              fontWeight: 900,
              color: '#10b981',
              marginTop: '4px',
              lineHeight: 1,
            }}
          >
            {clockedIn} Staff
          </div>
        </div>

        {/* Card 3: Unfulfilled Weekly Payroll */}
        <div
          style={{
            background: '#151D2A',
            border: '1.5px solid #0284c7',
            borderRadius: '16px',
            padding: '18px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            gridColumn: 'span 2',
          }}
        >
          <div>
            <div
              style={{
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>💰</span>
              <span>UNFULFILLED WEEKLY PAYROLL</span>
            </div>
            <div
              id="weeklyPayrollPendingText"
              style={{
                fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
                fontSize: '28px',
                fontWeight: 900,
                color: '#FFFFFF',
                marginTop: '4px',
                lineHeight: 1,
              }}
            >
              ${payrollSummary.total_pending_payroll.toFixed(2)} ({payrollSummary.unfulfilled_shifts_count} shifts)
            </div>
          </div>

          <button
            className="btn btn-primary touch-target"
            onClick={handleFulfill}
            disabled={fulfilling}
            style={{
              background: '#0ea5e9',
              color: '#FFFFFF',
              fontWeight: 800,
              padding: '12px 20px',
              fontSize: '13px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)',
              opacity: fulfilling ? 0.7 : 1,
            }}
            title="Mark weekly shift timecards as fulfilled and process payout"
          >
            <CheckCircle style={{ width: '16px', height: '16px' }} />
            <span>{fulfilling ? 'Fulfilling...' : 'Fulfill Weekly Payroll'}</span>
          </button>
        </div>
      </div>

      {/* Main Employee Roster Section */}
      <div
        style={{
          background: 'transparent',
          borderRadius: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
          }}
        >
          <h3
            style={{
              fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
              color: '#38bdf8',
              fontSize: '18px',
              fontWeight: 900,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            EMPLOYEE ROSTER
          </h3>

          <button
            className="btn btn-primary touch-target"
            onClick={onOpenAddEmployee}
            style={{
              background: '#0ea5e9',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(14, 165, 233, 0.3)',
            }}
          >
            <UserPlus style={{ width: '15px', height: '15px' }} />
            <span>+ Add Staff</span>
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '14px' }}>
            Connecting to database & loading staff roster...
          </div>
        ) : employees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '14px' }}>
            No staff members found in database. Tap "+ Add Staff" to register your first team member.
          </div>
        ) : (
          <div id="employeeListBody" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {employees.map((emp) => {
              const roleLabel = getRoleLabel(emp);
              const roleColor = getRoleColor(roleLabel);
              const isOwner = emp.role === 'owner' || roleLabel === 'OWNER';
              const isManager = isOwner || emp.role === 'manager' || roleLabel === 'MANAGER';
              const displayEmail = emp.email || null;

              const initial = (emp.name || 'S').charAt(0).toUpperCase();

              return (
                <div
                  key={emp.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#151D2A',
                    border: '1.5px solid #233044',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    gap: '16px',
                    flexWrap: 'wrap',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Left: Avatar + Details */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      cursor: 'pointer',
                    }}
                    onClick={() =>
                      onOpenStaffProfile &&
                      onOpenStaffProfile({
                        id: emp.id,
                        name: emp.name,
                        role: emp.role,
                        position: emp.position,
                        hourlyWage: Number(emp.hourly_rate) || 18,
                        email: displayEmail || undefined,
                        isClockedIn: emp.is_clocked_in,
                        weeklyHours: '34.5 hrs',
                      })
                    }
                    title="Click to view staff profile, shift history & payroll logs"
                  >
                    {/* Circular Avatar */}
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        border: `2px solid ${roleColor}`,
                        background: 'rgba(14, 165, 233, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: roleColor,
                        fontSize: '20px',
                        fontWeight: 900,
                        flexShrink: 0,
                      }}
                    >
                      {initial}
                    </div>

                    <div>
                      {/* Name + Clocked In Status + Profile Link */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
                            fontSize: '16px',
                            fontWeight: 800,
                            color: '#FFFFFF',
                          }}
                        >
                          {emp.name}
                        </span>

                        {emp.is_clocked_in && (
                          <span
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              border: '1.5px solid #10b981',
                              color: '#10b981',
                              borderRadius: '9999px',
                              padding: '2px 8px',
                              fontSize: '10px',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>🟢</span>
                            <span>ON SHIFT</span>
                          </span>
                        )}

                        <span
                          style={{
                            fontSize: '12px',
                            color: '#38bdf8',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <User style={{ width: '12px', height: '12px' }} />
                          <span>Profile</span>
                        </span>
                      </div>

                      {/* Role Pill */}
                      <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            background: 'transparent',
                            border: `1.5px solid ${roleColor}`,
                            color: roleColor,
                            borderRadius: '9999px',
                            padding: '2px 10px',
                            fontSize: '11px',
                            fontWeight: 800,
                            letterSpacing: '0.4px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {roleLabel}
                        </span>
                      </div>

                      {/* Email Row + Manager Login Pill */}
                      {displayEmail && (
                        <div
                          style={{
                            marginTop: '6px',
                            fontSize: '12px',
                            color: '#38bdf8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: 700,
                          }}
                        >
                          <span>✉️</span>
                          <span>{displayEmail}</span>
                          {isManager && (
                            <span
                              style={{
                                background: 'rgba(14, 165, 233, 0.15)',
                                border: '1px solid #0284c7',
                                color: '#38bdf8',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 800,
                                letterSpacing: '0.5px',
                              }}
                            >
                              MANAGER LOGIN
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions: Edit & Remove */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      className="btn touch-target"
                      onClick={() => onOpenEditEmployee && onOpenEditEmployee(emp)}
                      style={{
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: 800,
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1.5px solid #233044',
                        borderRadius: '10px',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <Edit2 style={{ width: '13px', height: '13px', color: '#94a3b8' }} />
                      <span>Edit</span>
                    </button>

                    {!isOwner && (
                      <button
                        className="btn btn-danger touch-target"
                        onClick={(e) => handleDelete(e, emp)}
                        style={{
                          padding: '8px 14px',
                          fontSize: '12px',
                          fontWeight: 800,
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1.5px solid rgba(239, 68, 68, 0.35)',
                          borderRadius: '10px',
                          color: '#f87171',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 style={{ width: '13px', height: '13px' }} />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
