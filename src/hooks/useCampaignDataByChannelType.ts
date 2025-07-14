import { useMemo } from 'react';
import { Campaign, ChartData } from '../types/campaign';
import { useChannels } from './useChannels';

export type ChannelType = 'digital' | 'traditional';

export const useCampaignDataByChannelType = (campaigns: Campaign[]) => {
  const { getChannelByName } = useChannels();

  const getChannelType = (channelName: string): ChannelType => {
    const channel = getChannelByName(channelName);
    
    // Prioritize the explicit type field
    if (channel?.type === 'digital') return 'digital';
    if (channel?.type === 'traditional') return 'traditional';

    // Fallback: check for known KPIs
    if (channel?.visibleKpis?.some(kpi => ['clicks', 'ctr', 'cpm'].includes(kpi))) {
      return 'digital';
    }

    // Default fallback based on channel name patterns
    const digitalChannels = ['Meta', 'META', 'Google', 'TikTok', 'Pinterest', 'LinkedIn', 'YouTube'];
    const traditionalChannels = ['TV', 'Radio', 'Cinema', 'DOOH'];
    
    if (digitalChannels.includes(channelName)) return 'digital';
    if (traditionalChannels.includes(channelName)) return 'traditional';
    
    return 'traditional';
  };

  const digitalCampaigns = useMemo(() => 
    campaigns.filter(campaign => getChannelType(campaign.channel) === 'digital'),
    [campaigns]
  );

  const traditionalCampaigns = useMemo(() => 
    campaigns.filter(campaign => getChannelType(campaign.channel) === 'traditional'),
    [campaigns]
  );

  const getFilteredCampaigns = (type: ChannelType, selectedChannels?: string[]) => {
    const baseCampaigns = type === 'digital' ? digitalCampaigns : traditionalCampaigns;
    
    if (!selectedChannels || selectedChannels.length === 0) {
      return baseCampaigns;
    }
    
    return baseCampaigns.filter(campaign => selectedChannels.includes(campaign.channel));
  };

  const getChannelsByType = (type: ChannelType): string[] => {
    const baseCampaigns = type === 'digital' ? digitalCampaigns : traditionalCampaigns;
    return [...new Set(baseCampaigns.map(c => c.channel))];
  };

  const getKPIData = (type: ChannelType, selectedChannels?: string[]) => {
    const filteredCampaigns = getFilteredCampaigns(type, selectedChannels);
    
    const totalBudget = filteredCampaigns.reduce((sum, c) => sum + c.budget, 0);
    const totalLeads = filteredCampaigns.reduce((sum, c) => sum + c.leads, 0);
    const avgCPL = totalLeads > 0 ? totalBudget / totalLeads : 0;
    const totalCampaigns = filteredCampaigns.length;
    
    // Type-specific metrics
    let typeSpecificMetrics = {};
    
    if (type === 'digital') {
      const extraSocialBudget = filteredCampaigns
        .filter(c => ['Meta', 'TikTok', 'Pinterest'].includes(c.channel))
        .reduce((sum, c) => sum + (c.extraSocialBudget || 0), 0);
      
      typeSpecificMetrics = { extraSocialBudget };
    } else {
      const totalSpots = filteredCampaigns.reduce((sum, c) => sum + (c.spotsPurchased || 0), 0);
      const tvCampaignsWithGRP = filteredCampaigns.filter(c => 
        c.channel === 'TV' && c.expectedGrps && c.achievedGrps && c.expectedGrps > 0
      );
      
      const avgGRPEfficiency = tvCampaignsWithGRP.length > 0 
        ? tvCampaignsWithGRP.reduce((sum, c) => 
            sum + (c.achievedGrps! / c.expectedGrps!), 0
                      ) / tvCampaignsWithGRP.length
        : 1;
      
      typeSpecificMetrics = { totalSpots, avgGRPEfficiency };
    }

    return {
      totalBudget,
      totalLeads,
      avgCPL,
      totalCampaigns,
      ...typeSpecificMetrics
    };
  };

  const getMonthlySpendData = (type: ChannelType, selectedChannels?: string[]): ChartData[] => {
    const filteredCampaigns = getFilteredCampaigns(type, selectedChannels);
    const monthlyData: { [key: string]: { [channel: string]: number } } = {};
    
    filteredCampaigns.forEach(campaign => {
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

  const getBudgetAllocationData = (type: ChannelType, selectedChannels?: string[]): ChartData[] => {
    const filteredCampaigns = getFilteredCampaigns(type, selectedChannels);
    const channelBudgets: { [channel: string]: number } = {};
    
    filteredCampaigns.forEach(campaign => {
      channelBudgets[campaign.channel] = (channelBudgets[campaign.channel] || 0) + campaign.budget;
    });

    return Object.entries(channelBudgets).map(([channel, budget]) => ({
      name: channel,
      value: budget,
    }));
  };

  const getLeadsPerChannelData = (type: ChannelType, selectedChannels?: string[]): ChartData[] => {
    const filteredCampaigns = getFilteredCampaigns(type, selectedChannels);
    const channelLeads: { [channel: string]: number } = {};
    
    filteredCampaigns.forEach(campaign => {
      channelLeads[campaign.channel] = (channelLeads[campaign.channel] || 0) + campaign.leads;
    });

    return Object.entries(channelLeads).map(([channel, leads]) => ({
      name: channel,
      value: leads,
    }));
  };

  const getRegionBudgetData = (type: ChannelType, selectedChannels?: string[]): ChartData[] => {
    const filteredCampaigns = getFilteredCampaigns(type, selectedChannels);
    const regionBudgets: { [region: string]: { [channel: string]: number } } = {};
    
    filteredCampaigns.forEach(campaign => {
      if (!regionBudgets[campaign.region]) {
        regionBudgets[campaign.region] = {};
      }
      
      regionBudgets[campaign.region][campaign.channel] = 
        (regionBudgets[campaign.region][campaign.channel] || 0) + campaign.budget;
    });

    return Object.entries(regionBudgets).map(([region, channels]) => ({
      name: region,
      ...channels,
    }));
  };

  const getCPLTrendData = (type: ChannelType, selectedChannels?: string[]): ChartData[] => {
    const filteredCampaigns = getFilteredCampaigns(type, selectedChannels);
    const monthlyData: { [key: string]: { totalBudget: number; totalLeads: number } } = {};
    
    filteredCampaigns.forEach(campaign => {
      if (campaign.leads > 0) {
        const month = new Date(campaign.startDate).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        
        if (!monthlyData[month]) {
          monthlyData[month] = { totalBudget: 0, totalLeads: 0 };
        }
        
        monthlyData[month].totalBudget += campaign.budget;
        monthlyData[month].totalLeads += campaign.leads;
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      name: month,
      avgCPL: data.totalLeads > 0 ? data.totalBudget / data.totalLeads : 0,
    }));
  };

  const getTopCampaignsByLeads = (limit: number = 3): Campaign[] => {
    return [...campaigns]
      .filter(c => c.leads > 0)
      .sort((a, b) => b.leads - a.leads)
      .slice(0, limit);
  };

  return {
    digitalCampaigns,
    traditionalCampaigns,
    getChannelType,
    getFilteredCampaigns,
    getChannelsByType,
    getKPIData,
    getMonthlySpendData,
    getBudgetAllocationData,
    getLeadsPerChannelData,
    getRegionBudgetData,
    getCPLTrendData,
    getTopCampaignsByLeads,
  };
};