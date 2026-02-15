import React from 'react';
import '../styles/components/RoleLabel.css';

const ROLE_NAMES = {
  CAPITAN: 'Capitán',
  VICE_CAPITAN: 'Vice',
  TANQUE: 'Tanque',
  HEALER: 'Healer',
  SOPORTE: 'Soporte',
  SOPORTE_2: 'Soporte 2'
};

const ROLE_SHORTS = {
  CAPITAN: 'CPT',
  VICE_CAPITAN: 'VIC',
  TANQUE: 'TNK',
  HEALER: 'HLR',
  SOPORTE: 'SOP',
  SOPORTE_2: 'SOP'
};

export default function RoleLabel({ role, icon }) {
  return (
    <div className="role-label-container">
      <div className="role-badge">
        <span className="material-icons">{icon}</span>
        <span className="role-name">{ROLE_NAMES[role]}</span>
        <span className="role-short">{ROLE_SHORTS[role]}</span>
      </div>
    </div>
  );
}
