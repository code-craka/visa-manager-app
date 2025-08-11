describe('Responsive Design Tests', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 720 },
  ];

  viewports.forEach(({ name, width, height }) => {
    describe(`${name} Viewport (${width}x${height})`, () => {
      beforeEach(async () => {
        await page.setViewport({ width, height });
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
      });

      test('should display navigation correctly', async () => {
        if (width < 768) {
          // Mobile: Should show hamburger menu
          const hamburger = await page.$('[data-testid="mobile-menu-button"]');
          expect(hamburger).toBeTruthy();
        } else {
          // Tablet/Desktop: Should show full navigation
          const navigation = await page.$('[data-testid="desktop-navigation"]');
          expect(navigation).toBeTruthy();
        }
      });

      test('should adapt layout for screen size', async () => {
        const container = await page.$('[data-testid="main-container"]');
        const containerBox = await container.boundingBox();
        
        expect(containerBox.width).toBeLessThanOrEqual(width);
        expect(containerBox.height).toBeLessThanOrEqual(height);
      });

      test('should handle touch/mouse interactions', async () => {
        const button = await page.$('[data-testid="primary-button"]');
        
        if (width < 768) {
          // Mobile: Test touch interaction
          await button.tap();
        } else {
          // Desktop: Test mouse interaction
          await button.hover();
          await button.click();
        }
        
        await page.waitForSelector('[data-testid="button-clicked"]', { timeout: 5000 });
        const result = await page.$('[data-testid="button-clicked"]');
        expect(result).toBeTruthy();
      });
    });
  });
});