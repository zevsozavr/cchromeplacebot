// Nova Poshta тарифи (квітень 2026)
// https://novaposhta.ua/news/novi-taryfy-nova-poshta

const KG_PER_ITEM = 0.5; // estimated weight per clothing item

export function estimateWeight(itemCount: number): number {
  return Math.max(0.5, itemCount * KG_PER_ITEM);
}

export function getNovaPoshtaPrice(weightKg: number): number {
  if (weightKg <= 0.5) return 90;   // documents
  if (weightKg <= 2) return 90;     // до 2 кг
  if (weightKg <= 10) return 135;   // до 10 кг
  if (weightKg <= 30) return 200;   // до 30 кг
  // понад 30 кг — 11 грн/кг
  return Math.ceil(weightKg * 11);
}
