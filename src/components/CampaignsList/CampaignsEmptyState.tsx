import React from 'react';
import { BarChart3 } from 'lucide-react';

interface CampaignsEmptyStateProps {
  campaignCount: number;
  filteredCount: number;
}

export const CampaignsEmptyState: React.FC<CampaignsEmptyStateProps> = ({
  campaignCount,
  filteredCount,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
      <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
      <p className="text-lg font-medium text-gray-900">No campaigns found</p>
      <p className="text-sm text-gray-500">
        {campaignCount === 0 
          ? 'Create your first campaign to get started'
          : 'Try adjusting your search or filter criteria'
        }
      </p>
    </div>
  );
};