import React from 'react';
import { Status, getStatusConfig, migrateStatus } from '../../types/campaign';

interface CampaignStatusBadgeProps {
  status: string;
}

export const CampaignStatusBadge: React.FC<CampaignStatusBadgeProps> = ({ status }) => {
  // Migrate legacy status and get configuration
  const migratedStatus = migrateStatus(status);
  const config = getStatusConfig(migratedStatus);
  
  return (
    <span 
      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
      style={{ 
        backgroundColor: config.bgColor, 
        color: config.textColor,
        border: `1px solid ${config.color}20`
      }}
      title={config.description}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
};