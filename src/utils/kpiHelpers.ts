import { Campaign } from '../types/campaign';
import { formatBudget } from './budgetFormatter';

// KPI label and formatting configuration
export const KPI_CONFIG = {
  // Universal KPIs
  budget: {
    label: 'Total Budget',
    icon: '💰',
    format: 'currency',
    category: 'universal'
  },
  leads: {
    label: 'Total Leads',
    icon: '👥',
    format: 'number',
    category: 'universal'
  },
  cpl: {
    label: 'Avg CPL',
    icon: '🎯',
    format: 'currency',
    category: 'universal'
  },
  roi: {
    label: 'Avg ROI',
    icon: '📈',
    format: 'percentage',
    category: 'universal'
  },
  
  // Digital KPIs
  clicks: {
    label: 'Total Clicks',
    icon: '👆',
    format: 'number',
    category: 'digital'
  },
  ctr: {
    label: 'Avg CTR',
    icon: '📊',
    format: 'percentage',
    category: 'digital'
  },
  cpm: {
    label: 'Avg CPM',
    icon: '💸',
    format: 'currency',
    category: 'digital'
  },
  
  // Traditional Media KPIs
  expectedGrps: {
    label: 'Expected GRPs',
    icon: '📺',
    format: 'number',
    category: 'tv'
  },
  achievedGrps: {
    label: 'Achieved GRPs',
    icon: '📺',
    format: 'number',
    category: 'tv'
  },
  spotsPurchased: {
    label: 'Spots Purchased',
    icon: '📻',
    format: 'number',
    category: 'traditional'
  },
  impressions: {
    label: 'Impressions',
    icon: '👁️',
    format: 'number',
    category: 'traditional'
  },
  expectedViewers: {
    label: 'Expected Viewers',
    icon: '🎬',
    format: 'number',
    category: 'cinema'
  },
  expectedViews: {
    label: 'Expected Views',
    icon: '🖥️',
    format: 'number',
    category: 'dooh'
  }
};

// Default KPI sets for fallback
export const DEFAULT_KPI_SETS = {
  digital: ['budget', 'leads', 'cpl', 'roi', 'clicks', 'ctr'],
  traditional: ['budget', 'spotsPurchased', 'expectedGrps', 'achievedGrps'],
  fallback: ['budget', 'leads', 'cpl', 'roi']
};

// Formatting functions
export const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const formatKpiValue = (value: number, format: string): string => {
  switch (format) {
    case 'currency':
      return formatBudget(value);
    case 'percentage':
      return formatPercentage(value);
    case 'number':
      return formatNumber(value);
    default:
      return value.toString();
  }
};

// Get KPI value for a specific channel and KPI key
export const getKpiValue = (campaigns: Campaign[], channelName: string, kpiKey: string): number => {
  const channelCampaigns = campaigns.filter(c => c.channel === channelName);
  
  if (channelCampaigns.length === 0) return 0;

  switch (kpiKey) {
    case 'budget':
      return channelCampaigns.reduce((sum, c) => sum + c.budget, 0);
    
    case 'leads':
      return channelCampaigns.reduce((sum, c) => sum + c.leads, 0);
    
    case 'cpl':
      const totalBudget = channelCampaigns.reduce((sum, c) => sum + c.budget, 0);
      const totalLeads = channelCampaigns.reduce((sum, c) => sum + c.leads, 0);
      return totalLeads > 0 ? totalBudget / totalLeads : 0;
    
    case 'roi':
      const campaignsWithROI = channelCampaigns.filter(c => c.roi && c.roi !== 'N/A');
      if (campaignsWithROI.length === 0) return 0;
      const avgROI = campaignsWithROI.reduce((sum, c) => {
        const roiValue = parseFloat(c.roi!.replace('%', ''));
        return sum + (isNaN(roiValue) ? 0 : roiValue);
      }, 0) / campaignsWithROI.length;
      return avgROI;
    
    case 'clicks':
      // Placeholder - would need to be added to Campaign interface
      return 0;
    
    case 'ctr':
      // Placeholder - would need to be added to Campaign interface
      return 0;
    
    case 'cpm':
      // Placeholder - would need to be added to Campaign interface
      return 0;
    
    case 'expectedGrps':
      return channelCampaigns.reduce((sum, c) => sum + (c.expectedGrps || 0), 0);
    
    case 'achievedGrps':
      return channelCampaigns.reduce((sum, c) => sum + (c.achievedGrps || 0), 0);
    
    case 'spotsPurchased':
      return channelCampaigns.reduce((sum, c) => sum + (c.spotsPurchased || 0), 0);
    
    case 'impressions':
      return channelCampaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
    
    case 'expectedViewers':
      return channelCampaigns.reduce((sum, c) => sum + (c.expectedViewers || 0), 0);
    
    case 'expectedViews':
      return channelCampaigns.reduce((sum, c) => sum + (c.expectedViews || 0), 0);
    
    default:
      return 0;
  }
};

// Get visible KPIs for a channel with fallback
export const getChannelKpis = (
  channelName: string,
  getChannelByName: (name: string) => any
): string[] => {
  const channel = getChannelByName(channelName);

  // Prende i KPI definiti nel canale o applica fallback
  let kpis: string[] =
    channel?.visibleKpis && channel.visibleKpis.length > 0
      ? channel.visibleKpis
      : channel?.type === 'digital'
      ? DEFAULT_KPI_SETS.digital
      : channel?.type === 'traditional'
      ? DEFAULT_KPI_SETS.traditional
      : DEFAULT_KPI_SETS.fallback;

  // Forza il budget come primo KPI, evitando duplicati
  return ['budget', ...kpis.filter(k => k !== 'budget')];
};

// Get KPI configuration for rendering
export const getKpiConfig = (kpiKey: string) => {
  return KPI_CONFIG[kpiKey as keyof typeof KPI_CONFIG] || {
    label: kpiKey,
    icon: '📊',
    format: 'number',
    category: 'unknown'
  };
};