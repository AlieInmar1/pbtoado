const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://app.productboard.com/?redirect_to=https%3A%2F%2Finmar.productboard.com%2Fproducts-page%3Fd%3DMTpQbUVudGl0eToxZmRhZDY4YS02NjZlLTRkY2UtYjVlYi1iMzU2N2YwZGU1NWY%253D');
  await page.getByTestId('LoginForm-EmailField').click();
  await page.getByTestId('LoginForm-EmailField').fill('alexandra.cohen@inmar.com');
  await page.getByTestId('LoginForm-EmailField').press('Tab');
  await page.getByTestId('LoginForm-PasswordField').fill('Josephine354');
  await page.getByTestId('LoginForm-PasswordField').press('Enter');
  await page.getByTestId('LoginForm-Login-Button').click();
  await page.locator('#integrations').getByRole('img', { name: 'ChevronRightIcon' }).click();
  await page.getByRole('button', { name: 'AzureDevOpsIcon Push' }).click();
  await page.getByRole('button', { name: 'Link to existing issue' }).click();
  await page.getByTestId('Ado-LinkDialog-project-value').locator('div').first().click();
  await page.getByTestId('select-item-efc29725-fe27-4183-8cf5-a32bd856f30a').click();
  await page.getByTestId('Ado-LinkDialog-workItemId').click();
  await page.getByTestId('Ado-LinkDialog-workItemId').fill('12345');
  await page.getByTestId('Ado-LinkDialog-EntityPreview').locator('div').filter({ hasText: 'test story for sync' }).nth(1).click();
  await page.getByRole('button', { name: 'Link', exact: true }).click();
  await page.locator('div').filter({ hasText: /^Keep Productboard data$/ }).first().click();
  await page.getByRole('button', { name: 'Link', exact: true }).click();
  await page.close();

  // ---------------------
  await context.close();
  await browser.close();
})();