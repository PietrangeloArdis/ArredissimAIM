import React, { useState, useMemo } from 'react';
import { Calendar, Plus, Target, TrendingUp, BarChart3, Edit } from 'lucide-react';
import { Campaign, formatMetric, getChannelMetrics } from '../types/campaign';
import { CampaignForm } from './CampaignForm';
import { DateFilter, DateRange, getDefaultDateRange, isCampaignInDateRange } from './DateFilter';
import { generatePeriodOptions, isCampaignInPeriod } from '../utils/dateHelpers';
import { useChannels } from '../hooks/useChannels';
import { useTranslation } from 'react-i18next';

interface PlannerProps {
  campaigns: Campaign[];
  onAdd: (campaign: Omit<Campaign, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Campaign>) => void;
}

type ViewType = 'monthly' | 'quarterly' | 'custom';

export const Planner: React.FC<PlannerProps> = ({ campaigns, onAdd, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [viewType, setViewType] = useState<ViewType>('quarterly');
  const [selectedPeriod, setSelectedPeriod] = useState('Q2 2025');
  const [customDateRange, setCustomDateRange] = useState<DateRange>(getDefaultDateRange());
  const { getChannelByName } = useChannels();
  const { t } = useTranslation();

  const { quarters, months } = generatePeriodOptions(2025);
  const periodOptions = viewType === 'quarterly' ? quarters : months;

  // Filter campaigns based on selected period and view type
  const filteredCampaigns = useMemo(() => {
    if (viewType === 'custom') {
      return campaigns.filter(campaign => 
        isCampaignInDateRange(campaign, customDateRange)
      );
    }
    
    return campaigns.filter(campaign => 
      isCampaignInPeriod(campaign, selectedPeriod, viewType)
    );
  }, [campaigns, selectedPeriod, viewType, customDateRange]);

  const plannedCampaigns = filteredCampaigns.filter(c => c.status === 'PLANNED');
  const confirmedCampaigns = filteredCampaigns.filter(c => c.status !== 'PLANNED');

  const quarterlyBudget = plannedCampaigns.reduce((sum, c) => sum + c.budget, 0);
  const confirmedBudget = confirmedCampaigns.reduce((sum, c) => sum + c.budget, 0);

  const budgetByChannel = filteredCampaigns.reduce((acc, campaign) => {
    acc[campaign.channel] = (acc[campaign.channel] || 0) + campaign.budget;
    return acc;
  }, {} as Record<string, number>);

  const getChannelColor = (channelName: string) => {
    const channel = getChannelByName(channelName);
    return channel?.color || '#6b7280';
  };

  const getChannelIcon = (channelName: string) => {
    const channel = getChannelByName(channelName);
    return channel?.icon || 'Zap';
  };

  const handleFormSubmit = (campaignData: Omit<Campaign, 'id'>) => {
    if (editingCampaign) {
      onUpdate(editingCampaign.id!, campaignData);
    } else {
      onAdd({ ...campaignData, status: 'PLANNED' });
    }
    setShowForm(false);
    setEditingCampaign(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCampaign(null);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setShowForm(true);
  };

  const handleViewTypeChange = (newViewType: ViewType) => {
    setViewType(newViewType);
    // Auto-select appropriate default period
    if (newViewType === 'quarterly') {
      setSelectedPeriod('Q2 2025');
    } else if (newViewType === 'monthly') {
      setSelectedPeriod('February 2025');
    }
    // For custom, we keep the existing customDateRange
  };

  const formatCampaignMetrics = (campaign: Campaign) => {
    const metrics = getChannelMetrics(campaign);
    
    if (metrics.length === 0) {
      return `${campaign.leads.toLocaleString()} lead`;
    }

    return metrics.slice(0, 2).map(metric => 
      `${metric.icon || ''} ${metric.value} ${metric.label.split(' ')[0]}`
    ).join(', ');
  };

  const renderChannelBadge = (channelName: string) => {
    const channel = getChannelByName(channelName);
    if (!channel) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          {channelName}
        </span>
      );
    }

    return (
      <span 
        className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full text-white"
        style={{ backgroundColor: channel.color }}
      >
        <span className="mr-1">{channel.icon === 'Facebook' ? '📘' : 
                                channel.icon === 'Search' ? '🔍' : 
                                channel.icon === 'Music' ? '🎵' : 
                                channel.icon === 'Image' ? '📷' : 
                                channel.icon === 'Tv' ? '📺' : 
                                channel.icon === 'Radio' ? '📻' : '⚡'}</span>
        {channelName}
      </span>
    );
  };

  const getCurrentPeriodLabel = () => {
    if (viewType === 'custom') {
      return customDateRange.label;
    }
    return selectedPeriod;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Campaign Planner</h2>
          <p className="text-gray-600 mt-1">Pianifica e alloca i budget marketing futuri</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Enhanced View Type Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleViewTypeChange('quarterly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewType === 'quarterly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Trimestrale
            </button>
            <button
              onClick={() => handleViewTypeChange('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewType === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📅 Mensile
            </button>
            <button
              onClick={() => handleViewTypeChange('custom')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewType === 'custom'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎯 Personalizzato
            </button>
          </div>

          {/* Period/Date Range Selector */}
          {viewType === 'custom' ? (
            <DateFilter
              value={customDateRange}
              onChange={setCustomDateRange}
              showQuickPresets={false}
              className="min-w-[200px]"
            />
          ) : (
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white min-w-[140px]"
            >
              {periodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Pianifica Campaign
          </button>
        </div>
      </div>

      {/* Enhanced Period Summary */}
      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-blue-900">
            📋 Panoramica Pianificazione: {getCurrentPeriodLabel()}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
          <div className="text-sm text-blue-700">
            <span className="font-medium">📊 Totale Campaigns:</span> {filteredCampaigns.length}
          </div>
          <div className="text-sm text-blue-700">
            <span className="font-medium">📝 Pianificate:</span> {plannedCampaigns.length} campaigns
          </div>
          <div className="text-sm text-blue-700">
            <span className="font-medium">✅ Confermate:</span> {confirmedCampaigns.length} campaigns
          </div>
        </div>
        
        {viewType === 'custom' && (
          <div className="mt-2 p-2 bg-blue-100 rounded-lg">
            <div className="text-xs text-blue-600 font-medium">
              🎯 Intervallo Personalizzato: {new Date(customDateRange.startDate).toLocaleDateString()} - {new Date(customDateRange.endDate).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Budget Pianificato</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                €{quarterlyBudget.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-500 p-3 rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Budget Confermato</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                €{confirmedBudget.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-xl">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Allocazione Totale</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                €{(quarterlyBudget + confirmedBudget).toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-500 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Campaigns Attive</p>
              <p className="text-2xl font-bold text-orange-900 mt-1">
                {filteredCampaigns.length}
              </p>
            </div>
            <div className="bg-orange-500 p-3 rounded-xl">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Channel Budget Allocation */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Allocazione Budget per Channel - {getCurrentPeriodLabel()}
        </h3>
        {Object.keys(budgetByChannel).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(budgetByChannel).map(([channelName, budget]) => {
              const percentage = ((budget / (quarterlyBudget + confirmedBudget)) * 100).toFixed(1);
              const channelColor = getChannelColor(channelName);
              
              return (
                <div key={channelName} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: channelColor }}
                    ></div>
                    <span className="font-medium text-gray-900">{channelName}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: channelColor
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-16 text-right">
                      €{(budget / 1000).toFixed(0)}k
                    </span>
                    <span className="text-sm text-gray-500 w-12 text-right">
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nessuna campaign trovata per {getCurrentPeriodLabel()}</p>
            <p className="text-sm">Crea una nuova campaign per vedere l'allocazione del budget</p>
          </div>
        )}
      </div>

      {/* Planned Campaigns Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Panoramica Campaign - {getCurrentPeriodLabel()}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {plannedCampaigns.length} campaigns pianificate, {confirmedCampaigns.length} campaigns confermate
            {viewType === 'custom' && (
              <span className="ml-2 text-blue-600 font-medium">
                (Intervallo personalizzato: {customDateRange.preset === 'custom' ? 'Pianificazione ad-hoc' : customDateRange.label})
              </span>
            )}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periodo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metriche Previste</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCampaigns.length > 0 ? (
                filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {campaign.brand}
                          </span>
                          {renderChannelBadge(campaign.channel)}
                        </div>
                        <div className="text-sm text-gray-500">{campaign.region}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">{campaign.periodType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      €{campaign.budget.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCampaignMetrics(campaign)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.manager}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        campaign.status === 'PLANNED' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : campaign.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {campaign.status === 'PLANNED' ? '📝 Da confermare' : 
                         campaign.status === 'ACTIVE' ? '🟢 Attiva' : 
                         campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(campaign)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Modifica campaign"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">Nessuna campaign per {getCurrentPeriodLabel()}</p>
                    <p className="text-sm">
                      {viewType === 'custom' 
                        ? 'Crea una nuova campaign per il tuo intervallo di date personalizzato'
                        : 'Crea una nuova campaign per iniziare'
                      }
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <CampaignForm
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          initialData={editingCampaign || { status: 'PLANNED' }}
        />
      )}
    </div>
  );
};