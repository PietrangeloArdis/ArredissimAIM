import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartData } from '../../types/campaign';
import { formatBudget } from '../../utils/budgetFormatter';

interface BudgetDistributionChartProps {
  data?: ChartData[];
  campaigns?: any[];
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export const BudgetDistributionChart: React.FC<BudgetDistributionChartProps> = ({ data, campaigns }) => {
  // Safe guard validation
  if (!Array.isArray(data) && !Array.isArray(campaigns)) {
    return null;
  }

  // If campaigns prop is provided, process it to generate data
  let chartData = data;
  if (!chartData && Array.isArray(campaigns)) {
    // Process campaigns to generate budget distribution data
    const channelBudgets: { [channel: string]: number } = {};
    
    campaigns.forEach(campaign => {
      channelBudgets[campaign.channel] = (channelBudgets[campaign.channel] || 0) + campaign.budget;
    });

    chartData = Object.entries(channelBudgets).map(([channel, budget]) => ({
      name: channel,
      value: budget,
    }));
  }

  // Final validation after processing
  if (!Array.isArray(chartData) || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium">No budget data available</div>
          <p className="text-sm">Budget distribution will appear when campaigns are added</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => [formatBudget(value), 'Budget']}
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};