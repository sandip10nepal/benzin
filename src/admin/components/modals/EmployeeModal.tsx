import React, { useState, useEffect } from 'react';
import { StaffUser } from '../../types';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: StaffUser | null;
  onSaveEmployee: (emp: {
    id?: string;
    name: string;
    role: string;
    email?: string;
    pin: string;
    hourlyWage?: number;
  }) => void;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSaveEmployee,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('cashier');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [hourlyWage, setHourlyWage] = useState('18.00');

  useEffect(() => {
    if (employee) {
      setName(employee.name || '');
      setRole(employee.role || 'cashier');
      setEmail(employee.email || '');
      setPin(employee.pin || '');
      setHourlyWage(String(employee.hourlyWage || '18.00'));
    } else {
      setName('');
      setRole('cashier');
      setEmail('');
      setPin('');
      setHourlyWage('18.00');
    }
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const isManagerRole = role === 'manager' || role === 'owner';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter employee name');
      return;
    }
    if (pin.length < 4) {
      alert('Please enter a 4-digit PIN');
      return;
    }
    if (isManagerRole && !email.trim()) {
      alert('Manager role requires an email address');
      return;
    }

    onSaveEmployee({
      id: employee?.id,
      name: name.trim(),
      role,
      email: isManagerRole ? email.trim() : undefined,
      pin: pin.trim(),
      hourlyWage: parseFloat(hourlyWage) || 18,
    });
    onClose();
  };

  return (
    <div
      id="empModal"
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
          maxWidth: '400px',
          background: 'var(--card)',
          border: '1.5px solid var(--gold)',
          borderRadius: '20px',
          padding: '24px',
          textAlign: 'left',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        }}
      >
        <h3 id="empModalTitle" style={{ color: 'var(--gold)', fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>
          {employee ? 'Edit Employee' : 'Add Employee'}
        </h3>
        <input type="hidden" id="empEditId" value={employee?.id || ''} />

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--muted)',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              Name *
            </label>
            <input
              type="text"
              id="empName"
              required
              placeholder="Staff Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '10px',
                background: 'var(--card2)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                color: 'var(--cream)',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--muted)',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              Role *
            </label>
            <select
              id="empRole"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                background: 'var(--card2)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                color: 'var(--cream)',
                fontSize: '14px',
              }}
            >
              <option value="cashier">Server / Cashier</option>
              <option value="host">Host / Greeter</option>
              <option value="bartender">Bartender</option>
              <option value="chef">Chef / Kitchen</option>
              <option value="hookah_maker">Hookah Maker</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          {isManagerRole && (
            <div id="empEmailContainer" style={{ marginBottom: '12px' }}>
              <label
                id="empEmailLabel"
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--gold)',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                Manager Email * (Required for Manager Portal)
              </label>
              <input
                type="email"
                id="empEmail"
                placeholder="name@cavalli.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--card2)',
                  border: '1.5px solid var(--gold)',
                  borderRadius: '8px',
                  color: 'var(--cream)',
                  fontSize: '14px',
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginTop: '3px' }}>
                Used by managers to authenticate into the Manager Portal with their passcode.
              </span>
            </div>
          )}

          <div style={{ marginBottom: '12px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--muted)',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              Hourly Wage ($/hr)
            </label>
            <input
              type="number"
              step="0.5"
              placeholder="18.00"
              value={hourlyWage}
              onChange={(e) => setHourlyWage(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                background: 'var(--card2)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                color: 'var(--cream)',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--muted)',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              4-Digit Staff Passcode / PIN *
            </label>
            <input
              type="password"
              id="empPin"
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              style={{
                width: '100%',
                padding: '10px',
                background: 'var(--card2)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                color: 'var(--cream)',
                fontSize: '18px',
                fontWeight: 800,
                letterSpacing: '6px',
                textAlign: 'center',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ fontWeight: 800 }}
            >
              Save Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
