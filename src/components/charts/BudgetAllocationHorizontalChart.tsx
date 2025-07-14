import React from 'react';
import { ChartData } from '../../types/campaign';
import { useChannels } from '../../hooks/useChannels';
import { formatBudget } from '../../utils/budgetFormatter';
import { useTranslation } from 'react-i18next';

interface BudgetAllocationHorizontalChartProps {
  data: ChartData[];
}

export const BudgetAllocationHorizontalChart: React.FC<BudgetAllocationHorizontalChartProps> = ({ data }) => {
  const { getChannelByName } = useChannels();
  const { t } = useTranslation();

  // Get dynamic channel colors from Firestore
  const getChannelColor = (channelName: string) => {
    const channel = getChannelByName(channelName);
    return channel?.color || '#6b7280'; // fallback to gray
  };

  // Calculate total budget and percentages
  const totalBudget = data.reduce((sum, item) => sum + item.value, 0);
  
  // Sort data by budget descending and add percentage calculations
  const sortedData = data
    .map(item => ({
      ...item,
      percentage: totalBudget > 0 ? (item.value / totalBudget) * 100 : 0
    }))
    .sort((a, b) => b.value - a.value);

  // Check if we have a dominant channel (>70% of budget)
  const hasDominantChannel = sortedData.length > 0 && sortedData[0].percentage > 70;

  // Minimum bar width to ensure visibility (5% of container)
  const getBarWidth = (percentage: number) => {
    return Math.max(percentage, 5);
  };

  if (sortedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium">Nessun dato di budget disponibile</div>
          <p className="text-sm">L'allocazione del budget apparirà quando verranno aggiunte le campaigns</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart Header with Total */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-sm font-medium text-gray-700">Distribuzione Budget</h4>
          <p className="text-xs text-gray-500">
            {sortedData.length} channel{sortedData.length !== 1 ? 's' : ''} • Totale: {formatBudget(totalBudget)}
          </p>
        </div>
        {hasDominantChannel && (
          <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
            <span className="text-xs font-medium">⚠️ Channel Dominante</span>
          </div>
        )}
      </div>

      {/* Horizontal Bar Chart */}
      <div className="space-y-3">
        {sortedData.map((item, index) => {
          const channelColor = getChannelColor(item.name);
          const barWidth = getBarWidth(item.percentage);
          const isSmallPercentage = item.percentage < 10;
          
          return (
            <div key={item.name} className="group">
              {/* Channel Info Row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: channelColor }}
                      ></div>
                    </div>
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-semibold text-gray-900">
                    {item.percentage.toFixed(1)}%
                  </span>
                  <span className="text-gray-600 min-w-[80px] text-right">
                    {formatBudget(item.value)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out relative group-hover:opacity-90"
                    style={{ 
                      width: `${barWidth}%`,
                      backgroundColor: channelColor,
                      minWidth: isSmallPercentage ? '40px' : 'auto'
                    }}
                  >
                    {/* Inner gradient for depth */}
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-20 rounded-full"
                    ></div>
                    
                    {/* Percentage label inside bar (for larger bars) */}
                    {!isSmallPercentage && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-white drop-shadow-sm">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-gray-300">
                      {formatBudget(item.value)} ({item.percentage.toFixed(1)}%)
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enhanced Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h5 className="text-xs font-medium text-gray-700 mb-3">Legenda Channel</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {sortedData.map((item, index) => {
            const channelColor = getChannelColor(item.name);
            
            return (
              <div key={item.name} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400">#{index + 1}</span>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: channelColor }}
                  ></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900 truncate">
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.percentage.toFixed(1)}% • {formatBudget(item.value)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Insights */}
      {hasDominantChannel && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 text-orange-800 mb-1">
            <span className="text-sm font-medium">📊 Analisi Distribuzione Budget</span>
          </div>
          <p className="text-xs text-orange-700">
            <strong>{sortedData[0].name}</strong> domina con il {sortedData[0].percentage.toFixed(1)}% del budget totale. 
            Considera di diversificare tra i channel per una migliore distribuzione del rischio.
          </p>
        </div>
      )}

      {/* Balanced Distribution Message */}
      {!hasDominantChannel && sortedData.length > 1 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800 mb-1">
            <span className="text-sm font-medium">✅ Distribuzione Bilanciata</span>
          </div>
          <p className="text-xs text-green-700">
            Il budget è ben distribuito tra {sortedData.length} channel senza che nessun channel superi il 70%.
          </p>
        </div>
      )}
    </div>
  );
};