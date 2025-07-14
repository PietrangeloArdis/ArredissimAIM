import React from 'react';
import { BarChart3, Building2, Users, Calendar } from 'lucide-react';

interface CampaignsSummaryProps {
  channelGroupsCount: number;
  totalBudget: number;
  totalLeads: number;
  avgCPL: number;
  viewMode: 'grouped' | 'table';
}

export const CampaignsSummary: React.FC<CampaignsSummaryProps> = ({
  channelGroupsCount,
  totalBudget,
  totalLeads,
  avgCPL,
  viewMode,
}) => {
  if (viewMode !== 'grouped' || channelGroupsCount === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Active Channels</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{channelGroupsCount}</p>
          </div>
          <div className="bg-blue-500 p-3 rounded-xl">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-600">Total Budget</p>
            <p className="text-2xl font-bold text-green-900 mt-1">€{totalBudget.toLocaleString()}</p>
          </div>
          <div className="bg-green-500 p-3 rounded-xl">
            <Building2 className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-600">Total Leads</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">{totalLeads.toLocaleString()}</p>
          </div>
          <div className="bg-purple-500 p-3 rounded-xl">
            <Users className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-orange-600">Avg CPL</p>
            <p className="text-2xl font-bold text-orange-900 mt-1">€{avgCPL.toFixed(2)}</p>
          </div>
          <div className="bg-orange-500 p-3 rounded-xl">
            <Calendar className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};