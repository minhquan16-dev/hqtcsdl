import subprocess
from pathlib import Path
import shutil
import sys
import re


# =========================================================
# SCRIPT: run_build_dw.py
# Mục đích:
# - Chạy lần lượt các file SQL để tạo Data Warehouse JobDW
# - Phù hợp với SQL Server / SSMS
# - Hỗ trợ file SQL có lệnh GO vì dùng sqlcmd
# =========================================================


# ==========================
# 1. CẤU HÌNH KẾT NỐI
# ==========================

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
ENV_FILE = ROOT_DIR / "env" / ".env"
SQL_FOLDER = BASE_DIR / "database"

SQL_FILES = [
    "00_rebuild_jobdw.sql",
    "01_create_datawarehouse.sql",
    "02_create_etl_procedures.sql",
    "03_create_agg_tables.sql",
    "04_create_agg_procedures.sql",
    "05_run_all_etl.sql",
    "06_check_output.sql",
    "07_create_indexes.sql",
]


def load_env_file(env_file: Path):
    """
    Tải file .env đơn giản mà không cần thêm dependency Python.
    """
    env_values = {}

    if not env_file.exists():
        print(f"LỖI: Không tìm thấy file env dùng chung: {env_file}")
        sys.exit(1)

    for raw_line in env_file.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        env_values[key.strip()] = value.strip()

    return env_values


def parse_bool(value: str, default: bool = False):
    """
    Parse giá trị boolean từ .env với danh sách giá trị hợp lệ rõ ràng.
    """
    if value is None:
        return default

    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "y", "on"}:
        return True
    if normalized in {"0", "false", "no", "n", "off"}:
        return False

    print(f"LỖI: Giá trị boolean không hợp lệ: {value}")
    sys.exit(1)


def load_db_config():
    """
    Đọc cấu hình kết nối từ env/.env.
    Nếu thiếu DB_USER hoặc DB_PASSWORD thì fallback sang Windows Authentication.
    """
    env_values = load_env_file(ENV_FILE)

    server = env_values.get("DB_SERVER")
    port = env_values.get("DB_PORT")
    username = env_values.get("DB_USER")
    password = env_values.get("DB_PASSWORD")

    if not server:
        print("LỖI: Thiếu DB_SERVER trong env/.env")
        sys.exit(1)

    use_windows_auth = not (username and password)

    return {
        "server": f"{server},{port}" if port else server,
        "database": env_values.get("DB_DATABASE", "JobDW"),
        "username": username,
        "password": password,
        "use_windows_auth": use_windows_auth,
        "encrypt": parse_bool(env_values.get("DB_ENCRYPT"), default=False),
        "trust_server_certificate": parse_bool(
            env_values.get("DB_TRUST_SERVER_CERTIFICATE"),
            default=True,
        ),
    }


def check_sqlcmd_installed():
    """
    Kiểm tra máy đã có sqlcmd chưa.
    sqlcmd cần thiết vì file SQL Server thường có lệnh GO.
    """
    if shutil.which("sqlcmd") is None:
        print("LỖI: Không tìm thấy sqlcmd trong PATH.")
        print("Hãy kiểm tra bằng CMD:")
        print("sqlcmd -?")
        print()
        print(
            "Nếu không chạy được, bạn cần cài Microsoft sqlcmd hoặc thêm sqlcmd vào PATH.")
        sys.exit(1)


def sqlcmd_supports_codepage(help_text: str) -> bool:
    """
    ODBC sqlcmd tren Windows ho tro -f codepage, go-sqlcmd thi khong.
    """
    return re.search(r"(^|\s)-f(?:[\s,<]|,|$)", help_text) is not None


def should_use_codepage_flag() -> bool:
    """
    Chi them -f 65001 khi ban sqlcmd hien tai co ho tro option nay.
    """
    try:
        result = subprocess.run(
            ["sqlcmd", "-?"],
            text=True,
            capture_output=True,
            encoding="utf-8",
            errors="replace",
            timeout=5000,
        )
    except (OSError, subprocess.SubprocessError):
        return sys.platform.startswith("win")

    return sqlcmd_supports_codepage(f"{result.stdout}\n{result.stderr}")


def build_command(sql_file: Path, db_config):
    """
    Tạo lệnh sqlcmd để chạy một file SQL.
    """
    command = [
        "sqlcmd",
        "-S", db_config["server"],
        "-i", str(sql_file),
        "-f","65001",
        "-b",          # Nếu SQL lỗi thì dừng script
        "-r", "1",     # Đưa lỗi SQL ra stderr
    ]

    if should_use_codepage_flag():
        command.extend(["-f", "65001"])

    if db_config["use_windows_auth"]:
        command.insert(3, "-E")
    else:
        command.extend(["-U", db_config["username"],
                       "-P", db_config["password"]])

    return command


def run_sql_file(sql_file: Path, db_config):
    """
    Chay mot file SQL.
    """
    print()
    print("=" * 80)
    print(f"ĐANG CHẠY FILE: {sql_file.name}")
    print("=" * 80)

    if not sql_file.exists():
        print(f"LỖI: Không tìm thấy file: {sql_file}")
        sys.exit(1)

    command = build_command(sql_file, db_config)

    result = subprocess.run(
        command,
        text=True,
        capture_output=True,
        encoding="utf-8",
        errors="replace"
    )

    if result.stdout:
        print(result.stdout)

    if result.stderr:
        print(result.stderr)

    if result.returncode != 0:
        print()
        print(f"LỖI: File chạy thất bại: {sql_file.name}")
        print("Quá trình tạo Data Warehouse đã dừng.")
        sys.exit(result.returncode)

    print(f"THÀNH CÔNG: {sql_file.name}")


def main():
    db_config = load_db_config()

    print("BẮT ĐẦU TẠO DATA WAREHOUSE JobDW")
    print(f"Server: {db_config['server']}")
    print(f"Database: {db_config['database']}")
    print(
        "Authentication: "
        + ("Windows Authentication" if db_config["use_windows_auth"] else "SQL Server Authentication")
    )
    print(f"SQL folder: {SQL_FOLDER}")

    check_sqlcmd_installed()

    if not SQL_FOLDER.exists():
        print(f"LỖI: Không tìm thấy thư mục: {SQL_FOLDER}")
        print("Hãy tạo thư mục database và đặt các file .sql vào trong đó.")
        sys.exit(1)

    for file_name in SQL_FILES:
        sql_path = SQL_FOLDER / file_name
        run_sql_file(sql_path, db_config)

    print()
    print("=" * 80)
    print("HOÀN THÀNH TẠO DATA WAREHOUSE JobDW")
    print("=" * 80)


if __name__ == "__main__":
    main()
