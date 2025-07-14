/**
 * Chart utilities for consistent formatting, colors, and data processing
 */

import { Campaign } from '../types/campaign';
import { formatBudget } from './budgetFormatter';

// Metric formatting with K/M suffixes
export const formatMetric = (value: number | null | undefined, unit?: string): string => {
  if (value === null || value === undefined || value === 0) {
    return '—';
  }
  
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M${unit ? ` ${unit}` : ''}`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K${unit ? ` ${unit}` : ''}`;
  }
  return `${value.toLocaleString()}${unit ? ` ${unit}` : ''}`;
};

// Percentage formatting
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Chart tooltip content generator
export const generateTooltipContent = (
  label: string,
  value: number,
  format: 'currency' | 'number' | 'percentage' = 'number'
): string => {
  switch (format) {
    case 'currency':
      return formatBudget(value);
    case 'percentage':
      return formatPercentage(value);
    case 'number':
    default:
      return formatMetric(value);
  }
};

// Standard chart colors (fallback when channel colors not available)
export const CHART_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

// Get color for chart segment with fallback
export const getChartColor = (
  index: number, 
  channelName?: string, 
  getChannelByName?: (name: string) => any
): string => {
  if (channelName && getChannelByName) {
    const channel = getChannelByName(channelName);
    if (channel?.color) return channel.color;
  }
  return CHART_COLORS[index % CHART_COLORS.length];
};

// Generate chart legend with channel colors and icons
export const generateChartLegend = (
  data: Array<{ name: string; value: number }>,
  getChannelByName?: (name: string) => any
) => {
  return data.map((item, index) => {
    const channel = getChannelByName?.(item.name);
    return {
      ...item,
      color: channel?.color || CHART_COLORS[index % CHART_COLORS.length],
      icon: channel?.icon || 'BarChart3'
    };
  });
};

// Campaign aggregation helpers
export const aggregateCampaignsByChannel = (campaigns: Campaign[]) => {
  const channelData: { [channel: string]: {
    budget: number;
    leads: number;
    campaigns: number;
    grpEfficiency?: number;
    spots?: number;
    impressions?: number;
    expectedViews?: number;
  }} = {};

  campaigns.forEach(campaign => {
    if (!channelData[campaign.channel]) {
      channelData[campaign.channel] = {
        budget: 0,
        leads: 0,
        campaigns: 0,
        spots: 0,
        impressions: 0,
        expectedViews: 0
      };
    }

    const data = channelData[campaign.channel];
    data.budget += campaign.budget;
    data.leads += campaign.leads;
    data.campaigns += 1;

    // Channel-specific metrics
    if (campaign.spotsPurchased) data.spots! += campaign.spotsPurchased;
    if (campaign.impressions) data.impressions! += campaign.impressions;
    if (campaign.expectedViews) data.expectedViews! += campaign.expectedViews;

    // GRP efficiency for TV campaigns
    if (campaign.channel === 'TV' && campaign.expectedGrps && campaign.achievedGrps) {
      const efficiency = campaign.achievedGrps / campaign.expectedGrps;
      data.grpEfficiency = data.grpEfficiency ? 
        (data.grpEfficiency + efficiency) / 2 : efficiency;
    }
  });

  return channelData;
};

// Campaign aggregation by region
export const aggregateCampaignsByRegion = (campaigns: Campaign[]) => {
  const regionData: { [region: string]: { [channel: string]: number } } = {};
  
  campaigns.forEach(campaign => {
    if (!regionData[campaign.region]) {
      regionData[campaign.region] = {};
    }
    
    regionData[campaign.region][campaign.channel] = 
      (regionData[campaign.region][campaign.channel] || 0) + campaign.budget;
  });

  return Object.entries(regionData).map(([region, channels]) => ({
    name: region,
    ...channels,
  }));
};

// Campaign aggregation by status
export const aggregateCampaignsByStatus = (campaigns: Campaign[]) => {
  const statusData: { [status: string]: number } = {};
  
  campaigns.forEach(campaign => {
    statusData[campaign.status] = (statusData[campaign.status] || 0) + 1;
  });

  return Object.entries(statusData).map(([status, count]) => ({
    name: status,
    value: count,
  }));
};

