import React, { useState } from 'react';
import { Calendar, Wifi, WifiOff, ChevronDown } from 'lucide-react';
import { DateFilter, DateRange } from '../DateFilter';
import { User } from 'firebase/auth';
import { useTranslation } from 'react-i18next';

interface DashboardHeaderProps {
  user: User | null;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  firestoreError: string | null;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  dateRange,
  onDateRangeChange,
  firestoreError
}) => {
  const { t, i18n } = useTranslation();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'it' ? 'en' : 'it';
    i18n.changeLanguage(newLang);
  };
  
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Analitica V5</h1>
        <p className="text-gray-600 mt-1">Bentornato, {user?.email}</p>
      </div>
      <div className="flex items-center gap-4">
        {/* Date Filter */}
        <DateFilter
          value={dateRange}
          onChange={onDateRangeChange}
          className="min-w-[200px]"
        />

        {/* Language Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            {i18n.language === 'it' ? '🇮🇹' : '🇬🇧'}
            <ChevronDown className={`w-3 h-3 transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showLanguageDropdown && (
            <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={() => {
                  i18n.changeLanguage('it');
                  setShowLanguageDropdown(false);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                🇮🇹 Italiano
              </button>
              <button
                onClick={() => {
                  i18n.changeLanguage('en');
                  setShowLanguageDropdown(false);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                🇬🇧 English
              </button>
            </div>
          )}
        </div>

        {/* Database Connection Status */}
        <div className="flex items-center gap-2">
          {firestoreError ? (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-lg">
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">Modalità Offline</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-lg">
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-medium">Connesso</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};