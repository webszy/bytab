interface FixedHoliday {
  month: number;
  day: number;
  name: string;
}

const universal: FixedHoliday[] = [
  { month: 1, day: 1, name: "New Year's Day" },
];
const regional: Record<string, FixedHoliday[]> = {
  US: [
    { month: 7, day: 4, name: 'Independence Day' },
    { month: 11, day: 11, name: 'Veterans Day' },
    { month: 12, day: 25, name: 'Christmas Day' },
  ],
  GB: [{ month: 12, day: 25, name: 'Christmas Day' }],
  CN: [
    { month: 5, day: 1, name: 'Labour Day' },
    { month: 10, day: 1, name: 'National Day' },
  ],
  FR: [
    { month: 5, day: 1, name: 'Labour Day' },
    { month: 7, day: 14, name: 'Bastille Day' },
    { month: 12, day: 25, name: 'Christmas Day' },
  ],
};

export function holidayLabel(now: Date, locale: string): string {
  let region: string | undefined;
  try {
    // Deliberately do not infer a country from a language such as "en" or "zh".
    region = new Intl.Locale(locale).region;
  } catch {
    region = undefined;
  }
  const holidays = [...universal, ...(region ? regional[region] ?? [] : [])];
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const candidates = [now.getFullYear(), now.getFullYear() + 1].flatMap(year =>
    holidays.map(holiday => ({
      ...holiday,
      date: new Date(year, holiday.month - 1, holiday.day),
      days: (Date.UTC(year, holiday.month - 1, holiday.day) - today) / 86_400_000,
    })));
  const next = candidates.filter(holiday => holiday.days >= 0 && holiday.days <= 30)
    .sort((left, right) => left.days - right.days)[0];
  if (!next) return '';
  if (next.days === 0) return `${next.name} · Today`;
  const date = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(next.date);
  return `${next.name} · ${date}`;
}
