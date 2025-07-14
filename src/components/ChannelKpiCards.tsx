import React from 'react';
import { Campaign } from '../types/campaign';
import { useChannels } from '../hooks/useChannels';
import { getKpiValue, getChannelKpis, getKpiConfig, formatKpiValue } from '../utils/kpiHelpers';

interface ChannelKpiCardsProps {
  campaigns: Campaign[];
  channelName: string;
}

export const ChannelKpiCards: React.FC<ChannelKpiCardsProps> = ({ campaigns, channelName }) => {
  const { getChannelByName } = useChannels();
  
  // Get visible KPIs for this channel
  const visibleKpis = getChannelKpis(channelName, getChannelByName);
  
  // Filter campaigns for this channel
  const channelCampaigns = campaigns.filter(c => c.channel === channelName);
  
  if (channelCampaigns.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-lg font-medium">No campaigns found</div>
        <p className="text-sm">No campaigns available for {channelName}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {visibleKpis.map((kpiKey) => {
        const kpiConfig = getKpiConfig(kpiKey);
        const value = getKpiValue(campaigns, channelName, kpiKey);
        const formattedValue = formatKpiValue(value, kpiConfig.format);
        
        // Determine card color based on KPI category
        const getCardColors = (category: string) => {
          switch (category) {
            case 'universal':
              return {
                bg: 'bg-blue-50',
                border: 'border-blue-100',
                iconBg: 'bg-blue-500',
                textColor: 'text-blue-600'
              };
            case 'digital':
              return {
                bg: 'bg-green-50',
                border: 'border-green-100',
                iconBg: 'bg-green-500',
                textColor: 'text-green-600'
              };
            case 'traditional':
            case 'tv':
            case 'radio':
            case 'cinema':
            case 'dooh':
              return {
                bg: 'bg-purple-50',
                border: 'border-purple-100',
                iconBg: 'bg-purple-500',
                textColor: 'text-purple-600'
              };
            default:
              return {
                bg: 'bg-gray-50',
                border: 'border-gray-100',
                iconBg: 'bg-gray-500',
                textColor: 'text-gray-600'
              };
          }
        };

        const colors = getCardColors(kpiConfig.category);

        return (
          <div
            key={kpiKey}
            className={`${colors.bg} p-6 rounded-2xl border ${colors.border} transition-all duration-200 hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${colors.textColor}`}>
                  {kpiConfig.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formattedValue}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {channelCampaigns.length} campaign{channelCampaigns.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className={`${colors.iconBg} p-3 rounded-xl`}>
                <span className="text-xl">{kpiConfig.icon}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};