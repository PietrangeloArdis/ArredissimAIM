import React from 'react';
import { Campaign } from '../types/campaign';
import { useChannels } from '../hooks/useChannels';
import { formatBudget } from '../utils/budgetFormatter';
import { formatMetric } from '../utils/chartHelpers';
import { Euro, Users, Target, BarChart3, TrendingUp, Calendar } from 'lucide-react';

interface ChannelSummaryPanelProps {
  campaigns: Campaign[];
  channelName: string;
}

export const ChannelSummaryPanel: React.FC<ChannelSummaryPanelProps> = ({ 
  campaigns, 
  channelName 
}) => {
  const { getChannelByName } = useChannels();
  const channel = getChannelByName(channelName);
  
  // Filter campaigns for this channel
  const channelCampaigns = campaigns.filter(c => c.channel === channelName);
  
  // Calculate summary metrics
  const totalBudget = channelCampaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalLeads = channelCampaigns.reduce((sum, c) => sum + c.leads, 0);
  const avgCPL = totalLeads > 0 ? totalBudget / totalLeads : 0;
  const campaignCount = channelCampaigns.length;
  const activeCampaigns = channelCampaigns.filter(c => c.status === 'ACTIVE').length;
  
  // Extra social budget for social channels
  const extraSocialBudget = channelCampaigns
    .filter(c => ['Meta', 'TikTok', 'Pinterest'].includes(c.channel))
    .reduce((sum, c) => sum + (c.extraSocialBudget || 0), 0);

  // Channel-specific metrics
  const channelMetrics = (() => {
    switch (channelName) {
      case 'TV':
        const totalExpectedGrps = channelCampaigns.reduce((sum, c) => sum + (c.expectedGrps || 0), 0);
        const totalAchievedGrps = channelCampaigns.reduce((sum, c) => sum + (c.achievedGrps || 0), 0);
        const grpEfficiency = totalExpectedGrps > 0 ? (totalAchievedGrps / totalExpectedGrps) * 100 : 0;
        return [
          { label: 'Expected GRPs', value: formatMetric(totalExpectedGrps), icon: '📺' },
          { label: 'Achieved GRPs', value: formatMetric(totalAchievedGrps), icon: '📺' },
          { label: 'GRP Efficiency', value: `${grpEfficiency.toFixed(1)}%`, icon: '📊' }
        ];
      
      case 'Radio':
        const totalSpots = channelCampaigns.reduce((sum, c) => sum + (c.spotsPurchased || 0), 0);
        const totalImpressions = channelCampaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
        return [
          { label: 'Radio Spots', value: formatMetric(totalSpots), icon: '📻' },
          { label: 'Impressions', value: formatMetric(totalImpressions), icon: '👁️' }
        ];
      
      case 'Cinema':
        const cinemaSpots = channelCampaigns.reduce((sum, c) => sum + (c.spotsPurchased || 0), 0);
        const expectedViewers = channelCampaigns.reduce((sum, c) => sum + (c.expectedViewers || 0), 0);
        return [
          { label: 'Screenings', value: formatMetric(cinemaSpots), icon: '🎬' },
          { label: 'Expected Viewers', value: formatMetric(expectedViewers), icon: '👥' }
        ];
      
      case 'DOOH':
        const expectedViews = channelCampaigns.reduce((sum, c) => sum + (c.expectedViews || 0), 0);
        return [
          { label: 'Expected Views', value: formatMetric(expectedViews), icon: '🖥️' }
        ];
      
      default:
        return [];
    }
  })();

  const channelColor = channel?.color || '#6b7280';
  const channelIcon = channel?.icon || 'Zap';

  // Icon mapping for dynamic channel icons
  const getChannelIconEmoji = (iconName: string) => {
    const iconMap: { [key: string]: string } = {
      'Facebook': '📘',
      'Search': '🔍',
      'Music': '🎵',
      'Image': '📷',
      'Tv': '📺',
      'Radio': '📻',
      'Smartphone': '📱',
      'Monitor': '🖥️',
      'Mail': '📧',
      'Globe': '🌐',
      'Zap': '⚡',
      'Target': '🎯',
    };
    return iconMap[iconName] || '📊';
  };

  if (campaignCount === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="text-center py-8">
          <div 
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: channelColor + '20' }}
          >
            <span className="text-2xl">{getChannelIconEmoji(channelIcon)}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No {channelName} Campaigns
          </h3>
          <p className="text-gray-500">Create your first {channelName} campaign to see budget summary</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div 
          className="p-4 rounded-xl"
          style={{ backgroundColor: channelColor }}
        >
          <span className="text-2xl">{getChannelIconEmoji(channelIcon)}</span>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            {channelName} Channel Summary
          </h3>
          <p className="text-gray-600">
            {campaignCount} campaign{campaignCount !== 1 ? 's' : ''} • 
            {activeCampaigns} active
          </p>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Budget */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Budget</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {formatBudget(totalBudget)}
              </p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Euro className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Total Leads (if applicable) */}
        {totalLeads > 0 && (
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Leads</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {formatMetric(totalLeads)}
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        )}

        {/* Average CPL (if leads > 0) */}
        {totalLeads > 0 && (
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Average CPL</p>
                <p className="text-2xl font-bold text-orange-900 mt-1">
                  €{avgCPL.toFixed(2)}
                </p>
              </div>
              <div className="bg-orange-500 p-3 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        )}

        {/* Campaign Count */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Campaigns</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {campaignCount}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                {activeCampaigns} active
              </p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Extra Social Budget (for social channels) */}
      {extraSocialBudget > 0 && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-xl border border-pink-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-pink-700">Extra Social Budget</p>
                <p className="text-xl font-bold text-pink-900">
                  {formatBudget(extraSocialBudget)}
                </p>
                <p className="text-xs text-pink-600 mt-1">
                  {((extraSocialBudget / totalBudget) * 100).toFixed(1)}% of total budget
                </p>
              </div>
              <div className="bg-pink-500 p-3 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Channel-Specific Metrics */}
      {channelMetrics.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">
            {channelName}-Specific Metrics
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {channelMetrics.map((metric, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{metric.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{metric.label}</p>
                    <p className="text-lg font-bold text-gray-900">{metric.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};