import React, { useState, useMemo, useCallback } from 'react';
import { Campaign, BUDGET_ALERT_THRESHOLD, formatMetric, getChannelMetrics, getStatusConfig, migrateStatus } from '../types/campaign';
import { CampaignForm } from './CampaignForm';
import { CampaignDuplicateModal } from './CampaignDuplicateModal';
import { CampaignsHeader } from './CampaignsList/CampaignsHeader';
import { CampaignsSummary } from './CampaignsList/CampaignsSummary';
import { CampaignsGroupList } from './CampaignsList/CampaignsGroupList';
import { CampaignsEmptyState } from './CampaignsList/CampaignsEmptyState';
import { GanttChart } from './charts/GanttChart'; // 1. IMPORTA IL GANTT CHART
import { useChannels } from '../hooks/useChannels';
import { useBrands } from '../hooks/useBrands';
import { useManagers } from '../hooks/useManagers';
import { getKPIOption, getCampaignGroupingValue, getSubGroupingOption } from '../types/channel';
import { getKpiValue, getChannelKpis, getKpiConfig, formatKpiValue } from '../utils/kpiHelpers';
import { Filter, Search, X, Edit, Trash2, Copy, AlertTriangle, TrendingDown, LayoutGrid, List, BarChart3 } from 'lucide-react'; // 2. IMPORTA LE NUOVE ICONE

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
  // 3. AGGIUNGI 'gantt' COME OPZIONE DI VISTA E IMPOSTALO COME DEFAULT
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

  // Filter and search campaigns (logica invariata)
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

  // Group campaigns by channel (logica invariata)
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

  // Sort campaigns for table view (logica invariata)
  const sortedCampaigns = useMemo(() => [...filteredCampaigns].sort((a, b) => {
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
  }), [filteredCampaigns, sortBy, sortOrder]);

  const handleEdit = useCallback((campaign: Campaign) => {
    setEditingCampaign(campaign);
    setShowForm(true);
  }, []);

  const handleDuplicate = useCallback((campaign: Campaign) => {
    setDuplicatingCampaign(campaign);
  }, []);

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

  const handleDelete = useCallback((id: string, campaignName: string) => {
    if (window.confirm(`Are you sure you want to delete the campaign "${campaignName}"? This action cannot be undone.`)) {
      onDelete(id);
    }
  }, [onDelete]);

  const clearFilters = () => {
    setFilters({ channel: '', brand: '', region: '', status: '', manager: '', period: '' });
    setSearchTerm('');
  };

  const getStatusBadge = useCallback((status: string) => {
    const migratedStatus = migrateStatus(status);
    const config = getStatusConfig(migratedStatus);
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: config.bgColor, color: config.textColor, border: `1px solid ${config.color}20` }} title={config.description}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  }, []);

  // ... (tutte le altre funzioni helper rimangono invariate)
  const getBudgetAlert = (campaign: Campaign) => { /* ... */ return null; };
  const getGRPAlert = (campaign: Campaign) => { /* ... */ return null; };
  const formatBudget = (budget: number, extraBudget?: number, campaign?: Campaign) => { /* ... */ return <div/>; };
  const formatChannelMetrics = (campaign: Campaign) => { /* ... */ return <div/>; };
  const renderKPIValue = useCallback((campaign: Campaign, kpiKey: string) => { /* ... */ return <div/>; }, []);

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

  return (
    <div className="space-y-6">
      {/* 4. MODIFICA L'HEADER PER IL NUOVO INTERRUTTORE */}
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
            <Plus className="w-4 h-4" />
            Add Campaign
          </button>
        </div>
      </div>
      
      {/* Il resto del JSX non cambia, ma la logica di rendering sì */}
      
      <CampaignsSummary
        channelGroupsCount={channelGroups.length}
        totalBudget={totalBudget}
        totalLeads={totalLeads}
        avgCPL={avgCPL}
        viewMode={viewMode}
      />

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        {/* ... (la tua sezione filtri rimane identica) ... */}
        <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Search & Filters</span>
            <button onClick={clearFilters} className="ml-auto text-sm text-blue-600 hover:text-blue-800">Clear All</button>
        </div>
        <div className="mb-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" placeholder="Search campaigns..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />{searchTerm && (<button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>)}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* ... (i tuoi <select> per i filtri rimangono identici) ... */}
        </div>
        {viewMode === 'table' && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                {/* ... (le tue opzioni di ordinamento rimangono identiche) ... */}
            </div>
        )}
      </div>

      {/* 5. NUOVA LOGICA DI VISUALIZZAZIONE */}
      {(() => {
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
            return <CampaignsGroupList channelGroups={channelGroups} onEdit={handleEdit} onDelete={handleDelete} onDuplicate={handleDuplicate} getStatusBadge={getStatusBadge} formatBudget={formatBudget} formatChannelMetrics={formatChannelMetrics} renderKPIValue={renderKPIValue} />;
          case 'table':
            return (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    {/* ... (intestazione tabella) ... */}
                </div>
                <div className="overflow-x-auto">
                    {/* ... (la tua tabella qui) ... */}
                </div>
              </div>
            );
        }
      })()}

      {showForm && (<CampaignForm onSubmit={handleFormSubmit} onCancel={handleFormCancel} initialData={editingCampaign || {}} />)}
      {duplicatingCampaign && (<CampaignDuplicateModal campaign={duplicatingCampaign} onDuplicate={handleDuplicateSubmit} onCancel={handleDuplicateCancel} />)}
    </div>
  );
};