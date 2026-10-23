/* Adapted to JavaScript from Renhuai123/ziwei-doushu:
 * lib/ziwei/true-solar-time.ts (2026-10-23)
 * https://github.com/Renhuai123/ziwei-doushu
 * MIT License — Copyright (c) 2026 紫微研究
 * See LICENSE-ziwei-doushu.txt.
 */
const mod = (value, base) => ((value % base) + base) % base;

export function isValidGregorianDate(year, month, day) {
  if (![year, month, day].every(Number.isInteger)) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function equationOfTimeMinutes(year, month, day, clockHour = 12, clockMinute = 0) {
  if (!isValidGregorianDate(year, month, day)) return 0;
  const daysInYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365;
  const dayOfYear = Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 86400000);
  const gamma = (2 * Math.PI / daysInYear) * (dayOfYear - 1 + (clockHour + clockMinute / 60 - 12) / 24);
  return 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
}

export function calculateTrueSolarTime(input) {
  const dateValid = isValidGregorianDate(input.year, input.month, input.day);
  const corrected = input.longitude !== undefined && Number.isFinite(input.longitude);
  const longitudeCorrectionMinutes = corrected ? (input.longitude - 120) * 4 : 0;
  const eot = corrected && dateValid
    ? equationOfTimeMinutes(input.year, input.month, input.day, input.clockHour, input.clockMinute) : 0;
  const totalCorrectionMinutes = longitudeCorrectionMinutes + eot;
  const rawMinutes = input.clockHour * 60 + input.clockMinute + totalCorrectionMinutes;
  const roundedTotalSeconds = Math.round(rawMinutes * 60);
  const dayOffset = Math.floor(roundedTotalSeconds / 86400);
  const secondOfDay = mod(roundedTotalSeconds, 86400);
  const normalizedMinutes = secondOfDay / 60;
  return {
    dateValid, corrected, longitudeCorrectionMinutes, equationOfTimeMinutes: eot,
    totalCorrectionMinutes, rawMinutes, normalizedMinutes, dayOffset,
    hour: Math.floor(secondOfDay / 3600), minute: Math.floor((secondOfDay % 3600) / 60),
    second: secondOfDay % 60,
    branch: normalizedMinutes >= 1380 || normalizedMinutes < 60 ? 0 : Math.floor((normalizedMinutes - 60) / 120) + 1,
  };
}
