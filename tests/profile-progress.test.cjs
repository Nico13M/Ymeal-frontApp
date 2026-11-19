const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/load-typescript.cjs");
const { getProfileProgress } = load("src/lib/profile-progress.ts");

test("profile progress follows all seven questions and clamps the confirmation screen", () => {
  assert.deepEqual(Array.from({ length: 9 }, (_, step) => getProfileProgress(step, 7).percentage), [0, 14, 29, 43, 57, 71, 86, 100, 100]);
  assert.equal(getProfileProgress(8, 7).currentStep, 7);
});

test("profile progress uses the supplied step count, including backward navigation", () => {
  assert.equal(getProfileProgress(1, 4).percentage, 25);
  assert.equal(getProfileProgress(3, 4).percentage, 75);
  assert.equal(getProfileProgress(2, 4).percentage, 50);
  assert.deepEqual(getProfileProgress(0, 0), { currentStep: 0, totalSteps: 0, progress: 0, percentage: 0 });
});
