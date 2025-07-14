import React, { useState, useMemo, useCallback } from 'react'; // Aggiunto useCallback
import { Campaign, BUDGET_ALERT_THRESHOLD, formatMetric, getChannelMetrics, getStatusConfig, migrateStatus } from '../types/campaign';
import { CampaignForm } from './CampaignForm';
import { CampaignDuplicateModal } from './CampaignDuplicateModal';
import { BrandCampaignBulkDuplicateModal } from './BrandCampaignBulkDuplicateModal';
import { ChannelKpiCards } from './ChannelKpiCards';
import { ChannelSummaryPanel } from './ChannelSummaryPanel';
import { CampaignTableHeader } from './CampaignTable/CampaignTableHeader';
import { CampaignRow } from './CampaignTable/CampaignRow';
import { CampaignStatusBadge } from './CampaignTable/CampaignStatusBadge';
import { useChannels } from '../hooks/useChannels';
import { getKpiValue, getChannelKpis, getKpiConfig, formatKpiValue } from '../utils/kpiHelpers';
import { Filter, Plus, Info, AlertTriangle, TrendingDown, ChevronDown, ChevronRight, BarChart3, Users, Euro, Target, CopyPlus } from 'lucide-react';

interface CampaignTableProps {
  campaigns: Campaign[];
  channel?: string;
  onAdd: (campaign: Omit<Campaign, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Campaign>) => void;
  onDelete: (id: string) => void;
}

interface BrandGroup {
  brandName: string;
  campaigns: Campaign[];
  totalBudget: number;
  totalLeads: number;
  avgCPL: number;
  avgROI: number;
  regionBreakdown: { [region: string]: { budget: number; leads: number; campaigns: number } };
}

