import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, Zap, Eye, EyeOff, AlertTriangle, Wifi, WifiOff, Palette, Facebook, Search, Music, Image, Tv, Radio, Smartphone, Monitor, Mail, Globe, Target, Settings, HelpCircle, ChevronDown, ChevronUp, Layers, Tag } from 'lucide-react';
import { Channel, AVAILABLE_KPIS, getDefaultKPIsForChannel, getKPIOption, AVAILABLE_SUB_GROUPINGS, getDefaultSubGroupingForChannel, getSubGroupingOption, getDefaultTypeForChannel } from '../types/channel';
import { useChannels } from '../hooks/useChannels';

// Available icons for channels with proper ES module imports
const availableIcons = [
  { name: 'Facebook', label: 'Facebook/Meta' },
  { name: 'Search', label: 'Google/Search' },
  { name: 'Music', label: 'TikTok/Music' },
  { name: 'Image', label: 'Pinterest/Image' },
  { name: 'Tv', label: 'Television' },
  { name: 'Radio', label: 'Radio' },
  { name: 'Smartphone', label: 'Mobile' },
  { name: 'Monitor', label: 'Digital' },
  { name: 'Mail', label: 'Email' },
  { name: 'Globe', label: 'Web' },
  { name: 'Zap', label: 'Energy' },
  { name: 'Target', label: 'Targeting' },
];

// Icon mapping for dynamic icon selection
const LucideIconMap: { [key: string]: React.ComponentType<any> } = {
  Facebook,
  Search,
  Music,
  Image,
  Tv,
  Radio,
  Smartphone,
  Monitor,
  Mail,
  Globe,
  Zap,
  Target,
};

// Predefined color options
const colorOptions = [
  { value: '#1877f2', label: 'Facebook Blue', class: 'bg-blue-500' },
  { value: '#ea4335', label: 'Google Red', class: 'bg-red-500' },
  { value: '#ff0050', label: 'TikTok Pink', class: 'bg-pink-500' },
  { value: '#bd081c', label: 'Pinterest Red', class: 'bg-red-600' },
  { value: '#8b5cf6', label: 'Purple', class: 'bg-purple-500' },
  { value: '#10b981', label: 'Green', class: 'bg-green-500' },
  { value: '#f59e0b', label: 'Orange', class: 'bg-orange-500' },
  { value: '#6b7280', label: 'Gray', class: 'bg-gray-500' },
];

