export interface Campaign {
  id?: string;
  channel: string; // Changed from Channel union to string for dynamic channels
  brand: string;
  region: string;
  periodType: PeriodType;
  startDate: string;
  endDate: string;
  budget: number;
  roi?: string;
  costPerLead?: number;
  leads: number;
  manager: string;
  status: Status;
  notes?: string;
  publisher?: string; // New field for TV/Radio broadcaster/sponsorship
  extraSocialBudget?: number; // New field for extra social media budget
  extraSocialNotes?: string; // New field for extra social media notes
  // TV-specific metrics
  expectedGrps?: number | null; // Expected GRP (Gross Rating Points)
  achievedGrps?: number | null; // Actual GRP achieved
  spotsPurchased?: number | null; // Total number of spots purchased (TV/Radio/Cinema)
  // Radio-specific metrics
  impressions?: number | null; // Estimated impressions (in thousands or millions)
  // Cinema-specific metrics
  expectedViewers?: number | null; // Estimated number of viewers (in thousands)
  // DOOH-specific metrics
  expectedViews?: number | null; // Projected views of digital signage (in thousands)
  createdAt?: string;
  updatedAt?: string;
}

// Keep legacy Channel type for backward compatibility, but it's now dynamic
export type Channel = string;

export type PeriodType = 'monthly' | 'weekly' | 'quarterly';

// Updated Status with clearer labels
export type Status = 'PLANNED' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

// Legacy status mapping for backward compatibility
export const LEGACY_STATUS_MAP: { [key: string]: Status } = {
  'PENDING': 'PLANNED',
  'LOADED': 'SCHEDULED',
  'OK': 'ACTIVE',
};

// Status configuration with colors and descriptions
export const STATUS_CONFIG: { [key in Status]: { 
  label: string; 
  description: string; 
  color: string; 
  bgColor: string; 
  textColor: string;
  icon: string;
} } = {
  PLANNED: {
    label: 'Planned',
    description: 'Campaign is created but not yet started',
    color: '#6b7280',
    bgColor: '#f9fafb',
    textColor: '#374151',
    icon: '📝'
  },
  SCHEDULED: {
    label: 'Scheduled',
    description: 'Dates and data are loaded, ready to launch',
    color: '#3b82f6',
    bgColor: '#eff6ff',
    textColor: '#1d4ed8',
    icon: '📅'
  },
  ACTIVE: {
    label: 'Active',
    description: 'Campaign is currently running',
    color: '#10b981',
    bgColor: '#ecfdf5',
    textColor: '#047857',
    icon: '🟢'
  },
  COMPLETED: {
    label: 'Completed',
    description: 'Campaign has ended successfully',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    textColor: '#4b5563',
    icon: '✅'
  },
  CANCELLED: {
    label: 'Cancelled',
    description: 'Campaign was stopped or deleted',
    color: '#ef4444',
    bgColor: '#fef2f2',
    textColor: '#dc2626',
    icon: '❌'
  }
};

// Helper function to migrate legacy status values
export const migrateStatus = (status: string): Status => {
  return LEGACY_STATUS_MAP[status] || status as Status;
};

// Helper function to get status configuration
export const getStatusConfig = (status: Status) => {
  return STATUS_CONFIG[status] || STATUS_CONFIG.PLANNED;
};

