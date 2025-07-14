import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X, Info, CalendarDays, CalendarRange } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, addMonths, startOfMonth, endOfMonth, getYear, getMonth } from 'date-fns';
import { it } from 'date-fns/locale';

export type DatePreset = 
  | 'last-7-days'
  | 'last-30-days'
  | 'this-month'
  | 'last-month'
  | 'this-quarter'
  | 'last-quarter'
  | 'full-year'
  | 'custom'
  | 'specific-month'
  | 'month-range';

export interface DateRange {
  startDate: string;
  endDate: string;
  preset: DatePreset;
  label: string;
}

interface DateFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  showQuickPresets?: boolean;
}

const DATE_PRESETS = [
  {
    key: 'last-7-days' as DatePreset,
    label: 'Ultimi 7 giorni',
    description: 'Periodo mobile di 7 giorni da oggi',
    type: 'rolling' as const,
    icon: '📅'
  },
  {
    key: 'last-30-days' as DatePreset,
    label: 'Ultimi 30 giorni',
    description: 'Periodo mobile di 30 giorni da oggi',
    type: 'rolling' as const,
    icon: '📅'
  },
  {
    key: 'this-month' as DatePreset,
    label: 'Questo mese',
    description: 'Mese corrente',
    type: 'fixed' as const,
    icon: '📆'
  },
  {
    key: 'last-month' as DatePreset,
    label: 'Mese scorso',
    description: 'Mese precedente',
    type: 'fixed' as const,
    icon: '📆'
  },
  {
    key: 'this-quarter' as DatePreset,
    label: 'Questo trimestre',
    description: 'Trimestre corrente',
    type: 'fixed' as const,
    icon: '📊'
  },
  {
    key: 'last-quarter' as DatePreset,
    label: 'Trimestre scorso',
    description: 'Trimestre precedente',
    type: 'fixed' as const,
    icon: '📊'
  },
  {
    key: 'full-year' as DatePreset,
    label: 'Anno intero',
    description: 'Anno corrente',
    type: 'fixed' as const,
    icon: '🗓️'
  },
  {
    key: 'custom' as DatePreset,
    label: 'Intervallo personalizzato',
    description: 'Seleziona date di inizio e fine specifiche',
    type: 'custom' as const,
    icon: '🎯'
  }
];

