import pyodbc
import threading
import logging

logger = logging.getLogger(__name__)

class TopCVDatabase:
    def __init__(self):
        self.server = 'localhost'
        self.database = 'JobCrawlDB'
        self.conn_str = (
            'DRIVER={ODBC Driver 18 for SQL Server};'
            f'SERVER={self.server};'
            f'DATABASE={self.database};'
            'Trusted_Connection=yes;'
            'TrustServerCertificate=yes;'
            'Encrypt=yes;'
        )
        self.lock = threading.Lock()
        self._create_tables()

    def _get_conn(self):
        return pyodbc.connect(self.conn_str)

    def reset_database(self):
        """Drop toàn bộ bảng cũ và tạo lại schema mới."""
        conn = self._get_conn()
        try:
            cursor = conn.cursor()
            # Drop theo thứ tự FK: junction → fact → dim
            tables = [
                'TinTuyenDung_DiaDiem', 'TinTuyenDung_KyNang',
                'tinTuyenDungDiaDiem', 'tinTuyenDungKyNang',
                'TinTuyenDung', 'tinTuyenDung',
                'CongTy', 'congTy',
                'CapBacCongViec', 'capDoCongViec',
                'ViTriCongViec', 'viTriCongViec',
                'DiaDiem', 'diaDiem',
                'KyNang', 'kyNang',
            ]
            for t in tables:
                cursor.execute(f"IF OBJECT_ID('{t}', 'U') IS NOT NULL DROP TABLE [{t}]")
            conn.commit()
        finally:
            conn.close()  # FIX: luôn đóng conn dù có exception
        print("✓ Đã drop toàn bộ bảng cũ.")
        self._create_tables()
        print("✓ Đã tạo lại schema mới theo tài liệu BTL.")

    def _create_tables(self):
        conn = self._get_conn()
        try:  # FIX: bọc try/finally để tránh connection leak
            cursor = conn.cursor()

            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CongTy')
                CREATE TABLE CongTy (
                    congTyId INT IDENTITY(1,1) PRIMARY KEY,
                    tenCongTy NVARCHAR(255) NOT NULL UNIQUE,
                    linkCongTy NVARCHAR(MAX),
                    linhVuc NVARCHAR(500),
                    quyMo NVARCHAR(255)
                )
            """)

            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CapBacCongViec')
                CREATE TABLE CapBacCongViec (
                    capBacId INT IDENTITY(1,1) PRIMARY KEY,
                    tenCapBac NVARCHAR(255) NOT NULL UNIQUE
                )
            """)

            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ViTriCongViec')
                CREATE TABLE ViTriCongViec (
                    viTriId INT IDENTITY(1,1) PRIMARY KEY,
                    tenViTriChuan NVARCHAR(255) NOT NULL UNIQUE
                )
            """)

            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DiaDiem')
                CREATE TABLE DiaDiem (
                    diaDiemId INT IDENTITY(1,1) PRIMARY KEY,
                    tenThanhPho NVARCHAR(255) NOT NULL,
                    tenPhuongXa NVARCHAR(255),
                    CONSTRAINT UC_DiaDiem UNIQUE (tenThanhPho, tenPhuongXa)
                )
            """)

            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'KyNang')
                CREATE TABLE KyNang (
                    kyNangId INT IDENTITY(1,1) PRIMARY KEY,
                    tenKyNang NVARCHAR(255) NOT NULL UNIQUE
                )
            """)

            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TinTuyenDung')
                CREATE TABLE TinTuyenDung (
                    tinTuyenDungId INT IDENTITY(1,1) PRIMARY KEY,
                    linkBaiDang NVARCHAR(450) NOT NULL UNIQUE,
                    tieuDeCongViec NVARCHAR(MAX) NOT NULL,
                    luongMin FLOAT,
                    luongMax FLOAT,
                    soNamKinhNghiem INT,
                    hanNopHoSo NVARCHAR(255),
                    thoiDiemThuThap DATETIME NOT NULL,
                    congTyId INT NOT NULL,
                    viTriId INT,
                    capBacId INT,
                    FOREIGN KEY (congTyId) REFERENCES CongTy(congTyId),
                    FOREIGN KEY (viTriId) REFERENCES ViTriCongViec(viTriId),
                    FOREIGN KEY (capBacId) REFERENCES CapBacCongViec(capBacId)
                )
            """)

            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TinTuyenDung_KyNang')
                CREATE TABLE TinTuyenDung_KyNang (
                    tinTuyenDungId INT,
                    kyNangId INT,
                    PRIMARY KEY (tinTuyenDungId, kyNangId),
                    FOREIGN KEY (tinTuyenDungId) REFERENCES TinTuyenDung(tinTuyenDungId),
                    FOREIGN KEY (kyNangId) REFERENCES KyNang(kyNangId)
                )
            """)

            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TinTuyenDung_DiaDiem')
                CREATE TABLE TinTuyenDung_DiaDiem (
                    tinTuyenDungId INT,
                    diaDiemId INT,
                    PRIMARY KEY (tinTuyenDungId, diaDiemId),
                    FOREIGN KEY (tinTuyenDungId) REFERENCES TinTuyenDung(tinTuyenDungId),
                    FOREIGN KEY (diaDiemId) REFERENCES DiaDiem(diaDiemId)
                )
            """)
            conn.commit()
        finally:
            conn.close()

    def is_job_exists(self, url):
        try:
            conn = self._get_conn()
            try:
                cursor = conn.cursor()
                cursor.execute("SELECT 1 FROM TinTuyenDung WHERE linkBaiDang = ?", (url,))
                res = cursor.fetchone()
                return res is not None
            finally:
                conn.close()  # FIX: luôn đóng conn
        except Exception as e:  # FIX: không dùng bare except
            logger.warning(f"is_job_exists error: {e}")
            return False

    def save_job(self, data):
        with self.lock:
            conn = self._get_conn()
            cursor = conn.cursor()
            try:
                # 1. CongTy
                cursor.execute("""
                    IF NOT EXISTS (SELECT 1 FROM CongTy WHERE tenCongTy = ?)
                    BEGIN
                        INSERT INTO CongTy (tenCongTy, linkCongTy, linhVuc, quyMo)
                        VALUES (?, ?, ?, ?)
                    END
                """, (data['company']['ten'], data['company']['ten'],
                      data['company']['link'], data['company']['linhVuc'], data['company']['quyMo']))
                cursor.execute("SELECT congTyId FROM CongTy WHERE tenCongTy = ?", (data['company']['ten'],))
                congTyId = cursor.fetchone()[0]

                # 2. CapBacCongViec
                capBacId = None
                if data['level']:
                    cursor.execute("IF NOT EXISTS (SELECT 1 FROM CapBacCongViec WHERE tenCapBac = ?) INSERT INTO CapBacCongViec (tenCapBac) VALUES (?)", (data['level'], data['level']))
                    cursor.execute("SELECT capBacId FROM CapBacCongViec WHERE tenCapBac = ?", (data['level'],))
                    capBacId = cursor.fetchone()[0]

                # 3. ViTriCongViec
                viTriId = None
                if data['viTri']['ten']:
                    cursor.execute("IF NOT EXISTS (SELECT 1 FROM ViTriCongViec WHERE tenViTriChuan = ?) INSERT INTO ViTriCongViec (tenViTriChuan) VALUES (?)", (data['viTri']['ten'], data['viTri']['ten']))
                    cursor.execute("SELECT viTriId FROM ViTriCongViec WHERE tenViTriChuan = ?", (data['viTri']['ten'],))
                    viTriId = cursor.fetchone()[0]

                # 4. TinTuyenDung
                cursor.execute("""
                    IF NOT EXISTS (SELECT 1 FROM TinTuyenDung WHERE linkBaiDang = ?)
                    BEGIN
                        INSERT INTO TinTuyenDung (linkBaiDang, tieuDeCongViec, luongMin, luongMax, soNamKinhNghiem, hanNopHoSo, thoiDiemThuThap, congTyId, viTriId, capBacId)
                        VALUES (?,?,?,?,?,?,?,?,?,?)
                    END
                """, (data['job_url'], data['job_url'], data['title'],
                      data['salary']['min'], data['salary']['max'],
                      data['exp']['years'], data['deadline'], data['crawl_time'],
                      congTyId, viTriId, capBacId))

                cursor.execute("SELECT tinTuyenDungId FROM TinTuyenDung WHERE linkBaiDang = ?", (data['job_url'],))
                job_db_id = cursor.fetchone()[0]

                # 5. KyNang + TinTuyenDung_KyNang
                for kn in data['skills']:
                    cursor.execute("IF NOT EXISTS (SELECT 1 FROM KyNang WHERE tenKyNang = ?) INSERT INTO KyNang (tenKyNang) VALUES (?)", (kn, kn))
                    cursor.execute("SELECT kyNangId FROM KyNang WHERE tenKyNang = ?", (kn,))
                    kn_id = cursor.fetchone()[0]
                    cursor.execute("IF NOT EXISTS (SELECT 1 FROM TinTuyenDung_KyNang WHERE tinTuyenDungId=? AND kyNangId=?) INSERT INTO TinTuyenDung_KyNang (tinTuyenDungId, kyNangId) VALUES (?,?)", (job_db_id, kn_id, job_db_id, kn_id))

                # 6. DiaDiem + TinTuyenDung_DiaDiem
                for loc in data['locations']:
                    cursor.execute("IF NOT EXISTS (SELECT 1 FROM DiaDiem WHERE tenThanhPho=? AND tenPhuongXa=?) INSERT INTO DiaDiem (tenThanhPho, tenPhuongXa) VALUES (?,?)", (loc['city'], loc['ward'], loc['city'], loc['ward']))
                    cursor.execute("SELECT diaDiemId FROM DiaDiem WHERE tenThanhPho=? AND (tenPhuongXa=? OR tenPhuongXa IS NULL)", (loc['city'], loc['ward']))
                    dd_id = cursor.fetchone()[0]
                    cursor.execute("IF NOT EXISTS (SELECT 1 FROM TinTuyenDung_DiaDiem WHERE tinTuyenDungId=? AND diaDiemId=?) INSERT INTO TinTuyenDung_DiaDiem (tinTuyenDungId, diaDiemId) VALUES (?,?)", (job_db_id, dd_id, job_db_id, dd_id))

                conn.commit()
                return True
            except Exception as e:
                conn.rollback()
                logger.error(f"Lỗi SQL Server: {e}")
                print(f"      [!] Lỗi SQL Server: {e}")
                return False
            finally:
                conn.close()

    def get_all_jobs(self):
        """Lấy danh sách tất cả tin tuyển dụng (id, url, hạn nộp)."""
        conn = self._get_conn()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT tinTuyenDungId, linkBaiDang, hanNopHoSo FROM TinTuyenDung")
            return cursor.fetchall()
        finally:
            conn.close()

    def delete_job(self, job_id):
        """Xóa 1 tin tuyển dụng và các bản ghi liên quan (junction tables)."""
        with self.lock:
            conn = self._get_conn()
            try:
                cursor = conn.cursor()
                # Xóa junction tables trước (FK constraint)
                cursor.execute("DELETE FROM TinTuyenDung_KyNang WHERE tinTuyenDungId = ?", (job_id,))
                cursor.execute("DELETE FROM TinTuyenDung_DiaDiem WHERE tinTuyenDungId = ?", (job_id,))
                # Xóa tin tuyển dụng
                cursor.execute("DELETE FROM TinTuyenDung WHERE tinTuyenDungId = ?", (job_id,))
                conn.commit()
                return True
            except Exception as e:
                conn.rollback()
                logger.error(f"Lỗi xóa job {job_id}: {e}")
                return False
            finally:
                conn.close()

    def cleanup_expired_by_date(self):
        """Xóa các tin đã hết hạn dựa trên trường hanNopHoSo."""
        import re
        from datetime import datetime
        jobs = self.get_all_jobs()
        today = datetime.now().date()
        deleted = 0
        for job_id, url, deadline_str in jobs:
            if not deadline_str or deadline_str == "N/A":
                continue
            # Parse ngày từ chuỗi kiểu "Hạn nộp: 30/05/2026" hoặc "30/05/2026"
            match = re.search(r'(\d{1,2})/(\d{1,2})/(\d{4})', deadline_str)
            if match:
                try:
                    day, month, year = int(match.group(1)), int(match.group(2)), int(match.group(3))
                    deadline_date = datetime(year, month, day).date()
                    if deadline_date < today:
                        if self.delete_job(job_id):
                            deleted += 1
                            logger.info(f"🗑️ Đã xóa (hết hạn {deadline_str}): {url[-40:]}")
                except ValueError:
                    continue
        print(f"✓ Đã xóa {deleted} tin hết hạn theo ngày.")
        return deleted

    def cleanup_orphaned_records(self):
        """Xóa các bản ghi mồ côi trong bảng dim (không còn FK tham chiếu)."""
        conn = self._get_conn()
        try:
            cursor = conn.cursor()
            # Xóa KyNang không còn được tham chiếu
            cursor.execute("""
                DELETE FROM KyNang WHERE kyNangId NOT IN 
                (SELECT DISTINCT kyNangId FROM TinTuyenDung_KyNang)
            """)
            kn = cursor.rowcount
            # Xóa DiaDiem không còn được tham chiếu
            cursor.execute("""
                DELETE FROM DiaDiem WHERE diaDiemId NOT IN 
                (SELECT DISTINCT diaDiemId FROM TinTuyenDung_DiaDiem)
            """)
            dd = cursor.rowcount
            # Xóa CongTy không còn được tham chiếu
            cursor.execute("""
                DELETE FROM CongTy WHERE congTyId NOT IN 
                (SELECT DISTINCT congTyId FROM TinTuyenDung)
            """)
            ct = cursor.rowcount
            # Xóa ViTriCongViec không còn được tham chiếu
            cursor.execute("""
                DELETE FROM ViTriCongViec WHERE viTriId NOT IN 
                (SELECT DISTINCT viTriId FROM TinTuyenDung WHERE viTriId IS NOT NULL)
            """)
            vt = cursor.rowcount
            # Xóa CapBacCongViec không còn được tham chiếu
            cursor.execute("""
                DELETE FROM CapBacCongViec WHERE capBacId NOT IN 
                (SELECT DISTINCT capBacId FROM TinTuyenDung WHERE capBacId IS NOT NULL)
            """)
            cb = cursor.rowcount
            conn.commit()
            print(f"✓ Dọn bảng mồ côi: KyNang={kn}, DiaDiem={dd}, CongTy={ct}, ViTri={vt}, CapBac={cb}")
        finally:
            conn.close()