export interface KPIData {
  totalBudget: number;
  totalLeads: number;
  avgCPL: number;
  totalCampaigns: number;
  extraSocialBudget: number;
  grpShortfallCampaigns: number; // New KPI for GRP shortfall campaigns
  highCPLCampaigns: number; // New KPI for high CPL campaigns
  avgGRPEfficiency: number; // New KPI for average GRP efficiency
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

// Enhanced alert thresholds
export const BUDGET_ALERT_THRESHOLD = 0.30; // 30% threshold for extra social budget alerts
export const HIGH_CPL_THRESHOLD = 150; // €150 threshold for high CPL alerts
export const GRP_EFFICIENCY_THRESHOLD = 0.90; // 90% threshold for GRP efficiency

export interface BudgetAlert {
  campaignId: string;
  campaignName: string;
  channel: string;
  extraBudgetPercentage: number;
  mainBudget: number;
  extraBudget: number;
}

// GRP Performance Alert for TV campaigns
export interface GRPAlert {
  campaignId: string;
  campaignName: string;
  expectedGrps: number;
  achievedGrps: number;
  performanceGap: number; // Percentage shortfall
  efficiency: number; // achievedGrps / expectedGrps
}

// High CPL Alert
export interface CPLAlert {
  campaignId: string;
  campaignName: string;
  channel: string;
  costPerLead: number;
  leads: number;
  budget: number;
}

// Performance Alert (combines all alert types)
export interface PerformanceAlert {
  type: 'grp' | 'cpl' | 'budget';
  campaignId: string;
  campaignName: string;
  channel: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  value: number;
  threshold: number;
}

// Utility function to format metrics with K/M suffixes
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

// Channel-specific metric helpers
export const getChannelMetrics = (campaign: Campaign) => {
  const metrics: { label: string; value: string; icon?: string }[] = [];
  
  switch (campaign.channel) {
    case 'TV':
      if (campaign.expectedGrps) {
        metrics.push({ label: 'Target GRP', value: formatMetric(campaign.expectedGrps), icon: '📺' });
      }
      if (campaign.achievedGrps) {
        metrics.push({ label: 'Achieved GRP', value: formatMetric(campaign.achievedGrps), icon: '📺' });
      }
      if (campaign.spotsPurchased) {
        metrics.push({ label: 'TV Spots', value: formatMetric(campaign.spotsPurchased), icon: '📺' });
      }
      break;
      
    case 'Radio':
      if (campaign.spotsPurchased) {
        metrics.push({ label: 'Radio Spots', value: formatMetric(campaign.spotsPurchased), icon: '📻' });
      }
      if (campaign.impressions) {
        metrics.push({ label: 'Impressions', value: formatMetric(campaign.impressions), icon: '📻' });
      }
      break;
      
    case 'Cinema':
      if (campaign.spotsPurchased) {
        metrics.push({ label: 'Screenings', value: formatMetric(campaign.spotsPurchased), icon: '🎬' });
      }
      if (campaign.expectedViewers) {
        metrics.push({ label: 'Expected Viewers', value: formatMetric(campaign.expectedViewers), icon: '🎬' });
      }
      break;
      
    case 'DOOH':
      if (campaign.expectedViews) {
        metrics.push({ label: 'Expected Views', value: formatMetric(campaign.expectedViews), icon: '🖥️' });
      }
      break;
  }
  
  return metrics;
};

// Helper to check if a channel supports specific metrics
export const channelSupportsMetric = (channel: string, metric: string): boolean => {
  const channelMetrics: { [key: string]: string[] } = {
    'TV': ['expectedGrps', 'achievedGrps', 'spotsPurchased'],
    'Radio': ['spotsPurchased', 'impressions'],
    'Cinema': ['spotsPurchased', 'expectedViewers'],
    'DOOH': ['expectedViews'],
  };
  
  return channelMetrics[channel]?.includes(metric) || false;
};

// Helper to get metric display info
export const getMetricDisplayInfo = (metric: string) => {
  const metricInfo: { [key: string]: { label: string; placeholder: string; tooltip: string; icon: string } } = {
    expectedGrps: {
      label: 'Expected GRPs',
      placeholder: 'e.g., 150.5',
      tooltip: '📺 Target GRP for campaign reach measurement',
      icon: '📺'
    },
    achievedGrps: {
      label: 'Achieved GRPs',
      placeholder: 'e.g., 142.3',
      tooltip: '📺 Actual GRP performance vs target',
      icon: '📺'
    },
    spotsPurchased: {
      label: 'Spots Purchased',
      placeholder: 'e.g., 24',
      tooltip: 'Total number of advertising spots purchased',
      icon: '📺'
    },
    impressions: {
      label: 'Impressions',
      placeholder: 'e.g., 250000',
      tooltip: '📻 Estimated impressions (in thousands or millions)',
      icon: '📻'
    },
    expectedViewers: {
      label: 'Expected Viewers',
      placeholder: 'e.g., 85000',
      tooltip: '🎬 Estimated number of viewers (in thousands)',
      icon: '🎬'
    },
    expectedViews: {
      label: 'Expected Views',
      placeholder: 'e.g., 500000',
      tooltip: '🖥️ Projected views of digital out-of-home signage',
      icon: '🖥️'
    }
  };
  
  return metricInfo[metric] || { label: metric, placeholder: '', tooltip: '', icon: '📊' };
};