export function formatMAD(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    maximumFractionDigits: 0,
  }).format(amount) + ' MAD';
}

export function formatWeight(kg: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
  }).format(kg) + ' kg';
}

export function formatVolume(m3: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(m3) + ' m³';
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}
