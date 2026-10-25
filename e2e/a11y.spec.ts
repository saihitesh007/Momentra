import { expect, test, type APIRequestContext } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const eventPayload = {
  name: "A11y Demo",
  type: "community",
  date: "2027-10-25",
  location: "Pune",
  guestCount: 80,
  budget: 100000,
  currency: "INR",
  notes: "Vegetarian",
};

async function createEvent(request: APIRequestContext) {
  const response = await request.post("/api/events", {
    headers: { "x-forwarded-for": `axe-${crypto.randomUUID()}` },
    data: eventPayload,
  });
  expect(response.ok()).toBeTruthy();
  return await response.json() as { id: string };
}

test("landing page has no tagged WCAG violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(results.violations).toEqual([]);
});

test("onboarding page has no tagged WCAG violations", async ({ page }) => {
  await page.goto("/new");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(results.violations).toEqual([]);
});

test("landing, onboarding, and event list reflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const path of ["/", "/new", "/events"]) {
    await page.goto(path);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  }
});

test("events list and event dashboard have no tagged WCAG violations", async ({ page, request }) => {
  const event = await createEvent(request);
  await page.goto("/events");
  let results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(results.violations).toEqual([]);
  await page.goto(`/events/${event.id}`);
  results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(results.violations).toEqual([]);
});
