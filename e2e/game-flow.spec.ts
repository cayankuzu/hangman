import { expect, test } from "@playwright/test";

test("language, difficulty and a 99-question round reach a result", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Asmaca/i })).toBeVisible();

  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Hangman/i })).toBeVisible();
  await page.getByRole("button", { name: "TR", exact: true }).click();

  await page.getByRole("button", { name: "Oyuna Başla" }).click();
  await expect(
    page.getByRole("heading", { name: "Karakterini seç" }),
  ).toBeVisible();

  await page.locator(".characterCard").first().click();
  await expect(page.locator(".difficultyPicker")).toBeVisible();
  await page.locator(".difficultyOptions button").nth(2).click();
  await expect(page.locator(".difficultyOptions button").nth(2)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator(".mode-execute").click();
  await expect(page.locator(".questionCard")).toBeVisible();
  await expect(page.locator(".roundStatus")).toContainText("Zor");

  for (let turn = 0; turn < 40; turn += 1) {
    const result = page.locator(".resultPanel");
    if (await result.isVisible().catch(() => false)) break;

    const explanation = page.locator(".answerExplanation");
    while (!(await explanation.isVisible().catch(() => false))) {
      const enabledAnswers = page.locator(".answerList button:enabled");
      if ((await enabledAnswers.count()) === 0) {
        await expect(explanation).toBeVisible();
        break;
      }
      await enabledAnswers.first().click();
    }

    await page.evaluate(() => {
      document.querySelector<HTMLButtonElement>(".nextButton")?.click();
    });
    await page.waitForTimeout(100);
  }

  await expect(page.locator(".resultPanel")).toBeVisible();
  await expect(page.locator(".resultCounts")).toContainText("Doğru");
  await expect(page.locator(".resultCounts")).toContainText("Yanlış");
  await expect(page.locator(".resultCounts")).toContainText("Yanıtlanan");
  await expect(page.locator(".resultCounts")).toContainText("Doğruluk");
});

test("avatar lab opens and saves transform settings", async ({ page }) => {
  await page.goto("/avatar-lab");
  await expect(page.getByRole("heading", { name: "Avatar Lab" })).toBeVisible();
  await page.getByRole("button", { name: "Ayarları kaydet" }).click();
  await expect(
    page.getByRole("button", { name: "Ayarlar kaydedildi ✓" }),
  ).toBeVisible();
});

test("all six characters can start a rescue round at 1280x720", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const names = [
    "Albert Einstein",
    "Jeffrey Epstein",
    "Stephen Hawking",
    "Şeyh Said",
    "Eric Cartman",
    "Adolf Hitler",
  ];

  for (const name of names) {
    await page.goto("/");
    await page.getByRole("button", { name: "Oyuna Başla" }).click();
    await page.locator(".characterCard").filter({ hasText: name }).click();
    await page.locator(".mode-rescue").click();
    await expect(page.locator(".questionCard")).toBeVisible();
    await expect(page.locator(".sceneCanvas")).toBeVisible();
  }
});

test("retry starts with a different question and reshuffled round", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Oyuna Başla" }).click();
  await page.locator(".characterCard").first().click();
  await page.locator(".mode-execute").click();

  const firstQuestion = await page.locator(".questionCard").getAttribute(
    "data-question-id",
  );
  await page.evaluate(async () => {
    const storeUrl = performance
      .getEntriesByType("resource")
      .map((entry) => entry.name)
      .find((name) => name.includes("gameStore.ts"));
    if (!storeUrl) throw new Error("Active game store module was not found.");
    const module = await import(/* @vite-ignore */ storeUrl);
    const state = module.useGameStore.getState();
    const question = state.questions[state.questionIndex];
    const wrongAnswer = Array.isArray(question.correctAnswer)
      ? [...question.correctAnswer].reverse()
      : question.options.find(
          (option: { id: string }) => option.id !== question.correctAnswer,
        )?.id;
    if (!wrongAnswer) throw new Error("A wrong answer could not be prepared.");
    state.submitAnswer(wrongAnswer);
    module.useGameStore.getState().advance();
  });
  await expect(page.locator(".resultPanel")).toBeVisible();
  await page.getByRole("button", { name: "Aynı karakterle tekrar oyna" }).click();

  const retryQuestion = await page.locator(".questionCard").getAttribute(
    "data-question-id",
  );
  expect(retryQuestion).not.toBe(firstQuestion);
});

test("mobile layout stays responsive", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Oyuna Başla" }).click();
  await page.locator(".characterCard").first().click();
  await page.locator(".difficultyOptions button").first().click();
  await page.locator(".mode-rescue").click();

  await expect(page.locator(".questionCard")).toBeVisible();
  await expect(page.locator(".sceneCanvas")).toHaveAttribute("data-step", "0");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("character rail scrolls by click-drag without a visible scrollbar", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".primaryButton").click();
  const rail = page.locator(".characterGrid");
  await expect(rail).toBeVisible();

  const box = await rail.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  const before = await rail.evaluate((element) => element.scrollLeft);
  await page.mouse.move(box.x + box.width - 80, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 120, box.y + box.height / 2, { steps: 12 });
  await page.mouse.up();
  const after = await rail.evaluate((element) => element.scrollLeft);

  expect(after).toBeGreaterThan(before + 20);
  await expect(rail).toHaveCSS("scrollbar-width", "none");
});

