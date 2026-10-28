/** Time-of-day greeting for soft home header. Pure — no locale side effects beyond hour. */
export function dayGreeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 5) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}
