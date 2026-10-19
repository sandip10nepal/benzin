import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

interface CollectCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  grandTotal: number;
  totalPaid: number;
  totalDue: number;
  onSubmitPayment: (orderId: string, amountTendered: number) => void;
}

export const CollectCashModal: React.FC<CollectCashModalProps> = ({
  isOpen,
  onClose,
  orderId,
  grandTotal,
  totalPaid,
  totalDue,
  onSubmitPayment,
}) => {
  const [tendered, setTendered] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setTendered(totalDue > 0 ? totalDue.toFixed(2) : '0.00');
    }
  }, [isOpen, totalDue]);

  if (!isOpen) return null;

  const numTendered = parseFloat(tendered) || 0;
  const changeDue = Math.max(0, numTendered - totalDue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numTendered <= 0) {
      alert('Please enter a valid cash tendered amount');
      return;
    }
    if (numTendered < totalDue) {
      if (!confirm(`Cash tendered ($${numTendered.toFixed(2)}) is less than remaining due ($${totalDue.toFixed(2)}). Process partial payment?`)) {
        return;
      }
    }
    onSubmitPayment(orderId, numTendered);
    onClose();
  };

  return (
    <div
      id="collectCashModal"
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
          maxWidth: '440px',
          background: 'var(--card)',
          border: '1.5px solid var(--gold)',
          borderRadius: '20px',
          padding: '24px',
          textAlign: 'left',
          boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
        }}
      >
        <h3 style={{ color: 'var(--gold)', fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>
          💵 Collect Cash Payment
        </h3>
        <input type="hidden" id="payOrderId" value={orderId} />
        <input type="hidden" id="payTotalDueVal" value={totalDue} />

        <div
          style={{
            background: 'var(--card2)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '13px',
              color: 'var(--muted)',
              marginBottom: '6px',
            }}
          >
            <span>Ticket Grand Total:</span>
            <span id="payGrandTotalText" style={{ fontWeight: 800, color: 'var(--cream)' }}>
              ${grandTotal.toFixed(2)}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '13px',
              color: 'var(--muted)',
              marginBottom: '6px',
            }}
          >
            <span>Already Paid (Card/Cash):</span>
            <span id="payAlreadyPaidText" style={{ fontWeight: 800, color: 'var(--success)' }}>
              ${totalPaid.toFixed(2)}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '15px',
              fontWeight: 900,
              color: 'var(--gold)',
              borderTop: '1px dashed var(--line)',
              paddingTop: '8px',
            }}
          >
            <span>Remaining Balance Due:</span>
            <span id="payRemainingDueText">${totalDue.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--gold)',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              Cash Tendered / Received ($) *
            </label>
            <input
              type="number"
              step="0.01"
              id="cashTenderedInput"
              placeholder="e.g. 50.00"
              value={tendered}
              onChange={(e) => setTendered(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--card2)',
                border: '1.5px solid var(--gold)',
                borderRadius: '10px',
                color: 'var(--cream)',
                fontSize: '20px',
                fontWeight: 900,
                textAlign: 'center',
              }}
            />
          </div>

          <div
            id="cashChangeDisplay"
            style={{
              background: 'rgba(34,197,94,0.12)',
              border: '1px solid var(--success)',
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>
              Change Due to Customer
            </div>
            <div
              id="cashChangeAmount"
              style={{ fontSize: '24px', fontWeight: 900, color: 'var(--success)', marginTop: '2px' }}
            >
              ${changeDue.toFixed(2)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ fontWeight: 900, padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Check style={{ width: '16px', height: '16px' }} />
              <span>Record Cash Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
