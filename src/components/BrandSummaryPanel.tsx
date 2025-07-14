import React, { useState } from 'react';
import { Campaign } from '../types/campaign';
import { useChannels } from '../hooks/useChannels';
import { formatBudget } from '../utils/budgetFormatter';
import { formatMetric } from '../utils/chartHelpers';
import { Euro, Users, Target, BarChart3, Building2, Copy } from 'lucide-react';
import { BrandCampaignBulkDuplicateModal } from './BrandCampaignBulkDuplicateModal';

interface BrandSummaryPanelProps {
  campaigns: Campaign[];
  brandName: string;
}

export const BrandSummaryPanel: React.FC<BrandSummaryPanelProps> = ({ 
  campaigns, 
  brandName 
}) => {
  const { getChannelByName } = useChannels();
  const [showBulkDuplicateModal, setShowBulkDuplicateModal] = useState(false);
  
  // Get the current channel from the campaigns context
  const currentChannel = campaigns.length > 0 && campaigns[0].channel ? campaigns[0].channel : '';
  
  // Filter campaigns for this brand
  const brandCampaigns = campaigns.filter(c => c.brand === brandName);
  
  // Calculate summary metrics
  const totalBudget = brandCampaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalLeads = brandCampaigns.reduce((sum, c) => sum + c.leads, 0);
  const avgCPL = totalLeads > 0 ? totalBudget / totalLeads : 0;
  const campaignCount = brandCampaigns.length;
  const activeCampaigns = brandCampaigns.filter(c => c.status === 'ACTIVE').length;
  
  // Group by channel
  const channelBreakdown: { [channel: string]: { budget: number; leads: number; campaigns: number } } = {};
  brandCampaigns.forEach(campaign => {
    if (!channelBreakdown[campaign.channel]) {
      channelBreakdown[campaign.channel] = { budget: 0, leads: 0, campaigns: 0 };
    }
    channelBreakdown[campaign.channel].budget += campaign.budget;
    channelBreakdown[campaign.channel].leads += campaign.leads;
    channelBreakdown[campaign.channel].campaigns += 1;
  });

  if (campaignCount === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Campaigns for {brandName}
          </h3>
          <p className="text-gray-500">Create your first campaign for this brand to see budget summary</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500 p-4 rounded-xl">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {brandName} Brand Summary
              </h3>
              <p className="text-gray-600">
                {campaignCount} campaign{campaignCount !== 1 ? 's' : ''} • 
                {activeCampaigns} active
              </p>
            </div>
          </div>
          
          {/* Bulk Duplicate Button - Now with Channel Context */}
          <button
            onClick={() => setShowBulkDuplicateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
            title={`Duplicate all ${campaignCount} ${currentChannel} campaigns for ${brandName}`}
          >
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">Duplicate All</span>
            <span className="sm:hidden">{campaignCount}</span>
          </button>
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

        {/* Channel Breakdown */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">
            Budget Breakdown by Channel
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(channelBreakdown).map(([channelName, data]) => {
              const channel = getChannelByName(channelName);
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
              
              return (
                <div 
                  key={channelName} 
                  className="p-4 rounded-xl border-2"
                  style={{ borderColor: `${channelColor}30` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getChannelIconEmoji(channelIcon)}</span>
                    <span className="font-medium text-gray-900">{channelName}</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Budget:</span>
                      <span className="font-medium text-gray-900">{formatBudget(data.budget)}</span>
                    </div>
                    {data.leads > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Leads:</span>
                          <span className="font-medium text-gray-900">{formatMetric(data.leads)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">CPL:</span>
                          <span className="font-medium text-gray-900">
                            €{(data.budget / data.leads).toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Campaigns:</span>
                      <span className="font-medium text-gray-900">{data.campaigns}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bulk Duplicate Modal - Now with Channel Context */}
      {showBulkDuplicateModal && (
        <BrandCampaignBulkDuplicateModal
          brand={brandName}
          channel={currentChannel}
          onClose={() => setShowBulkDuplicateModal(false)}
        />
      )}
    </>
  );
};