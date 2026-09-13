import { useRef, useState, useEffect } from 'react';
import { Loader2, RefreshCw, AlertCircle, Download, ExternalLink, ChevronRight, ChevronLeft, ArrowUp } from 'lucide-react';
import { Sidebar } from './components/dashboard/Sidebar';
import { TradeTable } from './components/dashboard/TradeTable';
import { PipsOverview } from './components/dashboard/PipsOverview';
import { PeriodSelector } from './components/dashboard/PeriodSelector';
import { MobileTradeList } from './components/dashboard/MobileTradeList';
import { useDashboard } from './hooks/useDashboard';
import { useDownload } from './hooks/useDownload';
import { cn } from './lib/utils';
import { TechnicalChartBackground } from './components/dashboard/TechnicalChartBackground';
import { Category } from './types';
import forexBg from './public/forex.jpg';
import goldBg from './public/gold.jpg';
import indicesBg from './public/indices.jpg';

/**
 * Main Application Dashboard.
 * Professional refactored architecture using custom hooks, high-fidelity responsive scaling, and mobile optimizations.
 */
export default function App() {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [activeCategory, setActiveCategory] = useState<Category>('FOREX');
  const [view, setView] = useState<'table' | 'overview'>('table');
  const [mobileTab, setMobileTab] = useState<'banner' | 'list'>('banner');
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  const {
    data,
    loading,
    refreshing,
    error,
    refresh,
    period,
    setPeriod,
    selectedWeeks,
    toggleWeek
  } = useDashboard(activeCategory);
  const { download, isExporting } = useDownload(dashboardRef);

  // Monitor scroll position to display Back to Top button on mobile
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 150);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auto-scale 1000x1000 canvas to fit mobile viewports proportionally
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const calculatedScale = Math.min(width / 1000, 1);
        setScale(calculatedScale > 0 ? calculatedScale : 1);
      }
    };
    updateScale();
    const timer = setTimeout(updateScale, 50);
    window.addEventListener('resize', updateScale);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  const toggleView = () => setView(prev => prev === 'table' ? 'overview' : 'table');
  const isGold = activeCategory === 'GOLD';
  const isIndices = activeCategory === 'INDICES';

  const categories: Category[] = ['FOREX', 'GOLD', 'INDICES'];

  const spreadsheetUrl = (import.meta.env.VITE_SPREADSHEET_ID || '').startsWith('http')
    ? import.meta.env.VITE_SPREADSHEET_ID
    : `https://docs.google.com/spreadsheets/d/${import.meta.env.VITE_SPREADSHEET_ID}`;

  // Seamless export handler: switch to banner view if in mobile list view before exporting
  const handleExport = async () => {
    if (mobileTab === 'list') {
      setMobileTab('banner');
      await new Promise((res) => setTimeout(res, 40));
    }
    download();
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 py-4 sm:py-8 px-2.5 sm:px-4 min-h-screen bg-[#020802] w-full max-w-full relative">
      {/* Category Tabs */}
      <nav className="flex w-full max-w-[360px] sm:max-w-none sm:w-auto justify-center gap-1.5 sm:gap-4 p-1 sm:p-1.5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xl z-[70] ignore-export">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "flex-1 sm:flex-initial px-3.5 sm:px-8 py-2.5 sm:py-3 rounded-lg font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[10px] sm:text-xs transition-all text-center",
              activeCategory === cat
                ? (
                  cat === 'GOLD' ? "bg-[#FFD700] text-black shadow-[0_0_20px_rgba(255,215,0,0.3)]" :
                    cat === 'INDICES' ? "bg-[#3B82F6] text-black shadow-[0_0_20px_rgba(59,130,246,0.3)]" :
                      "bg-[#00FF00] text-black shadow-[0_0_20px_rgba(0,255,0,0.3)]"
                )
                : "text-white/40 hover:text-white hover:bg-white/5"
            )}
          >
            {cat}
          </button>
        ))}
      </nav>

      {/* Period Selector Bar (1W, 2W, 3W, 4W, 1M, 2M, 3M, CUSTOM) */}
      <PeriodSelector
        period={period}
        onSelectPeriod={setPeriod}
        category={activeCategory}
        selectedWeeks={selectedWeeks}
        availableWeeks={data?.availableWeeks || []}
        onToggleWeek={toggleWeek}
      />

      {/* Mobile Mode Switcher (Banner Preview vs Mobile Trade List) - visible on mobile screens */}
      <div className="flex md:hidden items-center p-1 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xl z-[70] ignore-export w-full max-w-[360px] gap-1">
        <button
          onClick={() => setMobileTab('banner')}
          className={cn(
            "flex-1 py-2 rounded-lg font-black uppercase tracking-wider text-[10px] transition-all text-center",
            mobileTab === 'banner'
              ? "bg-white/15 text-white shadow-sm border border-white/10"
              : "text-white/40 hover:text-white"
          )}
        >
          Banner Preview
        </button>
        <button
          onClick={() => setMobileTab('list')}
          className={cn(
            "flex-1 py-2 rounded-lg font-black uppercase tracking-wider text-[10px] transition-all text-center",
            mobileTab === 'list'
              ? (
                  isGold ? "bg-[#FFD700] text-black shadow-sm" :
                  isIndices ? "bg-[#3B82F6] text-black shadow-sm" :
                  "bg-[#00FF00] text-black shadow-sm"
                )
              : "text-white/40 hover:text-white"
          )}
        >
          Trades List ({data?.trades?.filter(t => Math.abs(t.net) > 2).length || 0})
        </button>
      </div>

      {/* Mobile Trades List Mode (Touch-optimized detail view for phones) */}
      {mobileTab === 'list' && (
        <div className="w-full max-w-[1000px] md:hidden ignore-export">
          <MobileTradeList
            trades={data?.trades || []}
            category={activeCategory}
            totalPips={data?.totalPips || 0}
            dateRange={data?.dateRange || 'SYNCING...'}
          />
        </div>
      )}

      {/* 1:1 Aspect Ratio Canvas Container Wrapper (Responsive Scaler) */}
      <div
        ref={containerRef}
        className={cn(
          "relative w-full max-w-[1000px] mx-auto group touch-pan-y select-none",
          mobileTab === 'list' ? "hidden md:block" : "block"
        )}
        style={{ height: `${1000 * scale}px` }}
      >
        <div
          style={{
            width: '1000px',
            height: '1000px',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <div
            ref={dashboardRef}
            className="w-[1000px] h-[1000px] bg-[#010501] overflow-hidden rounded-[32px] shadow-2xl flex border border-white/5 relative"
          >
            {/* Layer 0: Background Textures */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <div className={cn(
                "absolute top-0 right-0 w-full h-full",
                isGold
                  ? "bg-[radial-gradient(circle_at_80%_20%,#332200_0%,transparent_50%)]"
                  : isIndices
                    ? "bg-[radial-gradient(circle_at_80%_20%,#001a33_0%,transparent_50%)]"
                    : "bg-[radial-gradient(circle_at_80%_20%,#002200_0%,transparent_50%)]",
                view === 'table' ? "opacity-60" : "opacity-20"
              )} />
              <div className={cn(
                "absolute bottom-0 left-0 w-full h-full",
                isGold
                  ? "bg-[radial-gradient(circle_at_20%_80%,#221100_0%,transparent_50%)]"
                  : isIndices
                    ? "bg-[radial-gradient(circle_at_20%_80%,#000d1a_0%,transparent_50%)]"
                    : "bg-[radial-gradient(circle_at_20%_80%,#001100_0%,transparent_50%)]",
                view === 'table' ? "opacity-40" : "opacity-10"
              )} />

              {/* Universal Technical SVG Chart Background (Replaces Grid) */}
              <div className={cn(view === 'table' ? "opacity-100" : "opacity-30")}>
                <TechnicalChartBackground />
              </div>

              {/* Overview Background Image - full canvas, changes per active category */}
              {view === 'overview' && (
                <>
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
                    style={{
                      backgroundImage: `url(${
                        activeCategory === 'GOLD' ? goldBg
                        : activeCategory === 'INDICES' ? indicesBg
                        : forexBg
                      })`
                    }}
                  />
                  <div className="absolute inset-0 bg-black/55" />
                </>
              )}

            </div>

            {/* Layer 1: Dashboard UI */}
            <div className="relative z-10 w-full h-full flex">
              {/* Identity Sidebar - Unified on Overview */}
              <div className={cn(
                "w-[32%] shrink-0",
                view === 'table' ? "border-r border-white/5 bg-black/10 backdrop-blur-md" : "border-r-0 bg-transparent"
              )}>
                <Sidebar
                  dateRange={data?.dateRange || 'SYNCING...'}
                  totalPips={data?.totalPips || 0}
                  view={view}
                  category={activeCategory}
                  period={period}
                  selectedWeeks={selectedWeeks}
                />
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col p-3 lg:p-4 relative overflow-hidden">
                {/* Main Feed Engine */}
                <main className="flex-1 min-h-0 h-full relative mt-1">
                  {error ? (
                    <div className="h-full flex items-center justify-center p-10 bg-red-500/5 rounded-2xl border border-red-500/10 backdrop-blur-md">
                      <div className="text-center space-y-6">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" strokeWidth={2.5} />
                        <div>
                          <h4 className="text-red-500 font-black uppercase tracking-widest text-xs mb-2">Protocol Disruption</h4>
                          <p className="text-white/40 text-[11px] leading-relaxed max-w-[240px] mx-auto uppercase">
                            Spreadsheet handshake failed. Verify ID and public access.
                          </p>
                        </div>
                        <button
                          onClick={() => refresh()}
                          className="px-8 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl border border-red-500/30 transition-all"
                        >
                          Restart Engine
                        </button>
                      </div>
                    </div>
                  ) : loading && !data ? (
                    <div className="h-full flex flex-col items-center justify-center gap-6 bg-white/[0.02] rounded-2xl border border-white/5 backdrop-blur-lg">
                      <Loader2 className="w-12 h-12 text-[#00FF00] opacity-40" strokeWidth={1.5} />
                      <div className="text-center">
                        <p className="text-[11px] text-[#00FF00] font-black tracking-[0.5em] uppercase">decrypting_feed.bin</p>
                        <p className="text-[9px] text-white/20 font-black mt-2 uppercase tracking-widest">Awaiting Remote Synchronizer...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col">
                      {view === 'table' ? (
                        data && <TradeTable trades={data.trades} category={activeCategory} />
                      ) : (view === 'overview' && data) ? (
                        <PipsOverview totalPips={data.totalPips} dateRange={data.dateRange} />
                      ) : null}
                    </div>
                  )}
                </main>
              </div>
            </div>
          </div>
        </div>

        {/* View Switcher Arrow - positioned with right-2 sm:-right-4 */}
        <button
          onClick={toggleView}
          className="absolute right-2 sm:-right-4 top-1/2 -translate-y-1/2 z-[60] w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-black/85 hover:bg-black text-[#00FF00] rounded-full border border-white/15 shadow-2xl transition-all backdrop-blur-md"
          title={view === 'table' ? 'Switch to Overview' : 'Back to List'}
        >
          {view === 'table' ? <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>
      </div>

      {/* Control Station */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center w-full max-w-[1000px] justify-center ignore-export pb-6">
        <button
          onClick={handleExport}
          disabled={loading || !data || isExporting}
          className="order-1 sm:order-2 group relative flex items-center justify-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 bg-[#00FF00] hover:bg-[#39ff39] text-black rounded-2xl transition-all font-black shadow-[0_0_30px_rgba(0,255,0,0.2)] disabled:opacity-50 disabled:grayscale min-h-[48px]"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span className="uppercase text-[11px] sm:text-[10px] tracking-widest font-black">Generate Export</span>
        </button>

        <div className="order-2 sm:order-1 flex gap-3 sm:gap-4 items-center justify-between sm:justify-center">
          <button
            onClick={() => refresh()}
            disabled={refreshing || loading}
            className="flex-1 sm:flex-initial group relative flex items-center justify-center gap-2.5 sm:gap-3 px-5 sm:px-8 py-3.5 sm:py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/10 min-h-[48px]"
          >
            <RefreshCw className={cn("w-4 h-4 text-[#00FF00]", (refreshing || loading) && "animate-spin")} />
            <span className="font-black uppercase text-[10px] tracking-widest">Force Refresh</span>
          </button>

          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noreferrer"
            className="p-3.5 sm:p-4 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-2xl transition-all border border-white/10 flex items-center justify-center min-h-[48px] min-w-[48px]"
            title="Open Google Spreadsheet"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Floating Back to Top Button on mobile scroll */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-5 z-[80] flex items-center gap-1.5 px-3.5 py-2.5 bg-black/90 hover:bg-black text-[#00FF00] rounded-full border border-white/20 shadow-[0_4px_20px_rgba(0,255,0,0.25)] backdrop-blur-xl transition-all animate-in fade-in slide-in-from-bottom-3 duration-200 ignore-export"
          title="Back to Top"
        >
          <ArrowUp className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-wider pr-0.5">Top</span>
        </button>
      )}
    </div>
  );
}

