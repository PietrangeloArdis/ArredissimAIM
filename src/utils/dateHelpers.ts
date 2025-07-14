export const getMonthName = (monthIndex: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex];
};

export const getQuarterFromMonth = (month: number): string => {
  if (month >= 0 && month <= 2) return 'Q1';
  if (month >= 3 && month <= 5) return 'Q2';
  if (month >= 6 && month <= 8) return 'Q3';
  return 'Q4';
};

export const getMonthsInQuarter = (quarter: string): number[] => {
  switch (quarter) {
    case 'Q1': return [0, 1, 2];
    case 'Q2': return [3, 4, 5];
    case 'Q3': return [6, 7, 8];
    case 'Q4': return [9, 10, 11];
    default: return [];
  }
};

export const generatePeriodOptions = (year: number = 2025) => {
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'].map(q => ({
    value: `${q} ${year}`,
    label: `${q} ${year}`,
    type: 'quarterly' as const
  }));

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: `${getMonthName(i)} ${year}`,
    label: `${getMonthName(i)} ${year}`,
    type: 'monthly' as const,
    monthIndex: i
  }));

  return { quarters, months };
};

export const isCampaignInPeriod = (
  campaign: { startDate: string; endDate: string },
  selectedPeriod: string,
  periodType: 'monthly' | 'quarterly'
): boolean => {
  const startDate = new Date(campaign.startDate);
  const endDate = new Date(campaign.endDate);
  
  if (periodType === 'monthly') {
    const [monthName, yearStr] = selectedPeriod.split(' ');
    const year = parseInt(yearStr);
    const monthIndex = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ].indexOf(monthName);
    
    const periodStart = new Date(year, monthIndex, 1);
    const periodEnd = new Date(year, monthIndex + 1, 0);
    
    // Check if campaign overlaps with the month
    return startDate <= periodEnd && endDate >= periodStart;
  } else {
    // Quarterly logic
    const [quarter, yearStr] = selectedPeriod.split(' ');
    const year = parseInt(yearStr);
    const monthsInQuarter = getMonthsInQuarter(quarter);
    
    const periodStart = new Date(year, monthsInQuarter[0], 1);
    const periodEnd = new Date(year, monthsInQuarter[2] + 1, 0);
    
    // Check if campaign overlaps with the quarter
    return startDate <= periodEnd && endDate >= periodStart;
  }
};