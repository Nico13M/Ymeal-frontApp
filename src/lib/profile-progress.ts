export function getProfileProgress(step: number, totalSteps: number) {
  const total = Math.max(0, totalSteps);
  const currentStep = Math.min(Math.max(step, 0), total);
  const progress = total > 0 ? currentStep / total : 0;
  return { currentStep, totalSteps: total, progress, percentage: Math.round(progress * 100) };
}
