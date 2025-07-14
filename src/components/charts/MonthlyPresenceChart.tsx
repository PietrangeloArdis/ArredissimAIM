import React, { useMemo, useState } from 'react';
import { Campaign } from '../../types/campaign';
import { useChannels } from '../../hooks/useChannels';
import { formatBudget } from '../../utils/budgetFormatter';
import { BarChart3, Grid3X3, Calendar, Eye } from 'lucide-react';

interface MonthlyPresenceChartProps {
  campaigns?: Campaign[];
  dateRange?: { startDate: string; endDate: string };
  viewMode?: 'heatmap' | 'timeline' | 'table';
}

interface MonthlyPresenceData {
  month: string;
  monthKey: string;
  channels: {
    [channelName: string]: {
      isActive: boolean;
      budget: number;
      campaignCount: number;
      campaigns: Campaign[];
    };
  };
  totalBudget: number;
  totalCampaigns: number;
}

type ViewMode = 'heatmap' | 'timeline' | 'table';

export const MonthlyPresenceChart: React.FC<MonthlyPresenceChartProps> = ({ 
  campaigns, 
  dateRange, 
  viewMode: propViewMode = 'timeline' 
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(propViewMode);

  // Safe guard validation
  if (!Array.isArray(campaigns) || campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium">No campaign data available</div>
          <p className="text-sm">Campaign presence will appear when campaigns are added</p>
        </div>
      </div>
    );
  }

  if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium">Date range required</div>
          <p className="text-sm">Please select a date range to view campaign presence</p>
        </div>
      </div>
    );
  }

  const { getChannelByName, getActiveChannels } = useChannels();
  const activeChannels = getActiveChannels();

  // Generate monthly data
  const monthlyData = useMemo((): MonthlyPresenceData[] => {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    const months: MonthlyPresenceData[] = [];

    // Generate all months in the range
    const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const lastDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (currentDate <= lastDate) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = currentDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });

      // Get month boundaries
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Find campaigns active in this month
      const monthCampaigns = campaigns.filter(campaign => {
        const campaignStart = new Date(campaign.startDate);
        const campaignEnd = new Date(campaign.endDate);
        
        // Check if campaign overlaps with this month
        return campaignStart <= monthEnd && campaignEnd >= monthStart;
      });

      // Group by channel
      const channelData: MonthlyPresenceData['channels'] = {};
      let totalBudget = 0;

      activeChannels.forEach(channel => {
        const channelCampaigns = monthCampaigns.filter(c => c.channel === channel.name);
        const channelBudget = channelCampaigns.reduce((sum, c) => sum + c.budget, 0);
        
        channelData[channel.name] = {
          isActive: channelCampaigns.length > 0,
          budget: channelBudget,
          campaignCount: channelCampaigns.length,
          campaigns: channelCampaigns
        };

        totalBudget += channelBudget;
      });

      months.push({
        month: monthLabel,
        monthKey,
        channels: channelData,
        totalBudget,
        totalCampaigns: monthCampaigns.length
      });

      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return months;
  }, [campaigns, dateRange, activeChannels]);

  const getChannelColor = (channelName: string) => {
    const channel = getChannelByName(channelName);
    return channel?.color || '#6b7280';
  };

  const getChannelIcon = (channelName: string) => {
    const channel = getChannelByName(channelName);
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
    return iconMap[channel?.icon || 'Zap'] || '📊';
  };

  // Calculate presence level for heatmap (0-3 levels)
  const getPresenceLevel = (budget: number): number => {
    if (budget === 0) return 0;
    const maxBudget = Math.max(...monthlyData.flatMap(m => 
      Object.values(m.channels).map(c => c.budget)
    ));
    if (budget < maxBudget * 0.33) return 1; // Low
    if (budget < maxBudget * 0.66) return 2; // Medium
    return 3; // High
  };

  if (monthlyData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium">No campaign data available</div>
          <p className="text-sm">Campaign presence will appear when campaigns are added</p>
        </div>
      </div>
    );
  }

  // Render Mode Toggle
  const renderModeToggle = () => (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">View:</span>
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setViewMode('heatmap')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
            viewMode === 'heatmap'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          title="Heatmap Grid - Color intensity shows budget levels"
        >
          <Grid3X3 className="w-3 h-3" />
          Heatmap
        </button>
        <button
          onClick={() => setViewMode('timeline')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
            viewMode === 'timeline'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          title="Timeline - Horizontal bars showing campaign duration"
        >
          <BarChart3 className="w-3 h-3" />
          Timeline
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
            viewMode === 'table'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          title="Table - Traditional grid with icons"
        >
          <Calendar className="w-3 h-3" />
          Table
        </button>
      </div>
    </div>
  );

  // Heatmap Grid View
  const renderHeatmapView = () => (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header Row */}
          <div className="grid grid-cols-[140px_repeat(auto-fit,minmax(80px,1fr))] gap-1 mb-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider p-2">
              Channel
            </div>
            {monthlyData.map((monthData) => (
              <div key={monthData.monthKey} className="text-xs font-medium text-gray-500 uppercase tracking-wider p-2 text-center">
                {monthData.month.split(' ')[0]}
              </div>
            ))}
          </div>

          {/* Channel Rows */}
          {activeChannels.map((channel) => {
            const channelColor = getChannelColor(channel.name);
            const channelIcon = getChannelIcon(channel.name);
            
            return (
              <div key={channel.name} className="grid grid-cols-[140px_repeat(auto-fit,minmax(80px,1fr))] gap-1 mb-1">
                {/* Channel Name */}
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="text-sm">{channelIcon}</span>
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {channel.name}
                  </span>
                </div>

                {/* Heatmap Cells */}
                {monthlyData.map((monthData) => {
                  const channelData = monthData.channels[channel.name];
                  const budget = channelData?.budget || 0;
                  const campaignCount = channelData?.campaignCount || 0;
                  const presenceLevel = getPresenceLevel(budget);
                  
                  const getHeatmapColor = (level: number) => {
                    if (level === 0) return '#f3f4f6'; // Gray for no activity
                    const opacity = 0.2 + (level * 0.25); // 0.2 to 0.95 opacity
                    return `${channelColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
                  };

                  return (
                    <div
                      key={`${channel.name}-${monthData.monthKey}`}
                      className="relative h-12 rounded border border-gray-200 transition-all duration-200 hover:scale-105 cursor-pointer group"
                      style={{
                        backgroundColor: getHeatmapColor(presenceLevel)
                      }}
                      title={`${channel.name} - ${monthData.month}: ${campaignCount} campaigns, ${formatBudget(budget)}`}
                    >
                      {/* Campaign Count */}
                      {campaignCount > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-800">
                            {campaignCount}
                          </span>
                        </div>
                      )}

                      {/* Hover Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                          <div className="font-medium">{channel.name} - {monthData.month}</div>
                          <div className="text-gray-300">
                            {campaignCount} campaign{campaignCount !== 1 ? 's' : ''}
                          </div>
                          <div className="text-gray-300">
                            Budget: {formatBudget(budget)}
                          </div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-gray-700">Intensity:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 rounded"></div>
            <span className="text-xs text-gray-600">None</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-200 rounded"></div>
            <span className="text-xs text-gray-600">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-400 rounded"></div>
            <span className="text-xs text-gray-600">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded"></div>
            <span className="text-xs text-gray-600">High</span>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Numbers show campaign count
        </div>
      </div>
    </div>
  );

  // Timeline (Gantt-style) View
  const renderTimelineView = () => (
    <div className="space-y-3">
      {activeChannels.map((channel) => {
        const channelColor = getChannelColor(channel.name);
        const channelIcon = getChannelIcon(channel.name);
        
        // Get active months for this channel
        const activeMonths = monthlyData.filter(m => m.channels[channel.name]?.isActive);
        const totalBudget = activeMonths.reduce((sum, m) => sum + (m.channels[channel.name]?.budget || 0), 0);
        const totalCampaigns = activeMonths.reduce((sum, m) => sum + (m.channels[channel.name]?.campaignCount || 0), 0);
        
        return (
          <div key={channel.name} className="bg-white border border-gray-200 rounded-lg p-4">
            {/* Channel Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">{channelIcon}</span>
                <div>
                  <h4 className="font-semibold text-gray-900">{channel.name}</h4>
                  <p className="text-xs text-gray-500">
                    {totalCampaigns} campaigns • {formatBudget(totalBudget)} total
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {activeMonths.length}/{monthlyData.length} months
                </div>
                <div className="text-xs text-gray-500">active</div>
              </div>
            </div>

            {/* Timeline Bar */}
            <div className="relative">
              <div className="flex h-8 bg-gray-100 rounded-lg overflow-hidden">
                {monthlyData.map((monthData, index) => {
                  const channelData = monthData.channels[channel.name];
                  const isActive = channelData?.isActive || false;
                  const budget = channelData?.budget || 0;
                  const campaignCount = channelData?.campaignCount || 0;
                  const widthPercent = 100 / monthlyData.length;
                  
                  return (
                    <div
                      key={monthData.monthKey}
                      className={`relative transition-all duration-200 hover:opacity-80 group cursor-pointer ${
                        index < monthlyData.length - 1 ? 'border-r border-gray-200' : ''
                      }`}
                      style={{ 
                        width: `${widthPercent}%`,
                        backgroundColor: isActive ? channelColor : 'transparent'
                      }}
                      title={`${monthData.month}: ${campaignCount} campaigns, ${formatBudget(budget)}`}
                    >
                      {/* Month Label */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1">
                        <span className="text-xs text-gray-500">
                          {monthData.month.split(' ')[0]}
                        </span>
                      </div>

                      {/* Campaign Count */}
                      {isActive && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-white drop-shadow-sm">
                            {campaignCount}
                          </span>
                        </div>
                      )}

                      {/* Hover Details */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                          <div className="font-medium">{monthData.month}</div>
                          <div className="text-gray-300">
                            {campaignCount} campaign{campaignCount !== 1 ? 's' : ''}
                          </div>
                          <div className="text-gray-300">
                            {formatBudget(budget)}
                          </div>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Table View
  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
              Channel
            </th>
            {monthlyData.map((monthData) => (
              <th key={monthData.monthKey} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0">
                {monthData.month.split(' ')[0]}
                <div className="text-xs text-gray-400 font-normal">
                  {monthData.month.split(' ')[1]}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {activeChannels.map((channel) => {
            const channelColor = getChannelColor(channel.name);
            const channelIcon = getChannelIcon(channel.name);
            
            return (
              <tr key={channel.name} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{channelIcon}</span>
                    <span className="font-medium text-gray-900">{channel.name}</span>
                  </div>
                </td>
                {monthlyData.map((monthData) => {
                  const channelData = monthData.channels[channel.name];
                  const isActive = channelData?.isActive || false;
                  const budget = channelData?.budget || 0;
                  const campaignCount = channelData?.campaignCount || 0;
                  
                  return (
                    <td key={`${channel.name}-${monthData.monthKey}`} className="px-3 py-4 text-center border-r border-gray-200 last:border-r-0">
                      {isActive ? (
                        <div className="group relative">
                          <div className="flex flex-col items-center">
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: channelColor }}
                            >
                              ✓
                            </div>
                            <span className="text-xs font-medium text-gray-700 mt-1">
                              {campaignCount}
                            </span>
                          </div>
                          
                          {/* Hover Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                              <div className="font-medium">{channel.name} - {monthData.month}</div>
                              <div className="text-gray-300">
                                {campaignCount} campaign{campaignCount !== 1 ? 's' : ''}
                              </div>
                              <div className="text-gray-300">
                                Budget: {formatBudget(budget)}
                              </div>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 mx-auto flex items-center justify-center">
                          <span className="text-gray-400 text-xs">—</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Single Horizontal Header Row with Title, Subtitle, and View Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">Campaign Presence Timeline</h4>
          <p className="text-sm text-gray-600">
            {monthlyData.length} month{monthlyData.length !== 1 ? 's' : ''} • 
            {activeChannels.length} channel{activeChannels.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        {renderModeToggle()}
      </div>

      {/* Render Selected View */}
      {viewMode === 'heatmap' && renderHeatmapView()}
      {viewMode === 'timeline' && renderTimelineView()}
      {viewMode === 'table' && renderTableView()}

      {/* Monthly Summary Bar */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h5 className="text-xs font-medium text-gray-700 mb-3">Monthly Budget Summary</h5>
        <div className="grid grid-cols-[120px_repeat(auto-fit,minmax(100px,1fr))] gap-2">
          <div className="text-xs font-medium text-gray-500 p-2">
            Total Budget
          </div>
          {monthlyData.map((monthData) => (
            <div key={`summary-${monthData.monthKey}`} className="text-center p-2 bg-blue-50 rounded-lg">
              <div className="text-sm font-bold text-blue-900">
                {formatBudget(monthData.totalBudget)}
              </div>
              <div className="text-xs text-blue-600">
                {monthData.totalCampaigns} campaign{monthData.totalCampaigns !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
