import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartData } from '../../types/campaign';
import { useChannels } from '../../hooks/useChannels';
import { formatBudget } from '../../utils/budgetFormatter';
import { generateChartLegend, getChartColor } from '../../utils/chartHelpers';

interface MonthlySpendChartProps {
  data?: ChartData[];
  campaigns?: any[];
}

export const MonthlySpendChart: React.FC<MonthlySpendChartProps> = ({ data, campaigns }) => {
  // Safe guard validation
  if (!Array.isArray(data) && !Array.isArray(campaigns)) {
    return null;
  }

  // If campaigns prop is provided, process it to generate data
  let chartData = data;
  if (!chartData && Array.isArray(campaigns)) {
    // Process campaigns to generate monthly spend data
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

    chartData = Object.entries(monthlyData).map(([month, channels]) => ({
      name: month,
      ...channels,
    }));
  }

  // Final validation after processing
  if (!Array.isArray(chartData) || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium">No spending data available</div>
          <p className="text-sm">Monthly spend trends will appear when campaigns are added</p>
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

  // Sort data by month chronologically
  const sortedData = [...chartData].sort((a, b) => {
    const dateA = new Date(a.name + ' 1, 2025');
    const dateB = new Date(b.name + ' 1, 2025');
    return dateA.getTime() - dateB.getTime();
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload
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
      <LineChart data={sortedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
        <YAxis 
          tickFormatter={(value) => formatBudget(value)} 
          stroke="#6b7280" 
          fontSize={12}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
          iconType="line"
        />
        {Array.from(channels).map((channelName, index) => {
          const color = getChartColor(index, channelName, getChannelByName);
          
          return (
            <Line
              key={channelName}
              type="monotone"
              dataKey={channelName}
              stroke={color}
              strokeWidth={3}
              dot={{ fill: color, strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, stroke: color, strokeWidth: 2 }}
              connectNulls={false}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
};