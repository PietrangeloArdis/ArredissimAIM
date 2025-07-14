import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Edit, Copy, Trash2, CopyPlus } from 'lucide-react';
import { Campaign } from '../../types/campaign';
import { getKpiConfig, formatKpiValue, getKpiValue } from '../../utils/kpiHelpers';
import { CampaignStatusBadge } from '../CampaignTable/CampaignStatusBadge';
import { ChannelKpiCards } from '../ChannelKpiCards';
import { BrandCampaignBulkDuplicateModal } from '../BrandCampaignBulkDuplicateModal';

interface ChannelGroup {
  channelName: string;
  campaigns: Campaign[];
  totalBudget: number;
  totalLeads: number;
  avgCPL: number;
  avgROI: number;
  campaignCount: number;
  channelColor: string;
  channelIcon: string;
  visibleKpis: string[];
  subGroups?: { [key: string]: Campaign[] };
  subGroupingKey: string | null;
}

interface CampaignsGroupListProps {
  channelGroups: ChannelGroup[];
  onEdit: (campaign: Campaign) => void;
  onDelete: (id: string, campaignName: string) => void;
  onDuplicate: (campaign: Campaign) => void;
  getStatusBadge: (status: string) => JSX.Element;
  formatBudget: (budget: number, extraBudget?: number, campaign?: Campaign) => JSX.Element;
  formatChannelMetrics: (campaign: Campaign) => JSX.Element;
  renderKPIValue: (campaign: Campaign, kpiKey: string) => JSX.Element;
}