// Monthly spend aggregation
export const aggregateMonthlySpend = (campaigns: Campaign[]) => {
  const monthlyData: { [key: string]: { [channel: string]: number } } = {};
  
  campaigns.forEach(campaign => {
    const month = new Date(campaign.startDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
    
    if (!monthlyData[month]) {
      monthlyData[month] = {};
    }
    
    monthlyData[month][campaign.channel] = 
      (monthlyData[month][campaign.channel] || 0) + campaign.budget;
  });

  return Object.entries(monthlyData).map(([month, channels]) => ({
    name: month,
    ...channels,
  }));
};

// GRP performance analysis
export const analyzeGRPPerformance = (campaigns: Campaign[]) => {
  const tvCampaigns = campaigns.filter(c => 
    c.channel === 'TV' && c.expectedGrps && c.achievedGrps && c.expectedGrps > 0
  );

  return tvCampaigns.map(campaign => {
    const efficiency = campaign.achievedGrps! / campaign.expectedGrps!;
    const isUnderperforming = efficiency < 0.9; // 10% threshold
    
    return {
      name: `${campaign.brand}`,
      efficiency,
      expectedGrps: campaign.expectedGrps!,
      achievedGrps: campaign.achievedGrps!,
      isUnderperforming,
      performanceGap: isUnderperforming ? ((campaign.expectedGrps! - campaign.achievedGrps!) / campaign.expectedGrps!) * 100 : 0
    };
  }).sort((a, b) => b.efficiency - a.efficiency);
};

// Channel-specific KPI extraction
export const getChannelKPIs = (campaigns: Campaign[], channelName: string) => {
  const channelCampaigns = campaigns.filter(c => c.channel === channelName);
  
  const kpis: { [key: string]: number } = {
    budget: channelCampaigns.reduce((sum, c) => sum + c.budget, 0),
    leads: channelCampaigns.reduce((sum, c) => sum + c.leads, 0),
    campaigns: channelCampaigns.length
  };

  // Calculate CPL
  kpis.cpl = kpis.leads > 0 ? kpis.budget / kpis.leads : 0;

  // Channel-specific metrics
  switch (channelName) {
    case 'TV':
      kpis.expectedGrps = channelCampaigns.reduce((sum, c) => sum + (c.expectedGrps || 0), 0);
      kpis.achievedGrps = channelCampaigns.reduce((sum, c) => sum + (c.achievedGrps || 0), 0);
      kpis.spots = channelCampaigns.reduce((sum, c) => sum + (c.spotsPurchased || 0), 0);
      break;
    case 'Radio':
      kpis.spots = channelCampaigns.reduce((sum, c) => sum + (c.spotsPurchased || 0), 0);
      kpis.impressions = channelCampaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
      break;
    case 'Cinema':
      kpis.spots = channelCampaigns.reduce((sum, c) => sum + (c.spotsPurchased || 0), 0);
      kpis.expectedViewers = channelCampaigns.reduce((sum, c) => sum + (c.expectedViewers || 0), 0);
      break;
    case 'DOOH':
      kpis.expectedViews = channelCampaigns.reduce((sum, c) => sum + (c.expectedViews || 0), 0);
      break;
  }

  return kpis;
};

// Dynamic grouping based on channel subGroupingKey
export const groupCampaignsByChannelLogic = (
  campaigns: Campaign[], 
  channelName: string, 
  getChannelByName?: (name: string) => any
) => {
  const channel = getChannelByName?.(channelName);
  const subGroupingKey = channel?.subGroupingKey || 'campaign';
  
  const groups: { [key: string]: Campaign[] } = {};
  
  campaigns.filter(c => c.channel === channelName).forEach(campaign => {
    let groupKey: string;
    
    switch (subGroupingKey) {
      case 'broadcaster':
        groupKey = campaign.publisher || 'No Broadcaster';
        break;
      case 'brand':
        groupKey = campaign.brand;
        break;
      case 'region':
        groupKey = campaign.region;
        break;
      case 'campaign':
      default:
        groupKey = `${campaign.brand} - ${campaign.region}`;
        break;
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(campaign);
  });
  
  return groups;
};

// Alert detection for underperforming campaigns
export const detectPerformanceAlerts = (campaigns: Campaign[]) => {
  const alerts: Array<{
    type: 'grp' | 'cpl' | 'budget';
    campaignId: string;
    campaignName: string;
    channel: string;
    severity: 'high' | 'medium' | 'low';
    message: string;
    value: number;
  }> = [];

  campaigns.forEach(campaign => {
    // GRP underperformance alert
    if (campaign.channel === 'TV' && campaign.expectedGrps && campaign.achievedGrps) {
      const efficiency = campaign.achievedGrps / campaign.expectedGrps;
      if (efficiency < 0.9) {
        const gap = ((campaign.expectedGrps - campaign.achievedGrps) / campaign.expectedGrps) * 100;
        alerts.push({
          type: 'grp',
          campaignId: campaign.id!,
          campaignName: `${campaign.brand} - ${campaign.channel}`,
          channel: campaign.channel,
          severity: gap > 20 ? 'high' : gap > 10 ? 'medium' : 'low',
          message: `GRP performance ${gap.toFixed(1)}% below target`,
          value: efficiency
        });
      }
    }

    // High CPL alert
    if (campaign.costPerLead && campaign.costPerLead > 150) {
      alerts.push({
        type: 'cpl',
        campaignId: campaign.id!,
        campaignName: `${campaign.brand} - ${campaign.channel}`,
        channel: campaign.channel,
        severity: campaign.costPerLead > 300 ? 'high' : campaign.costPerLead > 200 ? 'medium' : 'low',
        message: `High CPL: €${campaign.costPerLead.toFixed(2)}`,
        value: campaign.costPerLead
      });
    }

    // Extra social budget alert
    if (['Meta', 'TikTok', 'Pinterest'].includes(campaign.channel) && campaign.extraSocialBudget) {
      const percentage = campaign.extraSocialBudget / campaign.budget;
      if (percentage > 0.3) {
        alerts.push({
          type: 'budget',
          campaignId: campaign.id!,
          campaignName: `${campaign.brand} - ${campaign.channel}`,
          channel: campaign.channel,
          severity: percentage > 0.5 ? 'high' : 'medium',
          message: `Extra social budget ${(percentage * 100).toFixed(1)}% of main budget`,
          value: percentage
        });
      }
    }
  });

  return alerts.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
};