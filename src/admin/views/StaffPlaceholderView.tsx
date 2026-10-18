import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { UserRole } from '../types';

export const StaffPlaceholderView: React.FC = () => {
  const sampleStaff: { name: string; role: UserRole; clocked: boolean; email: string }[] = [
    { name: 'Sandip Nepal', role: 'owner', clocked: true, email: 'owner@cavalli.com' },
    { name: 'Aakash Mandal', role: 'manager', clocked: false, email: 'aakash@cavalli.com' },
    { name: 'Suwasna Gorkhali', role: 'server', clocked: true, email: 'suwasna@cavalli.com' },
    { name: 'Pasang Thapa', role: 'cashier', clocked: true, email: 'pasang@cavalli.com' },
    { name: 'Nikesh Baniya', role: 'hookah_maker', clocked: false, email: 'nikesh@cavalli.com' },
    { name: 'Ivana Molina', role: 'chef', clocked: false, email: 'ivana@cavalli.com' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
            Staff Team Roster & Shifts
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            14 Team members &bull; 3 Currently on shift &bull; RBAC Protected
          </p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={15} />}>Add Employee</Button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {sampleStaff.map((staff, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-card-hover)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px',
                    color: 'var(--brand-primary)',
                  }}
                >
                  {staff.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {staff.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {staff.email}
                  </div>
                </div>
              </div>
              <Badge role={staff.role} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: staff.clocked ? 'var(--teal)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {staff.clocked ? '🟢 On Shift' : '⚪ Off Shift'}
              </span>
              <Button variant="ghost" size="sm">Edit</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