export const CampaignTable: React.FC<CampaignTableProps> = ({
  campaigns,
  channel,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [duplicatingCampaign, setDuplicatingCampaign] = useState<Campaign | null>(null);
  const [showBulkDuplicateModal, setShowBulkDuplicateModal] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');
  const [filters, setFilters] = useState({
    brand: '',
    region: '',
    status: '',
    manager: '',
  });
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (brandName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [brandName]: !prev[brandName],
    }));
  };

  const { getChannelByName } = useChannels();

  const filteredCampaigns = campaigns.filter(campaign => {
    if (channel && campaign.channel !== channel) return false;
    if (filters.brand && campaign.brand !== filters.brand) return false;
    if (filters.region && campaign.region !== filters.region) return false;
    if (filters.status && migrateStatus(campaign.status) !== filters.status) return false;
    if (filters.manager && campaign.manager !== filters.manager) return false;
    return true;
  });

  const visibleKpis = channel ? getChannelKpis(channel, getChannelByName) : ['budget', 'leads', 'cpl', 'roi'];

  const brandGroups = useMemo((): BrandGroup[] => {
    const groups: { [brandName: string]: Campaign[] } = {};
    
    filteredCampaigns.forEach(campaign => {
      if (!groups[campaign.brand]) {
        groups[campaign.brand] = [];
      }
      groups[campaign.brand].push(campaign);
    });

    return Object.entries(groups).map(([brandName, brandCampaigns]) => {
      const totalBudget = brandCampaigns.reduce((sum, c) => sum + c.budget, 0);
      const totalLeads = brandCampaigns.reduce((sum, c) => sum + c.leads, 0);
      const avgCPL = totalLeads > 0 ? totalBudget / totalLeads : 0;
      
      const campaignsWithROI = brandCampaigns.filter(c => c.roi && c.roi !== 'N/A');
      const avgROI = campaignsWithROI.length > 0 
        ? campaignsWithROI.reduce((sum, c) => {
            const roiValue = parseFloat(c.roi!.replace('%', ''));
            return sum + (isNaN(roiValue) ? 0 : roiValue);
          }, 0) / campaignsWithROI.length
        : 0;

      const regionBreakdown: { [region: string]: { budget: number; leads: number; campaigns: number } } = {};
      brandCampaigns.forEach(campaign => {
        if (!regionBreakdown[campaign.region]) {
          regionBreakdown[campaign.region] = { budget: 0, leads: 0, campaigns: 0 };
        }
        regionBreakdown[campaign.region].budget += campaign.budget;
        regionBreakdown[campaign.region].leads += campaign.leads;
        regionBreakdown[campaign.region].campaigns += 1;
      });

      return {
        brandName,
        campaigns: brandCampaigns.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
        totalBudget,
        totalLeads,
        avgCPL,
        avgROI,
        regionBreakdown,
      };
    }).sort((a, b) => b.totalBudget - a.totalBudget);
  }, [filteredCampaigns]);

  // --- MODIFICHE QUI ---
  const handleEdit = useCallback((campaign: Campaign) => {
    setEditingCampaign(campaign);
    setShowForm(true);
  }, []);

  const handleDuplicate = useCallback((campaign: Campaign) => {
    setDuplicatingCampaign(campaign);
  }, []);

  const handleDelete = useCallback((id: string) => {
    onDelete(id);
  }, [onDelete]);
  // --- FINE MODIFICHE ---

  const handleFormSubmit = (campaignData: Omit<Campaign, 'id'>) => {
    if (editingCampaign) {
      onUpdate(editingCampaign.id!, campaignData);
    } else {
      onAdd(campaignData);
    }
    setShowForm(false);
    setEditingCampaign(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCampaign(null);
  };

  const handleDuplicateSubmit = (duplicatedCampaign: Omit<Campaign, 'id'>) => {
    onAdd(duplicatedCampaign);
    setDuplicatingCampaign(null);
  };

  const handleDuplicateCancel = () => {
    setDuplicatingCampaign(null);
  };

  const showPublisherColumn = channel === 'TV' || channel === 'Radio' || 
    (!channel && filteredCampaigns.some(c => c.channel === 'TV' || c.channel === 'Radio'));

  const showSocialColumns = channel === 'Meta' || channel === 'TikTok' || channel === 'Pinterest' ||
    (!channel && filteredCampaigns.some(c => c.channel === 'Meta' || c.channel === 'TikTok' || c.channel === 'Pinterest'));

  const showChannelMetricsColumn = !channel && filteredCampaigns.some(c => 
    ['TV', 'Radio', 'Cinema', 'DOOH'].includes(c.channel)
  );

  const getBudgetAlert = (campaign: Campaign) => {
    if (!campaign.extraSocialBudget || campaign.extraSocialBudget === 0) return null;
    if (!['Meta', 'TikTok', 'Pinterest'].includes(campaign.channel)) return null;
    
    const percentage = campaign.extraSocialBudget / campaign.budget;
    return percentage > BUDGET_ALERT_THRESHOLD ? percentage : null;
  };

  const getGRPAlert = (campaign: Campaign) => {
    if (campaign.channel !== 'TV' || !campaign.expectedGrps || !campaign.achievedGrps) return null;
    if (campaign.achievedGrps >= campaign.expectedGrps) return null;
    
    const performanceGap = ((campaign.expectedGrps - campaign.achievedGrps) / campaign.expectedGrps) * 100;
    return performanceGap > 10 ? performanceGap : null;
  };

  const getChannelColor = (channelName: string) => {
    const channel = getChannelByName(channelName);
    return channel?.color || '#6b7280';
  };

  const renderChannelBadge = useCallback((channelName: string) => {
    const channelData = getChannelByName(channelName);
    if (!channelData) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          {channelName}
        </span>
      );
    }

    return (
      <span 
        className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full text-white"
        style={{ backgroundColor: channelData.color }}
        title={`${channelName} Channel`}
      >
        <span className="mr-1">{channelData.icon === 'Facebook' ? '📘' : 
                                channelData.icon === 'Search' ? '🔍' : 
                                channelData.icon === 'Music' ? '🎵' : 
                                channelData.icon === 'Image' ? '📷' : 
                                channelData.icon === 'Tv' ? '📺' : 
                                channelData.icon === 'Radio' ? '📻' : '⚡'}</span>
        {channelName}
      </span>
    );
  }, [getChannelByName]);

  const formatBudget = (budget: number, extraBudget?: number, campaign?: Campaign) => {
    const alertPercentage = campaign ? getBudgetAlert(campaign) : null;
    
    if (extraBudget && extraBudget > 0) {
      return (
        <div className="space-y-1">
          <div className="text-sm text-gray-900">€{budget.toLocaleString()}</div>
          <div className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
            alertPercentage 
              ? 'text-red-600 bg-red-50 border border-red-200' 
              : 'text-blue-600 bg-blue-50'
          }`}>
            {alertPercentage && <AlertTriangle className="w-3 h-3" />}
            +€{extraBudget.toLocaleString()} extra
            {alertPercentage && (
              <span className="font-medium">
                ({(alertPercentage * 100).toFixed(0)}%)
              </span>
            )}
          </div>
        </div>
      );
    }
    return <div className="text-sm text-gray-900">€{budget.toLocaleString()}</div>;
  };

  const formatChannelMetrics = (campaign: Campaign) => {
    const metrics = getChannelMetrics(campaign);
    
    if (metrics.length === 0) {
      return <span className="text-gray-400 text-xs">—</span>;
    }

    const grpAlert = getGRPAlert(campaign);
    
    return (
      <div className="space-y-1">
        {metrics.map((metric, index) => (
          <div key={index} className={`text-xs flex items-center gap-1 ${
            metric.label.includes('Achieved') && grpAlert ? 'text-orange-600 font-medium' : 'text-gray-600'
          }`}>
            {metric.icon && <span>{metric.icon}</span>}
            <span>{metric.label}: {metric.value}</span>
            {metric.label.includes('Achieved') && grpAlert && (
              <TrendingDown className="w-3 h-3" />
            )}
          </div>
        ))}
        {grpAlert && (
          <div className="text-xs text-orange-600">
            -{grpAlert.toFixed(1)}% vs target
          </div>
        )}
      </div>
    );
  };
  
  const renderKpiValue = useCallback((campaign: Campaign, kpiKey: string) => {
    const kpiConfig = getKpiConfig(kpiKey);
    const grpAlert = getGRPAlert(campaign);
    
    switch (kpiKey) {
      case 'budget':
        return formatBudget(campaign.budget, campaign.extraSocialBudget, campaign);
      
      case 'leads':
        return (
          <div className="text-sm text-gray-900">
            {campaign.leads.toLocaleString()}
            {['TV', 'Radio', 'Cinema', 'DOOH'].includes(campaign.channel) && campaign.leads === 0 && (
              <div className="text-xs text-gray-500">N/A for {campaign.channel}</div>
            )}
          </div>
        );
      
      case 'cpl':
        return (
          <div className="text-sm text-gray-900">
            €{campaign.costPerLead?.toFixed(2) || 'N/A'}
          </div>
        );
      
      case 'roi':
        return (
          <div className="text-sm text-gray-900">
            {campaign.roi || 'N/A'}
          </div>
        );
      
      case 'expectedGrps':
        return (
          <div className="text-sm text-gray-900">
            {campaign.expectedGrps ? formatMetric(campaign.expectedGrps) : '—'}
          </div>
        );
      
      case 'achievedGrps':
        return (
          <div className={`text-sm ${grpAlert ? 'text-orange-600 font-medium' : 'text-gray-900'}`}>
            {campaign.achievedGrps ? (
              <div className="flex items-center gap-1">
                {formatMetric(campaign.achievedGrps)}
                {grpAlert && <TrendingDown className="w-3 h-3" />}
              </div>
            ) : '—'}
            {grpAlert && (
              <div className="text-xs text-orange-600">
                -{grpAlert.toFixed(1)}% vs target
              </div>
            )}
          </div>
        );
      
      case 'spotsPurchased':
        return (
          <div className="text-sm text-gray-900">
            {campaign.spotsPurchased ? formatMetric(campaign.spotsPurchased) : '—'}
          </div>
        );
      
      case 'impressions':
        return (
          <div className="text-sm text-gray-900">
            {campaign.impressions ? formatMetric(campaign.impressions) : '—'}
          </div>
        );
      
      case 'expectedViews':
        return (
          <div className="text-sm text-gray-900">
            {campaign.expectedViews ? formatMetric(campaign.expectedViews) : '—'}
          </div>
        );
      
      case 'expectedViewers':
        return (
          <div className="text-sm text-gray-900">
            {campaign.expectedViewers ? formatMetric(campaign.expectedViewers) : '—'}
          </div>
        );
      
      case 'clicks':
      case 'ctr':
      case 'cpm':
        return <div className="text-sm text-gray-500">—</div>;
      
      default:
        return <div className="text-sm text-gray-500">—</div>;
    }
  }, []);

  const uniqueValues = {
    brands: [...new Set(campaigns.map(c => c.brand))],
    regions: [...new Set(campaigns.map(c => c.region))],
    statuses: [...new Set(campaigns.map(c => migrateStatus(c.status)))],
    managers: [...new Set(campaigns.map(c => c.manager))],
  };

  const getSummaryStats = () => {
    const stats: { [key: string]: number } = {};
    
    visibleKpis.forEach(kpiKey => {
      stats[kpiKey] = getKpiValue(filteredCampaigns, channel || '', kpiKey);
    });
    
    return stats;
  };

  const summaryStats = getSummaryStats();

  // ... il resto del file rimane uguale ...
  // L'unica cosa importante è che le funzioni onEdit, onDelete, onDuplicate, etc.
  // che vengono passate a CampaignRow siano avvolte in useCallback.
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            {channel ? `${channel} Campaigns` : 'All Campaigns'}
          </h2>
          <p className="text-gray-600 mt-1">
            {filteredCampaigns.length} campaigns
            {visibleKpis.includes('budget') && ` • €${(summaryStats.budget / 1000).toFixed(0)}k total budget`}
            {visibleKpis.includes('leads') && ` • ${summaryStats.leads?.toLocaleString() || 0} leads`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grouped'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Grouped
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Table
            </button>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Campaign
          </button>
        </div>
      </div>

      {channel && (
        <ChannelSummaryPanel campaigns={filteredCampaigns} channelName={channel} />
      )}

      {channel && (
        <ChannelKpiCards campaigns={filteredCampaigns} channelName={channel} />
      )}

      {viewMode === 'grouped' && brandGroups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(['budget', ...visibleKpis.filter(k => k !== 'budget')].slice(0, 4)).map((kpiKey) => {
            const kpiConfig = getKpiConfig(kpiKey);
            const value = summaryStats[kpiKey] || 0;
            const formattedValue = formatKpiValue(value, kpiConfig.format);
            
            return (
              <div key={kpiKey} className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{kpiConfig.icon}</span>
                  <span className="text-sm font-medium text-blue-600">{kpiConfig.label}</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">{formattedValue}</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={filters.brand}
            onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Brands</option>
            {uniqueValues.brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
          <select
            value={filters.region}
            onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Regions</option>
            {uniqueValues.regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Statuses</option>
            {uniqueValues.statuses.map(status => {
              const config = getStatusConfig(status);
              return (
                <option key={status} value={status}>
                  {config.icon} {config.label}
                </option>
              );
            })}
          </select>
          <select
            value={filters.manager}
            onChange={(e) => setFilters(prev => ({ ...prev, manager: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Managers</option>
            {uniqueValues.managers.map(manager => (
              <option key={manager} value={manager}>{manager}</option>
            ))}
          </select>
        </div>
      </div>

      {viewMode === 'grouped' ? (
        brandGroups.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium text-gray-900">No campaigns found</p>
            <p className="text-sm text-gray-500">
              {campaigns.length === 0 
                ? 'Create your first campaign to get started'
                : 'Try adjusting your filters'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {brandGroups.map((brandGroup) => {
              const isExpanded = expandedGroups[brandGroup.brandName] === true;
              const hasMultipleRegions = Object.keys(brandGroup.regionBreakdown).length > 1;

              return (
                <div key={brandGroup.brandName} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-500 p-2 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div>
                          <button
                            onClick={() => toggleGroup(brandGroup.brandName)}
                            className="flex items-center gap-2 group"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                            )}
                            <span className="text-xl font-bold text-gray-900">{brandGroup.brandName}</span>
                          </button>

                          <p className="text-sm text-gray-600">
                            {brandGroup.campaigns.length} campaign{brandGroup.campaigns.length !== 1 ? 's' : ''}
                            {channel ? ` in ${channel}` : ' across all channels'}
                          </p>
                        </div>
                      </div>

                      {channel && (
                        <button
                          onClick={() => setShowBulkDuplicateModal(brandGroup.brandName)}
                          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
                          title={`Duplicate all ${brandGroup.campaigns.length} ${channel} campaigns for ${brandGroup.brandName}`}
                        >
                          <CopyPlus className="w-4 h-4" />
                          <span className="hidden sm:inline">Duplicate All</span>
                          <span className="sm:hidden">{brandGroup.campaigns.length}</span>
                        </button>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(['budget', ...visibleKpis.filter(k => k !== 'budget')].slice(0, 4)).map((kpiKey) => {
                          const kpiConfig = getKpiConfig(kpiKey);
                          const value = getKpiValue(brandGroup.campaigns, channel || brandGroup.campaigns[0]?.channel || '', kpiKey);
                          const formattedValue = formatKpiValue(value, kpiConfig.format);
                          
                          return (
                            <div key={kpiKey} className="bg-white p-4 rounded-xl border-2 text-center min-w-[100px]" style={{ borderColor: `${channel ? '#3b82f6' : '#6b7280'}30` }}>
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <span className="text-lg">{kpiConfig.icon}</span>
                                <span className="text-xs font-medium" style={{ color: channel ? '#3b82f6' : '#6b7280' }}>{kpiConfig.label}</span>
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

                  {isExpanded && (
                    <div className="p-6">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <CampaignTableHeader
                            visibleKpis={visibleKpis}
                            showPublisherColumn={showPublisherColumn}
                            showSocialColumns={showSocialColumns}
                          />
                          <tbody className="bg-white divide-y divide-gray-200">
                            {brandGroup.campaigns.map((campaign) => (
                              <CampaignRow
                                key={campaign.id}
                                campaign={campaign}
                                visibleKpis={visibleKpis}
                                channel={channel}
                                showPublisherColumn={showPublisherColumn}
                                showSocialColumns={showSocialColumns}
                                onEdit={handleEdit}
                                onDuplicate={handleDuplicate}
                                onDelete={handleDelete}
                                renderChannelBadge={renderChannelBadge}
                                renderKpiValue={renderKpiValue}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <CampaignTableHeader
                visibleKpis={visibleKpis}
                showPublisherColumn={showPublisherColumn}
                showSocialColumns={showSocialColumns}
              />
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCampaigns.map((campaign) => (
                  <CampaignRow
                    key={campaign.id}
                    campaign={campaign}
                    visibleKpis={visibleKpis}
                    channel={channel}
                    showPublisherColumn={showPublisherColumn}
                    showSocialColumns={showSocialColumns}
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    renderChannelBadge={renderChannelBadge}
                    renderKpiValue={renderKpiValue}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <CampaignForm
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          initialData={editingCampaign || {}}
          channel={channel}
        />
      )}

      {duplicatingCampaign && (
        <CampaignDuplicateModal
          campaign={duplicatingCampaign}
          onDuplicate={handleDuplicateSubmit}
          onCancel={handleDuplicateCancel}
        />
      )}
      
      {showBulkDuplicateModal && channel && (
        <BrandCampaignBulkDuplicateModal
          brand={showBulkDuplicateModal}
          channel={channel}
          onClose={() => setShowBulkDuplicateModal(null)}
        />
      )}
    </div>
  );
};