import React from 'react';
import { Plus, BarChart3, Filter, X } from 'lucide-react';

interface CampaignsHeaderProps {
  filteredCampaignsCount: number;
  totalCampaignsCount: number;
  totalBudget: number;
  totalLeads: number;
  viewMode: 'grouped' | 'table';
  onViewModeChange: (mode: 'grouped' | 'table') => void;
  onAddCampaign: () => void;
}

export const CampaignsHeader: React.FC<CampaignsHeaderProps> = ({
  filteredCampaignsCount,
  totalCampaignsCount,
  totalBudget,
  totalLeads,
  viewMode,
  onViewModeChange,
  onAddCampaign,
}) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">All Campaigns</h2>
        <p className="text-gray-600 mt-1">
          {filteredCampaignsCount} campaigns • €{(totalBudget / 1000).toFixed(0)}k total budget • {totalLeads.toLocaleString()} leads
        </p>
      </div>
      <div className="flex items-center gap-3">
        {/* View Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('grouped')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'grouped'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Grouped
          </button>
          <button
            onClick={() => onViewModeChange('table')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Table
          </button>
        </div>

        <button
          onClick={onAddCampaign}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Campaign
        </button>
      </div>
    </div>
  );
};