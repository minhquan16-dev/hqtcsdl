const fs = require('node:fs');
const path = require('node:path');
const cron = require('node-cron');
const { runSystemTask } = require('./systemTaskService');

const ROOT_DIR = path.resolve(__dirname, '../..');
const SCHEDULE_FILE = path.join(ROOT_DIR, 'backend', 'data', 'system-schedule.json');
const TIMEZONE = process.env.SYSTEM_SCHEDULE_TIMEZONE || 'Asia/Ho_Chi_Minh';

const DEFAULT_SCHEDULE = {
  enabled: false,
  jobType: 'crawl',
  frequency: 'daily',
  time: '02:00',
  dayOfWeek: '1',
  intervalHours: '6',
  dayOfMonth: '1',
  quarterMonth: 'first',
  cronExpression: '0 2 * * *',
};

const QUARTER_MONTHS = {
  first: '1,4,7,10',
  middle: '2,5,8,11',
  last: '3,6,9,12',
};

const JOB_LABELS = {
  crawl: 'Cào dữ liệu tuyển dụng',
  etl: 'Chạy ETL kho dữ liệu',
  crawl_then_etl: 'Cào dữ liệu rồi chạy ETL',
};

let scheduledTask = null;
let currentSchedule = null;
let activeJob = null;

function ensureDataDir() {
  fs.mkdirSync(path.dirname(SCHEDULE_FILE), { recursive: true });
}

function isValidTime(value) {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hour, minute] = value.split(':').map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function normalizeTime(value) {
  return isValidTime(value) ? value : DEFAULT_SCHEDULE.time;
}

function normalizeDayOfWeek(value) {
  const day = Number(value);
  if (Number.isInteger(day) && day >= 0 && day <= 6) return String(day);
  return DEFAULT_SCHEDULE.dayOfWeek;
}

function normalizeIntervalHours(value) {
  const hours = Number(value);
  if (Number.isInteger(hours) && hours >= 1 && hours <= 23) return String(hours);
  return DEFAULT_SCHEDULE.intervalHours;
}

function normalizeDayOfMonth(value) {
  const day = Number(value);
  if (Number.isInteger(day) && day >= 1 && day <= 28) return String(day);
  return DEFAULT_SCHEDULE.dayOfMonth;
}

function normalizeQuarterMonth(value) {
  return Object.prototype.hasOwnProperty.call(QUARTER_MONTHS, value)
    ? value
    : DEFAULT_SCHEDULE.quarterMonth;
}

function buildCronExpression(schedule) {
  if (schedule.frequency === 'interval') {
    return `0 */${normalizeIntervalHours(schedule.intervalHours)} * * *`;
  }

  const [hour, minute] = normalizeTime(schedule.time).split(':');

  if (schedule.frequency === 'monthly') {
    return `${Number(minute)} ${Number(hour)} ${normalizeDayOfMonth(schedule.dayOfMonth)} * *`;
  }

  if (schedule.frequency === 'quarterly') {
    const quarterMonth = normalizeQuarterMonth(schedule.quarterMonth);
    return `${Number(minute)} ${Number(hour)} ${normalizeDayOfMonth(schedule.dayOfMonth)} ${QUARTER_MONTHS[quarterMonth]} *`;
  }

  if (schedule.frequency === 'weekly') {
    return `${Number(minute)} ${Number(hour)} * * ${normalizeDayOfWeek(schedule.dayOfWeek)}`;
  }

  return `${Number(minute)} ${Number(hour)} * * *`;
}

function normalizeSchedule(input = {}) {
  const schedule = {
    ...DEFAULT_SCHEDULE,
    ...input,
  };

  if (!Object.prototype.hasOwnProperty.call(JOB_LABELS, schedule.jobType)) {
    schedule.jobType = DEFAULT_SCHEDULE.jobType;
  }

  if (!['daily', 'weekly', 'monthly', 'quarterly', 'interval'].includes(schedule.frequency)) {
    schedule.frequency = DEFAULT_SCHEDULE.frequency;
  }

  schedule.enabled = Boolean(schedule.enabled);
  schedule.time = normalizeTime(schedule.time);
  schedule.dayOfWeek = normalizeDayOfWeek(schedule.dayOfWeek);
  schedule.intervalHours = normalizeIntervalHours(schedule.intervalHours);
  schedule.dayOfMonth = normalizeDayOfMonth(schedule.dayOfMonth);
  schedule.quarterMonth = normalizeQuarterMonth(schedule.quarterMonth);
  schedule.cronExpression = buildCronExpression(schedule);

  return schedule;
}

