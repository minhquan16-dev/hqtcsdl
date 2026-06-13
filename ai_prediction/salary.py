"""
Huấn luyện và chạy dự đoán lương cho kho dữ liệu tuyển dụng JobDW.

Ví dụ:
  python ai_prediction/salary.py train
  python ai_prediction/salary.py predict --position "Backend Developer" --city "Ho Chi Minh" --level "Junior" --experience 2 --skills "Python,SQL,Docker"
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import joblib
import numpy as np
import pandas as pd
from dotenv import dotenv_values
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer
import sys
sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding = "utf-8")

ROOT_DIR = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT_DIR / "env" / ".env"
DEFAULT_ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"
DEFAULT_MODEL_PATH = DEFAULT_ARTIFACT_DIR / "salary_model.joblib"
DEFAULT_METADATA_PATH = DEFAULT_ARTIFACT_DIR / "salary_model_metadata.json"
RANDOM_STATE = 42

CATEGORICAL_FEATURES = [
    "position",
    "city",
    "level",
    "company_field",
    "company_size",
]
NUMERIC_FEATURES = [
    "experience",
    "skill_count",
    "city_count",
]
TEXT_FEATURE = "skills_text"
FEATURE_COLUMNS = CATEGORICAL_FEATURES + NUMERIC_FEATURES + [TEXT_FEATURE]


def parse_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default

    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "y", "on"}:
        return True
    if normalized in {"0", "false", "no", "n", "off"}:
        return False

    raise ValueError(f"Giá trị boolean không hợp lệ: {value}")


def load_env() -> dict[str, str]:
    values = {key: value for key, value in dotenv_values(ENV_FILE).items() if value is not None}
    values.update({key: value for key, value in os.environ.items() if key.startswith("DB_")})
    return values


def build_sqlcmd_command(query: str, env_values: dict[str, str] | None = None) -> list[str]:
    env_values = env_values or load_env()
    server = env_values.get("DB_SERVER")
    if not server:
        raise ValueError("Thiếu DB_SERVER trong env/.env hoặc biến môi trường")

    port = env_values.get("DB_PORT")
    database = env_values.get("DB_DATABASE", "JobDW")
    username = env_values.get("DB_USER")
    password = env_values.get("DB_PASSWORD")
    server_with_port = f"{server},{port}" if port else server

    command = [
        "sqlcmd",
        "-S", server_with_port,
        "-d", database,
        "-Q", query,
        "-s", "\t",
        "-h-1",
        "-b",
        "-r", "1",
    ]

    if parse_bool(env_values.get("DB_TRUST_SERVER_CERTIFICATE"), default=True):
        command.append("-C")

    if username and password:
        command.extend(["-U", username, "-P", password])
    else:
        command.append("-E")

    return command


TRAINING_COLUMNS = [
    "factId",
    "position",
    "level",
    "company_field",
    "company_size",
    "experience",
    "salary",
    "skills_text",
    "skill_count",
    "cities_text",
    "city_count",
]


def build_training_query() -> str:
    return """
    SET NOCOUNT ON;

    WITH SkillAgg AS (
      SELECT
        fk.factId,
        STRING_AGG(CAST(fk.tenKyNang AS nvarchar(max)), '|') AS skillsText,
        COUNT(*) AS skillCount
      FROM (
        SELECT DISTINCT ftk.factId, dk.tenKyNang
        FROM FactTuyenDung_KyNang ftk
        JOIN DimKyNang dk ON dk.kyNangId = ftk.kyNangId
      ) fk
      GROUP BY fk.factId
    ),
    CityAgg AS (
      SELECT
        fd.factId,
        STRING_AGG(CAST(fd.tenThanhPho AS nvarchar(max)), '|') AS citiesText,
        COUNT(*) AS cityCount
      FROM (
        SELECT DISTINCT ftd.factId, dd.tenThanhPho
        FROM FactTuyenDung_DiaDiem ftd
        JOIN DimDiaDiem dd ON dd.diaDiemId = ftd.diaDiemId
      ) fd
      GROUP BY fd.factId
    )
    SELECT
      f.factId,
      COALESCE(v.tenViTriChuan, '') AS position,
      COALESCE(cb.tenCapBac, '') AS level,
      COALESCE(ct.linhVuc, '') AS company_field,
      COALESCE(ct.quyMo, '') AS company_size,
      COALESCE(CAST(f.soNamKinhNghiem AS varchar(30)), '') AS experience,
      CAST(f.luongTrungBinh AS varchar(30)) AS salary,
      COALESCE(sa.skillsText, '') AS skills_text,
      COALESCE(sa.skillCount, 0) AS skill_count,
      COALESCE(ca.citiesText, '') AS cities_text,
      COALESCE(ca.cityCount, 0) AS city_count
    FROM FactTuyenDung f
    LEFT JOIN DimViTri v ON v.viTriId = f.viTriId
    LEFT JOIN DimCapBac cb ON cb.capBacId = f.capBacId
    LEFT JOIN DimCongTy ct ON ct.congTyId = f.congTyId
    LEFT JOIN SkillAgg sa ON sa.factId = f.factId
    LEFT JOIN CityAgg ca ON ca.factId = f.factId
    WHERE f.coLuong = 1
      AND f.luongTrungBinh IS NOT NULL
    """


def parse_sqlcmd_training_output(output: str) -> pd.DataFrame:
    rows = []
    reader = csv.reader(output.splitlines(), delimiter="\t")
    for raw_row in reader:
        row = [value.strip() for value in raw_row]
        if not row or not any(row):
            continue
        if len(row) != len(TRAINING_COLUMNS):
            continue
        rows.append(row)

    if not rows:
        return pd.DataFrame(columns=FEATURE_COLUMNS + ["salary"])

    data = pd.DataFrame(rows, columns=TRAINING_COLUMNS)
    return prepare_training_frame(data)


def run_sqlcmd_query(query: str, env_values: dict[str, str] | None = None) -> str:
    command = build_sqlcmd_command(query, env_values)
    result = subprocess.run(
        command,
        text=True,
        capture_output=True,
        encoding="utf-8",
        errors="replace",
    )

    if result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip()
        raise RuntimeError(f"Truy vấn sqlcmd thất bại: {detail}")

    return result.stdout


def load_training_data() -> pd.DataFrame:
    output = run_sqlcmd_query(build_training_query())
    return parse_sqlcmd_training_output(output)


def first_value(value: object) -> str:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return "unknown"

    values = [item.strip() for item in str(value).split("|") if item.strip()]
    return values[0] if values else "unknown"


def normalize_text(value: object, fallback: str = "unknown") -> str:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return fallback

    text = str(value).strip()
    return text if text else fallback


def normalize_skills(value: object | Iterable[str]) -> str:
    if value is None:
        return ""

    if isinstance(value, str):
        raw_items = value.replace(",", "|").split("|")
    else:
        raw_items = list(value)

    items = sorted({str(item).strip() for item in raw_items if str(item).strip()})
    return "|".join(items)


def split_skills(value: str) -> list[str]:
    return [item for item in str(value).split("|") if item]


def prepare_training_frame(data: pd.DataFrame) -> pd.DataFrame:
    frame = data.copy()
    frame["position"] = frame["position"].map(normalize_text)
    frame["level"] = frame["level"].map(normalize_text)
    frame["company_field"] = frame["company_field"].map(normalize_text)
    frame["company_size"] = frame["company_size"].map(normalize_text)
    frame["city"] = frame["cities_text"].map(first_value)
    frame["skills_text"] = frame["skills_text"].map(normalize_skills)
    frame["experience"] = pd.to_numeric(frame["experience"], errors="coerce")
    frame["skill_count"] = pd.to_numeric(frame["skill_count"], errors="coerce").fillna(0)
    frame["city_count"] = pd.to_numeric(frame["city_count"], errors="coerce").fillna(0)
    frame["salary"] = pd.to_numeric(frame["salary"], errors="coerce")
    frame = frame.dropna(subset=["salary"])

    return frame[FEATURE_COLUMNS + ["salary"]]


def make_one_hot_encoder() -> OneHotEncoder:
    try:
        return OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    except TypeError:
        return OneHotEncoder(handle_unknown="ignore", sparse=False)


def build_preprocessor() -> ColumnTransformer:
    categorical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="constant", fill_value="unknown")),
        ("one_hot", make_one_hot_encoder()),
    ])
    numeric_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])

    return ColumnTransformer([
        ("categorical", categorical_pipeline, CATEGORICAL_FEATURES),
        ("numeric", numeric_pipeline, NUMERIC_FEATURES),
        ("skills", TfidfVectorizer(tokenizer=split_skills, token_pattern=None, lowercase=False), TEXT_FEATURE),
    ])


def build_random_forest_model() -> Pipeline:
    return Pipeline([
        ("preprocessor", build_preprocessor()),
        ("model", RandomForestRegressor(
            n_estimators=300,
            min_samples_leaf=3,
            max_features="sqrt",
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )),
    ])


def build_ridge_baseline() -> Pipeline:
    return Pipeline([
        ("preprocessor", build_preprocessor()),
        ("model", Ridge(alpha=1.0)),
    ])


def evaluate_model(model: Pipeline, x_test: pd.DataFrame, y_test: pd.Series) -> dict[str, float]:
    predictions = model.predict(x_test)
    rmse = math.sqrt(mean_squared_error(y_test, predictions))
    return {
        "mae": round(float(mean_absolute_error(y_test, predictions)), 4),
        "rmse": round(float(rmse), 4),
        "r2": round(float(r2_score(y_test, predictions)), 4),
    }


def train_salary_model(data: pd.DataFrame, model_path: Path = DEFAULT_MODEL_PATH, metadata_path: Path = DEFAULT_METADATA_PATH) -> dict:
    if len(data) < 30:
        raise ValueError("Cần ít nhất 30 tin có lương để train model")

    x = data[FEATURE_COLUMNS]
    y = data["salary"]
    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=RANDOM_STATE,
    )

    baseline = build_ridge_baseline()
    baseline.fit(x_train, y_train)

    model = build_random_forest_model()
    model.fit(x_train, y_train)

    baseline_metrics = evaluate_model(baseline, x_test, y_test)
    model_metrics = evaluate_model(model, x_test, y_test)
    train_salary_values = y_train.to_numpy(dtype=float)
    residuals = np.abs(y_test.to_numpy(dtype=float) - model.predict(x_test))
    residual_p80 = float(np.percentile(residuals, 80)) if len(residuals) else model_metrics["mae"]

    metadata = {
        "model": "RandomForestRegressor",
        "baseline": "Ridge",
        "target": "luongTrungBinh",
        "unit": "triệu VND/tháng",
        "sampleSize": int(len(data)),
        "trainSize": int(len(x_train)),
        "testSize": int(len(x_test)),
        "features": FEATURE_COLUMNS,
        "metrics": model_metrics,
        "baselineMetrics": baseline_metrics,
        "salaryMin": round(float(np.min(train_salary_values)), 4),
        "salaryMax": round(float(np.max(train_salary_values)), 4),
        "salaryMean": round(float(np.mean(train_salary_values)), 4),
        "predictionIntervalHalfWidth": round(max(residual_p80, model_metrics["mae"]), 4),
        "trainedAt": datetime.now(timezone.utc).isoformat(),
    }

    bundle = {
        "model": model,
        "baseline": baseline,
        "metadata": metadata,
    }

    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, model_path)
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")

    return metadata


def build_prediction_frame(position: str, city: str, level: str, experience: float | None, skills: str, company_field: str = "", company_size: str = "") -> pd.DataFrame:
    skills_text = normalize_skills(skills)
    skill_count = len(split_skills(skills_text))

    return pd.DataFrame([{
        "position": normalize_text(position),
        "city": normalize_text(city),
        "level": normalize_text(level),
        "company_field": normalize_text(company_field),
        "company_size": normalize_text(company_size),
        "experience": experience,
        "skill_count": skill_count,
        "city_count": 1 if normalize_text(city) != "unknown" else 0,
        "skills_text": skills_text,
    }])


def confidence_from_input(skill_count: int, experience: float | None) -> str:
    if skill_count >= 2 and experience is not None:
        return "medium"
    if skill_count >= 1 or experience is not None:
        return "low"
    return "very_low"


def normalize_display_unit(unit: str) -> str:
    if unit == "trieu VND/thang":
        return "triệu VND/tháng"
    return unit


def predict_salary(
    position: str,
    city: str,
    level: str,
    experience: float | None,
    skills: str,
    model_path: Path = DEFAULT_MODEL_PATH,
    company_field: str = "",
    company_size: str = "",
) -> dict:
    bundle = joblib.load(model_path)
    model = bundle["model"]
    metadata = bundle["metadata"]
    frame = build_prediction_frame(position, city, level, experience, skills, company_field, company_size)
    predicted_salary = float(model.predict(frame)[0])
    half_width = float(metadata.get("predictionIntervalHalfWidth") or metadata["metrics"]["mae"])
    lower = max(0.0, predicted_salary - half_width)
    upper = predicted_salary + half_width

    return {
        "predictedSalary": round(predicted_salary, 2),
        "salaryRange": {
            "min": round(lower, 2),
            "max": round(upper, 2),
        },
        "confidence": confidence_from_input(int(frame["skill_count"].iloc[0]), experience),
        "unit": normalize_display_unit(metadata["unit"]),
        "model": {
            "name": metadata["model"],
            "mae": metadata["metrics"]["mae"],
            "rmse": metadata["metrics"]["rmse"],
            "r2": metadata["metrics"]["r2"],
            "sampleSize": metadata["sampleSize"],
            "trainedAt": metadata["trainedAt"],
        },
    }


def train_command(args: argparse.Namespace) -> None:
    data = load_training_data()
    metadata = train_salary_model(data, Path(args.output), Path(args.metadata))
    print(json.dumps(metadata, ensure_ascii=False, indent=2))


def predict_command(args: argparse.Namespace) -> None:
    result = predict_salary(
        position=args.position,
        city=args.city,
        level=args.level,
        experience=args.experience,
        skills=args.skills,
        model_path=Path(args.model),
        company_field=args.company_field,
        company_size=args.company_size,
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Huấn luyện và chạy dự đoán lương từ JobDW.",
        add_help=False,
    )
    parser._positionals.title = "lệnh"
    parser._optionals.title = "tùy chọn"
    parser.add_argument("-h", "--help", action="help", help="hiển thị trợ giúp và thoát")
    subparsers = parser.add_subparsers(dest="command", required=True, title="lệnh")

    train_parser = subparsers.add_parser("train", help="Train model dự đoán lương từ SQL Server JobDW.")
    train_parser.add_argument("--output", default=str(DEFAULT_MODEL_PATH), help="Đường dẫn lưu bundle model joblib.")
    train_parser.add_argument("--metadata", default=str(DEFAULT_METADATA_PATH), help="Đường dẫn lưu metadata JSON của model.")
    train_parser.set_defaults(func=train_command)

    predict_parser = subparsers.add_parser("predict", help="Dự đoán lương từ model đã lưu.")
    predict_parser.add_argument("--model", default=str(DEFAULT_MODEL_PATH), help="Đường dẫn tới bundle model joblib đã lưu.")
    predict_parser.add_argument("--position", required=True)
    predict_parser.add_argument("--city", default="")
    predict_parser.add_argument("--level", default="")
    predict_parser.add_argument("--experience", type=float)
    predict_parser.add_argument("--skills", default="")
    predict_parser.add_argument("--company-field", default="")
    predict_parser.add_argument("--company-size", default="")
    predict_parser.set_defaults(func=predict_command)

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"LỖI: {error}", file=sys.stderr)
        sys.exit(1)
