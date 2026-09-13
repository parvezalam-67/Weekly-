import { useMemo } from 'react';
import { TradeRecord } from '../../types';
import { cn } from '../../lib/utils';

interface TradeTableProps {
  trades: TradeRecord[];
  category?: string;
}

/**
 * Trade Ledger Component — matches the SureShotFX reference design (Image 2).
 * - Standalone rounded frosted glass Header box
 * - Each date is an INDIVIDUAL rounded frosted glass card with gap spacing in between
 * - Frosted glass semi-transparency with backdrop blur letting background chart show through
 * - Responsive density:
 *   - Few dates / trades: boxes expand vertically & horizontally with spacious rows & typography
 *   - Standard (4-5 dates): balanced distribution perfectly filling the 1:1 canvas
 *   - Many dates / trades: boxes shrink compactly, with smooth scrolling if needed
 */
export function TradeTable({ trades, category = 'FOREX' }: TradeTableProps) {
  // Filter out net 1 or 2 trades (rule: do not count or show net 1 or 2)
  const displayTrades = useMemo(() => {
    return trades
      .filter((trade) => Math.abs(trade.net) > 2)
      .slice(0, 60);
  }, [trades]);

  const totalTrades = displayTrades.length;

  // Group trades by date, preserving order
  const groupedTrades = useMemo(() => {
    const groups: { date: string; trades: TradeRecord[] }[] = [];
    displayTrades.forEach((trade) => {
      const existing = groups.find((g) => g.date === trade.date);
      if (existing) {
        existing.trades.push(trade);
      } else {
        groups.push({ date: trade.date, trades: [trade] });
      }
    });
    return groups;
  }, [displayTrades]);

  const isGold = category === 'GOLD';
  const isIndices = category === 'INDICES';

  const accentColor = isGold ? '#FFD700' : isIndices ? '#60A5FA' : '#00FF41';
  const accentRed = '#FF3B3B';
  // Blue for BUY across all categories including GOLD
  const typeColorBuy = isIndices ? '#60A5FA' : '#5DADE2';
  const typeColorSell = '#FF8C00';

  const dateCount = groupedTrades.length;

  // Fully Responsive Dynamic Density Tiers:
  // - spacious: few dates (<= 2) or few trades (<= 12) -> boxes expand wider/taller with generous padding & typography
  // - comfortable: moderate trades (13 - 22) -> balanced proportion
  // - compact: typical weekly loads (23 - 35 trades) -> boxes shrink smoothly so ALL dates fit 100% inside canvas
  // - isScroll: only activate scrolling for extreme multi-month loads (> 35 trades)
  const isSpacious = totalTrades <= 12 || dateCount <= 2;
  const isCompact = totalTrades >= 23 && totalTrades <= 35;
  const isScroll = totalTrades > 35;

  const dateColWidth = isSpacious ? 'w-[18%]' : isCompact ? 'w-[15%]' : 'w-[16%]';
  const headerMb = isSpacious ? 'mb-3' : isCompact ? 'mb-1.5' : 'mb-2';
  const containerGap = isSpacious ? 'gap-3' : isCompact ? 'gap-1.5' : 'gap-2';

  const rowPadding = isSpacious
    ? 'py-2.5 sm:py-3'
    : isCompact
      ? 'py-0.5 sm:py-1'
      : 'py-1 sm:py-1.5';

  const pairTextSize = isSpacious
    ? 'text-[14px] sm:text-[15px]'
    : isCompact
      ? 'text-[12px] sm:text-[13px]'
      : 'text-[12.5px] sm:text-[13.5px]';

  const typeTextSize = isSpacious
    ? 'text-[13px] sm:text-[14px]'
    : isCompact
      ? 'text-[11px] sm:text-[12px]'
      : 'text-[11.5px] sm:text-[12.5px]';

  const entryTextSize = isSpacious
    ? 'text-[14px] sm:text-[15px]'
    : isCompact
      ? 'text-[12px] sm:text-[13px]'
      : 'text-[12.5px] sm:text-[13.5px]';

  const netTextSize = isSpacious
    ? 'text-[17px] sm:text-[19px]'
    : isCompact
      ? 'text-[14px] sm:text-[15.5px]'
      : 'text-[15px] sm:text-[17px]';

  const dateTextSize = isSpacious
    ? 'text-[15px] sm:text-[17px]'
    : isCompact
      ? 'text-[12.5px] sm:text-[14px]'
      : 'text-[13.5px] sm:text-[15px]';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Standalone Frosted Glass Header Box (Gold / Blue / Green Toned) ── */}
      <div
        className={cn(
          "shrink-0 flex items-center rounded-xl shadow-lg",
          headerMb
        )}
        style={{
          backgroundColor: isGold
            ? 'rgba(34, 26, 10, 0.65)'
            : isIndices
              ? 'rgba(10, 22, 40, 0.65)'
              : 'rgba(8, 24, 18, 0.65)',
          border: isGold
            ? '1px solid rgba(255, 215, 0, 0.18)'
            : isIndices
              ? '1px solid rgba(96, 165, 250, 0.18)'
              : '1px solid rgba(0, 255, 65, 0.15)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Date Column Header */}
        <div
          className={cn("shrink-0 flex items-center justify-center py-2 px-1", dateColWidth)}
          style={{
            borderRight: isGold
              ? '1px solid rgba(255, 215, 0, 0.14)'
              : isIndices
                ? '1px solid rgba(96, 165, 250, 0.14)'
                : '1px solid rgba(0, 255, 65, 0.14)',
            backgroundColor: isGold
              ? 'rgba(48, 36, 14, 0.5)'
              : isIndices
                ? 'rgba(14, 30, 56, 0.5)'
                : 'rgba(14, 38, 28, 0.5)',
          }}
        >
          <span className="text-[11px] sm:text-[12px] font-bold text-white/80 uppercase tracking-[0.2em]">
            Date
          </span>
        </div>
        {/* Data Column Headers */}
        <div className="flex-1 grid grid-cols-[28%_22%_28%_22%] py-2 px-2">
          <span className="text-[11px] sm:text-[12px] font-bold text-white/80 uppercase tracking-[0.2em] text-center">
            Pair
          </span>
          <span className="text-[11px] sm:text-[12px] font-bold text-white/80 uppercase tracking-[0.2em] text-center">
            Type
          </span>
          <span className="text-[11px] sm:text-[12px] font-bold text-white/80 uppercase tracking-[0.2em] text-center">
            Entry
          </span>
          <span className="text-[11px] sm:text-[12px] font-bold text-white/80 uppercase tracking-[0.2em] text-center">
            Net
          </span>
        </div>
      </div>

      {/* ── Body: Individual Frosted Glass Date Cards ── */}
      <div
        className={cn(
          'flex-1 min-h-0 flex flex-col',
          containerGap,
          isScroll && 'overflow-y-auto custom-scrollbar pr-0.5'
        )}
      >
        {groupedTrades.map((group) => {
          return (
            <div
              key={group.date}
              className={cn(
                "flex rounded-xl shadow-lg overflow-hidden transition-all shadow-[0_4px_24px_rgba(0,0,0,0.35)]",
                isScroll ? "shrink-0 min-h-0" : "flex-1 min-h-0"
              )}
              style={{
                backgroundColor: isGold
                  ? 'rgba(42, 34, 14, 0.58)'
                  : isIndices
                    ? 'rgba(16, 32, 54, 0.58)'
                    : 'rgba(16, 42, 30, 0.58)',
                border: isGold
                  ? '1px solid rgba(255, 215, 0, 0.18)'
                  : isIndices
                    ? '1px solid rgba(96, 165, 250, 0.18)'
                    : '1px solid rgba(255, 255, 255, 0.14)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                flex: isScroll ? undefined : `${group.trades.length} 1 0%`,
                minHeight: isScroll ? `${group.trades.length * 22}px` : 0,
              }}
            >
              {/* ── Date Badge Column ── */}
              <div
                className={cn("shrink-0 flex items-center justify-center px-1 select-none", dateColWidth)}
                style={{
                  borderRight: isGold
                    ? '1px solid rgba(255, 215, 0, 0.15)'
                    : isIndices
                      ? '1px solid rgba(96, 165, 250, 0.15)'
                      : '1px solid rgba(255, 255, 255, 0.12)',
                  backgroundColor: isGold
                    ? 'rgba(56, 44, 18, 0.5)'
                    : isIndices
                      ? 'rgba(20, 42, 70, 0.5)'
                      : 'rgba(22, 52, 38, 0.5)',
                }}
              >
                <span
                  className={cn(
                    "font-bold text-white uppercase tracking-tight text-center leading-tight",
                    dateTextSize
                  )}
                >
                  {group.date.replace('-', '\u2011')}
                </span>
              </div>

              {/* ── Trade Rows for this Date ── */}
              <div
                className="flex-1 min-h-0 flex flex-col justify-center"
                style={{
                  backgroundColor: isGold
                    ? 'rgba(38, 30, 12, 0.3)'
                    : isIndices
                      ? 'rgba(14, 28, 48, 0.3)'
                      : 'rgba(16, 38, 28, 0.3)',
                }}
              >
                {group.trades.map((trade, idx) => (
                  <div
                    key={`${trade.pair}-${idx}`}
                    className={cn(
                      "flex-1 min-h-0 grid grid-cols-[28%_22%_28%_22%] items-center px-2",
                      rowPadding,
                      idx !== 0 && "border-t border-white/[0.06]"
                    )}
                    style={{
                      backgroundColor: idx % 2 === 1
                        ? 'rgba(255, 255, 255, 0.025)'
                        : 'transparent',
                    }}
                  >
                    {/* Pair */}
                    <div
                      className={cn(
                        "font-bold text-white uppercase tracking-tight text-center truncate leading-none",
                        pairTextSize
                      )}
                    >
                      {trade.pair}
                    </div>

                    {/* Type */}
                    <div
                      className={cn(
                        "font-bold uppercase tracking-widest text-center truncate leading-none",
                        typeTextSize
                      )}
                      style={{
                        color: trade.type.includes('SELL') ? typeColorSell : typeColorBuy,
                      }}
                    >
                      {trade.type}
                    </div>

                    {/* Entry */}
                    <div
                      className={cn(
                        "font-semibold text-white/85 text-center font-mono tracking-tight leading-none",
                        entryTextSize
                      )}
                    >
                      {trade.entry}
                    </div>

                    {/* Net */}
                    <div
                      className={cn(
                        "font-bold text-center tabular-nums leading-none",
                        netTextSize
                      )}
                      style={{
                        color: trade.net >= 0 ? accentColor : accentRed,
                        textShadow: trade.net >= 0
                          ? `0 0 12px ${accentColor}55`
                          : `0 0 12px ${accentRed}55`,
                      }}
                    >
                      {Math.abs(trade.net)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {displayTrades.length === 0 && (
          <div className="flex-1 flex items-center justify-center opacity-20">
            <p className="font-bold text-xs uppercase tracking-[0.5em]">No data records</p>
          </div>
        )}
      </div>
    </div>
  );
}