export const DateFilter: React.FC<DateFilterProps> = ({ 
  value, 
  onChange, 
  className = '',
  showQuickPresets = true 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showMonthRangePicker, setShowMonthRangePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(value.startDate);
  const [customEndDate, setCustomEndDate] = useState(value.endDate);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedStartMonth, setSelectedStartMonth] = useState<Date>(new Date());
  const [selectedEndMonth, setSelectedEndMonth] = useState<Date>(addMonths(new Date(), 2));
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setShowCustomPicker(false);
        setShowMonthPicker(false);
        setShowMonthRangePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const calculateDateRange = (preset: DatePreset): { startDate: string; endDate: string } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (preset) {
      case 'last-7-days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        return {
          startDate: format(sevenDaysAgo, 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd')
        };
      
      case 'last-30-days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return {
          startDate: format(thirtyDaysAgo, 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd')
        };
      
      case 'this-month':
        // Use startOfMonth and endOfMonth to ensure correct dates
        const thisMonthStart = startOfMonth(now);
        const thisMonthEnd = endOfMonth(now);
        return {
          startDate: format(thisMonthStart, 'yyyy-MM-dd'),
          endDate: format(thisMonthEnd, 'yyyy-MM-dd')
        };
      
      case 'last-month':
        // Get previous month and use startOfMonth and endOfMonth
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthStart = startOfMonth(lastMonthDate);
        const lastMonthEnd = endOfMonth(lastMonthDate);
        return {
          startDate: format(lastMonthStart, 'yyyy-MM-dd'),
          endDate: format(lastMonthEnd, 'yyyy-MM-dd')
        };
      
      case 'this-quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
        return {
          startDate: format(quarterStart, 'yyyy-MM-dd'),
          endDate: format(quarterEnd, 'yyyy-MM-dd')
        };
      
      case 'last-quarter':
        const lastQuarterMonth = Math.floor(now.getMonth() / 3) * 3 - 3;
        const lastQuarterYear = lastQuarterMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
        const adjustedMonth = lastQuarterMonth < 0 ? lastQuarterMonth + 12 : lastQuarterMonth;
        const lastQuarterStart = new Date(lastQuarterYear, adjustedMonth, 1);
        const lastQuarterEnd = new Date(lastQuarterYear, adjustedMonth + 3, 0);
        return {
          startDate: format(lastQuarterStart, 'yyyy-MM-dd'),
          endDate: format(lastQuarterEnd, 'yyyy-MM-dd')
        };
      
      case 'full-year':
        // Use January 1st to December 31st of current year
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31);
        return {
          startDate: format(yearStart, 'yyyy-MM-dd'),
          endDate: format(yearEnd, 'yyyy-MM-dd')
        };
      
      default:
        return {
          startDate: value.startDate,
          endDate: value.endDate
        };
    }
  };

  const handlePresetSelect = (preset: DatePreset) => {
    if (preset === 'custom') {
      setShowCustomPicker(true);
      setShowMonthPicker(false);
      setShowMonthRangePicker(false);
      return;
    }

    const dateRange = calculateDateRange(preset);
    const presetConfig = DATE_PRESETS.find(p => p.key === preset);
    
    onChange({
      ...dateRange,
      preset,
      label: presetConfig?.label || preset
    });
    
    setShowDropdown(false);
  };

  const handleCustomRangeApply = () => {
    if (customStartDate && customEndDate) {
      onChange({
        startDate: customStartDate,
        endDate: customEndDate,
        preset: 'custom',
        label: `${new Date(customStartDate).toLocaleDateString()} - ${new Date(customEndDate).toLocaleDateString()}`
      });
      setShowCustomPicker(false);
      setShowDropdown(false);
    }
  };

  const handleSpecificMonthSelect = () => {
    setShowMonthPicker(true);
    setShowCustomPicker(false);
    setShowMonthRangePicker(false);
  };

  const handleMonthRangeSelect = () => {
    setShowMonthRangePicker(true);
    setShowCustomPicker(false);
    setShowMonthPicker(false);
  };

  const handleSpecificMonthApply = () => {
    // Ensure we're using the 1st day of the month for start date
    const monthStartDate = startOfMonth(selectedMonth);
    // Ensure we're using the last day of the month for end date
    const monthEndDate = endOfMonth(selectedMonth);
    
    const formattedMonth = format(selectedMonth, 'MMMM yyyy', { locale: it });
    
    onChange({
      startDate: format(monthStartDate, 'yyyy-MM-dd'),
      endDate: format(monthEndDate, 'yyyy-MM-dd'),
      preset: 'specific-month',
      label: formattedMonth
    });
    
    setShowMonthPicker(false);
    setShowDropdown(false);
  };

  const handleMonthRangeApply = () => {
    // Ensure we're using the 1st day of the start month
    const startMonthDate = startOfMonth(selectedStartMonth);
    // Ensure we're using the last day of the end month
    const endMonthDate = endOfMonth(selectedEndMonth);
    
    const formattedStartMonth = format(selectedStartMonth, 'MMMM', { locale: it });
    const formattedEndMonth = format(selectedEndMonth, 'MMMM', { locale: it });
    const year = getYear(selectedStartMonth);
    
    onChange({
      startDate: format(startMonthDate, 'yyyy-MM-dd'),
      endDate: format(endMonthDate, 'yyyy-MM-dd'),
      preset: 'month-range',
      label: `${formattedStartMonth}–${formattedEndMonth} ${year}`
    });
    
    setShowMonthRangePicker(false);
    setShowDropdown(false);
  };

  const formatDateRange = (range: DateRange): string => {
    if (range.preset === 'custom') {
      return range.label;
    }
    
    const presetConfig = DATE_PRESETS.find(p => p.key === range.preset);
    return presetConfig?.label || range.label;
  };

  const getPresetIcon = (preset: DatePreset): string => {
    const presetConfig = DATE_PRESETS.find(p => p.key === preset);
    return presetConfig?.icon || '📅';
  };

  const getPresetType = (preset: DatePreset): 'rolling' | 'fixed' | 'custom' => {
    const presetConfig = DATE_PRESETS.find(p => p.key === preset);
    return presetConfig?.type || 'fixed';
  };

  // Generate month options for the current and next year
  const generateMonthOptions = () => {
    const currentYear = new Date().getFullYear();
    const months = [];
    
    // Current year months
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, i, 1);
      months.push(date);
    }
    
    // Next year months
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear + 1, i, 1);
      months.push(date);
    }
    
    return months;
  };

  const monthOptions = generateMonthOptions();

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Quick Presets (if enabled) */}
      {showQuickPresets && (
        <div className="flex flex-wrap gap-2 mb-3">
          {DATE_PRESETS.slice(0, 4).map((preset) => (
            <button
              key={preset.key}
              onClick={() => handlePresetSelect(preset.key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                value.preset === preset.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={preset.description}
            >
              <span className="mr-1">{preset.icon}</span>
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Date Filter Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors ${
          value.preset === 'custom' || value.preset === 'specific-month' || value.preset === 'month-range' 
            ? 'border-blue-500 bg-blue-50' 
            : ''
        }`}
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-900">
          {value.preset === 'specific-month' || value.preset === 'month-range' 
            ? value.label 
            : `${getPresetIcon(value.preset)} ${formatDateRange(value)}`}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${
          showDropdown ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          {/* Custom Date Picker */}
          {showCustomPicker ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Intervallo Date Personalizzato</h3>
                <button
                  onClick={() => setShowCustomPicker(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Data Inizio
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Data Fine
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleCustomRangeApply}
                  disabled={!customStartDate || !customEndDate}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Applica Intervallo
                </button>
                <button
                  onClick={() => setShowCustomPicker(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Annulla
                </button>
              </div>
            </div>
          ) : showMonthPicker ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Seleziona Mese Specifico</h3>
                <button
                  onClick={() => setShowMonthPicker(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Mese
                </label>
                <select
                  value={`${getYear(selectedMonth)}-${getMonth(selectedMonth)}`}
                  onChange={(e) => {
                    const [year, month] = e.target.value.split('-').map(Number);
                    setSelectedMonth(new Date(year, month, 1));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {monthOptions.map((date, index) => (
                    <option 
                      key={index} 
                      value={`${getYear(date)}-${getMonth(date)}`}
                    >
                      {format(date, 'MMMM yyyy', { locale: it })}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleSpecificMonthApply}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Applica Mese
                </button>
                <button
                  onClick={() => setShowMonthPicker(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Annulla
                </button>
              </div>
            </div>
          ) : showMonthRangePicker ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Seleziona Intervallo di Mesi</h3>
                <button
                  onClick={() => setShowMonthRangePicker(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Mese Inizio
                  </label>
                  <select
                    value={`${getYear(selectedStartMonth)}-${getMonth(selectedStartMonth)}`}
                    onChange={(e) => {
                      const [year, month] = e.target.value.split('-').map(Number);
                      const newStartDate = new Date(year, month, 1);
                      setSelectedStartMonth(newStartDate);
                      
                      // Ensure end month is not before start month
                      if (newStartDate > selectedEndMonth) {
                        setSelectedEndMonth(newStartDate);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {monthOptions.map((date, index) => (
                      <option 
                        key={index} 
                        value={`${getYear(date)}-${getMonth(date)}`}
                      >
                        {format(date, 'MMMM yyyy', { locale: it })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Mese Fine
                  </label>
                  <select
                    value={`${getYear(selectedEndMonth)}-${getMonth(selectedEndMonth)}`}
                    onChange={(e) => {
                      const [year, month] = e.target.value.split('-').map(Number);
                      const newEndDate = new Date(year, month, 1);
                      
                      // Ensure end month is not before start month
                      if (newEndDate >= selectedStartMonth) {
                        setSelectedEndMonth(newEndDate);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {monthOptions
                      .filter(date => {
                        // Only show months that are after or equal to the start month
                        const startYear = getYear(selectedStartMonth);
                        const startMonth = getMonth(selectedStartMonth);
                        const year = getYear(date);
                        const month = getMonth(date);
                        
                        return (year > startYear) || (year === startYear && month >= startMonth);
                      })
                      .map((date, index) => (
                        <option 
                          key={index} 
                          value={`${getYear(date)}-${getMonth(date)}`}
                        >
                          {format(date, 'MMMM yyyy', { locale: it })}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleMonthRangeApply}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Applica Intervallo
                </button>
                <button
                  onClick={() => setShowMonthRangePicker(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Annulla
                </button>
              </div>
            </div>
          ) : (
            /* Preset Options */
            <>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                Intervalli Date Predefiniti
              </div>
              
              {/* Rolling Periods */}
              <div className="px-3 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-600">Periodi Mobili</span>
                  <Info className="w-3 h-3 text-gray-400" title="Si aggiorna automaticamente in base alla data corrente" />
                </div>
                {DATE_PRESETS.filter(p => p.type === 'rolling').map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => handlePresetSelect(preset.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                      value.preset === preset.key
                        ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    title={preset.description}
                  >
                    <span className="text-base">{preset.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{preset.label}</div>
                      <div className="text-xs text-gray-500">{preset.description}</div>
                    </div>
                    {getPresetType(preset.key) === 'rolling' && (
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>

              {/* Fixed Periods */}
              <div className="px-3 py-2 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-600">Periodi Fissi</span>
                  <Info className="w-3 h-3 text-gray-400" title="Periodi di calendario statici" />
                </div>
                {DATE_PRESETS.filter(p => p.type === 'fixed').map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => handlePresetSelect(preset.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                      value.preset === preset.key
                        ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    title={preset.description}
                  >
                    <span className="text-base">{preset.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{preset.label}</div>
                      <div className="text-xs text-gray-500">{preset.description}</div>
                    </div>
                    {getPresetType(preset.key) === 'fixed' && (
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Range Options */}
              <div className="px-3 py-2 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-600">Intervalli Personalizzati</span>
                  <Info className="w-3 h-3 text-gray-400" title="Seleziona periodi specifici" />
                </div>
                
                {/* Specific Month Option */}
                <button
                  onClick={handleSpecificMonthSelect}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    value.preset === 'specific-month'
                      ? 'bg-orange-50 text-orange-700 border-l-2 border-orange-500'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <CalendarDays className="w-5 h-5 text-orange-500" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">Mese specifico</div>
                    <div className="text-xs text-gray-500">Seleziona un singolo mese</div>
                  </div>
                </button>
                
                {/* Month Range Option */}
                <button
                  onClick={handleMonthRangeSelect}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    value.preset === 'month-range'
                      ? 'bg-orange-50 text-orange-700 border-l-2 border-orange-500'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <CalendarRange className="w-5 h-5 text-orange-500" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">Intervallo di mesi</div>
                    <div className="text-xs text-gray-500">Seleziona un periodo di più mesi</div>
                  </div>
                </button>
                
                {/* Custom Date Range Option */}
                <button
                  onClick={() => handlePresetSelect('custom')}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    value.preset === 'custom'
                      ? 'bg-orange-50 text-orange-700 border-l-2 border-orange-500'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-base">🎯</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium">Intervallo personalizzato</div>
                    <div className="text-xs text-gray-500">Seleziona date di inizio e fine specifiche</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to get default date range
export const getDefaultDateRange = (): DateRange => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  
  return {
    startDate: format(thirtyDaysAgo, 'yyyy-MM-dd'),
    endDate: format(now, 'yyyy-MM-dd'),
    preset: 'last-30-days',
    label: 'Ultimi 30 giorni'
  };
};

// Helper function to check if campaigns fall within date range
export const isCampaignInDateRange = (campaign: { startDate: string; endDate: string }, dateRange: DateRange): boolean => {
  const campaignStart = new Date(campaign.startDate);
  const campaignEnd = new Date(campaign.endDate);
  const rangeStart = new Date(dateRange.startDate);
  const rangeEnd = new Date(dateRange.endDate);
  
  // Check if campaign overlaps with the date range
  return campaignStart <= rangeEnd && campaignEnd >= rangeStart;
};