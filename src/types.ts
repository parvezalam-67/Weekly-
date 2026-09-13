export type Category = 'FOREX' | 'GOLD' | 'INDICES';
export type PeriodType = '1W' | '2W' | '3W' | '4W' | '1M' | '2M' | '3M' | 'CUSTOM';

export interface TradeRecord {
  date: string;
  pair: string;
  type: string;
  entry: string;
  net: number;
  week?: number;
}

export interface DashboardData {
  trades: TradeRecord[];
  totalPips: number;
  dateRange: string;
  trustpilotRating: number;
  isMock: boolean;
  category?: Category;
  period?: PeriodType;
  selectedWeeks?: number[];
  availableWeeks?: number[];
}
