// src/components/dashboard/StatCard.tsx
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  meta: string;
  colorClass: 'sc-blue' | 'sc-green' | 'sc-red' | 'sc-amber' | 'sc-slate';
  icon?: React.ReactNode;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  meta,
  colorClass,
  icon,
  onClick,
}) => {
  return (
    <div
      className={`stat-card ${colorClass} ${onClick ? 'stat-card-clickable' : ''}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) onClick();
      }}
    >
      <div className="stat-label">{title}</div>
      <div className="stat-val">{value}</div>
      <div className="stat-meta">{meta}</div>
      {icon && <div className="stat-ico">{icon}</div>}
    </div>
  );
};

export default StatCard;
