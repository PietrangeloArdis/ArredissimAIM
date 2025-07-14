/**
 * Smart budget formatting utility that adapts to value magnitude
 */

export const formatBudget = (value: number): string => {
  if (value >= 1_000_000) {
    return '€' + (value / 1_000_000).toFixed(2) + 'M';
  }
  if (value >= 100_000) {
    // ora mantiene una cifra decimale anziché arrotondare
    return '€' + (value / 1_000).toFixed(1) + 'k';
  }
  return '€' + value.toLocaleString('it-IT');
};

export const formatBudgetCompact = (value: number): string => {
  if (value >= 1_000_000) {
    return '€' + (value / 1_000_000).toFixed(1) + 'M';
  }
  if (value >= 1_000) {
    return '€' + Math.round(value / 1_000) + 'k';
  }
  return '€' + value.toLocaleString('it-IT');
};

export const formatBudgetDetailed = (value: number): string => {
  if (value >= 1_000_000) {
    return (
      '€' +
      (value / 1_000_000).toFixed(2) +
      'M (' +
      value.toLocaleString('it-IT') +
      ')'
    );
  }
  if (value >= 100_000) {
    return (
      '€' +
      Math.round(value / 1_000) +
      'k (' +
      value.toLocaleString('it-IT') +
      ')'
    );
  }
  return '€' + value.toLocaleString('it-IT');
};

// Helper to determine the best format based on context
export const getOptimalBudgetFormat = (
  value: number,
  context: 'chart' | 'table' | 'card' | 'tooltip'
): string => {
  switch (context) {
    case 'chart':
      return formatBudgetCompact(value);
    case 'table':
      return formatBudget(value);
    case 'card':
      return formatBudget(value);
    case 'tooltip':
      return formatBudgetDetailed(value);
    default:
      return formatBudget(value);
  }
};