function readStoredSchedule() {
  try {
    const raw = fs.readFileSync(SCHEDULE_FILE, 'utf8');
    return normalizeSchedule(JSON.parse(raw));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('Không đọc được lịch hệ thống, dùng cấu hình mặc định:', error.message);
    }
    return normalizeSchedule();
  }
}

function writeStoredSchedule(schedule) {
  ensureDataDir();
  fs.writeFileSync(SCHEDULE_FILE, `${JSON.stringify(schedule, null, 2)}\n`, 'utf8');
}

async function executeJob(jobType) {
  if (jobType === 'crawl_then_etl') {
    const crawl = await runSystemTask('crawl');
    const etl = await runSystemTask('etl');
    return { steps: [crawl, etl] };
  }

  return { steps: [await runSystemTask(jobType)] };
}

function startSystemJob(jobType, source = 'manual') {
  if (!Object.prototype.hasOwnProperty.call(JOB_LABELS, jobType)) {
    const error = new Error('Tác vụ hệ thống không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  if (activeJob) {
    const error = new Error(`Đang chạy tác vụ "${activeJob.label}", vui lòng chờ hoàn tất`);
    error.statusCode = source === 'schedule' ? 409 : 423;
    throw error;
  }

  const startedAt = new Date();
  const job = {
    jobType,
    label: JOB_LABELS[jobType],
    source,
    startedAt: startedAt.toISOString(),
  };

  activeJob = job;

  executeJob(jobType)
    .then((result) => {
      console.log(`Hoàn tất tác vụ hệ thống "${job.label}"`, {
        source,
        startedAt: job.startedAt,
        finishedAt: new Date().toISOString(),
        steps: result.steps.length,
      });
    })
    .catch((error) => {
      console.error(`Tác vụ hệ thống "${job.label}" thất bại:`, error);
    })
    .finally(() => {
      activeJob = null;
    });

  return job;
}

function stopScheduledTask() {
  if (!scheduledTask) return;
  scheduledTask.stop();
  scheduledTask = null;
}

function registerSchedule(schedule) {
  stopScheduledTask();
  currentSchedule = normalizeSchedule(schedule);

  if (!currentSchedule.enabled) return currentSchedule;

  scheduledTask = cron.schedule(
    currentSchedule.cronExpression,
    () => {
      try {
        startSystemJob(currentSchedule.jobType, 'schedule');
      } catch (error) {
        console.warn('Bỏ qua lịch chạy hệ thống:', error.message);
      }
    },
    { timezone: TIMEZONE },
  );

  return currentSchedule;
}

function getSchedule() {
  if (!currentSchedule) {
    currentSchedule = registerSchedule(readStoredSchedule());
  }

  return {
    ...currentSchedule,
    timezone: TIMEZONE,
    activeJob,
  };
}

function saveSchedule(input) {
  const schedule = registerSchedule(normalizeSchedule(input));
  writeStoredSchedule(schedule);

  return {
    ...schedule,
    timezone: TIMEZONE,
    activeJob,
  };
}

function clearSchedule() {
  const schedule = registerSchedule({ ...DEFAULT_SCHEDULE, enabled: false });
  writeStoredSchedule(schedule);

  return {
    ...schedule,
    timezone: TIMEZONE,
    activeJob,
  };
}

function initializeSchedule() {
  currentSchedule = registerSchedule(readStoredSchedule());
  return currentSchedule;
}

module.exports = {
  buildCronExpression,
  clearSchedule,
  getSchedule,
  initializeSchedule,
  normalizeSchedule,
  saveSchedule,
  startSystemJob,
};
