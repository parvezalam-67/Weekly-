import React from 'react';
import { cn } from '../../lib/utils';
import { Category, PeriodType } from '../../types';

interface PeriodSelectorProps {
  period: PeriodType;
  onSelectPeriod: (period: PeriodType) => void;
  category?: Category;
  selectedWeeks?: number[];
  availableWeeks?: number[];
  onToggleWeek?: (wk: number) => void;
}

const PERIODS: PeriodType[] = ['1W', '2W', '3W', '4W', '1M', '2M', '3M', 'CUSTOM'];

export function PeriodSelector({
  period,
  onSelectPeriod,
  category = 'FOREX',
  selectedWeeks = [],
  availableWeeks = [],
  onToggleWeek
}: PeriodSelectorProps) {
  const isGold = category === 'GOLD';
  const isIndices = category === 'INDICES';

  const getPeriodLabel = () => {
    switch (period) {
      case '1W':
        return 'THIS WEEK';
      case '2W':
        return 'LAST 2 WEEKS';
      case '3W':
        return 'LAST 3 WEEKS';
      case '4W':
        return 'LAST 4 WEEKS';
      case '1M':
        return 'THIS MONTH';
      case '2M':
        return 'LAST 2 MONTHS';
      case '3M':
        return 'LAST 3 MONTHS';
      case 'CUSTOM':
        return selectedWeeks.length > 0
          ? `CUSTOM (${selectedWeeks.length} WEEKS)`
          : 'CUSTOM PERIOD';
      default:
        return 'THIS WEEK';
    }
  };

  const accentColorClass = isGold
    ? 'text-[#FFD700]'
    : isIndices
      ? 'text-[#3B82F6]'
      : 'text-[#00FF00]';

  const activePillClass = isGold
    ? 'bg-[#FFD700] text-black shadow-[0_0_15px_rgba(255,215,0,0.4)]'
    : isIndices
      ? 'bg-[#3B82F6] text-black shadow-[0_0_15px_rgba(59,130,246,0.4)]'
      : 'bg-[#00FF00] text-black shadow-[0_0_15px_rgba(0,255,0,0.4)]';

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-[1000px] z-[70] ignore-export">
      {/* Main Period Bar */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-4 px-3.5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl shadow-2xl">
        {/* Mobile Top Row: PERIOD label + Active Period Headline */}
        <div className="flex md:hidden w-full items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 select-none">
            PERIOD
          </span>
          <span className={cn("text-xs font-[1000] uppercase tracking-wider select-none", accentColorClass)}>
            {getPeriodLabel()}
          </span>
        </div>

        {/* Desktop Left: PERIOD Label */}
        <span className="hidden md:inline text-[11px] font-black uppercase tracking-[0.25em] text-white/40 select-none">
          PERIOD
        </span>

        {/* Center: Rounded Pill Container with period buttons */}
        <div className="w-full md:w-auto flex items-center justify-start md:justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-white/10 bg-white/[0.04] shadow-inner overflow-x-auto scrollbar-none">
          {PERIODS.map((p) => {
            const isActive = period === p;
            return (
              <button
                key={p}
                onClick={() => onSelectPeriod(p)}
                className={cn(
                  "px-3 sm:px-3.5 py-1.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 whitespace-nowrap shrink-0",
                  isActive
                    ? activePillClass
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Desktop Right: Active Period Headline */}
        <span className={cn("hidden md:inline text-xs sm:text-sm font-[1000] uppercase tracking-widest select-none", accentColorClass)}>
          {getPeriodLabel()}
        </span>
      </div>

      {/* Custom Weeks Drawer when CUSTOM is active */}
      {period === 'CUSTOM' && availableWeeks.length > 0 && (
        <div className="w-full flex flex-col gap-2 p-3 sm:p-4 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span className="font-black uppercase tracking-wider">Select Individual Weeks:</span>
            <span className="text-[10px] text-white/40">Click to toggle on/off</span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar pt-1">
            {availableWeeks.slice().reverse().map((wk) => {
              const isSelected = selectedWeeks.includes(wk);
              return (
                <button
                  key={wk}
                  onClick={() => onToggleWeek?.(wk)}
                  className={cn(
                    "px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-black transition-all min-w-[40px] text-center",
                    isSelected
                      ? (isGold
                          ? "bg-[#FFD700] text-black shadow-sm"
                          : isIndices
                            ? "bg-[#3B82F6] text-black shadow-sm"
                            : "bg-[#00FF00] text-black shadow-sm")
                      : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border border-white/5"
                  )}
                >
                  W{wk}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
