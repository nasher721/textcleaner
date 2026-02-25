import { test, expect } from '@playwright/test'

test('paste note -> infer -> outputs visible', async ({ page }) => {
  await page.goto('/infer')
  await page.getByPlaceholder('Paste note').fill('MAP 70 on norepi. No focal deficit.')
  await page.getByRole('button', { name: 'Infer' }).click()
  await expect(page.getByTestId('cleaned')).toBeVisible()
  await expect(page.getByTestId('structured')).toBeVisible()
})
