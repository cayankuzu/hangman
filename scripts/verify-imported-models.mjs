import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.HANGMAN_BASE_URL ?? "http://127.0.0.1:3030";
const outputDirectory = "test-results/imported-models";
const characters = [
  { name: "Adolf Hitler", slug: "hitler" },
  { name: "Şeyh Said", slug: "sheikh-said" },
];

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];

page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => errors.push(`page: ${error.message}`));

async function submitCurrentAnswer(shouldBeCorrect) {
  await page.evaluate(async (correct) => {
    const storeUrl = performance
      .getEntriesByType("resource")
      .map((entry) => entry.name)
      .find((name) => name.includes("gameStore.ts"));
    if (!storeUrl) throw new Error("Active game store module was not found.");
    const gameStoreModule = await import(/* @vite-ignore */ storeUrl);
    const state = gameStoreModule.useGameStore.getState();
    const question = state.questions[state.questionIndex];
    const selectedAnswer = correct
      ? question.correctAnswer
      : Array.isArray(question.correctAnswer)
        ? question.options.map((option) => option.id).reverse()
        : question.options.find(
            (option) => option.id !== question.correctAnswer,
          )?.id;
    if (!selectedAnswer) throw new Error("A test answer could not be prepared.");
    state.submitAnswer(selectedAnswer);
  }, shouldBeCorrect);
}

async function advanceQuestion() {
  await page.evaluate(async () => {
    const storeUrl = performance
      .getEntriesByType("resource")
      .map((entry) => entry.name)
      .find((name) => name.includes("gameStore.ts"));
    if (!storeUrl) throw new Error("Active game store module was not found.");
    const gameStoreModule = await import(/* @vite-ignore */ storeUrl);
    gameStoreModule.useGameStore.getState().advance();
  });
}

await page.goto(baseURL, { waitUntil: "networkidle" });
await page.screenshot({ path: `${outputDirectory}/home.png`, fullPage: true });

for (const character of characters) {
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.locator(".primaryButton").click();
  await page.locator(".characterCard").filter({ hasText: character.name }).click();
  await page.locator(".modeGrid canvas").first().waitFor({ state: "visible" });
  await page.waitForTimeout(3500);
  await page.screenshot({
    path: `${outputDirectory}/${character.slug}-modes.png`,
    fullPage: true,
  });

  await page.locator(".mode-execute").click();
  await page.locator(".gameLayout .sceneCanvas canvas").waitFor({ state: "visible" });
  await page.waitForTimeout(1800);
  await page.locator(".gameLayout .sceneCanvas").screenshot({
    path: `${outputDirectory}/${character.slug}-step-0.png`,
  });

  for (let step = 1; step <= 4; step += 1) {
    await submitCurrentAnswer(true);
    await page.locator(".gameLayout .sceneCanvas").waitFor({ state: "visible" });
    await page.waitForTimeout(650);
    await page.locator(".gameLayout .sceneCanvas").screenshot({
      path: `${outputDirectory}/${character.slug}-step-${step}.png`,
    });
    await advanceQuestion();
  }

  await submitCurrentAnswer(false);
  await page.waitForFunction(
    () => document.querySelector(".gameLayout .sceneCanvas")?.getAttribute("data-step") === "3",
  );
  await page.waitForTimeout(650);
  await page.locator(".gameLayout .sceneCanvas").screenshot({
    path: `${outputDirectory}/${character.slug}-wrong-retracts-step.png`,
  });
  await advanceQuestion();

  for (let step = 4; step <= 6; step += 1) {
    await submitCurrentAnswer(true);
    await page.waitForTimeout(step === 6 ? 1800 : 650);
    await page.locator(".gameLayout .sceneCanvas").screenshot({
      path: `${outputDirectory}/${character.slug}-step-${step}.png`,
    });
    if (step < 6) await advanceQuestion();
  }

  await page.waitForTimeout(4200);
  await page.locator(".gameLayout .sceneCanvas").screenshot({
    path: `${outputDirectory}/${character.slug}-strangulation-loop.png`,
  });
}

await browser.close();

if (errors.length > 0) {
  throw new Error(`Browser verification failed:\n${errors.join("\n")}`);
}

console.log(`Verified imported character models at ${baseURL}.`);
