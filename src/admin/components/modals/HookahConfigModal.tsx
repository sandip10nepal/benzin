import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface HookahBase {
  id: string;
  name: string;
  price: number;
}

interface HookahFlavor {
  id: string;
  name: string;
  brand: string;
  stock: number;
}

interface HookahAddon {
  id: string;
  name: string;
  price: number;
}

interface DakuPackage {
  active: boolean;
  name: string;
  price: number;
  desc: string;
  image: string;
}

interface HookahConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveConfig: (config: any) => void;
}

export const HookahConfigModal: React.FC<HookahConfigModalProps> = ({
  isOpen,
  onClose,
  onSaveConfig,
}) => {
  const [flavorWeight, setFlavorWeight] = useState(20);
  const [activeTab, setActiveTab] = useState<'bases' | 'flavors' | 'addons' | 'packages'>('bases');

  // Bases state
  const [bases, setBases] = useState<HookahBase[]>([
    { id: 'b1', name: 'Milk Base', price: 5.0 },
    { id: 'b2', name: 'Red Bull Base', price: 8.0 },
    { id: 'b3', name: 'Pineapple Fruit Head', price: 15.0 },
  ]);
  const [newBaseName, setNewBaseName] = useState('');
  const [newBasePrice, setNewBasePrice] = useState('');

  // Flavors state
  const [flavors, setFlavors] = useState<HookahFlavor[]>([
    { id: 'f1', name: 'Love 66', brand: 'Adalya', stock: 1200 },
    { id: 'f2', name: 'Lady Killer', brand: 'Adalya', stock: 850 },
    { id: 'f3', name: 'Pan Ras', brand: 'Afzal', stock: 1500 },
    { id: 'f4', name: 'Blue Mist', brand: 'Starbuzz', stock: 950 },
  ]);
  const [newFlavorName, setNewFlavorName] = useState('');
  const [newFlavorBrand, setNewFlavorBrand] = useState('');
  const [newFlavorStock, setNewFlavorStock] = useState('500');

  // Addons state
  const [addons, setAddons] = useState<HookahAddon[]>([
    { id: 'a1', name: 'Ice Base', price: 4.0 },
    { id: 'a2', name: 'Ice Hose Tip', price: 4.0 },
    { id: 'a3', name: 'LED Base Glow', price: 3.0 },
  ]);
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState('');

  // Package state
  const [dakuPackage, setDakuPackage] = useState<DakuPackage>({
    active: true,
    name: 'Daku',
    price: 65.0,
    desc: 'Unlimited head refill, choice of premium fruit head, ice hose included',
    image: '',
  });

  if (!isOpen) return null;

  const handleAddBase = () => {
    if (!newBaseName.trim()) return;
    setBases((prev) => [
      ...prev,
      { id: `base_${Date.now()}`, name: newBaseName.trim(), price: parseFloat(newBasePrice) || 0 },
    ]);
    setNewBaseName('');
    setNewBasePrice('');
  };

  const handleAddFlavor = () => {
    if (!newFlavorName.trim()) return;
    setFlavors((prev) => [
      ...prev,
      {
        id: `flavor_${Date.now()}`,
        name: newFlavorName.trim(),
        brand: newFlavorBrand.trim() || 'Custom',
        stock: parseFloat(newFlavorStock) || 0,
      },
    ]);
    setNewFlavorName('');
    setNewFlavorBrand('');
    setNewFlavorStock('500');
  };

  const handleAddAddon = () => {
    if (!newAddonName.trim()) return;
    setAddons((prev) => [
      ...prev,
      { id: `addon_${Date.now()}`, name: newAddonName.trim(), price: parseFloat(newAddonPrice) || 0 },
    ]);
    setNewAddonName('');
    setNewAddonPrice('');
  };

  const handleSave = () => {
    onSaveConfig({
      flavorWeight,
      bases,
      flavors,
      addons,
      dakuPackage,
    });
    alert('Hookah Configuration saved successfully!');
    onClose();
  };

  return (
    <div
      id="hookahConfigModal"
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
          border: '1.5px solid var(--gold)',
          borderRadius: '20px',
          padding: '24px',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3
              style={{
                color: 'var(--gold)',
                fontSize: '20px',
                fontWeight: 800,
                margin: '0 0 4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>💨</span> Hookah Configuration
            </h3>
            <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
              Configure bases, flavors, add-ons, and packages for customer ordering.
            </div>
          </div>
          <button className="btn" onClick={onClose} style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '8px' }}>
            ✕
          </button>
        </div>

        {/* Total Hookah Flavor Weight (100%) Setting */}
        <div
          style={{
            background: 'rgba(229,177,58,0.08)',
            border: '1.5px solid var(--gold)',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚖️</span> Total Hookah Flavor Weight (100%)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                Standard single-bowl capacity in grams used to calculate flavor deductions in Custom Mix Lab.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                id="hkTotalFlavorWeight"
                min={1}
                max={200}
                step={1}
                value={flavorWeight}
                onChange={(e) => setFlavorWeight(parseInt(e.target.value, 10) || 20)}
                style={{
                  width: '80px',
                  padding: '8px 10px',
                  background: 'var(--card2)',
                  border: '1.5px solid var(--gold)',
                  borderRadius: '8px',
                  color: 'var(--gold)',
                  fontSize: '15px',
                  fontWeight: 800,
                  textAlign: 'center',
                }}
              />
              <span style={{ fontWeight: 800, color: 'var(--gold)', fontSize: '14px' }}>grams</span>
            </div>
          </div>
          <div id="flavorWeightPreviewPills" style={{ display: 'flex', gap: '8px', marginTop: '10px', fontSize: '11px', color: 'var(--cream)', flexWrap: 'wrap' }}>
            <span style={{ background: 'var(--card2)', padding: '2px 8px', borderRadius: '6px' }}>50% = {(flavorWeight * 0.5).toFixed(1)}g</span>
            <span style={{ background: 'var(--card2)', padding: '2px 8px', borderRadius: '6px' }}>33% = {(flavorWeight * 0.33).toFixed(1)}g</span>
            <span style={{ background: 'var(--card2)', padding: '2px 8px', borderRadius: '6px' }}>25% = {(flavorWeight * 0.25).toFixed(1)}g</span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div style={{ display: 'flex', gap: '6px', borderBottom: '1.5px solid var(--line)', paddingBottom: '10px', marginBottom: '16px' }}>
          <button
            className={`sub-tab ${activeTab === 'bases' ? 'active' : ''}`}
            id="hkTabBtn-bases"
            onClick={() => setActiveTab('bases')}
            style={{ padding: '6px 14px', borderRadius: '8px', fontWeight: 800, fontSize: '12px' }}
          >
            🍯 Bases
          </button>
          <button
            className={`sub-tab ${activeTab === 'flavors' ? 'active' : ''}`}
            id="hkTabBtn-flavors"
            onClick={() => setActiveTab('flavors')}
            style={{ padding: '6px 14px', borderRadius: '8px', fontWeight: 800, fontSize: '12px' }}
          >
            🌿 Flavors
          </button>
          <button
            className={`sub-tab ${activeTab === 'addons' ? 'active' : ''}`}
            id="hkTabBtn-addons"
            onClick={() => setActiveTab('addons')}
            style={{ padding: '6px 14px', borderRadius: '8px', fontWeight: 800, fontSize: '12px' }}
          >
            🧊 Add-ons
          </button>
          <button
            className={`sub-tab ${activeTab === 'packages' ? 'active' : ''}`}
            id="hkTabBtn-packages"
            onClick={() => setActiveTab('packages')}
            style={{ padding: '6px 14px', borderRadius: '8px', fontWeight: 800, fontSize: '12px' }}
          >
            👑 Daku / Packages
          </button>
        </div>

        {/* BASES TAB */}
        {activeTab === 'bases' && (
          <div id="hkTab-bases">
            <div
              style={{
                background: 'rgba(229,177,58,0.06)',
                border: '1px dashed rgba(229,177,58,0.3)',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--gold)', marginBottom: '8px' }}>
                ➕ ADD NEW HOOKAH BASE
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  id="newHkBaseName"
                  placeholder="Base name (e.g. Rooh Afza, Watermelon Syrup)"
                  value={newBaseName}
                  onChange={(e) => setNewBaseName(e.target.value)}
                  style={{ flex: 2, minWidth: '180px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}
                />
                <input
                  type="number"
                  step="0.5"
                  id="newHkBasePrice"
                  placeholder="Price ($0.00)"
                  value={newBasePrice}
                  onChange={(e) => setNewBasePrice(e.target.value)}
                  style={{ flex: 1, minWidth: '100px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleAddBase}
                  style={{ padding: '8px 16px', fontWeight: 800, fontSize: '12px', background: 'var(--gold)', color: '#000' }}
                >
                  Add Base
                </button>
              </div>
            </div>
            <div id="hkBasesListContainer" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
              {bases.map((b) => (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'var(--card2)',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--cream)', fontSize: '13px' }}>{b.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 800, color: 'var(--gold)' }}>${b.price.toFixed(2)}</span>
                    <button
                      className="btn btn-danger"
                      onClick={() => setBases((prev) => prev.filter((item) => item.id !== b.id))}
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                    >
                      <Trash2 style={{ width: '12px', height: '12px' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FLAVORS TAB */}
        {activeTab === 'flavors' && (
          <div id="hkTab-flavors">
            <div
              style={{
                background: 'rgba(20,184,166,0.06)',
                border: '1px dashed rgba(20,184,166,0.3)',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--teal)', marginBottom: '8px' }}>
                ➕ ADD NEW HOOKAH FLAVOR TO INVENTORY
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  id="newHkFlavorName"
                  placeholder="Flavor name (e.g. Love 66, Blue Mist)"
                  value={newFlavorName}
                  onChange={(e) => setNewFlavorName(e.target.value)}
                  style={{ flex: 2, minWidth: '180px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}
                />
                <input
                  type="text"
                  id="newHkFlavorBrand"
                  placeholder="Brand (e.g. Al Fakher, Adalya)"
                  value={newFlavorBrand}
                  onChange={(e) => setNewFlavorBrand(e.target.value)}
                  style={{ flex: 1, minWidth: '120px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}
                />
                <input
                  type="number"
                  id="newHkFlavorStock"
                  placeholder="Stock (g)"
                  value={newFlavorStock}
                  onChange={(e) => setNewFlavorStock(e.target.value)}
                  style={{ width: '100px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 700 }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleAddFlavor}
                  style={{ padding: '8px 16px', fontWeight: 800, fontSize: '12px', background: 'var(--teal)', color: '#000' }}
                >
                  Add Flavor
                </button>
              </div>
            </div>
            <div id="hkFlavorsListContainer" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
              {flavors.map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'var(--card2)',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--cream)', fontSize: '13px' }}>{f.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '8px' }}>({f.brand})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 800, color: 'var(--teal)' }}>{f.stock}g</span>
                    <button
                      className="btn btn-danger"
                      onClick={() => setFlavors((prev) => prev.filter((item) => item.id !== f.id))}
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                    >
                      <Trash2 style={{ width: '12px', height: '12px' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADDONS TAB */}
        {activeTab === 'addons' && (
          <div id="hkTab-addons">
            <div
              style={{
                background: 'rgba(0,102,255,0.06)',
                border: '1px dashed rgba(0,102,255,0.3)',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#60a5fa', marginBottom: '8px' }}>
                ➕ ADD HOOKAH ADD-ON
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  id="newHkAddonName"
                  placeholder="Add-on name (e.g. Ice Base, Ice Hose)"
                  value={newAddonName}
                  onChange={(e) => setNewAddonName(e.target.value)}
                  style={{ flex: 2, minWidth: '180px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}
                />
                <input
                  type="number"
                  step="0.5"
                  id="newHkAddonPrice"
                  placeholder="Price ($0.00)"
                  value={newAddonPrice}
                  onChange={(e) => setNewAddonPrice(e.target.value)}
                  style={{ flex: 1, minWidth: '100px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleAddAddon}
                  style={{ padding: '8px 16px', fontWeight: 800, fontSize: '12px', background: '#0066FF' }}
                >
                  Add Add-on
                </button>
              </div>
            </div>
            <div id="hkAddonsListContainer" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
              {addons.map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'var(--card2)',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--cream)', fontSize: '13px' }}>{a.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 800, color: '#60a5fa' }}>${a.price.toFixed(2)}</span>
                    <button
                      className="btn btn-danger"
                      onClick={() => setAddons((prev) => prev.filter((item) => item.id !== a.id))}
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                    >
                      <Trash2 style={{ width: '12px', height: '12px' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PACKAGES TAB */}
        {activeTab === 'packages' && (
          <div id="hkTab-packages">
            <div
              style={{
                background: 'var(--card2)',
                border: '1.5px solid var(--gold)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>👑</span> MAKE IT DAKU PACKAGE
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--cream)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    id="hkDakuActive"
                    checked={dakuPackage.active}
                    onChange={(e) => setDakuPackage((prev) => ({ ...prev, active: e.target.checked }))}
                    style={{ accentColor: 'var(--gold)', width: '16px', height: '16px' }}
                  />
                  Active in Ordering
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Package Name
                  </label>
                  <input
                    type="text"
                    id="hkDakuName"
                    value={dakuPackage.name}
                    onChange={(e) => setDakuPackage((prev) => ({ ...prev, name: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    id="hkDakuPrice"
                    value={dakuPackage.price}
                    onChange={(e) => setDakuPackage((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', color: 'var(--gold)', fontSize: '14px', fontWeight: 800 }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Description / Perks
                </label>
                <input
                  type="text"
                  id="hkDakuDesc"
                  value={dakuPackage.desc}
                  onChange={(e) => setDakuPackage((prev) => ({ ...prev, desc: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Poster Image URL
                </label>
                <input
                  type="text"
                  id="hkDakuImage"
                  placeholder="https://..."
                  value={dakuPackage.image}
                  onChange={(e) => setDakuPackage((prev) => ({ ...prev, image: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1.5px solid var(--line)', paddingTop: '16px' }}>
          <button className="btn" onClick={onClose} style={{ padding: '10px 16px' }}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            style={{ background: 'var(--gold)', color: '#000', fontWeight: 800, padding: '10px 20px' }}
          >
            Save Hookah Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
