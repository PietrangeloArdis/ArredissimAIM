import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartData } from '../../types/campaign';
import { useChannels } from '../../hooks/useChannels';
import { getChartColor, formatMetric } from '../../utils/chartHelpers';

interface LeadsPerChannelChartProps {
  data?: ChartData[];
  campaigns?: any[];
}

export const LeadsPerChannelChart: React.FC<LeadsPerChannelChartProps> = ({ data, campaigns }) => {
  // Safe guard validation
  if (!Array.isArray(data) && !Array.isArray(campaigns)) {
    return null;
  }

  // If campaigns prop is provided, process it to generate data
  let chartData = data;
  if (!chartData && Array.isArray(campaigns)) {
    // Process campaigns to generate leads per channel data
    const channelLeads: { [channel: string]: number } = {};
    
    campaigns.forEach(campaign => {
      channelLeads[campaign.channel] = (channelLeads[campaign.channel] || 0) + campaign.leads;
    });

    chartData = Object.entries(channelLeads).map(([channel, leads]) => ({
      name: channel,
      value: leads,
    }));
  }

  // Final validation after processing
  if (!Array.isArray(chartData) || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium">No leads data available</div>
          <p className="text-sm">Leads by channel will appear when campaigns are added</p>
        </div>
      </div>
    );
  }

  const { getChannelByName } = useChannels();

  // Sort data by leads descending
  const sortedData = [...chartData].sort((a, b) => b.value - a.value);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const channel = getChannelByName(label);
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            {channel?.color && (
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: channel.color }}
              ></div>
            )}
            <p className="font-medium text-gray-900">{label}</p>
          </div>
          <p className="text-sm text-gray-600">
            Lead: <span className="font-medium">{formatMetric(payload[0].value)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={sortedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
          stroke="#6b7280" 
          fontSize={12}
          tickFormatter={(value) => formatMetric(value)}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {sortedData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={getChartColor(index, entry.name, getChannelByName)} 
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};