import React from 'react';
import { TradeRecord, Category } from '../../types';
import { cn } from '../../lib/utils';

interface MobileTradeListProps {
  trades: TradeRecord[];
  category: Category;
  totalPips: number;
  dateRange: string;
}

export function MobileTradeList({
  trades,
  category,
  totalPips,
  dateRange,
}: MobileTradeListProps) {
  // Filter trades (exclude <= 2)
  const displayTrades = trades.filter((t) => Math.abs(t.net) > 2);

  // Group by date
  const groupedTrades: { date: string; trades: TradeRecord[] }[] = [];
  displayTrades.forEach((trade) => {
    const existing = groupedTrades.find((g) => g.date === trade.date);
    if (existing) {
      existing.trades.push(trade);
    } else {
      groupedTrades.push({ date: trade.date, trades: [trade] });
    }
  });

  const isGold = category === 'GOLD';
  const isIndices = category === 'INDICES';

  const accentColor = isGold ? '#FFD700' : isIndices ? '#3B82F6' : '#00FF00';
  const accentRed = '#FF3B3B';
  const typeColorBuy = isIndices ? '#60A5FA' : '#5DADE2';
  const typeColorSell = '#FF8C00';

  return (
    <div className="w-full flex flex-col gap-4 text-white animate-in fade-in duration-300">
      {/* Mobile Summary Hero Card */}
      <div
        className="w-full rounded-2xl p-5 shadow-2xl relative overflow-hidden flex items-center justify-between"
        style={{
          backgroundColor: isGold
            ? 'rgba(42, 34, 14, 0.75)'
            : isIndices
              ? 'rgba(16, 32, 54, 0.75)'
              : 'rgba(16, 42, 30, 0.75)',
          border: `1px solid ${isGold ? 'rgba(255, 215, 0, 0.25)' : isIndices ? 'rgba(96, 165, 250, 0.25)' : 'rgba(0, 255, 65, 0.25)'}`,
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-black uppercase tracking-wider"
              style={{ color: accentColor }}
            >
              {category}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
              VIP
            </span>
          </div>
          <span className="text-xs text-white/60 font-semibold tracking-tight">
            {dateRange}
          </span>
          <span className="text-[11px] text-white/40 uppercase tracking-wider font-bold mt-1">
            {displayTrades.length} Confirmed Trades
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span
            className="text-3xl font-[1000] tracking-tight leading-none"
            style={{
              color: accentColor,
              textShadow: `0 0 20px ${accentColor}66`,
            }}
          >
            {totalPips >= 0 ? `+${totalPips}` : totalPips}
          </span>
          <span className="text-xs font-black uppercase tracking-widest text-white/70 mt-1">
            PIPS
          </span>
        </div>
      </div>

      {/* Date-Grouped Trade Cards */}
      <div className="flex flex-col gap-3">
        {groupedTrades.map((group) => (
          <div
            key={group.date}
            className="rounded-2xl overflow-hidden shadow-lg"
            style={{
              backgroundColor: isGold
                ? 'rgba(34, 26, 10, 0.6)'
                : isIndices
                  ? 'rgba(10, 22, 40, 0.6)'
                  : 'rgba(8, 24, 18, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Date Header */}
            <div
              className="px-4 py-2.5 flex items-center justify-between"
              style={{
                backgroundColor: isGold
                  ? 'rgba(56, 44, 18, 0.4)'
                  : isIndices
                    ? 'rgba(20, 42, 70, 0.4)'
                    : 'rgba(22, 52, 38, 0.4)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <span className="text-xs font-black uppercase tracking-wider text-white">
                {group.date}
              </span>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                {group.trades.length} {group.trades.length === 1 ? 'trade' : 'trades'}
              </span>
            </div>

            {/* Trades for this date */}
            <div className="divide-y divide-white/[0.06]">
              {group.trades.map((trade, idx) => {
                const isBuy = !trade.type.toUpperCase().includes('SELL');
                const isProfit = trade.net >= 0;

                return (
                  <div
                    key={`${trade.pair}-${idx}`}
                    className="p-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Left: Pair and Type */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white uppercase tracking-tight">
                          {trade.pair}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"
                          style={{
                            backgroundColor: isBuy ? 'rgba(93, 173, 226, 0.15)' : 'rgba(255, 140, 0, 0.15)',
                            color: isBuy ? typeColorBuy : typeColorSell,
                            border: `1px solid ${isBuy ? 'rgba(93, 173, 226, 0.3)' : 'rgba(255, 140, 0, 0.3)'}`,
                          }}
                        >
                          {trade.type}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-white/60">
                        Entry: {trade.entry}
                      </span>
                    </div>

                    {/* Right: Net Pips */}
                    <div className="flex flex-col items-end">
                      <span
                        className="text-base font-bold tabular-nums"
                        style={{
                          color: isProfit ? accentColor : accentRed,
                          textShadow: isProfit
                            ? `0 0 10px ${accentColor}55`
                            : `0 0 10px ${accentRed}55`,
                        }}
                      >
                        {isProfit ? `+${trade.net}` : trade.net}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                        PIPS
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {displayTrades.length === 0 && (
          <div className="py-12 text-center text-white/30 text-xs font-bold uppercase tracking-widest">
            No trade records available
          </div>
        )}
      </div>
    </div>
  );
}
