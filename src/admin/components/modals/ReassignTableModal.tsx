import React, { useState, useEffect } from 'react';
import { StaffUser } from '../../types';

interface ReassignTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  tableLabel: string;
  currentServerId?: string;
  currentServerName?: string;
  staffList: StaffUser[];
  onConfirmReassignment: (orderId: string, newServerId: string, newServerName: string) => void;
}

export const ReassignTableModal: React.FC<ReassignTableModalProps> = ({
  isOpen,
  onClose,
  orderId,
  tableLabel,
  currentServerId,
  staffList,
  onConfirmReassignment,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setSelectedStaffId(currentServerId || (staffList[0]?.id ?? ''));
    }
  }, [isOpen, currentServerId, staffList]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const chosen = staffList.find((s) => s.id === selectedStaffId);
    onConfirmReassignment(
      orderId,
      selectedStaffId,
      chosen ? chosen.name : 'Assigned Staff'
    );
    onClose();
  };

  return (
    <div
      id="reassignTableModal"
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
          background: 'var(--card)',
          border: '1.5px solid var(--line)',
          borderRadius: '16px',
          padding: '24px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        }}
      >
        <h3 style={{ color: 'var(--gold)', fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>
          Assign / Reassign Table Server
        </h3>
        <div id="reassignModalSub" style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>
          Assign server responsible for <strong>{tableLabel || 'Table'}</strong>.
        </div>
        <input type="hidden" id="reassignOrderId" value={orderId} />

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--muted)',
              marginBottom: '6px',
              textTransform: 'uppercase',
            }}
          >
            Assign To Staff Member
          </label>
          <select
            id="reassignServerSelect"
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            <option value="">-- Choose Staff Member --</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.role.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose} style={{ padding: '10px 16px' }}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            style={{ background: '#0066FF', padding: '10px 18px', fontWeight: 800 }}
          >
            Confirm Assignment
          </button>
        </div>
      </div>
    </div>
  );
};
