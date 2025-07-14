import React from 'react';
import { Euro, Users, Target, BarChart3, Smartphone, TrendingDown, AlertTriangle, Tv } from 'lucide-react';
import { KPIData } from '../types/campaign';
import { formatBudget } from '../utils/budgetFormatter';
import { useTranslation } from 'react-i18next';

interface KPICardsProps {
  data: KPIData;
}

export const KPICards: React.FC<KPICardsProps> = ({ data }) => {
  const { t } = useTranslation();
  
  const cards = [
    {
      title: 'Budget Totale',
      value: formatBudget(data.totalBudget),
      icon: Euro,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
    },
    {
      title: 'Lead Totali',
      value: data.totalLeads.toLocaleString(),
      icon: Users,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-100',
    },
    {
      title: 'CPL Medio',
      value: `€${data.avgCPL.toFixed(2)}`,
      icon: Target,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-100',
      alert: data.avgCPL > 150 ? 'CPL alto rilevato' : null,
    },
    {
      title: 'Campaigns Attive',
      value: data.totalCampaigns.toString(),
      icon: BarChart3,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100',
    },
    {
      title: 'Budget Social Extra',
      value: formatBudget(data.extraSocialBudget),
      icon: Smartphone,
      color: 'bg-pink-500',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-100',
    },
    {
      title: 'Campaigns con Deficit GRP',
      value: data.grpShortfallCampaigns.toString(),
      icon: TrendingDown,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-100',
      alert: data.grpShortfallCampaigns > 0 ? `${data.grpShortfallCampaigns} campaigns con basse performance` : null,
    },
    {
      title: 'Campaigns con CPL Alto',
      value: data.highCPLCampaigns.toString(),
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-100',
      alert: data.highCPLCampaigns > 0 ? `${data.highCPLCampaigns} campaigns oltre €150 CPL` : null,
    },
    {
      title: 'Efficienza GRP Media',
      value: `${(data.avgGRPEfficiency * 100).toFixed(1)}%`,
      icon: Tv,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
      alert: data.avgGRPEfficiency < 0.9 ? 'Sotto il 90% di efficienza' : null,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`${card.bgColor} p-6 rounded-2xl border ${card.borderColor} transition-all duration-200 hover:shadow-md relative`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                {card.alert && (
                  <div className="flex items-center gap-1 mt-2">
                    <AlertTriangle className="w-3 h-3 text-orange-500" />
                    <p className="text-xs text-orange-600 font-medium">{card.alert}</p>
                  </div>
                )}
              </div>
              <div className={`${card.color} p-3 rounded-xl relative`}>
                <Icon className="w-6 h-6 text-white" />
                {card.alert && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"></div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};