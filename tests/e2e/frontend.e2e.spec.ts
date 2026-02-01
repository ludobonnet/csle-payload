import { test, expect, Page } from '@playwright/test'

test.describe('Frontend', () => {
  let page: Page

  test.beforeAll(async ({ browser }, testInfo) => {
    const context = await browser.newContext()
    page = await context.newPage()
  })

  test('can go on homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Check that the page loads successfully
    await expect(page).toHaveTitle(/CSLE|Culture|Lifestyle/)

    // Verify the page has content (header exists)
    const header = page.locator('header')
    await expect(header).toBeVisible()
  })
})
