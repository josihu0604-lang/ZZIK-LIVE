/**
 * E2E Tests for Geofence Accuracy Enhancement (ㄱ9)
 */

import { test, expect, Page } from '@playwright/test';
import { GPSSimulator } from '@/lib/testing/gps-simulator';

// Test store locations (matching mock data)
const TEST_STORES = {
  gangnam: { lat: 37.4979, lng: 127.0276, radius: 120 },
  seongsu: { lat: 37.5446, lng: 127.0565, radius: 120 },
  hongdae: { lat: 37.5563, lng: 126.9220, radius: 120 },
};

test.describe('Geofence Accuracy Enhancement', () => {
  let page: Page;

  test.beforeEach(async ({ context }) => {
    // Enable feature flag
    await context.addInitScript(() => {
      localStorage.setItem('FEATURE_GEOFENCE_V2', 'true');
    });

    page = await context.newPage();
    
    // Grant geolocation permission
    await context.grantPermissions(['geolocation']);
  });

  test('should display accuracy circle with correct confidence colors', async () => {
    // Mock high confidence GPS
    await context.setGeolocation({
      latitude: TEST_STORES.gangnam.lat,
      longitude: TEST_STORES.gangnam.lng,
      accuracy: 10, // High accuracy
    });

    await page.goto('/pass');
    
    // Wait for map to load
    await page.waitForSelector('.mapboxgl-canvas', { timeout: 10000 });
    
    // Check for accuracy circle (should be green for high confidence)
    const accuracyCircle = await page.evaluate(() => {
      const map = (window as any).mapboxgl?.Map?.instances?.[0];
      if (!map) return null;
      
      const layer = map.getLayer('accuracy-circle-fill');
      if (!layer) return null;
      
      return map.getPaintProperty('accuracy-circle-fill', 'fill-color');
    });
    
    expect(accuracyCircle).toBe('#22c55e'); // Green for high confidence
  });

  test('should show distance badges on store markers', async () => {
    await context.setGeolocation({
      latitude: TEST_STORES.gangnam.lat + 0.001, // Slightly offset
      longitude: TEST_STORES.gangnam.lng,
      accuracy: 15,
    });

    await page.goto('/pass');
    await page.waitForSelector('.store-marker', { timeout: 10000 });
    
    // Check for distance badge
    const badge = await page.locator('.distance-badge').first();
    await expect(badge).toBeVisible();
    
    // Badge should contain distance text
    const badgeText = await badge.textContent();
    expect(badgeText).toMatch(/\d+m|\d+km|근처/);
  });

  test('should gray out markers beyond geofence with low confidence', async () => {
    // Set position far from stores with poor accuracy
    await context.setGeolocation({
      latitude: TEST_STORES.gangnam.lat + 0.01, // ~1km away
      longitude: TEST_STORES.gangnam.lng + 0.01,
      accuracy: 100, // Poor accuracy
    });

    await page.goto('/pass');
    await page.waitForSelector('.store-marker', { timeout: 10000 });
    
    // Check marker has block status
    const marker = await page.locator('.store-marker.block').first();
    await expect(marker).toBeVisible();
    
    // Check opacity is reduced
    const opacity = await marker.evaluate(el => 
      window.getComputedStyle(el).opacity
    );
    expect(parseFloat(opacity)).toBeLessThan(1);
  });

  test('should display GPS status badge with accuracy info', async () => {
    await context.setGeolocation({
      latitude: TEST_STORES.gangnam.lat,
      longitude: TEST_STORES.gangnam.lng,
      accuracy: 25,
    });

    await page.goto('/pass');
    
    // Wait for GPS status badge
    const statusBadge = await page.locator('div:has-text("정확도")').first();
    await expect(statusBadge).toBeVisible({ timeout: 10000 });
    
    // Should display accuracy in meters
    const text = await statusBadge.textContent();
    expect(text).toContain('25m');
  });

  test('should handle GPS signal loss gracefully', async () => {
    await page.goto('/pass');
    
    // Initially set good GPS
    await context.setGeolocation({
      latitude: TEST_STORES.gangnam.lat,
      longitude: TEST_STORES.gangnam.lng,
      accuracy: 10,
    });
    
    await page.waitForSelector('.user-location-pin', { timeout: 10000 });
    
    // Simulate GPS loss by denying permission
    await context.clearPermissions();
    
    // Should show error message
    const errorMsg = await page.locator('text=/GPS|위치/').first();
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
  });

  test('should update marker validation on movement', async () => {
    // Start outside geofence
    await context.setGeolocation({
      latitude: TEST_STORES.gangnam.lat + 0.002,
      longitude: TEST_STORES.gangnam.lng,
      accuracy: 20,
    });

    await page.goto('/pass');
    await page.waitForSelector('.store-marker.warn, .store-marker.block', { 
      timeout: 10000 
    });
    
    // Move closer to store
    await context.setGeolocation({
      latitude: TEST_STORES.gangnam.lat,
      longitude: TEST_STORES.gangnam.lng,
      accuracy: 10,
    });
    
    // Marker should change to allow status
    await page.waitForSelector('.store-marker.allow', { timeout: 5000 });
    
    const allowMarker = await page.locator('.store-marker.allow').first();
    await expect(allowMarker).toBeVisible();
  });

  test('should show pulsing animation for low confidence', async () => {
    // Set poor GPS accuracy
    await context.setGeolocation({
      latitude: TEST_STORES.gangnam.lat,
      longitude: TEST_STORES.gangnam.lng,
      accuracy: 80, // Poor accuracy = low confidence
    });

    await page.goto('/pass');
    await page.waitForSelector('.mapboxgl-canvas', { timeout: 10000 });
    
    // Check for pulsing animation on accuracy circle
    const isPulsing = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        const map = (window as any).mapboxgl?.Map?.instances?.[0];
        if (!map) {
          resolve(false);
          return;
        }
        
        let opacityChanges = 0;
        let lastOpacity = -1;
        const checkInterval = setInterval(() => {
          const opacity = map.getPaintProperty('accuracy-circle-fill', 'fill-opacity');
          if (lastOpacity !== -1 && opacity !== lastOpacity) {
            opacityChanges++;
          }
          lastOpacity = opacity;
          
          if (opacityChanges >= 2) {
            clearInterval(checkInterval);
            resolve(true);
          }
        }, 100);
        
        // Timeout after 3 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(opacityChanges > 0);
        }, 3000);
      });
    });
    
    expect(isPulsing).toBe(true);
  });

  test('should respect strict mode for high-value offers', async () => {
    // Position just outside strict geofence
    await context.setGeolocation({
      latitude: TEST_STORES.gangnam.lat + 0.0015, // ~165m away
      longitude: TEST_STORES.gangnam.lng,
      accuracy: 20,
    });

    await page.goto('/pass');
    await page.waitForSelector('.store-marker', { timeout: 10000 });
    
    // For strict mode stores (bars), should be blocked even with decent accuracy
    const barMarker = await page.locator('.store-marker[data-category="bar"]').first();
    
    if (await barMarker.count() > 0) {
      const hasBlockClass = await barMarker.evaluate(el => 
        el.classList.contains('block')
      );
      expect(hasBlockClass).toBe(true);
    }
  });

  test('should track GPS telemetry events', async () => {
    // Intercept analytics calls
    const analyticsEvents: any[] = [];
    await page.route('**/api/telemetry/**', async (route) => {
      const request = route.request();
      const postData = request.postData();
      if (postData) {
        analyticsEvents.push(JSON.parse(postData));
      }
      await route.fulfill({ status: 200, body: 'ok' });
    });

    await context.setGeolocation({
      latitude: TEST_STORES.gangnam.lat,
      longitude: TEST_STORES.gangnam.lng,
      accuracy: 15,
    });

    await page.goto('/pass');
    await page.waitForTimeout(2000); // Wait for GPS updates
    
    // Check for GPS update events
    const gpsEvents = analyticsEvents.filter(e => e.event === 'gps_update');
    expect(gpsEvents.length).toBeGreaterThan(0);
    
    // Verify event contains required data
    if (gpsEvents.length > 0) {
      expect(gpsEvents[0]).toHaveProperty('accuracy');
      expect(gpsEvents[0]).toHaveProperty('confidence');
    }
  });

  test('should handle rapid position changes (driving scenario)', async () => {
    await page.goto('/pass');
    
    // Simulate rapid movement
    const positions = [
      { latitude: TEST_STORES.gangnam.lat, longitude: TEST_STORES.gangnam.lng },
      { latitude: TEST_STORES.gangnam.lat + 0.001, longitude: TEST_STORES.gangnam.lng },
      { latitude: TEST_STORES.gangnam.lat + 0.002, longitude: TEST_STORES.gangnam.lng },
      { latitude: TEST_STORES.gangnam.lat + 0.003, longitude: TEST_STORES.gangnam.lng },
    ];
    
    for (const pos of positions) {
      await context.setGeolocation({ ...pos, accuracy: 30 });
      await page.waitForTimeout(500); // Rapid updates
    }
    
    // Map should still be responsive
    const canvas = await page.locator('.mapboxgl-canvas');
    await expect(canvas).toBeVisible();
    
    // Check no console errors
    const consoleErrors = await page.evaluate(() => {
      return (window as any).__consoleErrors || [];
    });
    expect(consoleErrors.length).toBe(0);
  });
});

// Performance tests
test.describe('Geofence Performance', () => {
  test('should maintain 60 FPS with GPS updates', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({
      latitude: TEST_STORES.gangnam.lat,
      longitude: TEST_STORES.gangnam.lng,
      accuracy: 20,
    });

    await page.goto('/pass');
    
    // Start performance measurement
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const frames: number[] = [];
        let lastTime = performance.now();
        let rafId: number;
        
        const measureFrame = () => {
          const now = performance.now();
          const delta = now - lastTime;
          frames.push(1000 / delta); // Convert to FPS
          lastTime = now;
          
          if (frames.length < 60) {
            rafId = requestAnimationFrame(measureFrame);
          } else {
            resolve({
              avgFps: frames.reduce((a, b) => a + b, 0) / frames.length,
              minFps: Math.min(...frames),
              maxFps: Math.max(...frames),
            });
          }
        };
        
        rafId = requestAnimationFrame(measureFrame);
      });
    });
    
    expect(metrics.avgFps).toBeGreaterThan(50); // Should maintain > 50 FPS average
    expect(metrics.minFps).toBeGreaterThan(30); // No drops below 30 FPS
  });
});