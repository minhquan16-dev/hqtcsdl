import subprocess
from pathlib import Path
import shutil
import sys


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

# Theo ảnh SSMS của bạn đang dùng localhost
SERVER = r"localhost"

# True = Windows Authentication
# False = SQL Server Authentication
USE_WINDOWS_AUTH = True

# Chỉ dùng khi USE_WINDOWS_AUTH = False
USERNAME = "sa"
PASSWORD = "your_password"


# ==========================
# 2. CẤU HÌNH THƯ MỤC SQL
# ==========================

BASE_DIR = Path(__file__).resolve().parent
SQL_FOLDER = BASE_DIR / "database"

SQL_FILES = [
    "00_rebuild_jobdw.sql",
    "01_create_datawarehouse.sql",
    "02_create_etl_procedures.sql",
    "03_create_agg_tables.sql",
    "04_create_agg_procedures.sql",
    "05_run_all_etl.sql",
    "06_check_output.sql",
]


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
        print("Nếu không chạy được, bạn cần cài Microsoft sqlcmd hoặc thêm sqlcmd vào PATH.")
        sys.exit(1)


def build_command(sql_file: Path):
    """
    Tạo lệnh sqlcmd để chạy một file SQL.
    """
    command = [
        "sqlcmd",
        "-S", SERVER,
        "-i", str(sql_file),
        "-b",          # Nếu SQL lỗi thì dừng script
        "-r", "1",     # Đưa lỗi SQL ra stderr
    ]

    if USE_WINDOWS_AUTH:
        command.insert(3, "-E")
    else:
        command.extend(["-U", USERNAME, "-P", PASSWORD])

    return command


def run_sql_file(sql_file: Path):
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

    command = build_command(sql_file)

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
    print("BẮT ĐẦU TẠO DATA WAREHOUSE JobDW")
    print(f"Server: {SERVER}")
    print(f"SQL folder: {SQL_FOLDER}")

    check_sqlcmd_installed()

    if not SQL_FOLDER.exists():
        print(f"LỖI: Không tìm thấy thư mục: {SQL_FOLDER}")
        print("Hãy tạo thư mục database và đặt các file .sql vào trong đó.")
        sys.exit(1)

    for file_name in SQL_FILES:
        sql_path = SQL_FOLDER / file_name
        run_sql_file(sql_path)

    print()
    print("=" * 80)
    print("HOÀN THÀNH TẠO DATA WAREHOUSE JobDW")
    print("=" * 80)


if __name__ == "__main__":
    main()
