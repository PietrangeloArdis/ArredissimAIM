import React, { useState, useMemo, useCallback } from 'react';
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
import { GanttChart } from './charts/GanttChart'; // Importa il Gantt Chart
import { Filter, Search, X, Edit, Trash2, Copy, AlertTriangle, TrendingDown, LayoutGrid, List, BarChart3, Plus } from 'lucide-react'; // Aggiunte le icone mancanti

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
  // Aggiungi 'gantt' e impostalo come default
  const [viewMode, setViewMode] = useState<'grouped' | 'table' | 'gantt'>('gantt'); 
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
  const filteredCampaigns = useMemo(() => campaigns.filter(campaign => {
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
  }), [campaigns, searchTerm, filters]);

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
      
      const campaignsWithROI = channelCampaigns.filter(c => c.roi && c.roi !== 'N/A');
      const avgROI = campaignsWithROI.length > 0 
        ? campaignsWithROI.reduce((sum, c) => {
            const roiValue = parseFloat(c.roi!.replace('%', ''));
            return sum + (isNaN(roiValue) ? 0 : roiValue);
          }, 0) / campaignsWithROI.length
        : 0;

      const channelData = getChannelByName(channelName);
      const channelColor = channelData?.color || '#6b7280';
      const channelIcon = channelData?.icon || 'Zap';
      const visibleKpis = getVisibleKPIsForChannel(channelName);
      const subGroupingKey = getSubGroupingForChannel(channelName);

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
    }).sort((a, b) => b.totalBudget - a.totalBudget);
  }, [filteredCampaigns, getChannelByName, getVisibleKPIsForChannel, getSubGroupingForChannel]);

  // Sort campaigns for table view
  const sortedCampaigns = useMemo(() => [...filteredCampaigns].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'createdAt': aValue = new Date(a.createdAt || 0); bValue = new Date(b.createdAt || 0); break;
      case 'startDate': aValue = new Date(a.startDate); bValue = new Date(b.startDate); break;
      case 'budget': aValue = a.budget; bValue = b.budget; break;
      case 'leads': aValue = a.leads; bValue = b.leads; break;
      default: return 0;
    }

    if (sortOrder === 'asc') return aValue > bValue ? 1 : -1;
    else return aValue < bValue ? 1 : -1;
  }), [filteredCampaigns, sortBy, sortOrder]);

  const handleEdit = useCallback((campaign: Campaign) => {
    setEditingCampaign(campaign);
    setShowForm(true);
  }, []);

  const handleDuplicate = useCallback((campaign: Campaign) => {
    setDuplicatingCampaign(campaign);
  }, []);

  const handleFormSubmit = useCallback((campaignData: Omit<Campaign, 'id'>) => {
    if (editingCampaign) {
      onUpdate(editingCampaign.id!, campaignData);
    } else {
      onAdd(campaignData);
    }
    setShowForm(false);
    setEditingCampaign(null);
  }, [editingCampaign, onAdd, onUpdate]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingCampaign(null);
  }, []);

  const handleDuplicateSubmit = useCallback((duplicatedCampaign: Omit<Campaign, 'id'>) => {
    onAdd(duplicatedCampaign);
    setDuplicatingCampaign(null);
  }, [onAdd]);

  const handleDuplicateCancel = useCallback(() => {
    setDuplicatingCampaign(null);
  }, []);

  const handleDelete = useCallback((id: string, campaignName: string) => {
    if (window.confirm(`Are you sure you want to delete the campaign "${campaignName}"? This action cannot be undone.`)) {
      onDelete(id);
    }
  }, [onDelete]);

  const clearFilters = useCallback(() => {
    setFilters({ channel: '', brand: '', region: '', status: '', manager: '', period: '' });
    setSearchTerm('');
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    const migratedStatus = migrateStatus(status);
    const config = getStatusConfig(migratedStatus);
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: config.bgColor, color: config.textColor, border: `1px solid ${config.color}20`}} title={config.description}>
        <span className="mr-1">{config.icon}</span>{config.label}
      </span>
    );
  }, []);

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

  const formatBudget = useCallback((budget: number, extraBudget?: number, campaign?: Campaign) => {
    const alertPercentage = campaign ? getBudgetAlert(campaign) : null;
    if (extraBudget && extraBudget > 0) {
      return (
        <div className="space-y-1">
          <div className="text-sm text-gray-900">€{budget.toLocaleString()}</div>
          <div className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${alertPercentage ? 'text-red-600 bg-red-50 border border-red-200' : 'text-blue-600 bg-blue-50'}`}>
            {alertPercentage && <AlertTriangle className="w-3 h-3" />}
            +€{extraBudget.toLocaleString()} extra
          </div>
        </div>
      );
    }
    return <div className="text-sm text-gray-900">€{budget.toLocaleString()}</div>;
  }, []);

  const formatChannelMetrics = useCallback((campaign: Campaign) => {
    const metrics = getChannelMetrics(campaign);
    if (metrics.length === 0) return <div className="text-sm text-gray-900">{campaign.leads.toLocaleString()} leads</div>;
    const grpAlert = getGRPAlert(campaign);
    return (
      <div className="text-xs text-gray-600 space-y-1">
        {metrics.slice(0, 2).map((metric, index) => (
          <div key={index} className={`flex items-center gap-1 ${metric.label.includes('Achieved') && grpAlert ? 'text-orange-600 font-medium' : ''}`}>
            {metric.icon && <span>{metric.icon}</span>}
            <span>{metric.label}: {metric.value}</span>
            {metric.label.includes('Achieved') && grpAlert && <TrendingDown className="w-3 h-3" />}
          </div>
        ))}
        {campaign.leads > 0 && <div>Leads: {campaign.leads.toLocaleString()}</div>}
      </div>
    );
  }, []);

  const renderKPIValue = useCallback((campaign: Campaign, kpiKey: string) => {
    const grpAlert = getGRPAlert(campaign);
    switch (kpiKey) {
      case 'budget': return formatBudget(campaign.budget, campaign.extraSocialBudget, campaign);
      case 'leads': return <div className="text-sm text-gray-900">{campaign.leads.toLocaleString()}{['TV', 'Radio', 'Cinema', 'DOOH'].includes(campaign.channel) && campaign.leads === 0 && <div className="text-xs text-gray-500">N/A for {campaign.channel}</div>}</div>;
      case 'cpl': return <div className="text-sm text-gray-900">€{campaign.costPerLead?.toFixed(2) || 'N/A'}</div>;
      case 'roi': return <div className="text-sm text-gray-900">{campaign.roi || 'N/A'}</div>;
      case 'expectedGrps': return <div className="text-sm text-gray-900">{campaign.expectedGrps ? formatMetric(campaign.expectedGrps) : '—'}</div>;
      case 'achievedGrps': return <div className={`text-sm ${grpAlert ? 'text-orange-600 font-medium' : 'text-gray-900'}`}>{campaign.achievedGrps ? <div className="flex items-center gap-1">{formatMetric(campaign.achievedGrps)}{grpAlert && <TrendingDown className="w-3 h-3" />}</div> : '—'}{grpAlert && <div className="text-xs text-orange-600">-{grpAlert.toFixed(1)}% vs target</div>}</div>;
      case 'spotsPurchased': return <div className="text-sm text-gray-900">{campaign.spotsPurchased ? formatMetric(campaign.spotsPurchased) : '—'}</div>;
      case 'impressions': return <div className="text-sm text-gray-900">{campaign.impressions ? formatMetric(campaign.impressions) : '—'}</div>;
      case 'expectedViews': return <div className="text-sm text-gray-900">{campaign.expectedViews ? formatMetric(campaign.expectedViews) : '—'}</div>;
      case 'expectedViewers': return <div className="text-sm text-gray-900">{campaign.expectedViewers ? formatMetric(campaign.expectedViewers) : '—'}</div>;
      case 'clicks': case 'ctr': case 'cpm': return <div className="text-sm text-gray-500">—</div>;
      default: return <div className="text-sm text-gray-500">—</div>;
    }
  }, [formatBudget]);

  const totalBudget = useMemo(() => filteredCampaigns.reduce((sum, c) => sum + c.budget, 0), [filteredCampaigns]);
  const totalLeads = useMemo(() => filteredCampaigns.reduce((sum, c) => sum + c.leads, 0), [filteredCampaigns]);
  const avgCPL = totalLeads > 0 ? totalBudget / totalLeads : 0;

  const uniqueValues = useMemo(() => ({
    channels: [...new Set(campaigns.map(c => c.channel))],
    brands: [...new Set(campaigns.map(c => c.brand))],
    regions: [...new Set(campaigns.map(c => c.region))],
    statuses: [...new Set(campaigns.map(c => migrateStatus(c.status)))],
    managers: [...new Set(campaigns.map(c => c.manager))],
  }), [campaigns]);

  // Funzione per renderizzare il contenuto principale
  const renderContent = () => {
    if (filteredCampaigns.length === 0) {
      return <CampaignsEmptyState campaignCount={campaigns.length} filteredCount={0} />;
    }
  
    switch (viewMode) {
      case 'gantt':
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline Panoramica</h3>
            <GanttChart campaigns={filteredCampaigns} />
          </div>
        );
      case 'grouped':
        return (
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
        );
      case 'table':
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Campaigns ({sortedCampaigns.length} of {campaigns.length})
                </h3>
                {filteredCampaigns.length !== campaigns.length && (
                  <span className="text-sm text-blue-600">Filtered results</span>
                )}
              </div>
            </div>
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
                          <div className="text-sm font-medium text-gray-900">{campaign.brand} - {campaign.channel}</div>
                          <div className="text-sm text-gray-500">{campaign.region} • {campaign.manager}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-500 capitalize">{campaign.periodType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatBudget(campaign.budget, campaign.extraSocialBudget, campaign)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatChannelMetrics(campaign)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">€{campaign.costPerLead?.toFixed(2) || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{campaign.roi || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(campaign.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button onClick={() => handleEdit(campaign)} className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50" title="Edit campaign"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDuplicate(campaign)} className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50" title="Duplicate campaign"><Copy className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(campaign.id!, `${campaign.brand} - ${campaign.channel}`)} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50" title="Delete campaign"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Intestazione con nuovo selettore di vista */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">All Campaigns</h2>
          <p className="text-gray-600 mt-1">
            {filteredCampaigns.length} campaigns • €{(totalBudget / 1000).toFixed(0)}k total budget • {totalLeads.toLocaleString()} leads
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('gantt')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'gantt' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Gantt
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'grouped' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Raggruppato
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" /> Tabella
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Campaign
          </button>
        </div>
      </div>

      {/* Rimuoviamo il vecchio Header perché integrato sopra */}
      {/* <CampaignsHeader ... /> */}

      <CampaignsSummary
        channelGroupsCount={channelGroups.length}
        totalBudget={totalBudget}
        totalLeads={totalLeads}
        avgCPL={avgCPL}
        viewMode={viewMode === 'gantt' ? 'table' : viewMode} // Nascondi summary in vista gantt
      />

      {/* Filtri */}
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <select value={filters.channel} onChange={(e) => setFilters(prev => ({ ...prev, channel: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All Channels</option>
            {uniqueValues.channels.map(channel => <option key={channel} value={channel}>{channel}</option>)}
          </select>
          <select value={filters.brand} onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All Brands</option>
            {uniqueValues.brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
          </select>
          <select value={filters.region} onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All Regions</option>
            {uniqueValues.regions.map(region => <option key={region} value={region}>{region}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All Statuses</option>
            {uniqueValues.statuses.map(status => {
              const config = getStatusConfig(status);
              return <option key={status} value={status}>{config.icon} {config.label}</option>;
            })}
          </select>
          <select value={filters.manager} onChange={(e) => setFilters(prev => ({ ...prev, manager: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All Managers</option>
            {uniqueValues.managers.map(manager => <option key={manager} value={manager}>{manager}</option>)}
          </select>
          <select value={filters.period} onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All Periods</option>
            <option value="this-month">This Month</option>
            <option value="current-year">Current Year</option>
            <option value="last-year">Last Year</option>
          </select>
        </div>
        {viewMode === 'table' && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="createdAt">Created Date</option>
              <option value="startDate">Start Date</option>
              <option value="budget">Budget</option>
              <option value="leads">Leads</option>
            </select>
            <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </button>
          </div>
        )}
      </div>

      {/* Contenuto principale con la nuova logica di visualizzazione */}
      {renderContent()}

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