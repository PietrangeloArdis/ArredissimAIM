import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { ChartData, GRP_EFFICIENCY_THRESHOLD } from '../../types/campaign';
import { formatMetric } from '../../utils/chartHelpers';

interface GRPEfficiencyChartProps {
  data?: Array<{
    name: string;
    efficiency: number;
    expectedGrps: number;
    achievedGrps: number;
    isUnderperforming: boolean;
    performanceGap?: number;
  }>;
  campaigns?: any[];
}

export const GRPEfficiencyChart: React.FC<GRPEfficiencyChartProps> = ({ data, campaigns }) => {
  // Safe guard validation
  if (!Array.isArray(data) && !Array.isArray(campaigns)) {
    return null;
  }

  // If campaigns prop is provided, process it to generate data
  let chartData = data;
  if (!chartData && Array.isArray(campaigns)) {
    // Process campaigns to generate GRP efficiency data
    chartData = campaigns
      .filter(campaign => 
        campaign.channel === 'TV' && 
        campaign.expectedGrps && 
        campaign.achievedGrps &&
        campaign.expectedGrps > 0
      )
      .map(campaign => {
        const efficiency = campaign.achievedGrps! / campaign.expectedGrps!;
        const isUnderperforming = efficiency < GRP_EFFICIENCY_THRESHOLD;
        
        return {
          name: `${campaign.brand}`,
          efficiency,
          expectedGrps: campaign.expectedGrps!,
          achievedGrps: campaign.achievedGrps!,
          isUnderperforming,
          performanceGap: isUnderperforming ? ((campaign.expectedGrps! - campaign.achievedGrps!) / campaign.expectedGrps!) * 100 : 0
        };
      })
      .sort((a, b) => b.efficiency - a.efficiency);
  }

  // Final validation after processing
  if (!Array.isArray(chartData) || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium">No GRP data available</div>
          <p className="text-sm">GRP efficiency will appear when TV campaigns with GRP data are added</p>
        </div>
      </div>
    );
  }

  const formatValue = (value: number) => `${(value * 100).toFixed(1)}%`;

  // Color bars based on efficiency threshold
  const getBarColor = (item: any) => {
    if (item.efficiency >= GRP_EFFICIENCY_THRESHOLD) return '#10b981'; // Green
    if (item.efficiency >= 0.8) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Efficienza: <span className="font-medium">{formatValue(data.efficiency)}</span>
          </p>
          <p className="text-sm text-gray-600">
            GRP Attesi: <span className="font-medium">{formatMetric(data.expectedGrps)}</span>
          </p>
          <p className="text-sm text-gray-600">
            GRP Raggiunti: <span className="font-medium">{formatMetric(data.achievedGrps)}</span>
          </p>
          {data.isUnderperforming && (
            <p className="text-sm text-orange-600 font-medium">
              Gap: -{data.performanceGap?.toFixed(1)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
          tickFormatter={formatValue} 
          stroke="#6b7280" 
          domain={[0, 1.2]} 
          fontSize={12}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine 
          y={GRP_EFFICIENCY_THRESHOLD} 
          stroke="#ef4444" 
          strokeDasharray="5 5" 
          label={{ 
            value: `Target (${(GRP_EFFICIENCY_THRESHOLD * 100).toFixed(0)}%)`, 
            position: "topRight",
            fontSize: 12
          }}
        />
        <Bar dataKey="efficiency" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};