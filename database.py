import pyodbc
import threading

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
        return pyodbc.connect(self.conn_str, autocommit=True)

    def _create_tables(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'congTy')
            CREATE TABLE congTy (
                congTyId INT IDENTITY(1,1) PRIMARY KEY,
                tenCongTy NVARCHAR(255) NOT NULL UNIQUE,
                linkCongTy NVARCHAR(MAX),
                diaChiCongTyRaw NVARCHAR(MAX),
                linhVuc NVARCHAR(500),
                quyMo NVARCHAR(255)
            )
        """)

        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'capDoCongViec')
            CREATE TABLE capDoCongViec (
                capDoId INT IDENTITY(1,1) PRIMARY KEY,
                tenCapDo NVARCHAR(255) NOT NULL UNIQUE
            )
        """)

        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'viTriCongViec')
            CREATE TABLE viTriCongViec (
                viTriId INT IDENTITY(1,1) PRIMARY KEY,
                tenViTriChuan NVARCHAR(255) NOT NULL UNIQUE,
                moTaNhomViTri NVARCHAR(MAX)
            )
        """)

        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'diaDiem')
            CREATE TABLE diaDiem (
                diaDiemId INT IDENTITY(1,1) PRIMARY KEY,
                tenThanhPho NVARCHAR(255) NOT NULL,
                tenPhuongXa NVARCHAR(255),
                diaChiChiTietRaw NVARCHAR(450), 
                CONSTRAINT UC_DiaDiem UNIQUE (tenThanhPho, tenPhuongXa, diaChiChiTietRaw)
            )
        """)

        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'kyNang')
            CREATE TABLE kyNang (
                kyNangId INT IDENTITY(1,1) PRIMARY KEY,
                tenKyNang NVARCHAR(255) NOT NULL UNIQUE
            )
        """)

        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tinTuyenDung')
            CREATE TABLE tinTuyenDung (
                tinTuyenDungId INT IDENTITY(1,1) PRIMARY KEY,
                linkBaiDang NVARCHAR(450) NOT NULL UNIQUE,
                tieuDeCongViec NVARCHAR(MAX) NOT NULL,
                moTaCongViec NVARCHAR(MAX),
                yeuCauCongViec NVARCHAR(MAX),
                quyenLoi NVARCHAR(MAX),
                luongRaw NVARCHAR(500),
                luongMin FLOAT,
                luongMax FLOAT,
                kinhNghiemRaw NVARCHAR(500),
                soNamKinhNghiem INT,
                diaDiemRaw NVARCHAR(MAX),
                hanNopHoSo NVARCHAR(255),
                thoiDiemThuThap DATETIME NOT NULL,
                congTyId INT NOT NULL,
                capDoId INT,
                viTriId INT,
                FOREIGN KEY (congTyId) REFERENCES congTy(congTyId),
                FOREIGN KEY (capDoId) REFERENCES capDoCongViec(capDoId),
                FOREIGN KEY (viTriId) REFERENCES viTriCongViec(viTriId)
            )
        """)

        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tinTuyenDungKyNang')
            CREATE TABLE tinTuyenDungKyNang (
                tinTuyenDungId INT,
                kyNangId INT,
                PRIMARY KEY (tinTuyenDungId, kyNangId),
                FOREIGN KEY (tinTuyenDungId) REFERENCES tinTuyenDung(tinTuyenDungId),
                FOREIGN KEY (kyNangId) REFERENCES kyNang(kyNangId)
            )
        """)

        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tinTuyenDungDiaDiem')
            CREATE TABLE tinTuyenDungDiaDiem (
                tinTuyenDungId INT,
                diaDiemId INT,
                PRIMARY KEY (tinTuyenDungId, diaDiemId),
                FOREIGN KEY (tinTuyenDungId) REFERENCES tinTuyenDung(tinTuyenDungId),
                FOREIGN KEY (diaDiemId) REFERENCES diaDiem(diaDiemId)
            )
        """)
        conn.close()

    def is_job_exists(self, url):
        try:
            conn = self._get_conn()
            cursor = conn.cursor()
            cursor.execute("SELECT 1 FROM tinTuyenDung WHERE linkBaiDang = ?", (url,))
            res = cursor.fetchone()
            conn.close()
            return res is not None
        except: return False

    def save_job(self, data):
        with self.lock:
            conn = self._get_conn()
            cursor = conn.cursor()
            try:
                # 1. Công Ty
                cursor.execute("""
                    IF NOT EXISTS (SELECT 1 FROM congTy WHERE tenCongTy = ?)
                    BEGIN
                        INSERT INTO congTy (tenCongTy, linkCongTy, diaChiCongTyRaw, linhVuc, quyMo) 
                        VALUES (?, ?, ?, ?, ?)
                    END
                """, (data['company']['ten'], data['company']['ten'], data['company']['link'], data['company']['diaChi'], data['company']['linhVuc'], data['company']['quyMo']))
                cursor.execute("SELECT congTyId FROM congTy WHERE tenCongTy = ?", (data['company']['ten'],))
                congTyId = cursor.fetchone()[0]

                # 2. Cấp Độ
                capDoId = None
                if data['level']:
                    cursor.execute("IF NOT EXISTS (SELECT 1 FROM capDoCongViec WHERE tenCapDo = ?) INSERT INTO capDoCongViec (tenCapDo) VALUES (?)", (data['level'], data['level']))
                    cursor.execute("SELECT capDoId FROM capDoCongViec WHERE tenCapDo = ?", (data['level'],))
                    capDoId = cursor.fetchone()[0]

                # 3. Vị Trí
                viTriId = None
                if data['viTri']['ten']:
                    cursor.execute("IF NOT EXISTS (SELECT 1 FROM viTriCongViec WHERE tenViTriChuan = ?) INSERT INTO viTriCongViec (tenViTriChuan, moTaNhomViTri) VALUES (?, ?)", (data['viTri']['ten'], data['viTri']['ten'], data['viTri']['moTa']))
                    cursor.execute("SELECT viTriId FROM viTriCongViec WHERE tenViTriChuan = ?", (data['viTri']['ten'],))
                    viTriId = cursor.fetchone()[0]

                # 4. Tin Tuyển Dụng
                cursor.execute("""
                    IF NOT EXISTS (SELECT 1 FROM tinTuyenDung WHERE linkBaiDang = ?)
                    BEGIN
                        INSERT INTO tinTuyenDung (linkBaiDang, tieuDeCongViec, moTaCongViec, yeuCauCongViec, quyenLoi, luongRaw, luongMin, luongMax, kinhNghiemRaw, soNamKinhNghiem, diaDiemRaw, hanNopHoSo, thoiDiemThuThap, congTyId, capDoId, viTriId)
                        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                    END
                """, (data['job_url'], data['job_url'], data['title'], data['desc'], data['req'], data['benefit'], data['salary']['raw'], data['salary']['min'], data['salary']['max'], data['exp']['raw'], data['exp']['years'], data['location_raw'], data['deadline'], data['crawl_time'], congTyId, capDoId, viTriId))
                
                cursor.execute("SELECT tinTuyenDungId FROM tinTuyenDung WHERE linkBaiDang = ?", (data['job_url'],))
                job_db_id = cursor.fetchone()[0]

                # 5. Kỹ Năng (Fix SQL)
                for kn in data['skills']:
                    cursor.execute("IF NOT EXISTS (SELECT 1 FROM kyNang WHERE tenKyNang = ?) INSERT INTO kyNang (tenKyNang) VALUES (?)", (kn, kn))
                    cursor.execute("SELECT kyNangId FROM kyNang WHERE tenKyNang = ?", (kn,))
                    kn_id = cursor.fetchone()[0]
                    cursor.execute("IF NOT EXISTS (SELECT 1 FROM tinTuyenDungKyNang WHERE tinTuyenDungId=? AND kyNangId=?) INSERT INTO tinTuyenDungKyNang (tinTuyenDungId, kyNangId) VALUES (?,?)", (job_db_id, kn_id, job_db_id, kn_id))

                # 6. Địa Điểm (Fix SQL)
                for loc in data['locations']:
                    cursor.execute("IF NOT EXISTS (SELECT 1 FROM diaDiem WHERE tenThanhPho=? AND tenPhuongXa=? AND diaChiChiTietRaw=?) INSERT INTO diaDiem (tenThanhPho, tenPhuongXa, diaChiChiTietRaw) VALUES (?,?,?)", (loc['city'], loc['ward'], loc['detail'], loc['city'], loc['ward'], loc['detail']))
                    cursor.execute("SELECT diaDiemId FROM diaDiem WHERE tenThanhPho=? AND (tenPhuongXa=? OR tenPhuongXa IS NULL) AND diaChiChiTietRaw=?", (loc['city'], loc['ward'], loc['detail']))
                    dd_id = cursor.fetchone()[0]
                    cursor.execute("IF NOT EXISTS (SELECT 1 FROM tinTuyenDungDiaDiem WHERE tinTuyenDungId=? AND diaDiemId=?) INSERT INTO tinTuyenDungDiaDiem (tinTuyenDungId, diaDiemId) VALUES (?,?)", (job_db_id, dd_id, job_db_id, dd_id))

                return True
            except Exception as e:
                print(f"      [!] Lỗi SQL Server: {e}")
                return False
            finally:
                conn.close()