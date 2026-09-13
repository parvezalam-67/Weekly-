import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardData, Category, PeriodType } from '../types';
import { fetchSheetData } from '../services/sheetsService';

export function useDashboard(activeCategory: Category = 'FOREX') {
  const [period, setPeriod] = useState<PeriodType>('1W');
  // Store weeks as a ref to avoid triggering effects; expose a state copy for UI
  const selectedWeeksRef = useRef<number[]>([]);
  const [selectedWeeks, setSelectedWeeksState] = useState<number[]>([]);

  const [dataMap, setDataMap] = useState<Record<Category, DashboardData | null>>({
    FOREX: null,
    GOLD: null,
    INDICES: null
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Track the "load key" — only change it when user explicitly changes period/weeks/category
  const [loadKey, setLoadKey] = useState(0);

  const setSelectedWeeks = useCallback((weeks: number[]) => {
    selectedWeeksRef.current = weeks;
    setSelectedWeeksState(weeks);
  }, []);

  const loadData = useCallback(async (
    category: Category,
    currentPeriod: PeriodType,
    weeksList: number[],
    isRefresh = false
  ) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      const dashboardData = await fetchSheetData(
        category,
        undefined,
        currentPeriod,
        currentPeriod === 'CUSTOM' ? weeksList : undefined
      );
      
      setDataMap(prev => ({
        ...prev,
        [category]: dashboardData
      }));

      // Only update selected weeks from server response if we're NOT in CUSTOM mode
      // (to avoid overwriting user-chosen weeks) and DON'T update the state in a way
      // that would re-trigger the effect
      if (dashboardData.selectedWeeks && currentPeriod !== 'CUSTOM') {
        selectedWeeksRef.current = dashboardData.selectedWeeks;
        setSelectedWeeksState(dashboardData.selectedWeeks);
      }
      
      setError(null);
    } catch (err) {
      console.error(`[Dashboard Hook Error - ${category}]:`, err);
      setError(`Connection failed for ${category}. Verify spreadsheet tab/ID.`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Only re-run when category, period, or the loadKey changes (not selectedWeeks array ref)
  useEffect(() => {
    loadData(activeCategory, period, selectedWeeksRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, period, loadKey, loadData]);

  const toggleWeek = useCallback((wk: number) => {
    setPeriod('CUSTOM');
    const currentWeeks = selectedWeeksRef.current;
    let nextWeeks: number[];
    if (currentWeeks.includes(wk)) {
      const filtered = currentWeeks.filter(w => w !== wk);
      nextWeeks = filtered.length === 0 ? [wk] : filtered;
    } else {
      nextWeeks = [...currentWeeks, wk].sort((a, b) => a - b);
    }
    selectedWeeksRef.current = nextWeeks;
    setSelectedWeeksState(nextWeeks);
    // Trigger a new load with the updated custom weeks
    setLoadKey(k => k + 1);
  }, []);

  const selectPeriod = useCallback((newPeriod: PeriodType) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'CUSTOM') {
      setSelectedWeeks([]);
    }
    // Trigger reload
    setLoadKey(k => k + 1);
  }, [setSelectedWeeks]);

  return {
    data: dataMap[activeCategory],
    loading,
    refreshing,
    error,
    period,
    setPeriod: selectPeriod,
    selectedWeeks,
    setSelectedWeeks,
    toggleWeek,
    refresh: () => {
      setLoadKey(k => k + 1);
    }
  };
}
