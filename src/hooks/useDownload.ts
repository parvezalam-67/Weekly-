import { useState, useCallback, RefObject } from 'react';
import { toPng, toJpeg } from 'html-to-image';

/**
 * Super-stable, high-performance download engine.
 * Optimized for low latency on mobile and desktop devices.
 */
export function useDownload(ref: RefObject<HTMLElement | null>) {
  const [isExporting, setIsExporting] = useState(false);

  const download = useCallback(async () => {
    if (!ref.current) return;
    
    try {
      setIsExporting(true);

      const filter = (node: HTMLElement) => {
        return !node.classList?.contains?.('ignore-export');
      };

      const options = {
        cacheBust: false,
        pixelRatio: 2,
        width: 1000,
        height: 1000,
        backgroundColor: '#010101',
        filter,
        style: {
          borderRadius: '40px',
        }
      };

      let dataUrl: string | null = null;
      let attempts = 0;
      const maxRetries = 2;

      while (attempts < maxRetries && !dataUrl) {
        try {
          attempts++;
          dataUrl = await toPng(ref.current, options);
        } catch (err) {
          console.warn(`Export attempt ${attempts} (PNG) failed:`, err);
          if (attempts >= maxRetries) {
            try {
              console.log('Falling back to JPEG export...');
              dataUrl = await toJpeg(ref.current, { ...options, quality: 0.95 });
            } catch (jpegErr) {
              console.error('JPEG fallback failed:', jpegErr);
              throw jpegErr;
            }
          } else {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }

      if (!dataUrl) {
        throw new Error('Capture failed to generate image data.');
      }

      const extension = dataUrl.includes('image/jpeg') ? 'jpg' : 'png';
      const link = document.createElement('a');
      link.download = `sureshotfx-export.${extension}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error('Download System Error:', err);
      alert('Capture failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [ref]);

  return { download, isExporting };
}