test("classic hangman supports keyboard guessing and both 3D outcomes", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".primaryButton").click();
  await page.locator(".characterCard").first().click();
  await page.locator(".mode-classic").click();
  await expect(page.locator(".classicKeyboard")).toBeVisible();

  const answer = await page.locator(".classicWord").getAttribute("aria-label");
  expect(answer).toBeTruthy();
  const winningKeys = [
    ...new Set(
      Array.from((answer ?? "").toLocaleUpperCase("tr-TR")).filter((value) =>
        /[\p{L}\p{N}]/u.test(value),
      ),
    ),
  ];
  for (const key of winningKeys) {
    await page.getByRole("button", { name: key, exact: true }).click();
  }

  await expect(page.locator(".classicResult")).toContainText("Kurtar");
  await expect(page.locator(".sceneCanvas")).toHaveAttribute(
    "data-mode",
    "rescue",
  );
  await expect(page.locator(".sceneCanvas")).toHaveAttribute("data-step", "6");

  await page.locator(".classicResult button").click();
  const nextAnswer =
    (await page.locator(".classicWord").getAttribute("aria-label")) ?? "";
  const normalizedAnswer = nextAnswer.toLocaleUpperCase("tr-TR");
  const wrongKeys = await page.locator(".classicKeyboard button").allTextContents();
  for (const key of wrongKeys.filter((value) => !normalizedAnswer.includes(value)).slice(0, 6)) {
    await page.getByRole("button", { name: key, exact: true }).click();
  }

  await expect(page.locator(".classicResult")).toContainText("Asıl");
  await expect(page.locator(".sceneCanvas")).toHaveAttribute(
    "data-mode",
    "execute",
  );
  await expect(page.locator(".sceneCanvas")).toHaveAttribute("data-step", "6");
});

test("mode order and the effects-only audio control match the final UX", async ({
  page,
}) => {
  await page.goto("/");
  const sound = page.locator(".soundToggle");
  await expect(sound).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".musicToggle")).toHaveCount(0);
  await sound.click();
  await expect(sound).toHaveAttribute("aria-pressed", "false");

  await page.locator(".primaryButton").click();
  await page.locator(".characterCard").first().click();
  await expect(page.locator(".modeCard > strong")).toHaveText([
    "KLASİK",
    "AS",
    "KURTAR",
  ]);
});

test("answers stay concise and expose a clickable source", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Asmaca");
  await page.locator(".primaryButton").click();
  await page.locator(".characterCard").first().click();
  await page.locator(".mode-execute").click();

  const question = page.locator(".questionCard h2");
  await expect(question).not.toContainText("Rahatsızlık doğru cevabı");
  await expect(question).not.toContainText("iki tarafı rahatsız");

  await page.locator(".answerList button").first().click();
  const answerPanel = page.locator(".answerExplanation");
  await expect(answerPanel.locator("p")).toHaveCount(0);

  const source = answerPanel.locator("a.sourceLink");
  await expect(source).toBeVisible();
  await expect(source).toHaveAttribute("href", /^https?:\/\//);
  await expect(source).toHaveAttribute("target", "_blank");
});

test("a failed rescue resolves to the full 3D hanging sequence", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".primaryButton").click();
  await page.locator(".characterCard").first().click();
  await page.locator(".mode-rescue").click();
  await expect(page.locator(".questionCard")).toBeVisible();

  await page.evaluate(async () => {
    const storeUrl = performance
      .getEntriesByType("resource")
      .map((entry) => entry.name)
      .find((name) => name.includes("gameStore.ts"));
    if (!storeUrl) throw new Error("Active game store module was not found.");
    const module = await import(/* @vite-ignore */ storeUrl);
    const state = module.useGameStore.getState();
    const question = state.questions[state.questionIndex];
    const wrongAnswer = Array.isArray(question.correctAnswer)
      ? [...question.correctAnswer].reverse()
      : question.options.find(
          (option: { id: string }) => option.id !== question.correctAnswer,
        )?.id;
    if (!wrongAnswer) throw new Error("A wrong answer could not be prepared.");
    state.submitAnswer(wrongAnswer);
    module.useGameStore.getState().advance();
  });

  await expect(page.locator(".resultPanel h1")).toContainText("Kurtarılamadı");
  const resultScene = page.locator(".resultStage .sceneCanvas");
  await expect(resultScene).toHaveAttribute("data-mode", "execute");
  await expect(resultScene).toHaveAttribute("data-step", "6");
  await expect(resultScene).toHaveAttribute("data-final", "hanged");
});
