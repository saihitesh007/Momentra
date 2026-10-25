import { expect, test } from "@playwright/test";

test("creates an event, generates a mocked plan, and supports keyboard tabs", async ({ page }) => {
  await page.route("**/api/ai/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], tasks: [], vendors: [], ideas: [] }) });
  });
  await page.goto("/new");
  await page.locator("#type-wedding").click();
  await expect(page.locator("#next-step")).toBeEnabled();
  await page.locator("#next-step").click();
  await expect(page.locator("#event-name")).toBeVisible();
  await page.locator("#event-name").fill("E2E Wedding");
  await page.locator("#event-date").fill("2027-11-20");
  await page.locator("#event-location").fill("Pune");
  await page.locator("#next-step").click();
  await expect(page.locator("#guest-count")).toBeVisible();
  await page.locator("#guest-count").fill("60");
  await page.locator("#total-budget").fill("250000");
  await page.locator("#next-step").click();
  await expect(page.locator("#notes")).toBeVisible();
  await page.locator("#notes").fill("Vegetarian menu");
  await page.getByRole("button", { name: /Generate my plan/ }).click();

  await expect(page).toHaveURL(/\/events\//);
  await expect(page.getByText("E2E Wedding", { exact: true })).toBeVisible();
  const tabs = page.getByRole("tablist").getByRole("tab");
  await tabs.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
});
