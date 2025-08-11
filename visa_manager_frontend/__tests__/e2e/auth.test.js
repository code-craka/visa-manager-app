describe('Authentication E2E Tests', () => {
  test('should display login screen', async () => {
    await page.waitForSelector('[data-testid="login-screen"]', { timeout: 10000 });
    const loginScreen = await page.$('[data-testid="login-screen"]');
    expect(loginScreen).toBeTruthy();
  });

  test('should navigate to dashboard after login', async () => {
    // Mock successful login
    await page.evaluate(() => {
      window.localStorage.setItem('auth_token', 'mock-token');
    });
    
    await page.reload({ waitUntil: 'networkidle0' });
    
    await page.waitForSelector('[data-testid="dashboard-screen"]', { timeout: 10000 });
    const dashboard = await page.$('[data-testid="dashboard-screen"]');
    expect(dashboard).toBeTruthy();
  });

  test('should handle logout correctly', async () => {
    // Set up authenticated state
    await page.evaluate(() => {
      window.localStorage.setItem('auth_token', 'mock-token');
    });
    
    await page.reload({ waitUntil: 'networkidle0' });
    
    // Click logout button
    await page.click('[data-testid="logout-button"]');
    
    // Should redirect to login
    await page.waitForSelector('[data-testid="login-screen"]', { timeout: 10000 });
    const loginScreen = await page.$('[data-testid="login-screen"]');
    expect(loginScreen).toBeTruthy();
  });
});