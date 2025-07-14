import React, { useState, useEffect } from 'react';
import { X, Copy, Calendar, Users, FileText, Settings, AlertTriangle, Info, CheckCircle, Loader2, Target } from 'lucide-react';
import { useDuplicateBrandCampaigns } from '../hooks/useDuplicateBrandCampaigns';
import { useManagers } from '../hooks/useManagers';
import { useFirestore } from '../hooks/useFirestore';
import { Status, STATUS_CONFIG } from '../types/campaign';

interface BrandCampaignBulkDuplicateModalProps {
  brand: string;
  channel: string;
  onClose: () => void;
}

export const BrandCampaignBulkDuplicateModal: React.FC<BrandCampaignBulkDuplicateModalProps> = ({
  brand,
  channel,
  onClose,
}) => {
  const { duplicateCampaignsByBrand, loading, error } = useDuplicateBrandCampaigns();
  const { getActiveManagers } = useManagers();
  const { campaigns } = useFirestore();
  
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    manager: '',
    notes: '',
    setAllToPlanned: false,
    customStatus: 'auto' as 'auto' | Status, // New field for custom status override
  });
  
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [duplicatedCount, setDuplicatedCount] = useState(0);

  const activeManagers = getActiveManagers();
  
  // Filter campaigns by BOTH brand AND channel
  const brandChannelCampaigns = campaigns.filter(c => c.brand === brand && c.channel === channel);

  // Available status options for the dropdown
  const statusOptions: Array<{ value: 'auto' | Status; label: string; description: string }> = [
    { value: 'auto', label: 'Auto (based on dates)', description: 'Automatically assign status based on date range' },
    { value: 'PLANNED', label: '📝 Planned', description: 'Campaign is created but not yet started' },
    { value: 'SCHEDULED', label: '📅 Scheduled', description: 'Dates and data are loaded, ready to launch' },
    { value: 'ACTIVE', label: '🟢 Active', description: 'Campaign is currently running' },
    { value: 'COMPLETED', label: '✅ Completed', description: 'Campaign has ended successfully' },
  ];

  // Set default dates (next month)
  useEffect(() => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate() + 30);
    
    setFormData(prev => ({
      ...prev,
      startDate: nextMonth.toISOString().split('T')[0],
      endDate: endOfNextMonth.toISOString().split('T')[0],
    }));
  }, []);

  // Validation
  useEffect(() => {
    setValidationError(null);

    if (!formData.startDate || !formData.endDate) {
      setValidationError('Start and end dates are required.');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setValidationError('Start date must be before end date.');
      return;
    }

    // Validate SCHEDULED status requires proper dates
    if (formData.customStatus === 'SCHEDULED') {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (!start || !end) {
        setValidationError('SCHEDULED status requires valid start and end dates.');
        return;
      }
    }

    if (brandChannelCampaigns.length === 0) {
      setValidationError(`No campaigns found for brand "${brand}" in the ${channel} channel.`);
      return;
    }
  }, [formData.startDate, formData.endDate, formData.customStatus, brandChannelCampaigns.length, brand, channel]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDuplicate = async () => {
    if (validationError) return;

    try {
      const result = await duplicateCampaignsByBrand(brand, channel, {
        startDate: formData.startDate,
        endDate: formData.endDate,
        manager: formData.manager || undefined,
        notes: formData.notes || undefined,
        setAllToPlanned: formData.setAllToPlanned,
        customStatus: formData.customStatus !== 'auto' ? formData.customStatus : undefined, // Pass custom status
      });

      setDuplicatedCount(result.duplicatedCount);
      setShowSuccess(true);

      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Duplication failed:', error);
      // Error is handled by the hook
    }
  };

  const getStatusPreview = () => {
    if (!formData.startDate || !formData.endDate) return 'PLANNED';
    
    // Priority 1: Custom status override
    if (formData.customStatus !== 'auto') {
      return formData.customStatus;
    }
    
    // Priority 2: Set all to planned checkbox
    if (formData.setAllToPlanned) {
      return 'PLANNED';
    }
    
    // Priority 3: Automatic date-based logic
    const now = new Date();
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    
    now.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (now < start) return 'PLANNED';
    if (now >= start && now <= end) return 'ACTIVE';
    if (now > end) return 'COMPLETED';
    
    return 'PLANNED';
  };

  const statusPreview = getStatusPreview();
  const statusConfig = STATUS_CONFIG[statusPreview];

  // Get channel emoji for visual enhancement
  const getChannelEmoji = (channelName: string) => {
    const emojiMap: { [key: string]: string } = {
      'Meta': '📘',
      'Google': '🔍',
      'TikTok': '🎵',
      'Pinterest': '📷',
      'TV': '📺',
      'Radio': '📻',
      'Cinema': '🎬',
      'DOOH': '🖥️',
      'LinkedIn': '💼',
      'YouTube': '📹',
    };
    return emojiMap[channelName] || '📊';
  };

  const getStatusPreviewDescription = () => {
    if (formData.customStatus !== 'auto') {
      return `Custom status override: ${statusConfig.label}`;
    }
    if (formData.setAllToPlanned) {
      return 'All campaigns will be set to PLANNED status (checkbox override)';
    }
    return 'Status will be automatically assigned based on the selected dates';
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md text-center">
          <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            🎉 Duplication Successful!
          </h3>
          <p className="text-gray-600 mb-4">
            Successfully duplicated {duplicatedCount} <strong>{channel}</strong> campaigns for <strong>{brand}</strong>
          </p>
          <div className="text-sm text-gray-500">
            Closing automatically...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Copy className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bulk Duplicate Brand Campaigns</h2>
              <p className="text-sm text-gray-600">
                Duplicate <strong>{brand}</strong> campaigns in <strong>{channel}</strong> {getChannelEmoji(channel)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Campaign Preview */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-700 mb-2">
            📋 {channel} Campaigns to Duplicate
          </h3>
          <div className="text-lg font-semibold text-blue-900 mb-2">
            {brandChannelCampaigns.length} {channel} campaigns found for {brand} {getChannelEmoji(channel)}
          </div>
          {brandChannelCampaigns.length > 0 ? (
            <div className="space-y-1">
              {brandChannelCampaigns.slice(0, 3).map((campaign, index) => (
                <div key={campaign.id} className="text-sm text-blue-700">
                  • {campaign.brand} - {campaign.channel} ({campaign.region})
                </div>
              ))}
              {brandChannelCampaigns.length > 3 && (
                <div className="text-sm text-blue-600 font-medium">
                  ... and {brandChannelCampaigns.length - 3} more {channel} campaigns
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-blue-700">
              No campaigns found for this brand in the {channel} channel.
            </div>
          )}
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Validation Error</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{validationError}</p>
          </div>
        )}

        {/* API Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Duplication Error</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Date Configuration */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">New Date Range</h3>
              <span className="text-red-500">*</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Status Configuration */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Status Configuration</h3>
            </div>
            
            <div className="space-y-4">
              {/* Custom Status Override Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Override Campaign Status
                  <span className="text-xs text-gray-500 ml-1">(Optional)</span>
                </label>
                <select
                  name="customStatus"
                  value={formData.customStatus}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {statusOptions.find(opt => opt.value === formData.customStatus)?.description}
                </p>
              </div>

              {/* Legacy "Set all to PLANNED" checkbox - now secondary to custom status */}
              {formData.customStatus === 'auto' && (
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    name="setAllToPlanned"
                    checked={formData.setAllToPlanned}
                    onChange={handleInputChange}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Set all campaigns to PLANNED</div>
                    <div className="text-xs text-gray-500">
                      Override automatic status assignment based on dates
                    </div>
                  </div>
                </label>
              )}

              {/* Status Preview */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <Info className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Status Preview:</span>
                  <span 
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: statusConfig.bgColor, 
                      color: statusConfig.textColor,
                      border: `1px solid ${statusConfig.color}20`
                    }}
                  >
                    <span className="mr-1">{statusConfig.icon}</span>
                    {statusConfig.label}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  {getStatusPreviewDescription()}
                </p>
                {formData.customStatus !== 'auto' && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700 font-medium">
                      ✨ Custom Status Override Active: All {brandChannelCampaigns.length} campaigns will be set to "{statusConfig.label}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Optional Overrides */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Optional Overrides</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manager Override
                  <span className="text-xs text-gray-500 ml-1">(Optional)</span>
                </label>
                <select
                  name="manager"
                  value={formData.manager}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Keep original managers</option>
                  {activeManagers.map(manager => (
                    <option key={manager.id} value={manager.initials}>
                      {manager.initials} - {manager.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to keep each campaign's original manager
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes Override
                  <span className="text-xs text-gray-500 ml-1">(Optional)</span>
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new notes for all duplicated campaigns..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to keep original notes with "(Copy)" appended
                </p>
              </div>
            </div>
          </div>

          {/* Summary Information */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <Info className="w-4 h-4" />
              <span className="text-sm font-medium">🚀 Duplication Summary</span>
            </div>
            <div className="text-sm text-green-700 space-y-1">
              <p>• <strong>{brandChannelCampaigns.length}</strong> {channel} campaigns will be duplicated</p>
              <p>• Brand: <strong>{brand}</strong></p>
              <p>• Channel: <strong>{channel}</strong> {getChannelEmoji(channel)}</p>
              <p>• New date range: <strong>{formData.startDate}</strong> to <strong>{formData.endDate}</strong></p>
              <p>• Status: <strong>{statusConfig.icon} {statusConfig.label}</strong></p>
              {formData.manager && (
                <p>• Manager override: <strong>{formData.manager}</strong></p>
              )}
              {formData.notes && (
                <p>• Custom notes will be applied to all campaigns</p>
              )}
              {formData.customStatus !== 'auto' && (
                <p>• <strong>Custom status override active</strong> - ignoring date-based logic</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
          <button
            onClick={handleDuplicate}
            disabled={!!validationError || loading || brandChannelCampaigns.length === 0}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Duplicating {brandChannelCampaigns.length} {channel} campaigns...
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Duplicate {brandChannelCampaigns.length} {channel} Campaigns
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};