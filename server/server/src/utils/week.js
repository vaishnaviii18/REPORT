// Week rules for The Report, all in the app's time zone (IST by default).
//   Monday to Saturday: people fill in their report.
//   Saturday 11:59 pm: last moment to send it.
//   Sunday: everyone's sent reports are revealed.
//   Monday: a new week starts.
// Dates are handled as plain 'YYYY-MM-DD' strings so time zones can't shift them.

const TZ = process.env.APP_TIMEZONE || 'Asia/Kolkata';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// 'YYYY-MM-DD' for a moment in time, as seen in the given time zone
function localDate(now = new Date(), tz = TZ) {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

// Add whole days to a 'YYYY-MM-DD' string
function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// 0 = Monday ... 6 = Sunday
function weekdayIndex(dateStr) {
  const js = new Date(`${dateStr}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return (js + 6) % 7;
}

// Monday of the week that contains dateStr
function weekStartOf(dateStr) {
  return addDays(dateStr, -weekdayIndex(dateStr));
}

function currentWeekStart(now = new Date(), tz = TZ) {
  return weekStartOf(localDate(now, tz));
}

// Last day people can still send (Saturday)
function deadlineDate(weekStart) {
  return addDays(weekStart, 5);
}

// Day the week's reports become visible (Sunday)
function revealDate(weekStart) {
  return addDays(weekStart, 6);
}

function isOpenForWriting(weekStart, now = new Date(), tz = TZ) {
  const today = localDate(now, tz);
  return today >= weekStart && today <= deadlineDate(weekStart);
}

function isRevealed(weekStart, now = new Date(), tz = TZ) {
  return localDate(now, tz) >= revealDate(weekStart);
}

function isValidDate(str) {
  if (typeof str !== 'string' || !DATE_RE.test(str)) return false;
  const d = new Date(`${str}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === str;
}

module.exports = {
  TZ,
  localDate,
  addDays,
  weekdayIndex,
  weekStartOf,
  currentWeekStart,
  deadlineDate,
  revealDate,
  isOpenForWriting,
  isRevealed,
  isValidDate,
};
