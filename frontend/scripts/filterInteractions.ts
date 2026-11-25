/** Open actual disclosure controls with user clicks before interacting with their fields. */
export async function openFilterPanels(page: any) {
  await page.locator(".topbar").waitFor();
  await page.locator(".jm-loading").waitFor({ state: "detached" });
  for (const panel of await page
    .locator("details[data-filter-panel],details.b-stage-menu")
    .all()) {
    if ((await panel.getAttribute("open")) === null) {
      const summary = panel.locator(":scope > summary");
      if (await summary.isVisible()) await summary.click();
    }
  }
}
export async function openAccountMenu(page:any){
  const account=page.locator('details.b-account-menu');
  if(await account.count() && await account.getAttribute('open')===null)await account.locator(':scope>summary').click();
}
