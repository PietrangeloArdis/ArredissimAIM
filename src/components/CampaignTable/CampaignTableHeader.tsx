import React from 'react';
import { getKpiConfig } from '../../utils/kpiHelpers';

interface CampaignTableHeaderProps {
  visibleKpis: string[];
  showPublisherColumn: boolean;
  showSocialColumns: boolean;
}

export const CampaignTableHeader: React.FC<CampaignTableHeaderProps> = ({
  visibleKpis,
  showPublisherColumn,
  showSocialColumns,
}) => {
  return (
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
        {showPublisherColumn && (
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Broadcaster</th>
        )}
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
        
        {/* Dynamic KPI Columns */}
        {visibleKpis.map((kpiKey) => {
          const kpiConfig = getKpiConfig(kpiKey);
          return (
            <th key={kpiKey} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {kpiConfig.label}
            </th>
          );
        })}
        
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
        {showSocialColumns && (
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Social Details</th>
        )}
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
      </tr>
    </thead>
  );
};