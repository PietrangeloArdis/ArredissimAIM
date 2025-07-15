import React, { useState, useMemo } from 'react';
import { Campaign, BUDGET_ALERT_THRESHOLD, formatMetric, getChannelMetrics, getStatusConfig, migrateStatus } from '../types/campaign';
import { CampaignForm } from './CampaignForm';
import { CampaignDuplicateModal } from './CampaignDuplicateModal';
import { CampaignsHeader } from './CampaignsList/CampaignsHeader';
import { CampaignsSummary } from './CampaignsList/CampaignsSummary';
import { CampaignsGroupList } from './CampaignsList/CampaignsGroupList';
import { CampaignsEmptyState } from './CampaignsList/CampaignsEmptyState';
import { useChannels } from '../hooks/useChannels';
import { useBrands } from '../hooks/useBrands';
import { useManagers } from '../hooks/useManagers';
import { getKPIOption, getCampaignGroupingValue, getSubGroupingOption } from '../types/channel';
import { getKpiValue, getChannelKpis, getKpiConfig, formatKpiValue } from '../utils/kpiHelpers';
import { Filter, Search, X, Edit, Trash2, Copy, AlertTriangle, TrendingDown } from 'lucide-react';

interface CampaignsListProps {
  campaigns: Campaign[];
  onAdd: (campaign: Omit<Campaign, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Campaign>) => void;
  onDelete: (id: string) => void;
}

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

