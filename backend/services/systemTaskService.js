const { execFile, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);
const ROOT_DIR = path.resolve(__dirname, '../..');
const DEFAULT_TASK_TIMEOUT_MS = 4 * 60 * 60 * 1000;
require('dotenv').config({ path: path.join(ROOT_DIR, 'backend', '.env') });

const TASKS = {
  crawl: {
    scriptPath: path.join('crawl', 'main.py'),
    label: 'Cào dữ liệu tuyển dụng',
  },
  etl: {
    scriptPath: path.join('DataWareHouse', 'build_dw.py'),
    label: 'Chạy ETL kho dữ liệu',
  },
};

let _cachedPython = null;

function findSystemPython() {
  if (_cachedPython) return _cachedPython;

  for (const cmd of ['python3', 'python']) {
    try {
      execFileSync(cmd, ['--version'], { stdio: 'ignore', timeout: 5000 });
      _cachedPython = cmd;
      return cmd;
    } catch {
      // command not available, try next
    }
  }

  return 'python';
}

function getPythonExecutable() {
  if (process.env.SYSTEM_TASK_PYTHON) {
    return process.env.SYSTEM_TASK_PYTHON;
  }

  const venvPython = process.platform === 'win32'
    ? path.join(ROOT_DIR, '.venv', 'Scripts', 'python.exe')
    : path.join(ROOT_DIR, '.venv', 'bin', 'python');

  return fs.existsSync(venvPython) ? venvPython : findSystemPython();
}

function getTaskConfig(taskName) {
  const task = TASKS[taskName];

  if (!task) {
    const error = new Error('Tác vụ hệ thống không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  return task;
}

function trimOutput(output = '') {
  const cleanOutput = output.trim();
  if (cleanOutput.length <= 4000) return cleanOutput;
  return cleanOutput.slice(-4000);
}

async function runSystemTask(taskName) {
  const task = getTaskConfig(taskName);
  const pythonExecutable = getPythonExecutable();
  const startedAt = new Date();

  try {
    const result = await execFileAsync(
      pythonExecutable,
      [task.scriptPath],
      {
        cwd: ROOT_DIR,
        encoding: 'utf8',
        timeout: Number(process.env.SYSTEM_TASK_TIMEOUT_MS) || DEFAULT_TASK_TIMEOUT_MS,
        maxBuffer: 10 * 1024 * 1024,
      },
    );

    const finishedAt = new Date();

    return {
      task: taskName,
      label: task.label,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      stdout: trimOutput(result.stdout),
      stderr: trimOutput(result.stderr),
    };
  } catch (error) {
    const detail = error.stderr?.trim() || error.stdout?.trim() || error.message;
    console.error(error);
    throw new Error(`Không chạy được tác vụ "${task.label}": ${detail}`);
  }
}

module.exports = {
  getPythonExecutable,
  runSystemTask,
};
