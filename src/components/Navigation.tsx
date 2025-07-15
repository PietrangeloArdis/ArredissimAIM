import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Music, Image, Tv, Radio, Calendar, Building2, LogOut,
  ChevronDown, BarChart3, Menu, X, Users, Zap, Facebook, Smartphone,
  Monitor, Mail, Globe, Target, List, Settings, Antenna, MapPin, LayoutGrid // 1. Aggiungi LayoutGrid
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useChannels } from '../hooks/useChannels';
import { useTranslation } from 'react-i18next';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// Icon mapping for channels with proper ES module imports
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

// Fallback icon mapping for channels
const getChannelIcon = (iconName?: string) => {
  return LucideIconMap[iconName || 'Zap'] || Zap;
};

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { logout, user } = useAuth();
  const { channels, getActiveChannels } = useChannels();
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [showConfigDropdown, setShowConfigDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const channelDropdownRef = useRef<HTMLDivElement>(null);
  const configDropdownRef = useRef<HTMLDivElement>(null);
  const { t, i18n } = useTranslation();

  const activeChannels = getActiveChannels();
  // 2. Aggiungi 'Gantt' all'array dei tab principali
  const mainTabs = ['Dashboard', 'Campaigns', 'Planner', 'Gantt'];
  const configTabs = ['Brands', 'Managers', 'Channels', 'Broadcasters', 'Regions'];
  const isChannelActive = activeChannels.some(channel => channel.name === activeTab);
  const isConfigActive = configTabs.includes(activeTab);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (channelDropdownRef.current && !channelDropdownRef.current.contains(event.target as Node)) {
        setShowChannelDropdown(false);
      }
      if (configDropdownRef.current && !configDropdownRef.current.contains(event.target as Node)) {
        setShowConfigDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleChannelSelect = (channelName: string) => {
    onTabChange(channelName);
    setShowChannelDropdown(false);
    setShowMobileMenu(false);
  };

  const handleMainTabSelect = (tab: string) => {
    onTabChange(tab);
    setShowMobileMenu(false);
  };

  const handleConfigSelect = (tab: string) => {
    onTabChange(tab);
    setShowConfigDropdown(false);
    setShowMobileMenu(false);
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'Dashboard': return BarChart3;
      case 'Campaigns': return List;
      case 'Planner': return Calendar;
      case 'Gantt': return LayoutGrid; // 3. Aggiungi il caso per l'icona del Gantt
      case 'Brands': return Building2;
      case 'Managers': return Users;
      case 'Channels': return Zap;
      case 'Broadcasters': return Antenna;
      case 'Regions': return MapPin;
      default: return Calendar;
    }
  };

  const getChannelColor = (channel: any) => {
    if (channel.color) {
      return {
        backgroundColor: channel.color + '20', // 20% opacity for background
        color: channel.color,
      };
    }
    return {
      backgroundColor: '#f3f4f6',
      color: '#6b7280',
    };
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'it' ? 'en' : 'it';
    i18n.changeLanguage(newLang);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 hidden sm:block">
                  ArredissimA IM
                </h1>
                <h1 className="text-lg font-bold text-gray-900 sm:hidden">
                  AIM
                </h1>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2">
            {/* Main Navigation Tabs */}
            {mainTabs.map((tab) => {
              const Icon = getTabIcon(tab);
              const isActive = activeTab === tab;

              return (
                <button
                  key={tab}
                  onClick={() => handleMainTabSelect(tab)}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab}
                </button>
              );
            })}

            {/* Channels Dropdown */}
            {activeChannels.length > 0 && (
              <div className="relative" ref={channelDropdownRef}>
                <button
                  onClick={() => setShowChannelDropdown(!showChannelDropdown)}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isChannelActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    {isChannelActive ? (
                      (() => {
                        const activeChannel = activeChannels.find(c => c.name === activeTab);
                        const IconComponent = getChannelIcon(activeChannel?.icon);
                        return (
                          <>
                            <IconComponent className="w-4 h-4 mr-2" />
                            {activeTab}
                          </>
                        );
                      })()
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Channels
                      </>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                    showChannelDropdown ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* Channels Dropdown Menu */}
                {showChannelDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      Marketing Channels
                    </div>
                    {activeChannels.map((channel) => {
                      const IconComponent = getChannelIcon(channel.icon);
                      const isActive = activeTab === channel.name;
                      const channelStyle = getChannelColor(channel);

                      return (
                        <button
                          key={channel.id}
                          onClick={() => handleChannelSelect(channel.name)}
                          className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                            isActive
                              ? 'border-r-2'
                              : 'hover:bg-gray-50'
                          }`}
                          style={isActive ? {
                            backgroundColor: channelStyle.backgroundColor,
                            color: channelStyle.color,
                            borderRightColor: channelStyle.color,
                          } : {}}
                        >
                          <IconComponent className="w-4 h-4 mr-3" />
                          {channel.name}
                          {isActive && (
                            <div 
                              className="ml-auto w-2 h-2 rounded-full"
                              style={{ backgroundColor: channelStyle.color }}
                            ></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Configuration Dropdown */}
            <div className="relative" ref={configDropdownRef}>
              <button
                onClick={() => setShowConfigDropdown(!showConfigDropdown)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isConfigActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurazione
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                  showConfigDropdown ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Configuration Dropdown Menu */}
              {showConfigDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    Configurazione Sistema
                  </div>
                  {configTabs.map((tab) => {
                    const Icon = getTabIcon(tab);
                    const isActive = activeTab === tab;

                    return (
                      <button
                        key={tab}
                        onClick={() => handleConfigSelect(tab)}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {tab}
                        {isActive && (
                          <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleLanguage}
              className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              {i18n.language === 'it' ? '🇮🇹 IT' : '🇬🇧 EN'}
            </button>
            
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {user?.email?.split('@')[0]}
                </div>
                <div className="text-xs text-gray-500">
                  {user?.email?.split('@')[1]}
                </div>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Esci"
            >
              <LogOut className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Esci</span>
            </button>

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {showMobileMenu ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              <div className="space-y-1">
                {mainTabs.map((tab) => {
                  const Icon = getTabIcon(tab);
                  const isActive = activeTab === tab;

                  return (
                    <button
                      key={tab}
                      onClick={() => handleMainTabSelect(tab)}
                      className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {tab}
                    </button>
                  );
                })}
              </div>

              {activeChannels.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marketing Channels
                  </div>
                  <div className="space-y-1">
                    {activeChannels.map((channel) => {
                      const IconComponent = getChannelIcon(channel.icon);
                      const isActive = activeTab === channel.name;
                      const channelStyle = getChannelColor(channel);

                      return (
                        <button
                          key={channel.id}
                          onClick={() => handleChannelSelect(channel.name)}
                          className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                            isActive ? 'border-r-2' : 'hover:bg-gray-50'
                          }`}
                          style={isActive ? {
                            backgroundColor: channelStyle.backgroundColor,
                            color: channelStyle.color,
                            borderRightColor: channelStyle.color,
                          } : {}}
                        >
                          <IconComponent className="w-4 h-4 mr-3" />
                          {channel.name}
                          {isActive && (
                            <div 
                              className="ml-auto w-2 h-2 rounded-full"
                              style={{ backgroundColor: channelStyle.color }}
                            ></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Configurazione Sistema
                </div>
                <div className="space-y-1">
                  {configTabs.map((tab) => {
                    const Icon = getTabIcon(tab);
                    const isActive = activeTab === tab;

                    return (
                      <button
                        key={tab}
                        onClick={() => handleConfigSelect(tab)}
                        className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {tab}
                        {isActive && (
                          <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="px-4 py-2 text-sm text-gray-600">
                  Accesso come: <span className="font-medium">{user?.email}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};