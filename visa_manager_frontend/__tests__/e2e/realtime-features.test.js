describe('Real-time Features E2E Tests', () => {
  beforeEach(async () => {
    // Set up authenticated state
    await page.evaluate(() => {
      window.localStorage.setItem('auth_token', 'mock-token');
    });
    
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  });

  test('should display connection status', async () => {
    await page.waitForSelector('[data-testid="connection-status"]', { timeout: 10000 });
    
    const connectionStatus = await page.$eval(
      '[data-testid="connection-status"]',
      el => el.textContent
    );
    
    expect(['Online', 'Connecting...', 'Offline']).toContain(connectionStatus);
  });

  test('should handle real-time notifications', async () => {
    // Mock WebSocket message
    await page.evaluate(() => {
      const mockNotification = {
        type: 'notification',
        data: {
          notification: {
            id: 1,
            message: 'Test notification',
            read: false
          },
          action: 'new'
        },
        timestamp: new Date().toISOString()
      };
      
      // Simulate WebSocket message
      window.dispatchEvent(new CustomEvent('websocket-message', {
        detail: mockNotification
      }));
    });

    // Wait for notification to appear
    await page.waitForSelector('[data-testid="notification-item"]', { timeout: 5000 });
    
    const notification = await page.$('[data-testid="notification-item"]');
    expect(notification).toBeTruthy();
  });

  test('should sync data across tabs', async () => {
    // Open second tab
    const secondPage = await browser.newPage();
    await secondPage.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Make change in first tab
    await page.click('[data-testid="add-client-button"]');
    await page.type('[data-testid="client-name-input"]', 'Test Client');
    await page.click('[data-testid="save-client-button"]');
    
    // Wait for sync in second tab
    await secondPage.waitForSelector('[data-testid="client-list"]', { timeout: 10000 });
    
    const clientInSecondTab = await secondPage.$eval(
      '[data-testid="client-list"]',
      el => el.textContent.includes('Test Client')
    );
    
    expect(clientInSecondTab).toBe(true);
    
    await secondPage.close();
  });

  test('should handle offline/online transitions', async () => {
    // Simulate going offline
    await page.setOfflineMode(true);
    
    await page.waitForSelector('[data-testid="offline-indicator"]', { timeout: 5000 });
    const offlineIndicator = await page.$('[data-testid="offline-indicator"]');
    expect(offlineIndicator).toBeTruthy();
    
    // Simulate going back online
    await page.setOfflineMode(false);
    
    await page.waitForSelector('[data-testid="online-indicator"]', { timeout: 5000 });
    const onlineIndicator = await page.$('[data-testid="online-indicator"]');
    expect(onlineIndicator).toBeTruthy();
  });
});