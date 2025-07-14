import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartData } from '../../types/campaign';
import { useChannels } from '../../hooks/useChannels';
import { formatBudget } from '../../utils/budgetFormatter';
import { getChartColor } from '../../utils/chartHelpers';

interface RegionBudgetChartProps {
  data?: ChartData[];
  campaigns?: any[];
}

export const RegionBudgetChart: React.FC<RegionBudgetChartProps> = ({ data, campaigns }) => {
  // Safe guard validation
  if (!Array.isArray(data) && !Array.isArray(campaigns)) {
    return null;
  }

  // If campaigns prop is provided, process it to generate data
  let chartData = data;
  if (!chartData && Array.isArray(campaigns)) {
    // Process campaigns to generate region budget data
    const regionBudgets: { [region: string]: { [channel: string]: number } } = {};
    
    campaigns.forEach(campaign => {
      if (!regionBudgets[campaign.region]) {
        regionBudgets[campaign.region] = {};
      }
      
      regionBudgets[campaign.region][campaign.channel] = 
        (regionBudgets[campaign.region][campaign.channel] || 0) + campaign.budget;
    });

    chartData = Object.entries(regionBudgets).map(([region, channels]) => ({
      name: region,
      ...channels,
    }));
  }

  // Final validation after processing
  if (!Array.isArray(chartData) || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium">No regional data available</div>
          <p className="text-sm">Regional budget distribution will appear when campaigns are added</p>
        </div>
      </div>
    );
  }

  const { getChannelByName } = useChannels();

  // Get all unique channels from the data
  const channels = new Set<string>();
  chartData.forEach(item => {
    Object.keys(item).forEach(key => {
      if (key !== 'name' && typeof item[key] === 'number') {
        channels.add(key);
      }
    });
  });

  // Sort data by total budget descending
  const sortedData = [...chartData].sort((a, b) => {
    const totalA = Object.keys(a).reduce((sum, key) => 
      key !== 'name' ? sum + (a[key] as number || 0) : sum, 0
    );
    const totalB = Object.keys(b).reduce((sum, key) => 
      key !== 'name' ? sum + (b[key] as number || 0) : sum, 0
    );
    return totalB - totalA;
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload
            .filter((entry: any) => entry.value > 0)
            .sort((a: any, b: any) => b.value - a.value)
            .map((entry: any, index: number) => (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {entry.dataKey}: {formatBudget(entry.value)}
              </p>
            ))}
          <div className="border-t border-gray-200 mt-2 pt-2">
            <p className="text-sm font-medium text-gray-900">
              Totale: {formatBudget(total)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={sortedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="name" 
          stroke="#6b7280" 
          fontSize={12}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          tickFormatter={(value) => formatBudget(value)} 
          stroke="#6b7280" 
          fontSize={12}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
        />
        {Array.from(channels).map((channelName, index) => {
          const color = getChartColor(index, channelName, getChannelByName);
          
          return (
            <Area
              key={channelName}
              type="monotone"
              dataKey={channelName}
              stackId="1"
              stroke={color}
              fill={color}
              fillOpacity={0.7}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
};