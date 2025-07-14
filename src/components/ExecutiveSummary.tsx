import React from 'react';
import { Campaign, KPIData } from '../types/campaign';
import { KPICards } from './KPICards';
import { BudgetAllocationHorizontalChart } from './charts/BudgetAllocationHorizontalChart';
import { Trophy, AlertTriangle, TrendingDown, Users, Target } from 'lucide-react';
import { useCampaignDataByChannelType } from '../hooks/useCampaignDataByChannelType';
import { useChannels } from '../hooks/useChannels';
import { useTranslation } from 'react-i18next';

interface ExecutiveSummaryProps {
  campaigns: Campaign[];
  kpiData: KPIData;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ campaigns, kpiData }) => {
  const { getBudgetAllocationData, getTopCampaignsByLeads } = useCampaignDataByChannelType(campaigns);
  const { getChannelByName } = useChannels();
  const { t } = useTranslation();

  const budgetAllocationData = getBudgetAllocationData('digital').concat(getBudgetAllocationData('traditional'));
  const topCampaigns = getTopCampaignsByLeads(3);

  // Get underperforming campaigns
  const underperformingCampaigns = campaigns.filter(campaign => {
    // High CPL campaigns
    if (campaign.costPerLead && campaign.costPerLead > 150) return true;
    
    // TV campaigns with GRP shortfall
    if (campaign.channel === 'TV' && 
        campaign.expectedGrps && 
        campaign.achievedGrps &&
        (campaign.achievedGrps / campaign.expectedGrps) < 0.9) return true;
    
    return false;
  }).slice(0, 5);

  const getChannelColor = (channelName: string) => {
    const channel = getChannelByName(channelName);
    return channel?.color || '#6b7280';
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KPICards data={kpiData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Budget Allocation Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📊 Allocazione Budget per Channel
          </h3>
          <BudgetAllocationHorizontalChart data={budgetAllocationData} />
        </div>

        {/* Top Campaigns by Leads */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🏆 Migliori Campaigns per Lead
          </h3>
          {topCampaigns.length > 0 ? (
            <div className="space-y-4">
              {topCampaigns.map((campaign, index) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getChannelColor(campaign.channel) }}
                    ></div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {campaign.brand} - {campaign.channel}
                      </div>
                      <div className="text-sm text-gray-500">
                        {campaign.region} • €{campaign.budget.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-gray-900">
                      {campaign.leads.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">lead</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nessuna campaign con dati lead disponibili</p>
            </div>
          )}
        </div>
      </div>

      {/* Underperforming Campaigns Alert */}
      {underperformingCampaigns.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-500 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900">
                ⚠️ Campaigns con Basse Performance
              </h3>
              <p className="text-sm text-red-700">
                {underperformingCampaigns.length} campaign{underperformingCampaigns.length > 1 ? 's' : ''} che richiedono attenzione
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            {underperformingCampaigns.map((campaign) => {
              const isHighCPL = campaign.costPerLead && campaign.costPerLead > 150;
              const isGRPShortfall = campaign.channel === 'TV' && 
                campaign.expectedGrps && 
                campaign.achievedGrps &&
                (campaign.achievedGrps / campaign.expectedGrps) < 0.9;

              return (
                <div key={campaign.id} className="bg-white p-4 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getChannelColor(campaign.channel) }}
                      ></div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {campaign.brand} - {campaign.channel}
                        </div>
                        <div className="text-sm text-gray-600">
                          {campaign.region} • {campaign.manager}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {isHighCPL && (
                        <div className="flex items-center gap-1 text-red-600">
                          <Target className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            CPL Alto: €{campaign.costPerLead!.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {isGRPShortfall && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <TrendingDown className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Deficit GRP: {((campaign.achievedGrps! / campaign.expectedGrps!) * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};