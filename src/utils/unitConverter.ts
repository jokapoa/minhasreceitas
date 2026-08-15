export type UnitSystem = 'metric' | 'imperial';

// Common unit conversions
const CONVERSIONS: Record<string, { toImperial: { factor: number; unit: string }; toMetric?: { factor: number; unit: string } }> = {
  g: { toImperial: { factor: 0.035274, unit: 'oz' } },
  kg: { toImperial: { factor: 2.20462, unit: 'lbs' } },
  ml: { toImperial: { factor: 0.033814, unit: 'fl oz' } },
  l: { toImperial: { factor: 4.22675, unit: 'xícaras' } },
};

export function scaleAmount(baseAmount: number, baseServings: number, targetServings: number): number {
  if (!baseAmount || baseServings <= 0 || targetServings <= 0) return baseAmount;
  const scaled = (baseAmount / baseServings) * targetServings;
  return Number(scaled.toFixed(2));
}

export function formatFraction(val: number): string {
  if (val === 0) return '0';
  
  const whole = Math.floor(val);
  const frac = val - whole;
  
  let fracStr = '';
  if (Math.abs(frac - 0.5) < 0.05) fracStr = '½';
  else if (Math.abs(frac - 0.25) < 0.05) fracStr = '¼';
  else if (Math.abs(frac - 0.75) < 0.05) fracStr = '¾';
  else if (Math.abs(frac - 0.33) < 0.05) fracStr = '⅓';
  else if (Math.abs(frac - 0.66) < 0.05) fracStr = '⅔';
  else if (Math.abs(frac - 0.125) < 0.05) fracStr = '⅛';
  else if (frac > 0.05) fracStr = frac.toFixed(1).replace(/^0/, '');

  if (whole > 0 && fracStr) return `${whole} ${fracStr}`;
  if (whole > 0) return `${whole}`;
  return fracStr || `${val}`;
}

export function convertUnitAndAmount(
  amount: number,
  unit: string,
  targetSystem: UnitSystem
): { amount: number; unit: string; display: string } {
  if (!amount) return { amount: 0, unit, display: '' };
  
  const normalizedUnit = unit.toLowerCase().trim();
  
  if (targetSystem === 'imperial' && CONVERSIONS[normalizedUnit]) {
    const conv = CONVERSIONS[normalizedUnit].toImperial;
    const newAmount = Number((amount * conv.factor).toFixed(1));
    return {
      amount: newAmount,
      unit: conv.unit,
      display: `${formatFraction(newAmount)} ${conv.unit}`,
    };
  }
  
  return {
    amount,
    unit,
    display: `${formatFraction(amount)} ${unit}`,
  };
}
