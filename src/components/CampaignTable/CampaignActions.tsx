import React from 'react';
import { Edit, Copy, Trash2 } from 'lucide-react';
import { Campaign } from '../../types/campaign';

interface CampaignActionsProps {
  campaign: Campaign;
  onEdit: (campaign: Campaign) => void;
  onDuplicate: (campaign: Campaign) => void;
  onDelete: (id: string) => void;
}

export const CampaignActions: React.FC<CampaignActionsProps> = ({
  campaign,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  return (
    <div className="flex space-x-2">
      <button
        onClick={() => onEdit(campaign)}
        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
        title="Edit campaign"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => onDuplicate(campaign)}
        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
        title="Duplicate campaign"
      >
        <Copy className="w-4 h-4" />
      </button>
      <button
        onClick={() => onDelete(campaign.id!)}
        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
        title="Delete campaign"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};