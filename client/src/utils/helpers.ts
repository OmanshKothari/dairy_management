export const stringToColor = (string: string) => {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

export const getMonthName = (monthIndex: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  // Adjust for 1-based index if necessary, but usually billing month is 1-12
  // If we assume 1-based input:
  return months[monthIndex - 1] || '';
};

export const formatCurrency = (amount: number, currencySymbol: string = '$') => {
    return `${currencySymbol}${amount.toFixed(2)}`;
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

export const getCurrentShift = (): string => {
  const hour = new Date().getHours();
  return hour < 14 ? 'MORNING' : 'EVENING';
};
