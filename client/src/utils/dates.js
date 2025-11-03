// convierte Date -> { isoYear, isoWeek }
export function dateToIsoWeek(dateInput) {
  const d = new Date(
    Date.UTC(
      dateInput.getUTCFullYear(),
      dateInput.getUTCMonth(),
      dateInput.getUTCDate()
    )
  );
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const isoYear = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.floor(((d - yearStart) / 86400000 + 10) / 7);
  return { isoYear, isoWeek: week };
}

// regresa un Date (UTC) para la semana ISO dada y día de la semana (1=lunes..7=domingo)
export function isoWeekToDate(isoYear, isoWeek, weekday = 1) {
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const firstThu = new Date(jan4);
  firstThu.setUTCDate(jan4.getUTCDate() + (4 - jan4Day));
  const monday = new Date(firstThu);
  monday.setUTCDate(firstThu.getUTCDate() - 3 + (isoWeek - 1) * 7);
  const target = new Date(monday);
  target.setUTCDate(monday.getUTCDate() + (weekday - 1));
  return target;
}

// "01–07 ene (2)"
export function isoWeekToRangeLabel(isoYear, isoWeek, locale = "es") {
  const start = isoWeekToDate(isoYear, isoWeek, 1);
  const end = isoWeekToDate(isoYear, isoWeek, 7);
  const fmt = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
  return `${fmt.format(start)}–${fmt.format(end)} (${isoWeek})`;
}

// YYYY-MM-DD (UTC)
export function toIsoDateString(dateInput) {
  const y = dateInput.getUTCFullYear();
  const m = `${dateInput.getUTCMonth() + 1}`.padStart(2, "0");
  const d = `${dateInput.getUTCDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}
