import { defineConfig, devices } from '@playwright/test';

const maven = process.platform === 'win32' ? 'mvn.cmd' : 'mvn';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: `${maven} -q -f ../backend/pom.xml spring-boot:run "-Dspring-boot.run.arguments=--server.port=18080 --spring.datasource.url=jdbc:h2:mem:passmate-e2e --spring.h2.console.enabled=false"`,
      url: 'http://localhost:18080/api/users',
      timeout: 120_000,
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      env: { NEXT_PUBLIC_API_BASE_URL: 'http://localhost:18080/api' },
      timeout: 120_000,
      reuseExistingServer: false,
    },
  ],
});
