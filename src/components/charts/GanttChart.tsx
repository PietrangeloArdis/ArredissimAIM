import React, { useMemo } from 'react';
import { Campaign } from '../../types/campaign';
import { useChannels } from '../../hooks/useChannels';
import { format, differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { it } from 'date-fns/locale';

interface GanttChartProps {
  campaigns: Campaign[];
}

export const GanttChart: React.FC<GanttChartProps> = ({ campaigns }) => {
  const { getChannelByName } = useChannels();

  // 1. Calcola l'intervallo di date totale per il grafico
  const { startDate, endDate, totalDays, months } = useMemo(() => {
    if (campaigns.length === 0) {
      const now = new Date();
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
        totalDays: 30,
        months: [now],
      };
    }

    const allDates = campaigns.flatMap(c => [new Date(c.startDate), new Date(c.endDate)]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    const chartStartDate = startOfMonth(minDate);
    const chartEndDate = endOfMonth(maxDate);

    return {
      startDate: chartStartDate,
      endDate: chartEndDate,
      totalDays: differenceInDays(chartEndDate, chartStartDate) + 1,
      months: eachMonthOfInterval({ start: chartStartDate, end: chartEndDate }),
    };
  }, [campaigns]);

  // 2. Raggruppa le campagne per canale
  const campaignsByChannel = useMemo(() => {
    const grouped: { [key: string]: Campaign[] } = {};
    campaigns.forEach(campaign => {
      if (!grouped[campaign.channel]) {
        grouped[campaign.channel] = [];
      }
      grouped[campaign.channel].push(campaign);
    });
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [campaigns]);

  if (campaigns.length === 0) {
    return <div className="text-center py-10 text-gray-500">Nessuna campagna da visualizzare nel planner.</div>;
  }

  return (
    <div className="w-full overflow-x-auto bg-white p-4 rounded-lg border border-gray-200">
      <div className="relative" style={{ minWidth: `${months.length * 150}px` }}>
        {/* Intestazione con i mesi */}
        <div className="sticky top-0 z-10 flex bg-gray-100 border-b-2 border-gray-200">
          <div className="w-48 flex-shrink-0 border-r border-gray-200 p-2 font-semibold text-sm text-gray-600">Canale</div>
          {months.map((month, index) => (
            <div key={index} className="flex-1 p-2 text-center font-semibold text-sm text-gray-600 capitalize" style={{ minWidth: '150px' }}>
              {format(month, 'MMMM yyyy', { locale: it })}
            </div>
          ))}
        </div>

        {/* Griglia verticale per i mesi */}
        <div className="absolute top-0 left-48 h-full flex pointer-events-none">
          {months.map((_, index) => (
            <div key={index} className="flex-1 border-r border-gray-100" style={{ minWidth: '150px' }}></div>
          ))}
        </div>

        {/* Righe del Gantt */}
        <div className="relative">
          {campaignsByChannel.map(([channelName, channelCampaigns], index) => {
            const channelInfo = getChannelByName(channelName);
            return (
              <div key={channelName} className={`flex border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                <div className="w-48 flex-shrink-0 border-r border-gray-200 p-2 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channelInfo?.color || '#ccc' }}></div>
                  <span className="font-bold text-sm text-gray-800">{channelName}</span>
                </div>
                <div className="relative flex-1 h-12">
                  {channelCampaigns.map(campaign => {
                    const campaignStart = new Date(campaign.startDate);
                    const campaignEnd = new Date(campaign.endDate);
                    
                    // Calcola posizione e larghezza della barra
                    const left = (differenceInDays(campaignStart, startDate) / totalDays) * 100;
                    const width = (differenceInDays(campaignEnd, campaignStart) / totalDays) * 100;

                    return (
                      <div
                        key={campaign.id}
                        className="absolute h-8 top-2 rounded-md flex items-center px-2 cursor-pointer group"
                        style={{
                          left: `${Math.max(0, left)}%`,
                          width: `${Math.max(1, width)}%`, // Larghezza minima per visibilità
                          backgroundColor: `${channelInfo?.color || '#ccc'}dd`, // Colore con trasparenza
                          border: `1px solid ${channelInfo?.color || '#ccc'}`
                        }}
                      >
                        <p className="text-xs font-medium text-white truncate">
                          {campaign.brand} - {campaign.region}
                        </p>
                        {/* Tooltip che appare al passaggio del mouse */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                          <strong>{campaign.brand} - {campaign.region}</strong>
                          <div>Periodo: {format(campaignStart, 'dd/MM/yy')} - {format(campaignEnd, 'dd/MM/yy')}</div>
                          <div>Budget: €{campaign.budget.toLocaleString()}</div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
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
  );
};