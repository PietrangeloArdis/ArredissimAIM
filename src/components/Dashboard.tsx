import React, { useState, useMemo } from 'react';
import { Campaign, KPIData, GRP_EFFICIENCY_THRESHOLD, HIGH_CPL_THRESHOLD, migrateStatus } from '../types/campaign';
import { DateFilter, DateRange, getDefaultDateRange, isCampaignInDateRange } from './DateFilter';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardEmptyState } from './dashboard/DashboardEmptyState';
import { DashboardCharts } from './dashboard/DashboardCharts';
import { formatBudget } from '../utils/budgetFormatter';
import { AlertTriangle, Calendar, Filter, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { useChannels } from '../hooks/useChannels';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface DashboardProps {
  campaigns: Campaign[];
}

export const Dashboard: React.FC<DashboardProps> = ({ campaigns }) => {
  const { user } = useAuth();
  const { error: firestoreError } = useFirestore();
  const { getActiveChannels } = useChannels();
  const { t } = useTranslation();

  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [channelFilter, setChannelFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const activeChannels = getActiveChannels();

  // Memoized filtered campaigns for performance
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      // Date range filter
      const inDateRange = isCampaignInDateRange(campaign, dateRange);
      
      // Status filter
      const statusMatch = !statusFilter || migrateStatus(campaign.status) === statusFilter;
      
      // Channel filter
      const channelMatch = !channelFilter || campaign.channel === channelFilter;
      
      return inDateRange && statusMatch && channelMatch;
    });
  }, [campaigns, dateRange, statusFilter, channelFilter]);

  // Memoized KPI data calculation
  const kpiData = useMemo((): KPIData => {
    const totalBudget = filteredCampaigns.reduce((sum, campaign) => sum + campaign.budget, 0);
    const totalLeads = filteredCampaigns.reduce((sum, campaign) => sum + campaign.leads, 0);
    const avgCPL = totalLeads > 0 ? totalBudget / totalLeads : 0;
    const totalCampaigns = filteredCampaigns.length;

    const extraSocialBudget = filteredCampaigns
      .filter(campaign => ['Meta', 'TikTok', 'Pinterest'].includes(campaign.channel))
      .reduce((sum, campaign) => sum + (campaign.extraSocialBudget || 0), 0);

    const grpShortfallCampaigns = filteredCampaigns.filter(campaign =>
      campaign.channel === 'TV' &&
      campaign.expectedGrps &&
      campaign.achievedGrps &&
      (campaign.achievedGrps / campaign.expectedGrps) < GRP_EFFICIENCY_THRESHOLD
    ).length;

    const highCPLCampaigns = filteredCampaigns.filter(campaign =>
      campaign.costPerLead && campaign.costPerLead > HIGH_CPL_THRESHOLD
    ).length;

    const tvCampaignsWithGRP = filteredCampaigns.filter(campaign =>
      campaign.channel === 'TV' &&
      campaign.expectedGrps &&
      campaign.achievedGrps &&
      campaign.expectedGrps > 0
    );

    const avgGRPEfficiency =
      tvCampaignsWithGRP.length > 0
        ? tvCampaignsWithGRP.reduce(
            (sum, campaign) =>
              sum + (campaign.achievedGrps! / campaign.expectedGrps!),
            0
          ) / tvCampaignsWithGRP.length
        : 1;

    return {
      totalBudget,
      totalLeads,
      avgCPL,
      totalCampaigns,
      extraSocialBudget,
      grpShortfallCampaigns,
      highCPLCampaigns,
      avgGRPEfficiency
    };
  }, [filteredCampaigns]);

  // Get unique statuses for filter
  const availableStatuses = useMemo(() => {
    const statuses = [...new Set(campaigns.map(c => migrateStatus(c.status)))];
    return statuses.sort();
  }, [campaigns]);

  const clearFilters = () => {
    setStatusFilter('');
    setChannelFilter('');
    setDateRange(getDefaultDateRange());
  };

  const hasActiveFilters = statusFilter || channelFilter || dateRange.preset !== 'last-30-days';

  return (
    <div className="space-y-6">
      <DashboardHeader
        user={user}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        firestoreError={firestoreError}
      />

      {firestoreError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-900">
                Problema di Connessione Database
              </h3>
              <p className="text-sm text-yellow-700">
                {firestoreError}. Visualizzazione dati demo. Le modifiche non saranno salvate.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtri Avanzati</span>
            {hasActiveFilters && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Filtri attivi
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Cancella filtri
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              {showFilters ? 'Nascondi' : 'Mostra'} filtri
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status Campaign
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tutti gli status</option>
                {availableStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Channel
              </label>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tutti i channel</option>
                {activeChannels.map(channel => (
                  <option key={channel.id} value={channel.name}>{channel.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intervallo Date
              </label>
              <DateFilter
                value={dateRange}
                onChange={setDateRange}
                showQuickPresets={false}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {filteredCampaigns.length === 0 ? (
        <DashboardEmptyState
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          campaignCount={campaigns.length}
        />
      ) : (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">
                    📊 Visualizzazione dati per: {dateRange.label}
                  </h3>
                  <p className="text-sm text-blue-700">
                    {filteredCampaigns.length} campaigns • {formatBudget(kpiData.totalBudget)} budget totale • {kpiData.totalLeads.toLocaleString()} lead
                    {hasActiveFilters && (
                      <span className="ml-2 text-blue-600 font-medium">
                        (filtrato da {campaigns.length} campaigns totali)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-600">
                  {format(new Date(dateRange.startDate), 'dd/MM/yyyy', { locale: it })} - {format(new Date(dateRange.endDate), 'dd/MM/yyyy', { locale: it })}
                </div>
                <div className="text-xs text-blue-500">
                  {dateRange.preset === 'custom' ? 'Intervallo Personalizzato' : 
                   dateRange.preset === 'specific-month' ? 'Mese Specifico' :
                   dateRange.preset === 'month-range' ? 'Intervallo di Mesi' :
                   `${dateRange.preset.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
                </div>
              </div>
            </div>
          </div>

          <DashboardCharts
            filteredCampaigns={filteredCampaigns}
            kpiData={kpiData}
            dateRange={dateRange}
          />
        </>
      )}
    </div>
  );
};