export const ChannelManager: React.FC = () => {
  const { channels, loading, error, addChannel, updateChannel, deleteChannel } = useChannels();
  const [showForm, setShowForm] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [showKPISettings, setShowKPISettings] = useState(false);
  const [showGroupingSettings, setShowGroupingSettings] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    active: true,
    type: 'digital' as 'digital' | 'traditional',
    color: '#1877f2',
    icon: 'Zap',
    visibleKpis: [] as string[],
    subGroupingKey: null as string | null,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    try {
      // Use default KPIs and sub-grouping if none selected
      const kpisToSave = formData.visibleKpis.length > 0 
        ? formData.visibleKpis 
        : getDefaultKPIsForChannel(formData.name);

      const subGroupingToSave = formData.subGroupingKey !== null
        ? formData.subGroupingKey
        : getDefaultSubGroupingForChannel(formData.name);

      const channelData = {
        ...formData,
        visibleKpis: kpisToSave,
        subGroupingKey: subGroupingToSave,
      };

      if (editingChannel) {
        await updateChannel(editingChannel.id!, channelData);
      } else {
        await addChannel(channelData);
      }
      
      resetForm();
    } catch (err: any) {
      console.error('Error saving channel:', err);
      setFormError(err.message || 'Failed to save channel');
    }
  };

  const handleEdit = (channel: Channel) => {
    setEditingChannel(channel);
    setFormData({
      name: channel.name,
      active: channel.active,
      type: channel.type || getDefaultTypeForChannel(channel.name),
      color: channel.color || '#1877f2',
      icon: channel.icon || 'Zap',
      visibleKpis: channel.visibleKpis || getDefaultKPIsForChannel(channel.name),
      subGroupingKey: channel.subGroupingKey !== undefined ? channel.subGroupingKey : getDefaultSubGroupingForChannel(channel.name),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the "${name}" channel? This action cannot be undone and may affect existing campaigns.`)) {
      try {
        await deleteChannel(id);
      } catch (error) {
        console.error('Error deleting channel:', error);
        // Error handling is done in the hook
      }
    }
  };

  const handleToggleActive = async (channel: Channel) => {
    try {
      await updateChannel(channel.id!, { active: !channel.active });
    } catch (error) {
      console.error('Error toggling channel status:', error);
      // Error handling is done in the hook
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      active: true,
      type: 'digital',
      color: '#1877f2',
      icon: 'Zap',
      visibleKpis: [],
      subGroupingKey: null,
    });
    setEditingChannel(null);
    setShowForm(false);
    setShowKPISettings(false);
    setShowGroupingSettings(false);
    setFormError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Auto-populate KPIs and sub-grouping when channel name changes
    if (name === 'name' && value) {
      const defaultKpis = getDefaultKPIsForChannel(value);
      const defaultSubGrouping = getDefaultSubGroupingForChannel(value);
      const defaultType = getDefaultTypeForChannel(value);
      setFormData(prev => ({
        ...prev,
        type: prev.type === 'digital' && defaultType !== 'digital' ? defaultType : prev.type,
        visibleKpis: prev.visibleKpis.length === 0 ? defaultKpis : prev.visibleKpis,
        subGroupingKey: prev.subGroupingKey === null ? defaultSubGrouping : prev.subGroupingKey,
      }));
    }
  };

  const handleKPIToggle = (kpiKey: string) => {
    setFormData(prev => ({
      ...prev,
      visibleKpis: prev.visibleKpis.includes(kpiKey)
        ? prev.visibleKpis.filter(k => k !== kpiKey)
        : [...prev.visibleKpis, kpiKey]
    }));
  };

  const moveKPI = (kpiKey: string, direction: 'up' | 'down') => {
    setFormData(prev => {
      const currentIndex = prev.visibleKpis.indexOf(kpiKey);
      if (currentIndex === -1) return prev;

      const newKpis = [...prev.visibleKpis];
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (newIndex >= 0 && newIndex < newKpis.length) {
        [newKpis[currentIndex], newKpis[newIndex]] = [newKpis[newIndex], newKpis[currentIndex]];
      }

      return { ...prev, visibleKpis: newKpis };
    });
  };

  // Group KPIs by category for better organization
  const kpisByCategory = AVAILABLE_KPIS.reduce((acc, kpi) => {
    if (!acc[kpi.category]) acc[kpi.category] = [];
    acc[kpi.category].push(kpi);
    return acc;
  }, {} as { [key: string]: typeof AVAILABLE_KPIS });

  const categoryLabels = {
    universal: 'Universal KPIs',
    digital: 'Digital Marketing',
    traditional: 'Traditional Media',
    tv: 'TV Specific',
    radio: 'Radio Specific',
    cinema: 'Cinema Specific',
    dooh: 'Digital Out-of-Home'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading channels...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Channel Management</h2>
          <p className="text-gray-600 mt-1">Manage marketing channels, their properties, KPI configurations, and grouping logic</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Database Connection Status */}
          <div className="flex items-center gap-2">
            {error ? (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-lg">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">Offline</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">Connected</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Channel
          </button>
        </div>
      </div>

      {/* Database Error Alert */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-900">
                Database Connection Issue
              </h3>
              <p className="text-sm text-yellow-700">
                {error}. Showing demo data. Changes will not be saved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Channel List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {channels.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium text-gray-900">No channels found</p>
            <p className="text-sm text-gray-500">Create your first channel to get started</p>
          </div>
        ) : (
        <div className="w-full overflow-x-auto">
          <div className="min-w-[1280px]">
            <table className="w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visual</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KPI Configuration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grouping Logic</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {channels.map((channel) => {
                  const IconComponent = LucideIconMap[channel.icon || 'Zap'] || Zap;
                  const visibleKpis = channel.visibleKpis || getDefaultKPIsForChannel(channel.name);
                  const subGrouping = getSubGroupingOption(channel.subGroupingKey !== undefined ? channel.subGroupingKey : getDefaultSubGroupingForChannel(channel.name));
                  const channelType = channel.type || getDefaultTypeForChannel(channel.name);
                  
                  return (
                    <tr key={channel.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="p-2 rounded-lg mr-3"
                            style={{ backgroundColor: channel.color || '#6b7280' }}
                          >
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{channel.name}</div>
                            {/*<div className="text-sm text-gray-500">ID: {channel.id}</div>*/}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          channelType === 'digital' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {channelType === 'digital' ? '📱' : '📺'} {channelType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-200"
                            style={{ backgroundColor: channel.color || '#6b7280' }}
                          ></div>
                          <span className="text-xs text-gray-500">
                            {channel.color || 'No color'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {visibleKpis.slice(0, 3).map((kpiKey) => {
                            const kpi = getKPIOption(kpiKey);
                            return (
                              <span
                                key={kpiKey}
                                className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800"
                                title={kpi?.tooltip}
                              >
                                {kpi?.label || kpiKey}
                              </span>
                            );
                          })}
                          {visibleKpis.length > 3 && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                              +{visibleKpis.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{subGrouping?.icon || '📊'}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {subGrouping?.label || 'Campaign'}
                            </div>
                            {/*<div className="text-xs text-gray-500">
                              {subGrouping?.description || 'Default grouping'}
                            </div>*/}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(channel)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            channel.active
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {channel.active ? (
                            <>
                              <Eye className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {channel.createdAt ? new Date(channel.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(channel)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(channel.id!, channel.name)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {/* Channel Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingChannel ? 'Edit Channel' : 'Add New Channel'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Error</span>
                </div>
                <p className="text-sm text-red-700 mt-1">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Channel Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Channel Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Meta, Google, LinkedIn"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Channel Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.type === 'digital'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="type"
                        value="digital"
                        checked={formData.type === 'digital'}
                        onChange={handleChange}
                        className="mr-3 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">📱</span>
                          <span className="text-sm font-medium text-gray-900">Digital</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Online advertising platforms (Meta, Google, etc.)
                        </div>
                      </div>
                    </label>

                    <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.type === 'traditional'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="type"
                        value="traditional"
                        checked={formData.type === 'traditional'}
                        onChange={handleChange}
                        className="mr-3 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">📺</span>
                          <span className="text-sm font-medium text-gray-900">Traditional</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Traditional media (TV, Radio, Cinema, DOOH)
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon
                  </label>
                  <select
                    name="icon"
                    value={formData.icon}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableIcons.map((icon) => (
                      <option key={icon.name} value={icon.name}>
                        {icon.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((color) => (
                      <label
                        key={color.value}
                        className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.color === color.value
                            ? 'border-blue-500 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="color"
                          value={color.value}
                          checked={formData.color === color.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className={`w-6 h-6 rounded-full ${color.class}`}></div>
                      </label>
                    ))}
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Custom hex color (e.g., #1877f2)"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="active"
                      checked={formData.active}
                      onChange={handleChange}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Inactive channels won't appear in campaign forms
                  </p>
                </div>
              </div>

              {/* Grouping Logic Settings */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-gray-600" />
                    <h4 className="text-lg font-semibold text-gray-900">Grouping Logic</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGroupingSettings(!showGroupingSettings)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showGroupingSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showGroupingSettings ? 'Hide' : 'Show'} Grouping Settings
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Configure how campaigns are grouped in the channel view.
                  {formData.subGroupingKey === null && (
                    <span className="text-blue-600 ml-1">
                      (Using default grouping for {formData.name || 'this channel'})
                    </span>
                  )}
                </p>

                {showGroupingSettings && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sub-Grouping Strategy
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {AVAILABLE_SUB_GROUPINGS.map((option) => (
                          <label
                            key={option.key}
                            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                              formData.subGroupingKey === option.key
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="subGroupingKey"
                              value={option.key || ''}
                              checked={formData.subGroupingKey === option.key}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                subGroupingKey: e.target.value || null 
                              }))}
                              className="mr-3 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{option.icon}</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {option.label}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {option.description}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Grouping Preview */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Preview</h5>
                      <div className="text-sm text-gray-600">
                        {formData.subGroupingKey === 'broadcaster' && (
                          <span>📺 Campaigns will be grouped by broadcaster/sponsorship (e.g., "Sky – ATP Finals 2025")</span>
                        )}
                        {formData.subGroupingKey === 'brand' && (
                          <span>🏢 Campaigns will be grouped by brand (e.g., "ArredissimA", "FC")</span>
                        )}
                        {formData.subGroupingKey === 'region' && (
                          <span>🗺️ Campaigns will be grouped by region (e.g., "Lazio", "National")</span>
                        )}
                        {(formData.subGroupingKey === 'campaign' || formData.subGroupingKey === null) && (
                          <span>📊 Campaigns will be grouped individually (e.g., "FC - Lazio")</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* KPI Settings */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-gray-600" />
                    <h4 className="text-lg font-semibold text-gray-900">KPI Settings</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowKPISettings(!showKPISettings)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showKPISettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showKPISettings ? 'Hide' : 'Show'} KPI Configuration
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Select which KPIs should be visible in campaign tables and reports for this channel.
                  {formData.visibleKpis.length === 0 && (
                    <span className="text-blue-600 ml-1">
                      (Using default KPIs for {formData.name || 'this channel'})
                    </span>
                  )}
                </p>

                {showKPISettings && (
                  <div className="space-y-4">
                    {/* Selected KPIs (with ordering) */}
                    {formData.visibleKpis.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Selected KPIs (in display order)
                        </label>
                        <div className="space-y-2">
                          {formData.visibleKpis.map((kpiKey, index) => {
                            const kpi = getKPIOption(kpiKey);
                            return (
                              <div key={kpiKey} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                                <span className="text-sm font-medium text-blue-900 min-w-[20px]">
                                  {index + 1}.
                                </span>
                                <span className="flex-1 text-sm font-medium text-blue-900">
                                  {kpi?.label || kpiKey}
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => moveKPI(kpiKey, 'up')}
                                    disabled={index === 0}
                                    className="p-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                                  >
                                    <ChevronUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveKPI(kpiKey, 'down')}
                                    disabled={index === formData.visibleKpis.length - 1}
                                    className="p-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleKPIToggle(kpiKey)}
                                    className="p-1 text-red-600 hover:text-red-800"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Available KPIs by category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available KPIs
                      </label>
                      <div className="space-y-4">
                        {Object.entries(kpisByCategory).map(([category, kpis]) => (
                          <div key={category}>
                            <h5 className="text-sm font-medium text-gray-600 mb-2">
                              {categoryLabels[category] || category}
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {kpis.map((kpi) => (
                                <label
                                  key={kpi.key}
                                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                                    formData.visibleKpis.includes(kpi.key)
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={formData.visibleKpis.includes(kpi.key)}
                                    onChange={() => handleKPIToggle(kpi.key)}
                                    className="mr-3 text-blue-600 focus:ring-blue-500"
                                  />
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">
                                      {kpi.label}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {kpi.tooltip}
                                    </div>
                                  </div>
                                  <HelpCircle className="w-4 h-4 text-gray-400 ml-2" title={kpi.tooltip} />
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  {editingChannel ? 'Update Channel' : 'Add Channel'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};