export const CampaignsGroupList: React.FC<CampaignsGroupListProps> = ({
  channelGroups,
  onEdit,
  onDelete,
  onDuplicate,
  getStatusBadge,
  formatBudget,
  formatChannelMetrics,
  renderKPIValue,
}) => {
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set());
  const [expandedSubGroups, setExpandedSubGroups] = useState<Set<string>>(new Set());
  const [showBulkDuplicateModal, setShowBulkDuplicateModal] = useState<{brand: string; channel: string} | null>(null);

  const toggleChannelExpansion = (channelName: string) => {
    const newExpanded = new Set(expandedChannels);
    if (newExpanded.has(channelName)) {
      newExpanded.delete(channelName);
    } else {
      newExpanded.add(channelName);
    }
    setExpandedChannels(newExpanded);
  };

  const toggleSubGroupExpansion = (key: string) => {
    const newExpanded = new Set(expandedSubGroups);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSubGroups(newExpanded);
  };

  const getChannelEmoji = (channelName: string) => {
    const emojiMap: { [key: string]: string } = {
      'Meta': '📘',
      'Google': '🔍',
      'TikTok': '🎵',
      'Pinterest': '📷',
      'TV': '📺',
      'Radio': '📻',
      'Cinema': '🎬',
      'DOOH': '🖥️',
      'LinkedIn': '💼',
      'YouTube': '📹',
    };
    return emojiMap[channelName] || '📊';
  };

  // Get unique brands from campaigns in a specific channel
  const getUniqueBrandsForChannel = (campaigns: Campaign[]): string[] => {
    const brands = new Set(campaigns.map(c => c.brand));
    return Array.from(brands).sort();
  };

  const renderCampaignRow = (campaign: Campaign, visibleKpis: string[]) => (
    <tr key={campaign.id} className="hover:bg-gray-50">
      <td className="px-4 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900 mb-1">
            {campaign.brand} - {campaign.region}
          </div>
          <div className="text-xs text-gray-500">
            {campaign.manager} • {new Date(campaign.startDate).toLocaleDateString()}
          </div>
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
        </div>
        <div className="text-xs text-gray-500 capitalize">{campaign.periodType}</div>
      </td>
      
      {/* Dynamic KPI Values */}
      {(['budget', ...visibleKpis.filter(k => k !== 'budget')].slice(0, 4)).map((kpiKey) => (
        <td key={kpiKey} className="px-4 py-4 whitespace-nowrap">
          {renderKPIValue(campaign, kpiKey)}
        </td>
      ))}
      
      <td className="px-4 py-4 whitespace-nowrap">
        <CampaignStatusBadge status={campaign.status} />
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(campaign)}
            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
            title="Edit campaign"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDuplicate(campaign)}
            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
            title="Duplicate campaign"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(campaign.id!, `${campaign.brand} - ${campaign.channel}`)}
            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
            title="Delete campaign"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <>
      <div className="space-y-6">
        {channelGroups.map((channelGroup) => {
          const isExpanded = expandedChannels.has(channelGroup.channelName);
          const channelEmoji = getChannelEmoji(channelGroup.channelName);
          const uniqueBrands = getUniqueBrandsForChannel(channelGroup.campaigns);

          return (
            <div key={channelGroup.channelName} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Channel Header */}
              <div 
                className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-6 cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-colors"
                onClick={() => toggleChannelExpansion(channelGroup.channelName)}
                style={{
                  background: `linear-gradient(135deg, ${channelGroup.channelColor}15, ${channelGroup.channelColor}25)`
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" style={{ color: channelGroup.channelColor }} />
                      ) : (
                        <ChevronRight className="w-5 h-5" style={{ color: channelGroup.channelColor }} />
                      )}
                      <div 
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: channelGroup.channelColor }}
                      >
                        <span className="text-xl">{channelEmoji}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        {channelGroup.channelName}
                        <span className="text-lg">{channelEmoji}</span>
                      </h3>
                      <p className="text-sm text-gray-600">
                        {channelGroup.campaignCount} campaign{channelGroup.campaignCount !== 1 ? 's' : ''} • 
                        {channelGroup.totalLeads > 0 ? ` ${channelGroup.totalLeads.toLocaleString()} leads` : ' Performance tracking'}
                        {uniqueBrands.length > 0 && (
                          <span className="ml-2">• {uniqueBrands.length} brand{uniqueBrands.length !== 1 ? 's' : ''}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Channel Summary Cards - Dynamic based on visible KPIs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(['budget', ...channelGroup.visibleKpis.filter(k => k !== 'budget')].slice(0, 4)).map((kpiKey) => {
                      const kpiConfig = getKpiConfig(kpiKey);
                      const value = getKpiValue(channelGroup.campaigns, channelGroup.channelName, kpiKey);
                      const formattedValue = formatKpiValue(value, kpiConfig.format);
                      
                      return (
                        <div key={kpiKey} className="bg-white p-4 rounded-xl border-2 text-center min-w-[100px]" style={{ borderColor: `${channelGroup.channelColor}30` }}>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <span className="text-lg">{kpiConfig.icon}</span>
                            <span className="text-xs font-medium" style={{ color: channelGroup.channelColor }}>{kpiConfig.label}</span>
                          </div>
                          <div className="text-lg font-bold text-gray-900">
                            {formattedValue}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-6">
                  {/* Brand Bulk Actions - Now Channel-Specific */}
                  {uniqueBrands.length > 0 && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-700 mb-3">
                        📋 Bulk Actions by Brand ({channelGroup.channelName} Channel)
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {uniqueBrands.map((brand) => {
                          const brandChannelCampaigns = channelGroup.campaigns.filter(c => c.brand === brand);
                          return (
                            <button
                              key={brand}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowBulkDuplicateModal({ brand, channel: channelGroup.channelName });
                              }}
                              className="flex items-center gap-2 bg-white border border-blue-300 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                              title={`Duplicate all ${brandChannelCampaigns.length} ${channelGroup.channelName} campaigns for ${brand}`}
                            >
                              <CopyPlus className="w-4 h-4" />
                              <span className="font-medium">{brand}</span>
                              <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs">
                                {brandChannelCampaigns.length}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        Click a brand to duplicate all its <strong>{channelGroup.channelName}</strong> campaigns with new dates
                      </p>
                    </div>
                  )}

                  {/* Channel-specific KPI Cards */}
                  <div className="mb-6">
                    <ChannelKpiCards campaigns={channelGroup.campaigns} channelName={channelGroup.channelName} />
                  </div>

                  {/* Campaigns Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                          
                          {/* Dynamic KPI Columns */}
                          {(['budget', ...channelGroup.visibleKpis.filter(k => k !== 'budget')].slice(0, 4)).map((kpiKey) => {
                            const kpiConfig = getKpiConfig(kpiKey);
                            return (
                              <th key={kpiKey} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {kpiConfig.label}
                              </th>
                            );
                          })}
                          
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {channelGroup.campaigns.map((campaign) => renderCampaignRow(campaign, channelGroup.visibleKpis))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bulk Duplicate Modal - Now with Channel Context */}
      {showBulkDuplicateModal && (
        <BrandCampaignBulkDuplicateModal
          brand={showBulkDuplicateModal.brand}
          channel={showBulkDuplicateModal.channel}
          onClose={() => setShowBulkDuplicateModal(null)}
        />
      )}
    </>
  );
};