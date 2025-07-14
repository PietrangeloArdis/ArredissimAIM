import React from 'react';
import { Calendar, BarChart3 } from 'lucide-react';
import { DateFilter, DateRange, getDefaultDateRange } from '../DateFilter';
import { useTranslation } from 'react-i18next';

interface DashboardEmptyStateProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  campaignCount?: number;
}

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  dateRange,
  onDateRangeChange,
  campaignCount = 0
}) => {
  const { t } = useTranslation();
  
  const handleResetToDefault = () => {
    onDateRangeChange(getDefaultDateRange());
  };

  return (
    <div className="space-y-6">
      {/* Active Filter Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-lg">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900">
              📅 Visualizzazione dati per: {dateRange.label}
            </h3>
            <p className="text-sm text-blue-700">
              Intervallo date: {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* No Data Message */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Nessuna campaign trovata per il periodo selezionato
        </h2>
        <p className="text-gray-600 mb-6">
          {campaignCount === 0 
            ? 'Non esistono ancora campaigns nel sistema. Crea la tua prima campaign per iniziare.'
            : 'Prova a modificare l\'intervallo di date per includere periodi con attività di campaign.'
          }
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleResetToDefault}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Reimposta a Ultimi 30 Giorni
          </button>
          <DateFilter
            value={dateRange}
            onChange={onDateRangeChange}
            className="min-w-[200px]"
            showQuickPresets={true}
          />
        </div>
      </div>
    </div>
  );
};