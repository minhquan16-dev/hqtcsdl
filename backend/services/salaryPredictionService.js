const { execFile } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);
const ROOT_DIR = path.resolve(__dirname, '../..');
const SCRIPT_PATH = path.join('ai_prediction', 'salary.py');

function getPythonExecutable() {
  if (process.env.AI_PREDICTION_PYTHON) {
    return process.env.AI_PREDICTION_PYTHON;
  }

  const venvPython = process.platform === 'win32'
    ? path.join(ROOT_DIR, '.venv', 'Scripts', 'python.exe')
    : path.join(ROOT_DIR, '.venv', 'bin', 'python');

  return fs.existsSync(venvPython) ? venvPython : 'python3';
}

function appendOptionalArg(args, flag, value) {
  if (value === undefined || value === null || value === '') return;
  args.push(flag, String(value));
}

function buildPredictionArgs(filters) {
  const args = [SCRIPT_PATH, 'predict'];

  appendOptionalArg(args, '--position', filters.position);
  appendOptionalArg(args, '--city', filters.city);
  appendOptionalArg(args, '--level', filters.level);
  appendOptionalArg(args, '--experience', filters.experience);
  appendOptionalArg(args, '--skills', filters.skills);
  appendOptionalArg(args, '--company-field', filters.companyField);
  appendOptionalArg(args, '--company-size', filters.companySize);

  return args;
}

function normalizePredictionPayload(payload) {
  return {
    luongDuDoan: payload.predictedSalary,
    khoangLuong: {
      thap: payload.salaryRange?.min ?? null,
      cao: payload.salaryRange?.max ?? null,
    },
    doTinCay: payload.confidence,
    donVi: payload.unit,
    model: {
      ten: payload.model?.name,
      mae: payload.model?.mae,
      rmse: payload.model?.rmse,
      r2: payload.model?.r2,
      soMau: payload.model?.sampleSize,
      thoiDiemTrain: payload.model?.trainedAt,
    },
  };
}

async function predictSalary(filters) {
  let stdout;
  try {
    const result = await execFileAsync(
      getPythonExecutable(),
      buildPredictionArgs(filters),
      {
        cwd: ROOT_DIR,
        encoding: 'utf8',
        timeout: 30000,
        maxBuffer: 1024 * 1024,
      },
    );
    stdout = result.stdout;
  } catch (error) {
    const detail = error.stderr?.trim() || error.message;
    throw new Error(`Không chạy được model dự đoán lương: ${detail}`);
  }

  try {
    return normalizePredictionPayload(JSON.parse(stdout));
  } catch (error) {
    throw new Error('Không đọc được kết quả dự đoán lương từ model Python');
  }
}

module.exports = {
  buildPredictionArgs,
  normalizePredictionPayload,
  predictSalary,
};
