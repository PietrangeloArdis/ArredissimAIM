import React, { useState, useEffect } from 'react';
import { X, Copy, Calendar, Settings, AlertTriangle, Info, Save } from 'lucide-react';
import { Campaign, Status, STATUS_CONFIG, migrateStatus } from '../types/campaign';
import { useBrands } from '../hooks/useBrands';
import { useManagers } from '../hooks/useManagers';
import { useRegions } from '../hooks/useRegions';
import { useBroadcasters } from '../hooks/useBroadcasters';

interface CampaignDuplicateModalProps {
  campaign: Campaign;
  onDuplicate: (duplicatedCampaign: Omit<Campaign, 'id'>) => void;
  onCancel: () => void;
}

export const CampaignDuplicateModal: React.FC<CampaignDuplicateModalProps> = ({
  campaign,
  onDuplicate,
  onCancel,
}) => {
  const { getActiveBrandsForChannel } = useBrands();
  const { getActiveManagers } = useManagers();
  const { getActiveRegions } = useRegions();
  const { getActiveBroadcasters } = useBroadcasters();

  const [keepOriginalDates, setKeepOriginalDates] = useState(true);
  const [showCustomization, setShowCustomization] = useState(false);
  const [duplicateData, setDuplicateData] = useState({
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    budget: campaign.budget,
    region: campaign.region,
    brand: campaign.brand,
    publisher: campaign.publisher || '',
    manager: campaign.manager,
    notes: `${campaign.notes || ''} (Copy)`.trim(),
  });
  const [autoAssignedStatus, setAutoAssignedStatus] = useState<Status>('PLANNED');
  const [statusInfo, setStatusInfo] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const availableBrands = getActiveBrandsForChannel(campaign.channel);
  const activeManagers = getActiveManagers();
  const activeRegions = getActiveRegions();
  const activeBroadcasters = getActiveBroadcasters();
  const showPublisherField = campaign.channel === 'TV' || campaign.channel === 'Radio';

  // Auto-assign status based on date range
  useEffect(() => {
    if (duplicateData.startDate && duplicateData.endDate) {
      const now = new Date();
      const start = new Date(duplicateData.startDate);
      const end = new Date(duplicateData.endDate);
      
      // Set time to start of day for accurate comparison
      now.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      let newStatus: Status = 'PLANNED';

      if (now < start) {
        newStatus = 'PLANNED';
      } else if (now >= start && now <= end) {
        newStatus = 'ACTIVE';
      } else if (now > end) {
        newStatus = 'COMPLETED';
      }

      if (newStatus !== autoAssignedStatus) {
        setAutoAssignedStatus(newStatus);
        setStatusInfo(`Status will be automatically set to "${STATUS_CONFIG[newStatus].label}" based on selected dates.`);
      }
    }
  }, [duplicateData.startDate, duplicateData.endDate, autoAssignedStatus]);

  // Validation
  useEffect(() => {
    setValidationError(null);

    if (!duplicateData.startDate || !duplicateData.endDate) {
      setValidationError('Start and end dates are required.');
      return;
    }

    if (new Date(duplicateData.startDate) > new Date(duplicateData.endDate)) {
      setValidationError('Start date must be before end date.');
      return;
    }

    if (!duplicateData.brand) {
      setValidationError('Brand is required.');
      return;
    }

    if (!duplicateData.region) {
      setValidationError('Region is required.');
      return;
    }

    if (!duplicateData.manager) {
      setValidationError('Manager is required.');
      return;
    }

    if (showPublisherField && !duplicateData.publisher) {
      setValidationError(`Broadcaster/Sponsorship is required for ${campaign.channel} campaigns.`);
      return;
    }

    if (duplicateData.budget <= 0) {
      setValidationError('Budget must be greater than 0.');
      return;
    }
  }, [duplicateData, showPublisherField, campaign.channel]);

  const handleDateModeChange = (keepDates: boolean) => {
    setKeepOriginalDates(keepDates);
    if (keepDates) {
      setDuplicateData(prev => ({
        ...prev,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
      }));
    } else {
      // Set default new dates (next month)
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
      const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate() + 30);
      
      setDuplicateData(prev => ({
        ...prev,
        startDate: nextMonth.toISOString().split('T')[0],
        endDate: endOfNextMonth.toISOString().split('T')[0],
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;
    
    if (type === 'number') {
      newValue = value === '' ? 0 : parseFloat(value) || 0;
    }
    
    setDuplicateData(prev => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleDuplicate = () => {
    if (validationError) {
      return;
    }

    // Create the duplicated campaign
    const duplicatedCampaign: Omit<Campaign, 'id'> = {
      ...campaign,
      // Override with customized values
      startDate: duplicateData.startDate,
      endDate: duplicateData.endDate,
      budget: duplicateData.budget,
      region: duplicateData.region,
      brand: duplicateData.brand,
      publisher: duplicateData.publisher,
      manager: duplicateData.manager,
      notes: duplicateData.notes,
      // Set auto-assigned status
      status: autoAssignedStatus,
      // Reset timestamps
      createdAt: undefined,
      updatedAt: undefined,
    };

    onDuplicate(duplicatedCampaign);
  };

  const generateCampaignName = () => {
    return `${duplicateData.brand} - ${duplicateData.region} (${campaign.channel})`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Copy className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Duplicate Campaign</h2>
              <p className="text-sm text-gray-600">
                Create a copy of "{campaign.brand} - {campaign.channel}"
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Campaign Preview */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">New Campaign Preview</h3>
          <div className="text-lg font-semibold text-gray-900">{generateCampaignName()}</div>
          <div className="text-sm text-gray-600 mt-1">
            {new Date(duplicateData.startDate).toLocaleDateString()} - {new Date(duplicateData.endDate).toLocaleDateString()} • 
            €{duplicateData.budget.toLocaleString()} • {duplicateData.manager}
          </div>
          {statusInfo && (
            <div className="mt-2 flex items-center gap-2 text-green-700">
              <Info className="w-4 h-4" />
              <span className="text-xs">{statusInfo}</span>
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

        <div className="space-y-6">
          {/* Date Options */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Date Options</h3>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="dateMode"
                  checked={keepOriginalDates}
                  onChange={() => handleDateModeChange(true)}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Keep original dates</div>
                  <div className="text-xs text-gray-500">
                    {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                  </div>
                </div>
              </label>

              <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="dateMode"
                  checked={!keepOriginalDates}
                  onChange={() => handleDateModeChange(false)}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Set new dates</div>
                  <div className="text-xs text-gray-500">Choose custom start and end dates</div>
                </div>
              </label>

              {!keepOriginalDates && (
                <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={duplicateData.startDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New End Date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={duplicateData.endDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Optional Customization */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Optional Customization</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomization(!showCustomization)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showCustomization ? 'Hide Options' : 'Show Options'}
              </button>
            </div>

            {showCustomization && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Budget (€)
                    </label>
                    <input
                      type="number"
                      name="budget"
                      value={duplicateData.budget}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Region
                    </label>
                    <select
                      name="region"
                      value={duplicateData.region}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Region</option>
                      {activeRegions.map(region => (
                        <option key={region.id} value={region.name}>{region.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand
                    </label>
                    <select
                      name="brand"
                      value={duplicateData.brand}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Brand</option>
                      {availableBrands.map(brand => (
                        <option key={brand.id} value={brand.name}>{brand.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manager
                    </label>
                    <select
                      name="manager"
                      value={duplicateData.manager}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Manager</option>
                      {activeManagers.map(manager => (
                        <option key={manager.id} value={manager.initials}>
                          {manager.initials} - {manager.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {showPublisherField && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Broadcaster / Sponsorship
                      </label>
                      <input
                        type="text"
                        name="publisher"
                        value={duplicateData.publisher}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={activeBroadcasters.length > 0 
                          ? `e.g., ${activeBroadcasters[0]?.name || 'Sky – ATP Finals 2025'}`
                          : 'Enter broadcaster or sponsorship details'
                        }
                        required
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={duplicateData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes for the duplicated campaign..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Status Information */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <Info className="w-4 h-4" />
              <span className="text-sm font-medium">🤖 Smart Status Assignment</span>
            </div>
            <p className="text-sm text-blue-700">
              The new campaign will automatically be assigned the status "{STATUS_CONFIG[autoAssignedStatus].label}" 
              based on the selected date range. You can change this later if needed.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
          <button
            onClick={handleDuplicate}
            disabled={!!validationError}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Create Duplicate Campaign
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};