export const CampaignsList: React.FC<CampaignsListProps> = ({
  campaigns,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [duplicatingCampaign, setDuplicatingCampaign] = useState<Campaign | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');
  const [filters, setFilters] = useState({
    channel: '',
    brand: '',
    region: '',
    status: '',
    manager: '',
    period: '',
  });
  const [sortBy, setSortBy] = useState<'createdAt' | 'startDate' | 'budget' | 'leads'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { getActiveChannels, getChannelByName, getVisibleKPIsForChannel, getSubGroupingForChannel } = useChannels();
  const { brands } = useBrands();
  const { managers } = useManagers();

  const activeChannels = getActiveChannels();

  // Filter and search campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = !searchTerm || 
      campaign.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.channel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.manager.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (campaign.notes && campaign.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesChannel = !filters.channel || campaign.channel === filters.channel;
    const matchesBrand = !filters.brand || campaign.brand === filters.brand;
    const matchesRegion = !filters.region || campaign.region === filters.region;
    const matchesStatus = !filters.status || migrateStatus(campaign.status) === filters.status;
    const matchesManager = !filters.manager || campaign.manager === filters.manager;
    
    const matchesPeriod = !filters.period || (() => {
      const campaignYear = new Date(campaign.startDate).getFullYear();
      const currentYear = new Date().getFullYear();
      
      switch (filters.period) {
        case 'current-year':
          return campaignYear === currentYear;
        case 'last-year':
          return campaignYear === currentYear - 1;
        case 'this-month':
          const now = new Date();
          const campaignStart = new Date(campaign.startDate);
          return campaignStart.getMonth() === now.getMonth() && campaignStart.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    })();

    return matchesSearch && matchesChannel && matchesBrand && matchesRegion && 
           matchesStatus && matchesManager && matchesPeriod;
  });

  // Group campaigns by channel with dynamic sub-grouping
  const channelGroups = useMemo((): ChannelGroup[] => {
    const groups: { [channelName: string]: Campaign[] } = {};
    
    filteredCampaigns.forEach(campaign => {
      if (!groups[campaign.channel]) {
        groups[campaign.channel] = [];
      }
      groups[campaign.channel].push(campaign);
    });

    return Object.entries(groups).map(([channelName, channelCampaigns]) => {
      const totalBudget = channelCampaigns.reduce((sum, c) => sum + c.budget, 0);
      const totalLeads = channelCampaigns.reduce((sum, c) => sum + c.leads, 0);
      const avgCPL = totalLeads > 0 ? totalBudget / totalLeads : 0;
      
      // Calculate average ROI (only for campaigns with ROI data)
      const campaignsWithROI = channelCampaigns.filter(c => c.roi && c.roi !== 'N/A');
      const avgROI = campaignsWithROI.length > 0 
        ? campaignsWithROI.reduce((sum, c) => {
            const roiValue = parseFloat(c.roi!.replace('%', ''));
            return sum + (isNaN(roiValue) ? 0 : roiValue);
          }, 0) / campaignsWithROI.length
        : 0;

      // Get channel data and configuration
      const channelData = getChannelByName(channelName);
      const channelColor = channelData?.color || '#6b7280';
      const channelIcon = channelData?.icon || 'Zap';
      const visibleKpis = getVisibleKPIsForChannel(channelName);
      const subGroupingKey = getSubGroupingForChannel(channelName);

      // Create sub-groups based on the channel's sub-grouping configuration
      let subGroups: { [key: string]: Campaign[] } | undefined;
      if (subGroupingKey && subGroupingKey !== 'campaign' && channelCampaigns.length > 1) {
        subGroups = {};
        channelCampaigns.forEach(campaign => {
          const groupValue = getCampaignGroupingValue(campaign, subGroupingKey);
          if (!subGroups![groupValue]) {
            subGroups![groupValue] = [];
          }
          subGroups![groupValue].push(campaign);
        });

        // Only use sub-groups if there are multiple groups
        if (Object.keys(subGroups).length <= 1) {
          subGroups = undefined;
        }
      }

      return {
        channelName,
        campaigns: channelCampaigns.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
        totalBudget,
        totalLeads,
        avgCPL,
        avgROI,
        campaignCount: channelCampaigns.length,
        channelColor,
        channelIcon,
        visibleKpis,
        subGroups,
        subGroupingKey,
      };
    }).sort((a, b) => b.totalBudget - a.totalBudget); // Sort by total budget descending
  }, [filteredCampaigns, getChannelByName, getVisibleKPIsForChannel, getSubGroupingForChannel]);

  // Sort campaigns for table view
  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'createdAt':
        aValue = new Date(a.createdAt || 0);
        bValue = new Date(b.createdAt || 0);
        break;
      case 'startDate':
        aValue = new Date(a.startDate);
        bValue = new Date(b.startDate);
        break;
      case 'budget':
        aValue = a.budget;
        bValue = b.budget;
        break;
      case 'leads':
        aValue = a.leads;
        bValue = b.leads;
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setShowForm(true);
  };

  const handleDuplicate = (campaign: Campaign) => {
    setDuplicatingCampaign(campaign);
  };

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

  const handleDelete = (id: string, campaignName: string) => {
    if (window.confirm(`Are you sure you want to delete the campaign "${campaignName}"? This action cannot be undone.`)) {
      onDelete(id);
    }
  };

  const clearFilters = () => {
    setFilters({
      channel: '',
      brand: '',
      region: '',
      status: '',
      manager: '',
      period: '',
    });
    setSearchTerm('');
  };

  const getStatusBadge = (status: string) => {
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
          </div>
        </div>
      );
    }
    return <div className="text-sm text-gray-900">€{budget.toLocaleString()}</div>;
  };

  const formatChannelMetrics = (campaign: Campaign) => {
    const metrics = getChannelMetrics(campaign);
    
    if (metrics.length === 0) {
      return <div className="text-sm text-gray-900">{campaign.leads.toLocaleString()} leads</div>;
    }

    const grpAlert = getGRPAlert(campaign);
    
    return (
      <div className="text-xs text-gray-600 space-y-1">
        {metrics.slice(0, 2).map((metric, index) => (
          <div key={index} className={`flex items-center gap-1 ${
            metric.label.includes('Achieved') && grpAlert ? 'text-orange-600 font-medium' : ''
          }`}>
            {metric.icon && <span>{metric.icon}</span>}
            <span>{metric.label}: {metric.value}</span>
            {metric.label.includes('Achieved') && grpAlert && (
              <TrendingDown className="w-3 h-3" />
            )}
          </div>
        ))}
        {campaign.leads > 0 && (
          <div>Leads: {campaign.leads.toLocaleString()}</div>
        )}
      </div>
    );
  };

  // Render KPI value based on the KPI key
  const renderKPIValue = (campaign: Campaign, kpiKey: string) => {
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
        // These are placeholder KPIs - would need to be added to Campaign interface
        return <div className="text-sm text-gray-500">—</div>;
      
      default:
        return <div className="text-sm text-gray-500">—</div>;
    }
  };

  // Calculate summary stats
  const totalBudget = filteredCampaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalLeads = filteredCampaigns.reduce((sum, c) => sum + c.leads, 0);
  const avgCPL = totalLeads > 0 ? totalBudget / totalLeads : 0;

  // Get unique values for filters
  const uniqueValues = {
    channels: [...new Set(campaigns.map(c => c.channel))],
    brands: [...new Set(campaigns.map(c => c.brand))],
    regions: [...new Set(campaigns.map(c => c.region))],
    statuses: [...new Set(campaigns.map(c => migrateStatus(c.status)))], // Migrate legacy statuses
    managers: [...new Set(campaigns.map(c => c.manager))],
  };

  return (
    <div className="space-y-6">
      <CampaignsHeader
        filteredCampaignsCount={filteredCampaigns.length}
        totalCampaignsCount={campaigns.length}
        totalBudget={totalBudget}
        totalLeads={totalLeads}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddCampaign={() => setShowForm(true)}
      />

      <CampaignsSummary
        channelGroupsCount={channelGroups.length}
        totalBudget={totalBudget}
        totalLeads={totalLeads}
        avgCPL={avgCPL}
        viewMode={viewMode}
      />

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Search & Filters</span>
          <button
            onClick={clearFilters}
            className="ml-auto text-sm text-blue-600 hover:text-blue-800"
          >
            Clear All
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search campaigns by brand, channel, region, manager, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <select
            value={filters.channel}
            onChange={(e) => setFilters(prev => ({ ...prev, channel: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Channels</option>
            {uniqueValues.channels.map(channel => (
              <option key={channel} value={channel}>{channel}</option>
            ))}
          </select>

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

          <select
            value={filters.period}
            onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Periods</option>
            <option value="this-month">This Month</option>
            <option value="current-year">Current Year</option>
            <option value="last-year">Last Year</option>
          </select>
        </div>

        {/* Sort Options - Only show in table view */}
        {viewMode === 'table' && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="createdAt">Created Date</option>
              <option value="startDate">Start Date</option>
              <option value="budget">Budget</option>
              <option value="leads">Leads</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === 'grouped' ? (
        channelGroups.length === 0 ? (
          <CampaignsEmptyState
            campaignCount={campaigns.length}
            filteredCount={filteredCampaigns.length}
          />
        ) : (
          <CampaignsGroupList
            channelGroups={channelGroups}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            getStatusBadge={getStatusBadge}
            formatBudget={formatBudget}
            formatChannelMetrics={formatChannelMetrics}
            renderKPIValue={renderKPIValue}
          />
        )
      ) : (
        /* Traditional Table View with Dynamic KPI Columns */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Campaigns ({sortedCampaigns.length} of {campaigns.length})
              </h3>
              {filteredCampaigns.length !== campaigns.length && (
                <span className="text-sm text-blue-600">
                  Filtered results
                </span>
              )}
            </div>
          </div>

          {sortedCampaigns.length === 0 ? (
            <CampaignsEmptyState
              campaignCount={campaigns.length}
              filteredCount={filteredCampaigns.length}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metrics</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROI</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {campaign.brand} - {campaign.channel}
                          </div>
                          <div className="text-sm text-gray-500">
                            {campaign.region} • {campaign.manager}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">{campaign.periodType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatBudget(campaign.budget, campaign.extraSocialBudget, campaign)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatChannelMetrics(campaign)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{campaign.costPerLead?.toFixed(2) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.roi || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(campaign.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(campaign)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Edit campaign"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(campaign)}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                            title="Duplicate campaign"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(campaign.id!, `${campaign.brand} - ${campaign.channel}`)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Delete campaign"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <CampaignForm
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          initialData={editingCampaign || {}}
        />
      )}

      {duplicatingCampaign && (
        <CampaignDuplicateModal
          campaign={duplicatingCampaign}
          onDuplicate={handleDuplicateSubmit}
          onCancel={handleDuplicateCancel}
        />
      )}
    </div>
  );
};