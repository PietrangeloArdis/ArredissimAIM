import React, { memo } from 'react'; // Aggiunto "memo"
import { Campaign } from '../../types/campaign';
import { CampaignActions } from './CampaignActions';
import { CampaignStatusBadge } from './CampaignStatusBadge';
import { Info } from 'lucide-react';

interface CampaignRowProps {
  campaign: Campaign;
  visibleKpis: string[];
  channel?: string;
  showPublisherColumn: boolean;
  showSocialColumns: boolean;
  onEdit: (campaign: Campaign) => void;
  onDuplicate: (campaign: Campaign) => void;
  onDelete: (id: string) => void;
  renderChannelBadge: (channelName: string) => JSX.Element;
  renderKpiValue: (campaign: Campaign, kpiKey: string) => JSX.Element;
}

// "memo" avvolge il componente per ottimizzarlo
export const CampaignRow: React.FC<CampaignRowProps> = memo(({
  campaign,
  visibleKpis,
  channel,
  showPublisherColumn,
  showSocialColumns,
  onEdit,
  onDuplicate,
  onDelete,
  renderChannelBadge,
  renderKpiValue,
}) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900">
              {campaign.brand}
            </span>
            {!channel && renderChannelBadge(campaign.channel)}
          </div>
          <div className="text-sm text-gray-500">{campaign.region}</div>
        </div>
      </td>
      {showPublisherColumn && (
        <td className="px-6 py-4">
          <div className="text-sm text-gray-900 max-w-xs">
            {campaign.publisher || (campaign.channel === 'TV' || campaign.channel === 'Radio' ? 'Not specified' : '—')}
          </div>
        </td>
      )}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
        </div>
        <div className="text-sm text-gray-500 capitalize">{campaign.periodType}</div>
      </td>
      
      {/* Dynamic KPI Values */}
      {visibleKpis.map((kpiKey) => (
        <td key={kpiKey} className="px-6 py-4 whitespace-nowrap">
          {renderKpiValue(campaign, kpiKey)}
        </td>
      ))}
      
      <td className="px-6 py-4 whitespace-nowrap">
        <CampaignStatusBadge status={campaign.status} />
      </td>
      {showSocialColumns && (
        <td className="px-6 py-4">
          {campaign.extraSocialNotes && (campaign.channel === 'Meta' || campaign.channel === 'TikTok' || campaign.channel === 'Pinterest') ? (
            <div className="group relative">
              <div className="flex items-center gap-1 text-blue-600 cursor-help">
                <Info className="w-4 h-4" />
                <span className="text-xs">Details</span>
              </div>
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                {campaign.extraSocialNotes}
                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </td>
      )}
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <CampaignActions
          campaign={campaign}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
});