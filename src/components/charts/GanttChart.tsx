import React, { useMemo } from 'react';
import { Campaign } from '../../types/campaign';
import { useChannels } from '../../hooks/useChannels';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { it } from 'date-fns/locale';
import { formatBudgetCompact } from '../../utils/budgetFormatter';

interface GanttChartProps {
  campaigns: Campaign[];
}

export const GanttChart: React.FC<GanttChartProps> = ({ campaigns }) => {
  const { getChannelByName, getActiveChannels } = useChannels();
  
  // Utilizziamo solo i canali attivi per le righe del Gantt
  const activeChannels = getActiveChannels();

  // 1. Calcola l'intervallo di mesi basandosi su tutte le campagne
  const months = useMemo(() => {
    if (campaigns.length === 0) {
      const now = new Date();
      return eachMonthOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });
    }
    
    const allDates = campaigns.flatMap(c => [new Date(c.startDate), new Date(c.endDate)]);
    const chartStartDate = startOfMonth(new Date(Math.min(...allDates.map(d => d.getTime()))));
    const chartEndDate = endOfMonth(new Date(Math.max(...allDates.map(d => d.getTime()))));
    
    return eachMonthOfInterval({ start: chartStartDate, end: chartEndDate });
  }, [campaigns]);

  // 2. Funzione per calcolare il budget totale di un canale in un dato mese
  const getMonthlyBudgetData = (channelName: string, month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const budget = campaigns
      .filter(c => {
        const campaignStart = new Date(c.startDate);
        const campaignEnd = new Date(c.endDate);
        // La campagna deve essere del canale giusto e il suo intervallo deve sovrapporsi al mese corrente
        return c.channel === channelName && campaignStart <= monthEnd && campaignEnd >= monthStart;
      })
      .reduce((sum, c) => sum + c.budget, 0); // Somma i budget di tutte le campagne che corrispondono
      
    return budget;
  };

  if (campaigns.length === 0) {
    return <div className="text-center py-10 text-gray-500">Nessuna campagna da visualizzare.</div>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="relative" style={{ minWidth: `${months.length * 130}px` }}>
        {/* Intestazione fissa con i Mesi */}
        <div className="sticky top-0 z-10 flex bg-gray-50 border-b-2 border-gray-200">
          <div className="w-48 flex-shrink-0 border-r border-gray-200 p-2 font-semibold text-sm text-gray-600">Canale</div>
          {months.map((month, index) => (
            <div key={index} className="flex-1 p-2 text-center font-semibold text-sm text-gray-600 capitalize" style={{ minWidth: '130px' }}>
              {format(month, 'MMMM yyyy', { locale: it })}
            </div>
          ))}
        </div>

        {/* Griglia verticale per leggibilità */}
        <div className="absolute top-0 left-48 h-full flex pointer-events-none">
          {months.map((_, index) => (
            <div key={index} className="flex-1 border-r border-gray-100" style={{ minWidth: '130px' }}></div>
          ))}
        </div>

        {/* Righe del Gantt per ogni canale */}
        <div className="relative">
          {activeChannels.map((channel) => {
            const channelInfo = getChannelByName(channel.name);
            return (
              <div key={channel.name} className="flex h-12 border-b border-gray-100">
                {/* Nome del Canale fisso a sinistra */}
                <div className="w-48 flex-shrink-0 border-r border-gray-200 p-2 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channelInfo?.color || '#ccc' }}></div>
                  <span className="font-bold text-sm text-gray-800">{channel.name}</span>
                </div>

                {/* Celle mensili */}
                <div className="flex-1 flex">
                  {months.map((month, monthIndex) => {
                    const budget = getMonthlyBudgetData(channel.name, month);
                    // Se non c'è budget, la cella rimane vuota (nessuna campagna attiva)
                    if (budget === 0) {
                      return <div key={monthIndex} className="flex-1" style={{ minWidth: '130px' }}></div>;
                    }
                    // Se c'è budget, mostra la barra colorata con l'importo
                    return (
                      <div key={monthIndex} className="flex-1 p-1" style={{ minWidth: '130px' }}>
                        <div
                          className="w-full h-full rounded-md flex items-center justify-center px-2 group relative"
                          style={{ backgroundColor: `${channelInfo?.color || '#ccc'}33` }} // Usa il colore del canale con trasparenza
                        >
                          <p className="text-sm font-semibold truncate" style={{color: channelInfo?.color || '#333'}}>
                            {formatBudgetCompact(budget)}
                          </p>
                           {/* Tooltip per vedere il budget esatto */}
                           <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-max p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                              Budget: €{budget.toLocaleString('it-IT')}
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
  );
};