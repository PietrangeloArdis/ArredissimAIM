import React, { useMemo, useState } from 'react';
import { Campaign } from '../../types/campaign';
import { useChannels } from '../../hooks/useChannels';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, differenceInDays, max, min } from 'date-fns';
import { it } from 'date-fns/locale';
import { formatBudgetCompact, formatBudget } from '../../utils/budgetFormatter';

interface GanttChartProps {
  campaigns: Campaign[];
}

export const GanttChart: React.FC<GanttChartProps> = ({ campaigns }) => {
  const { getChannelByName, getActiveChannels } = useChannels();
  const activeChannels = getActiveChannels();

  // 1. STATO PER L'ANNO SELEZIONATO
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // 2. CALCOLA GLI ANNI DISPONIBILI DAI DATI DELLE CAMPAGNE
  const availableYears = useMemo(() => {
    if (campaigns.length === 0) return [new Date().getFullYear()];
    const years = new Set(campaigns.map(c => new Date(c.startDate).getFullYear()));
    return Array.from(years).sort((a, b) => b - a); // Ordina dal più recente al più vecchio
  }, [campaigns]);

  // 3. FILTRA LE CAMPAGNE IN BASE ALL'ANNO SELEZIONATO
  const yearlyCampaigns = useMemo(() => {
    return campaigns.filter(c => new Date(c.startDate).getFullYear() === selectedYear);
  }, [campaigns, selectedYear]);

  // I mesi ora sono sempre 12, per l'anno selezionato
  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => new Date(selectedYear, i, 1));
  }, [selectedYear]);

  const getProratedMonthlyBudget = (channelName: string, month: Date): number => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    let totalChannelBudgetInMonth = 0;

    const channelCampaigns = yearlyCampaigns.filter(c => c.channel === channelName);

    for (const campaign of channelCampaigns) {
      const campaignStart = new Date(campaign.startDate);
      const campaignEnd = new Date(campaign.endDate);
      if (campaignStart > monthEnd || campaignEnd < monthStart) continue;

      const totalCampaignDays = differenceInDays(campaignEnd, campaignStart) + 1;
      if (totalCampaignDays <= 0) continue;

      const dailyBudget = campaign.budget / totalCampaignDays;
      const effectiveStartDate = max([campaignStart, monthStart]);
      const effectiveEndDate = min([campaignEnd, monthEnd]);
      const activeDaysInMonth = differenceInDays(effectiveEndDate, effectiveStartDate) + 1;
      
      if (activeDaysInMonth > 0) {
        totalChannelBudgetInMonth += dailyBudget * activeDaysInMonth;
      }
    }
    return totalChannelBudgetInMonth;
  };
  
  const getTotalChannelBudget = (channelName: string) => {
    // Calcola il budget totale solo per le campagne dell'anno selezionato
    return yearlyCampaigns
      .filter(c => c.channel === channelName)
      .reduce((sum, c) => sum + c.budget, 0);
  };

  if (campaigns.length === 0) {
    return <div className="text-center py-10 text-gray-500">Nessuna campagna da visualizzare.</div>;
  }

  return (
    // Aggiungiamo un contenitore per il selettore e il grafico
    <div className="space-y-4">
        {/* 4. SELETTORE PER L'ANNO */}
        <div className="flex items-center gap-2">
            <label htmlFor="year-selector" className="text-sm font-medium text-gray-700">Anno di riferimento:</label>
            <select
                id="year-selector"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
                {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                ))}
            </select>
        </div>

        <div className="w-full overflow-x-auto">
          <div className="relative" style={{ minWidth: `${months.length * 100}px` }}>
            <div className="sticky top-0 z-10 flex bg-gray-50 border-b-2 border-gray-200">
              <div className="w-48 flex-shrink-0 border-r border-gray-200 p-2 font-semibold text-sm text-gray-600">Canale</div>
              {months.map((month, index) => (
                // 5. LARGHEZZA COLONNA RIDOTTA
                <div key={index} className="flex-1 p-2 text-center font-semibold text-sm text-gray-600 capitalize" style={{ minWidth: '100px' }}>
                  {format(month, 'MMMM', { locale: it })}
                </div>
              ))}
            </div>

            <div className="absolute top-0 left-48 h-full flex pointer-events-none">
              {months.map((_, index) => (
                <div key={index} className="flex-1 border-r border-gray-100" style={{ minWidth: '100px' }}></div>
              ))}
            </div>

            <div className="relative">
              {activeChannels.map((channel) => {
                const channelInfo = getChannelByName(channel.name);
                const totalBudget = getTotalChannelBudget(channel.name); 

                return (
                  <div key={channel.name} className="flex h-12 border-b border-gray-100">
                    <div className="w-48 flex-shrink-0 border-r border-gray-200 p-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channelInfo?.color || '#ccc' }}></div>
                        <span className="font-bold text-sm text-gray-800">{channel.name}</span>
                      </div>
                      {totalBudget > 0 && (
                        <span className="text-xs font-semibold text-gray-500">{formatBudget(totalBudget)}</span>
                      )}
                    </div>
                    
                    <div className="flex-1 flex">
                      {months.map((month, monthIndex) => {
                        const budget = getProratedMonthlyBudget(channel.name, month);
                        if (budget < 1) {
                          return <div key={monthIndex} className="flex-1" style={{ minWidth: '100px' }}></div>;
                        }
                        return (
                          <div key={monthIndex} className="flex-1 p-1" style={{ minWidth: '100px' }}>
                            <div className="w-full h-full rounded-md flex items-center justify-center px-2 group relative" style={{ backgroundColor: `${channelInfo?.color || '#ccc'}33` }}>
                              <p className="text-sm font-semibold truncate" style={{color: channelInfo?.color || '#333'}}>{formatBudgetCompact(budget)}</p>
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-max p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                  Budget Ripartito: €{Math.round(budget).toLocaleString('it-IT')}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
    </div>
  );
};