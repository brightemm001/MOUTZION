export function giftAmount(input: string): { valid: boolean; text: string } {
  if (typeof input !== 'string' || input.length > 32) return { valid: false, text: '' };
  const trimmed = input.trim();
  if (!trimmed) return { valid: true, text: 'a gift' };
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return { valid: false, text: '' };
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0 || value > 1000000000) return { valid: false, text: '' };
  return { valid: true, text: `₦${value.toLocaleString('en-NG', { maximumFractionDigits: 2 })}` };
}
