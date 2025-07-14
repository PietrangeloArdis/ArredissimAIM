import React, { useMemo, useState } from 'react';
import { Campaign, KPIData } from '../../types/campaign';
import { DateRange } from '../DateFilter';
import { ExecutiveSummary } from '../ExecutiveSummary';
import { MonthlySpendChart } from '../charts/MonthlySpendChart';
import { BudgetDistributionChart } from '../charts/BudgetDistributionChart';
import { GRPEfficiencyChart } from '../charts/GRPEfficiencyChart';
import { MonthlyPresenceChart } from '../charts/MonthlyPresenceChart';
import { LeadsPerChannelChart } from '../charts/LeadsPerChannelChart';
import { RegionBudgetChart } from '../charts/RegionBudgetChart';
import { useChannels } from '../../hooks/useChannels';
import { useTranslation } from 'react-i18next';
import { 
  aggregateCampaignsByChannel, 
  aggregateCampaignsByRegion, 
  aggregateMonthlySpend,
  analyzeGRPPerformance,
  detectPerformanceAlerts,
  formatMetric
} from '../../utils/chartHelpers';
import { AlertTriangle, TrendingDown, Eye, EyeOff } from 'lucide-react';

interface DashboardChartsProps {
  filteredCampaigns: Campaign[];
  kpiData: KPIData;
  dateRange: DateRange;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  filteredCampaigns,
  kpiData,
  dateRange
}) => {
  const { t } = useTranslation();
  const { getChannelByName } = useChannels();
  const [visibleSections, setVisibleSections] = useState({
    executive: true,
    budget: true,
    presence: true,
    performance: true,
    regional: true
  });

  // Memoized data aggregations for performance
  const chartData = useMemo(() => {
    return {
      channelAggregation: aggregateCampaignsByChannel(filteredCampaigns),
      monthlySpend: aggregateMonthlySpend(filteredCampaigns),
      regionalBudget: aggregateCampaignsByRegion(filteredCampaigns),
      grpAnalysis: analyzeGRPPerformance(filteredCampaigns),
      performanceAlerts: detectPerformanceAlerts(filteredCampaigns)
    };
  }, [filteredCampaigns]);

  // Memoized budget distribution data
  const budgetDistributionData = useMemo(() => {
    return Object.entries(chartData.channelAggregation).map(([channel, data]) => ({
      name: channel,
      value: data.budget,
    }));
  }, [chartData.channelAggregation]);

  // Memoized leads per channel data
  const leadsPerChannelData = useMemo(() => {
    return Object.entries(chartData.channelAggregation).map(([channel, data]) => ({
      name: channel,
      value: data.leads,
    }));
  }, [chartData.channelAggregation]);

  const toggleSection = (section: keyof typeof visibleSections) => {
    setVisibleSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const SectionToggle: React.FC<{ 
    section: keyof typeof visibleSections; 
    title: string; 
    icon: string;
    children: React.ReactNode;
  }> = ({ section, title, icon, children }) => (
    <section>
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
        onClick={() => toggleSection(section)}
      >
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>{icon}</span>
          {title}
        </h2>
        <button className="p-1 hover:bg-gray-200 rounded">
          {visibleSections[section] ? (
            <EyeOff className="w-5 h-5 text-gray-500" />
          ) : (
            <Eye className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>
      {visibleSections[section] && children}
    </section>
  );

  return (
    <div className="space-y-8">
      {/* Executive Summary */}
      <SectionToggle section="executive" title="Riepilogo Esecutivo" icon="📊">
        <ExecutiveSummary campaigns={filteredCampaigns} kpiData={kpiData} />
      </SectionToggle>

      {/* Performance Alerts */}
      {chartData.performanceAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-500 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-orange-900">
                ⚠️ Avvisi Performance ({chartData.performanceAlerts.length})
              </h3>
              <p className="text-sm text-orange-700">
                Campaigns che richiedono attenzione immediata
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {chartData.performanceAlerts.slice(0, 6).map((alert, index) => {
              const channel = getChannelByName(alert.channel);
              const severityColors = {
                high: 'bg-red-100 border-red-300 text-red-800',
                medium: 'bg-orange-100 border-orange-300 text-orange-800',
                low: 'bg-yellow-100 border-yellow-300 text-yellow-800'
              };
              
              return (
                <div key={`${alert.campaignId}-${index}`} className={`p-3 rounded-lg border ${severityColors[alert.severity]}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: channel?.color || '#6b7280' }}
                    ></div>
                    <span className="text-sm font-medium">{alert.campaignName}</span>
                  </div>
                  <p className="text-xs">{alert.message}</p>
                  {alert.type === 'grp' && (
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingDown className="w-3 h-3" />
                      <span className="text-xs">Efficienza: {formatMetric(alert.value * 100)}%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Budget Analysis Charts */}
      <SectionToggle section="budget" title="Analisi Budget" icon="📈">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Andamento Spesa Mensile</h3>
            <MonthlySpendChart data={chartData.monthlySpend} />
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuzione Budget</h3>
            <BudgetDistributionChart data={budgetDistributionData} />
          </div>
        </div>
      </SectionToggle>

      {/* Campaign Presence Timeline (Full Width) */}
      <SectionToggle section="presence" title="Cronologia Presenza Campaign" icon="📅">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <MonthlyPresenceChart campaigns={filteredCampaigns} dateRange={dateRange} />
        </div>
      </SectionToggle>

      {/* Performance Insights Charts */}
      <SectionToggle section="performance" title="Analisi Performance" icon="🎯">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Efficienza GRP (Campaigns TV)
              {chartData.grpAnalysis.length > 0 && (
                <span className="text-sm text-gray-500 ml-2">
                  ({chartData.grpAnalysis.filter(g => g.isUnderperforming).length} sotto-performanti)
                </span>
              )}
            </h3>
            <GRPEfficiencyChart data={chartData.grpAnalysis} />
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead per Channel</h3>
            <LeadsPerChannelChart data={leadsPerChannelData} />
          </div>
        </div>
      </SectionToggle>

      {/* Regional Analysis Charts */}
      <SectionToggle section="regional" title="Analisi Regionale" icon="🗺️">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuzione Budget Regionale</h3>
          <RegionBudgetChart data={chartData.regionalBudget} />
        </div>
      </SectionToggle>

      {/* Channel Performance Summary */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Riepilogo Performance per Channel</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(chartData.channelAggregation).map(([channelName, data]) => {
            const channel = getChannelByName(channelName);
            const cpl = data.leads > 0 ? data.budget / data.leads : 0;
            
            return (
              <div key={channelName} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: channel?.color || '#6b7280' }}
                  ></div>
                  <span className="font-medium text-gray-900">{channelName}</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Budget:</span>
                    <span className="font-medium">€{formatMetric(data.budget)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Campaigns:</span>
                    <span className="font-medium">{data.campaigns}</span>
                  </div>
                  {data.leads > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Lead:</span>
                        <span className="font-medium">{formatMetric(data.leads)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">CPL:</span>
                        <span className="font-medium">€{cpl.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  
                  {/* Channel-specific metrics */}
                  {channelName === 'TV' && data.grpEfficiency && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">GRP Efficiency:</span>
                      <span className={`font-medium ${data.grpEfficiency < 0.9 ? 'text-orange-600' : 'text-green-600'}`}>
                        {formatMetric(data.grpEfficiency * 100)}%
                      </span>
                    </div>
                  )}
                  
                  {data.spots && data.spots > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Spots:</span>
                      <span className="font-medium">{formatMetric(data.spots)}</span>
                    </div>
                  )}
                  
                  {data.impressions && data.impressions > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Impressions:</span>
                      <span className="font-medium">{formatMetric(data.impressions)}</span>
                    </div>
                  )}
                  
                  {data.expectedViews && data.expectedViews > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expected Views:</span>
                      <span className="font-medium">{formatMetric(data.expectedViews)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};