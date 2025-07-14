import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, X, AlertTriangle, Info, TrendingDown, HelpCircle } from 'lucide-react';
import { Campaign, PeriodType, Status, BUDGET_ALERT_THRESHOLD, channelSupportsMetric, getMetricDisplayInfo, STATUS_CONFIG, migrateStatus } from '../types/campaign';
import { useBrands } from '../hooks/useBrands';
import { useManagers } from '../hooks/useManagers';
import { useChannels } from '../hooks/useChannels';
import { useBroadcasters } from '../hooks/useBroadcasters';
import { useRegions } from '../hooks/useRegions';

interface CampaignFormProps {
  onSubmit: (campaign: Omit<Campaign, 'id'>) => void;
  onCancel: () => void;
  initialData?: Partial<Campaign>;
  channel?: string;
}

const periodTypes: PeriodType[] = ['monthly', 'weekly', 'quarterly'];
const allStatuses: Status[] = ['PLANNED', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

export const CampaignForm: React.FC<CampaignFormProps> = ({ 
  onSubmit, 
  onCancel, 
  initialData = {}, 
  channel 
}) => {
  const { getActiveBrandsForChannel, loading: brandsLoading } = useBrands();
  const { getActiveManagers, loading: managersLoading } = useManagers();
  const { getActiveChannels, loading: channelsLoading } = useChannels();
  const { getActiveBroadcasters, loading: broadcastersLoading } = useBroadcasters();
  const { getActiveRegions, loading: regionsLoading } = useRegions();
  
  const activeChannels = getActiveChannels();
  const activeRegions = getActiveRegions();
  const activeBroadcasters = getActiveBroadcasters();
  const defaultChannel = channel || initialData.channel || (activeChannels.length > 0 ? activeChannels[0].name : '');
  
  // Migrate legacy status if needed
  const migratedStatus = initialData.status ? migrateStatus(initialData.status) : 'PLANNED';
  
  const [formData, setFormData] = useState({
    channel: defaultChannel,
    brand: initialData.brand || '',
    region: initialData.region || '',
    periodType: initialData.periodType || 'monthly',
    startDate: initialData.startDate || '',
    endDate: initialData.endDate || '',
    budget: initialData.budget || 0,
    roi: initialData.roi || '',
    costPerLead: initialData.costPerLead || 0,
    leads: initialData.leads || 0,
    manager: initialData.manager || '',
    status: migratedStatus,
    notes: initialData.notes || '',
    publisher: initialData.publisher || '',
    extraSocialBudget: initialData.extraSocialBudget || 0,
    extraSocialNotes: initialData.extraSocialNotes || '',
    // Channel-specific metrics - all default to null
    expectedGrps: initialData.expectedGrps || null,
    achievedGrps: initialData.achievedGrps || null,
    spotsPurchased: initialData.spotsPurchased || null,
    impressions: initialData.impressions || null,
    expectedViewers: initialData.expectedViewers || null,
    expectedViews: initialData.expectedViews || null,
  });

  const [showPublisherSuggestions, setShowPublisherSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);
  const [statusWarning, setStatusWarning] = useState<string | null>(null);
  const [statusInfo, setStatusInfo] = useState<string | null>(null);

  // Memoize available brands for the selected channel to prevent unnecessary recalculations
  const availableBrands = useMemo(() => {
    return getActiveBrandsForChannel(formData.channel);
  }, [formData.channel, getActiveBrandsForChannel]);

  const activeManagers = getActiveManagers();
  const showPublisherField = formData.channel === 'TV' || formData.channel === 'Radio';
  const showSocialFields = formData.channel === 'Meta' || formData.channel === 'TikTok' || formData.channel === 'Pinterest';

  // Channel-specific field visibility
  const showTVFields = formData.channel === 'TV';
  const showRadioFields = formData.channel === 'Radio';
  const showCinemaFields = formData.channel === 'Cinema';
  const showDOOHFields = formData.channel === 'DOOH';

  // Determine if date range is valid for "Scheduled" status
  const isDateRangeValid = formData.startDate && formData.endDate && 
    new Date(formData.startDate) <= new Date(formData.endDate);

  // Filter available statuses based on date validity
  const availableStatuses = allStatuses.filter(status => {
    if (status === 'SCHEDULED') {
      return isDateRangeValid;
    }
    return true;
  });

  // Check if all dependencies are loaded
  const isLoading = brandsLoading || managersLoading || channelsLoading || broadcastersLoading || regionsLoading;

  // Consolidated effect for handling form initialization and channel changes
  useEffect(() => {
    // Only proceed if all data is loaded
    if (isLoading) return;

    // Initialize form data when editing (only once)
    if (initialData && Object.keys(initialData).length > 0 && !formData.channel) {
      const migratedStatus = initialData.status ? migrateStatus(initialData.status) : 'PLANNED';
      const channelToUse = channel || initialData.channel || (activeChannels.length > 0 ? activeChannels[0].name : '');
      
      setFormData({
        channel: channelToUse,
        brand: initialData.brand || '',
        region: initialData.region || '',
        periodType: initialData.periodType || 'monthly',
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || '',
        budget: initialData.budget || 0,
        roi: initialData.roi || '',
        costPerLead: initialData.costPerLead || 0,
        leads: initialData.leads || 0,
        manager: initialData.manager || '',
        status: migratedStatus,
        notes: initialData.notes || '',
        publisher: initialData.publisher || '',
        extraSocialBudget: initialData.extraSocialBudget || 0,
        extraSocialNotes: initialData.extraSocialNotes || '',
        expectedGrps: initialData.expectedGrps || null,
        achievedGrps: initialData.achievedGrps || null,
        spotsPurchased: initialData.spotsPurchased || null,
        impressions: initialData.impressions || null,
        expectedViewers: initialData.expectedViewers || null,
        expectedViews: initialData.expectedViews || null,
      });
      return;
    }

    // Handle brand validation when channel changes
    if (formData.channel && formData.brand) {
      const currentChannelBrands = getActiveBrandsForChannel(formData.channel);
      const isBrandAvailable = currentChannelBrands.some(brand => brand.name === formData.brand);
      
      if (!isBrandAvailable) {
        setFormData(prev => ({
          ...prev,
          brand: ''
        }));
      }
    }
  }, [isLoading, formData.channel, formData.brand, getActiveBrandsForChannel, initialData, channel, activeChannels]);

  // Handle field clearing when switching channel types
  useEffect(() => {
    if (!formData.channel) return;

    const updates: Partial<typeof formData> = {};
    let hasChanges = false;

    // Clear publisher field when switching away from TV/Radio
    if (formData.channel !== 'TV' && formData.channel !== 'Radio' && formData.publisher) {
      updates.publisher = '';
      hasChanges = true;
    }

    // Clear social fields when switching away from social channels
    if (!showSocialFields && (formData.extraSocialBudget > 0 || formData.extraSocialNotes)) {
      updates.extraSocialBudget = 0;
      updates.extraSocialNotes = '';
      hasChanges = true;
    }

    // Clear channel-specific metrics when switching channels
    const metricsToReset: (keyof Campaign)[] = [
      'expectedGrps', 'achievedGrps', 'spotsPurchased', 
      'impressions', 'expectedViewers', 'expectedViews'
    ];

    metricsToReset.forEach(metric => {
      if (!channelSupportsMetric(formData.channel, metric) && formData[metric] !== null) {
        updates[metric] = null;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setFormData(prev => ({ ...prev, ...updates }));
    }
  }, [formData.channel, formData.publisher, formData.extraSocialBudget, formData.extraSocialNotes, showSocialFields]);

  // Auto-fallback logic for invalid "Scheduled" status
  useEffect(() => {
    if (formData.status === 'SCHEDULED' && !isDateRangeValid) {
      setFormData(prev => ({ ...prev, status: 'PLANNED' }));
      setStatusWarning('Status changed to "Planned" because valid dates are required for "Scheduled" status.');
      
      // Clear warning after 5 seconds
      const timer = setTimeout(() => setStatusWarning(null), 5000);
      return () => clearTimeout(timer);
    } else {
      setStatusWarning(null);
    }
  }, [formData.status, isDateRangeValid]);

  // Automatic status assignment based on date range
  useEffect(() => {
    if (formData.startDate && formData.endDate && isDateRangeValid) {
      const now = new Date();
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      // Set time to start of day for accurate comparison
      now.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      let newStatus: Status = formData.status;

      if (now < start) {
        newStatus = 'PLANNED';
      } else if (now >= start && now <= end) {
        newStatus = 'ACTIVE';
      } else if (now > end) {
        newStatus = 'COMPLETED';
      }

      // Only update if the status actually changed and it's not a manual override
      if (newStatus !== formData.status && 
          !['SCHEDULED', 'CANCELLED'].includes(formData.status)) {
        setFormData(prev => ({ ...prev, status: newStatus }));
        setStatusInfo(`Status updated automatically to "${STATUS_CONFIG[newStatus].label}" based on selected dates.`);
        
        // Clear info message after 4 seconds
        const timer = setTimeout(() => setStatusInfo(null), 4000);
        return () => clearTimeout(timer);
      }
    } else {
      setStatusInfo(null);
    }
  }, [formData.startDate, formData.endDate, isDateRangeValid, formData.status]);

  // Calculate budget alert
  const getBudgetAlert = useCallback(() => {
    if (!showSocialFields || !formData.extraSocialBudget || !formData.budget) return null;
    const percentage = formData.extraSocialBudget / formData.budget;
    return percentage > BUDGET_ALERT_THRESHOLD ? percentage : null;
  }, [showSocialFields, formData.extraSocialBudget, formData.budget]);

  // Calculate GRP performance alert
  const getGRPAlert = useCallback(() => {
    if (!showTVFields || !formData.expectedGrps || !formData.achievedGrps) return null;
    if (formData.achievedGrps >= formData.expectedGrps) return null;
    
    const performanceGap = ((formData.expectedGrps - formData.achievedGrps) / formData.expectedGrps) * 100;
    return performanceGap > 10 ? performanceGap : null; // Alert if more than 10% shortfall
  }, [showTVFields, formData.expectedGrps, formData.achievedGrps]);

  const budgetAlert = getBudgetAlert();
  const grpAlert = getGRPAlert();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up the form data - convert null values and remove unsupported metrics
    const cleanedData = { ...formData };
    
    // Convert empty numbers to null for optional fields
    const numericFields: (keyof typeof formData)[] = [
      'expectedGrps', 'achievedGrps', 'spotsPurchased', 
      'impressions', 'expectedViewers', 'expectedViews'
    ];
    
    numericFields.forEach(field => {
      if (cleanedData[field] === 0 || cleanedData[field] === '') {
        cleanedData[field] = null;
      }
    });
    
    onSubmit(cleanedData as Omit<Campaign, 'id'>);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;
    
    if (type === 'number') {
      newValue = value === '' ? null : parseFloat(value) || null;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handlePublisherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, publisher: value }));

    // Filter suggestions based on input
    if (value.length > 0 && showPublisherField) {
      const filtered = activeBroadcasters.filter(broadcaster =>
        broadcaster.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered.map(b => b.name));
      setShowPublisherSuggestions(filtered.length > 0);
    } else {
      setShowPublisherSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFormData(prev => ({ ...prev, publisher: suggestion }));
    setShowPublisherSuggestions(false);
  };

  const handlePublisherFocus = () => {
    if (showPublisherField && activeBroadcasters.length > 0) {
      setFilteredSuggestions(activeBroadcasters.map(b => b.name));
      setShowPublisherSuggestions(true);
    }
  };

  const getSocialPlaceholder = () => {
    switch (formData.channel) {
      case 'Meta':
        return 'e.g., Boosted reel on launch day, IG Story Ads during promotion';
      case 'TikTok':
        return 'e.g., Spark Ads for viral content, TopView campaign';
      case 'Pinterest':
        return 'e.g., Promoted pins for seasonal collection, Shopping ads';
      default:
        return 'Details for extra sponsored posts';
    }
  };

  // Helper to render channel-specific metric fields
  const renderChannelMetricField = (metricKey: string, channelName: string) => {
    if (!channelSupportsMetric(formData.channel, metricKey)) return null;
    
    const metricInfo = getMetricDisplayInfo(metricKey);
    const value = formData[metricKey as keyof typeof formData] as number | null;
    const isGRPField = metricKey === 'achievedGrps';
    const hasAlert = isGRPField && grpAlert;

    return (
      <div key={metricKey}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {metricInfo.label}
          <span className="text-xs text-gray-500 ml-1">({channelName})</span>
        </label>
        <input
          type="number"
          name={metricKey}
          value={value || ''}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            hasAlert 
              ? 'border-orange-300 focus:ring-orange-500' 
              : 'border-gray-300 focus:ring-blue-500'
          }`}
          min="0"
          step={metricKey.includes('Grp') ? '0.1' : '1'}
          placeholder={metricInfo.placeholder}
          title={metricInfo.tooltip}
        />
        
        {/* GRP Performance Alert */}
        {hasAlert && (
          <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-800">
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm font-medium">
                {metricInfo.icon} GRP Performance Shortfall
              </span>
            </div>
            <p className="text-xs text-orange-700 mt-1">
              Achieved GRPs are {grpAlert.toFixed(1)}% below expected target
              ({formData.achievedGrps} vs {formData.expectedGrps} expected)
            </p>
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-1">
          {metricInfo.tooltip}
        </p>
      </div>
    );
  };

  // Helper to render status badge
  const renderStatusBadge = (status: Status) => {
    const config = STATUS_CONFIG[status];
    return (
      <div className="flex items-center gap-2">
        <span 
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
          style={{ 
            backgroundColor: config.bgColor, 
            color: config.textColor,
            border: `1px solid ${config.color}20`
          }}
        >
          <span className="mr-1">{config.icon}</span>
          {config.label}
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading form data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData.id ? 'Edit Campaign' : 'Add New Campaign'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Warning */}
        {statusWarning && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Status Updated</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">{statusWarning}</p>
          </div>
        )}

        {/* Status Info (Auto-assignment) */}
        {statusInfo && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <Info className="w-4 h-4" />
              <span className="text-sm font-medium">📅 Auto Status Assignment</span>
            </div>
            <p className="text-sm text-green-700 mt-1">{statusInfo}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
              <select
                name="channel"
                value={formData.channel}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={activeChannels.length === 0}
              >
                {activeChannels.length === 0 ? (
                  <option value="">No active channels available</option>
                ) : (
                  <>
                    <option value="">Select Channel</option>
                    {activeChannels.map(channel => (
                      <option key={channel.id} value={channel.name}>{channel.name}</option>
                    ))}
                  </>
                )}
              </select>
              {activeChannels.length === 0 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <Info className="w-4 h-4" />
                    <span className="text-xs font-medium">No Active Channels</span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    No active channels are available. Please contact an administrator to add channels.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
                {availableBrands.length === 0 && formData.channel && (
                  <span className="text-xs text-red-500 ml-1">(No brands available for {formData.channel})</span>
                )}
              </label>
              <select
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={availableBrands.length === 0}
              >
                <option value="">Select Brand</option>
                {availableBrands.map(brand => (
                  <option key={brand.id} value={brand.name}>
                    {brand.name}
                  </option>
                ))}
              </select>
              {availableBrands.length === 0 && formData.channel && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <Info className="w-4 h-4" />
                    <span className="text-xs font-medium">No Active Brands</span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    No active brands are configured for {formData.channel}. Please contact an administrator to add brands for this channel.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region
                {activeRegions.length === 0 && (
                  <span className="text-xs text-red-500 ml-1">(No regions available)</span>
                )}
              </label>
              <select
                name="region"
                value={formData.region}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={activeRegions.length === 0}
              >
                <option value="">Select Region</option>
                {activeRegions.map(region => (
                  <option key={region.id} value={region.name}>{region.name}</option>
                ))}
              </select>
              {activeRegions.length === 0 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <Info className="w-4 h-4" />
                    <span className="text-xs font-medium">No Active Regions</span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    No active regions are available. Please contact an administrator to add regions.
                  </p>
                </div>
              )}
            </div>

            {/* Broadcaster/Sponsorship Field - Only for TV and Radio */}
            {showPublisherField && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Broadcaster / Sponsorship
                  <span className="text-red-500 ml-1">*</span>
                  {activeBroadcasters.length === 0 && (
                    <span className="text-xs text-red-500 ml-1">(No broadcasters available)</span>
                  )}
                </label>
                <input
                  type="text"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handlePublisherChange}
                  onFocus={handlePublisherFocus}
                  onBlur={() => setTimeout(() => setShowPublisherSuggestions(false), 200)}
                  placeholder={activeBroadcasters.length > 0 
                    ? `e.g., ${activeBroadcasters[0]?.name || 'Sky – ATP Finals 2025'}`
                    : 'No broadcasters available'
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={activeBroadcasters.length === 0}
                />
                
                {/* Suggestions Dropdown */}
                {showPublisherSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-sm border-b border-gray-100 last:border-b-0"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {activeBroadcasters.length === 0 && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <Info className="w-4 h-4" />
                      <span className="text-xs font-medium">No Active Broadcasters</span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      No active broadcasters are available. Please contact an administrator to add broadcasters.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period Type</label>
              <select
                name="periodType"
                value={formData.periodType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {periodTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
                <span className="text-xs text-blue-600 ml-1">(Auto-assigns status)</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
                <span className="text-xs text-blue-600 ml-1">(Auto-assigns status)</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget (€)</label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="0"
                step="0.01"
              />
            </div>

            {/* Extra Social Budget - Only for Meta, TikTok, Pinterest */}
            {showSocialFields && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Extra Post Budget (€)
                  <span className="text-xs text-gray-500 ml-1">(Optional)</span>
                </label>
                <input
                  type="number"
                  name="extraSocialBudget"
                  value={formData.extraSocialBudget}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    budgetAlert 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  min="0"
                  step="0.01"
                  placeholder="Additional budget for boosted posts"
                />
                
                {/* Budget Alert Tooltip */}
                {budgetAlert && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        ⚠️ High Extra Budget Alert
                      </span>
                    </div>
                    <p className="text-xs text-red-700 mt-1">
                      Extra social budget is {(budgetAlert * 100).toFixed(1)}% of main budget 
                      (over {(BUDGET_ALERT_THRESHOLD * 100).toFixed(0)}% threshold)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Channel-Specific Metric Fields */}
            {showTVFields && (
              <>
                {renderChannelMetricField('expectedGrps', 'TV')}
                {renderChannelMetricField('achievedGrps', 'TV')}
              </>
            )}

            {(showTVFields || showRadioFields || showCinemaFields) && (
              renderChannelMetricField('spotsPurchased', formData.channel)
            )}

            {showRadioFields && (
              renderChannelMetricField('impressions', 'Radio')
            )}

            {showCinemaFields && (
              renderChannelMetricField('expectedViewers', 'Cinema')
            )}

            {showDOOHFields && (
              renderChannelMetricField('expectedViews', 'DOOH')
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ROI (%)</label>
              <input
                type="text"
                name="roi"
                value={formData.roi}
                onChange={handleChange}
                placeholder="e.g., 1200%"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost Per Lead (€)</label>
              <input
                type="number"
                name="costPerLead"
                value={formData.costPerLead}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {showTVFields || showRadioFields || showCinemaFields || showDOOHFields ? 'Leads (if applicable)' : 'Leads'}
              </label>
              <input
                type="number"
                name="leads"
                value={formData.leads}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={!showTVFields && !showRadioFields && !showCinemaFields && !showDOOHFields}
                min="0"
              />
              {(showTVFields || showRadioFields || showCinemaFields || showDOOHFields) && (
                <p className="text-xs text-gray-500 mt-1">
                  For traditional media campaigns, leads may not be the primary KPI. Channel-specific metrics are more relevant.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manager
                {activeManagers.length === 0 && (
                  <span className="text-xs text-red-500 ml-1">(No managers available)</span>
                )}
              </label>
              <select
                name="manager"
                value={formData.manager}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={activeManagers.length === 0}
                title={formData.manager ? activeManagers.find(m => m.initials === formData.manager)?.name : ''}
              >
                <option value="">Select Manager</option>
                {activeManagers.map(manager => (
                  <option key={manager.id} value={manager.initials} title={manager.name}>
                    {manager.initials} - {manager.name}
                  </option>
                ))}
              </select>
              {activeManagers.length === 0 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <Info className="w-4 h-4" />
                    <span className="text-xs font-medium">No Active Managers</span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    No active managers are available. Please contact an administrator to add managers.
                  </p>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Campaign Status
                  <span className="text-xs text-blue-600 ml-1">(Auto-assigned by dates)</span>
                </label>
                <button
                  type="button"
                  onMouseEnter={() => setShowStatusTooltip(true)}
                  onMouseLeave={() => setShowStatusTooltip(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {availableStatuses.map(status => {
                  const config = STATUS_CONFIG[status];
                  return (
                    <option key={status} value={status} title={config.description}>
                      {config.icon} {config.label}
                    </option>
                  );
                })}
              </select>

              {/* Date Range Requirement Notice for Scheduled */}
              {!isDateRangeValid && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Info className="w-4 h-4" />
                    <span className="text-sm font-medium">📅 Scheduled Status</span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    "Scheduled" status requires valid start and end dates. Complete the date fields to enable this option.
                  </p>
                </div>
              )}

              {/* Auto-Assignment Info */}
              {isDateRangeValid && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <Info className="w-4 h-4" />
                    <span className="text-sm font-medium">🤖 Smart Status Assignment</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Status is automatically assigned based on your selected dates. You can override this if needed.
                  </p>
                </div>
              )}

              {/* Status Preview */}
              <div className="mt-2">
                {renderStatusBadge(formData.status)}
                <p className="text-xs text-gray-500 mt-1">
                  {STATUS_CONFIG[formData.status].description}
                </p>
              </div>

              {/* Status Tooltip */}
              {showStatusTooltip && (
                <div className="absolute z-10 top-full left-0 mt-2 w-80 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg">
                  <div className="space-y-2">
                    {allStatuses.map(status => {
                      const config = STATUS_CONFIG[status];
                      const isAvailable = availableStatuses.includes(status);
                      return (
                        <div key={status} className={`flex items-start gap-2 ${!isAvailable ? 'opacity-50' : ''}`}>
                          <span className="text-sm">{config.icon}</span>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {config.label}
                              {!isAvailable && status === 'SCHEDULED' && (
                                <span className="text-yellow-300 text-xs">(Requires dates)</span>
                              )}
                            </div>
                            <div className="text-gray-300">{config.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="absolute -top-1 left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional campaign notes..."
            />
          </div>

          {/* Extra Social Notes - Only for Meta, TikTok, Pinterest */}
          {showSocialFields && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Details for Extra Sponsored Posts
                <span className="text-xs text-gray-500 ml-1">(Optional)</span>
              </label>
              <textarea
                name="extraSocialNotes"
                value={formData.extraSocialNotes}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={getSocialPlaceholder()}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={availableBrands.length === 0 || activeManagers.length === 0 || activeChannels.length === 0 || activeRegions.length === 0 || (showPublisherField && activeBroadcasters.length === 0)}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              {initialData.id ? 'Update Campaign' : 'Add Campaign'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};