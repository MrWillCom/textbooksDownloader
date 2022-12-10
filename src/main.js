import { chromium, devices } from "@playwright/test";
import download from "download";
import path from "node:path";

const CONFIG = {
  PERIOD: "高中",
  SUBJECT: "数学",
  VERSION: "沪教版",
  OUT_DIR: "books",
};

(async () => {
  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext(devices["Desktop Chrome"]);
  const page = await context.newPage();

  await page.goto("https://www.zxx.edu.cn/elecEdu");

  await page.waitForLoadState("domcontentloaded");

  await page
    .locator("div", { hasText: "电子教材" })
    .getByText(CONFIG.PERIOD)
    .click();

  await page
    .locator("div", { hasText: "学科" })
    .locator(".fish-radio-group")
    .getByText(CONFIG.SUBJECT)
    .click();

  await page
    .locator("div", { hasText: "版本" })
    .locator(".fish-radio-group")
    .getByText(CONFIG.VERSION)
    .click();

  await page.waitForLoadState("networkidle");

  var booksList = await page.$$("img");

  for (const i in booksList) {
    if (Object.hasOwnProperty.call(booksList, i)) {
      const el = booksList[i];

      if ((await el.getAttribute("src")).match("-ndr.ykt.cbern.com.cn/")) {
        await el.click();
      }
    }
  }

  await page.close();

  const allPages = context.pages();
  const pdfs = [];

  for (const i in allPages) {
    if (Object.hasOwnProperty.call(allPages, i)) {
      await allPages[i].waitForLoadState("domcontentloaded");
      const url = new URL(allPages[i].url());
      pdfs.push({
        title: await allPages[i].title(),
        url: `https://r1-ndr.ykt.cbern.com.cn/edu_product/esp/assets_document/${url.searchParams.get(
          "contentId"
        )}.pkg/pdf.pdf`,
      });

      await allPages[i].close();
    }
  }

  await context.close();
  await browser.close();

  for (const i in pdfs) {
    if (Object.hasOwnProperty.call(pdfs, i)) {
      const pdf = pdfs[i];
      const filename = pdf.title + ".pdf";

      download(pdf.url, path.join(CONFIG.OUT_DIR), { filename }).then(() => {
        console.log(`Downloaded ${filename}`);
      });
    }
  }
})();
