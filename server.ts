import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { JSDOM } from 'jsdom';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import Papa from 'papaparse';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get('/api/fetch-sheet', async (req, res) => {
    const sheetId = (req.query.id as string || '').trim();
    const category = (req.query.category as string || 'FOREX').toUpperCase();
    
    if (!sheetId) return res.status(400).json({ error: 'Spreadsheet ID is required' });

    try {
      let url = sheetId;
      
      // Unlock: Remove single=true to support multi-tab GID switching
      if (url.includes('single=true')) {
        url = url.replace('single=true', 'single=false');
      }

      if (!url.includes('docs.google.com/spreadsheets')) {
         if (url.startsWith('2PACX')) {
            url = `https://docs.google.com/spreadsheets/d/e/${url}/pubhtml`;
         } else {
            url = `https://docs.google.com/spreadsheets/d/${url}/pubhtml`;
         }
      }

      if (url.includes('/edit')) {
        url = url.split('/edit')[0] + '/pubhtml';
      }

      // GID Extraction from secrets
      let rawGid = '';
      if (category === 'GOLD') rawGid = process.env.VITE_GID_GOLD || '';
      else if (category === 'INDICES') rawGid = process.env.VITE_GID_INDICES || '';
      else rawGid = process.env.VITE_GID_FOREX || '';

      const targetGid = (rawGid.match(/\d+/) || [rawGid])[0].trim();
      if (targetGid && targetGid !== '') {
        url += (url.includes('?') ? '&' : '?') + `gid=${targetGid}`;
      }

      const fetchOptions = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      };

      // 1. Try CSV Fetch (Highest Reliability)
      const baseCsvUrl = url.split('?')[0].replace('/pubhtml', '/pub');
      const params = new URLSearchParams(url.split('?')[1] || '');
      params.set('output', 'csv');
      params.set('single', 'true');
      const csvUrl = `${baseCsvUrl}?${params.toString()}`;

      console.log(`[FETCH] Trying CSV for ${category}: ${csvUrl}`);
      const csvResp = await fetch(csvUrl, fetchOptions);
      
      if (csvResp.ok) {
        const csvText = await csvResp.text();
        if (csvText.length > 100) {
          const parsed = Papa.parse(csvText, { skipEmptyLines: true });
          const rows = parsed.data as string[][];

          let headerRowIndex = -1;
          for (let i = 0; i < Math.min(15, rows.length); i++) {
            const r = rows[i];
            if (r.some(c => typeof c === 'string' && c.trim().toLowerCase() === 'pair')) {
              headerRowIndex = i;
              break;
            }
          }

          if (headerRowIndex !== -1) {
            const header = rows[headerRowIndex].map(h => (h || '').trim().toLowerCase());
            const dateCol = header.findIndex(h => h === 'date');
            const pairCol = header.findIndex(h => h === 'pair');
            const dirCol = header.findIndex(h => h === 'dir' || h === 'direction');
            const entryCol = header.findIndex(h => h === 'entry');
            const netCol = header.findIndex(h => h.includes('net'));
            const lossCol = header.findIndex(h => h.includes('loss'));
            const wkCol = header.findIndex(h => h.includes('wk') || h.includes('week'));

            const allTrades: any[] = [];
            const weeksFound = new Set<number>();

            for (let i = headerRowIndex + 1; i < rows.length; i++) {
              const row = rows[i];
              if (!row || row.length < 3) continue;

              const rawDate = (row[dateCol] || '').trim();
              let rawPair = (row[pairCol] || '').trim();
              let rawDir = dirCol >= 0 ? (row[dirCol] || '').trim() : '';
              const rawEntry = entryCol >= 0 ? (row[entryCol] || '').trim() : '';
              const rawNet = netCol >= 0 ? (row[netCol] || '').trim() : '';
              const rawLoss = lossCol >= 0 ? (row[lossCol] || '').trim() : '';
              const rawWk = wkCol >= 0 ? (row[wkCol] || '').trim() : '';

              if (!rawDate && !rawPair) continue;
              if (rawDate.toUpperCase() === 'DATE' || rawPair.toUpperCase() === 'PAIR') continue;

              let pair = rawPair;
              let type = rawDir;
              const dirMatch = pair.match(/\s+(BUY(?:\s+LIMIT|\s+STOP)?|SELL(?:\s+LIMIT|\s+STOP)?)/i);
              if (dirMatch) {
                if (!type) type = dirMatch[1].trim();
                pair = pair.replace(dirMatch[0], '').trim();
              }
              if (!type && rawDir) type = rawDir;
              type = type.toUpperCase() || 'BUY';

              let net = 0;
              const netVal = parseInt(rawNet.replace(/[^0-9-]/g, ''), 10);
              const lossVal = parseInt(rawLoss.replace(/[^0-9-]/g, ''), 10);

              if (!isNaN(netVal) && netVal !== 0) {
                net = netVal;
              } else if (!isNaN(lossVal) && lossVal !== 0) {
                net = -Math.abs(lossVal);
              } else {
                continue;
              }

              // Rule: Do not count net 1 or 2 and do not show in table
              if (Math.abs(net) <= 2) {
                continue;
              }

              const wkNum = parseInt(rawWk, 10);
              if (!isNaN(wkNum) && wkNum > 0) {
                weeksFound.add(wkNum);
              }

              allTrades.push({
                date: rawDate,
                pair,
                type,
                entry: rawEntry,
                net,
                week: !isNaN(wkNum) ? wkNum : undefined
              });
            }

            if (allTrades.length > 0) {
              const sortedWeeks = Array.from(weeksFound).sort((a, b) => a - b);
              const latestWeek = sortedWeeks.length > 0 ? sortedWeeks[sortedWeeks.length - 1] : undefined;
              
              const reqWeeks = (req.query.weeks as string || req.query.week as string || '').trim();
              const reqPeriod = ((req.query.period as string) || (reqWeeks ? 'CUSTOM' : '1W')).toUpperCase();

              let targetWeeks: number[] = [];
              if (reqWeeks) {
                targetWeeks = reqWeeks.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
              } else if (reqPeriod === '2W') {
                targetWeeks = sortedWeeks.slice(-2);
              } else if (reqPeriod === '3W') {
                targetWeeks = sortedWeeks.slice(-3);
              } else if (reqPeriod === '4W' || reqPeriod === '1M') {
                targetWeeks = sortedWeeks.slice(-4);
              } else if (reqPeriod === '2M') {
                targetWeeks = sortedWeeks.slice(-8);
              } else if (reqPeriod === '3M') {
                targetWeeks = sortedWeeks.slice(-12);
              } else {
                targetWeeks = latestWeek ? [latestWeek] : [];
              }

              const targetWeeksSet = new Set(targetWeeks);
              let periodTrades = targetWeeksSet.size > 0
                ? allTrades.filter(t => t.week && targetWeeksSet.has(t.week))
                : allTrades.slice(-30);

              if (periodTrades.length === 0) {
                periodTrades = allTrades.slice(-30);
              }

              return sendResult(req, res, periodTrades, targetWeeks, sortedWeeks, reqPeriod);
            }
          }
        }
      }

      // 2. Fallback to HTML Scraping
      console.log(`[FETCH] Falling back to HTML for ${category}: ${url}`);
      const response = await fetch(url, fetchOptions);
      const html = await response.text();
      if (html.includes('google-signin-frame')) throw new Error('Sheet is Private. Set to Public -> Entire Document.');

      const dom = new JSDOM(html);
      const doc = dom.window.document;
      const tables = Array.from(doc.querySelectorAll('table, .waffle'));
      let table = tables.find(t => t.textContent?.toUpperCase().includes('BUY')) || tables[0];
      if (!table) throw new Error('Data table not found.');

      const style = Array.from(doc.querySelectorAll('style')).map(s => s.textContent).join(' ');
      const redClasses: string[] = [];
      const redRegex = /\.([a-z0-9]+)\s*\{[^}]*color:\s*(?:#f00|#ff0000|red|#cc4125|#ff4444)[^}]*\}/gi;
      let m; while ((m = redRegex.exec(style)) !== null) redClasses.push(m[1]);

      const trades = Array.from(table.querySelectorAll('tr')).map(tr => {
        const tds = Array.from(tr.querySelectorAll('td'));
        if (tds.length < 5) return null;
        const [d, p, t, e, n] = tds.map(td => td.textContent?.trim() || '');
        const l = tds.length >= 6 ? tds[5].textContent?.trim() || '' : '';
        let v = parseInt(n.replace(/[^0-9-]/g, ''), 10);
        const lv = parseInt(l.replace(/[^0-9-]/g, ''), 10);
        if (isNaN(v) || v === 0) {
          if (!isNaN(lv) && lv !== 0) v = -Math.abs(lv);
          else return null;
        }
        if (redClasses.some(c => tds[4].classList.contains(c)) && v > 0) v = -v;
        // Rule: Do not count net 1 or 2 and do not show in table
        if (Math.abs(v) <= 2) return null;
        return { date: d, pair: p, entry: e, net: v, type: t.toUpperCase() };
      }).filter(t => t && t.pair.length > 1 && t.pair.toUpperCase() !== 'PAIR');

      if (!trades.length) throw new Error('No valid trades found in sheet.');
      sendResult(req, res, trades as any[]);

    } catch (err: any) {
      console.error('[ERROR]', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  function sendResult(
    req: any,
    res: any,
    trades: any[],
    selectedWeeks?: number[],
    availableWeeks?: number[],
    period?: string
  ) {
    const filteredTrades = trades.filter((t: any) => Math.abs(t.net) > 2);
    const total = filteredTrades.reduce((s: number, t: any) => s + t.net, 0);
    const dateRange = filteredTrades.length > 0 ? `${filteredTrades[0].date} - ${filteredTrades[filteredTrades.length - 1].date}` : 'N/A';
    res.json({
      trades: filteredTrades,
      totalPips: total,
      dateRange,
      category: req.query.category,
      period: period || '1W',
      selectedWeeks: selectedWeeks || [],
      availableWeeks: availableWeeks || []
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const dist = path.join(process.cwd(), 'dist');
    app.use(express.static(dist));
    app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => console.log(`Server UP: 3000`));
  }
  return app;
}

export const appPromise = startServer();
