import threading, time, re, random, sys, logging
from datetime import datetime
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
from database import TopCVDatabase

sys.stdout.reconfigure(encoding="utf-8")

# ─── Logging setup: ghi ra file + console ───────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(threadName)s] %(levelname)s: %(message)s',
    handlers=[
        logging.FileHandler('crawler.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout),
    ]
)
logger = logging.getLogger(__name__)

# ─── Mapping cấp bậc chuẩn hóa ──────────────────────────────────────────────
LEVEL_NORMALIZE_MAP = {
    "Intern": "Intern",
    "Fresher": "Fresher",
    "Entry Level": "Fresher",
    "Entry-Level": "Fresher",
    "Junior": "Junior",
    "Middle": "Middle",
    "Mid-level": "Middle",
    "Mid Level": "Middle",
    "Senior": "Senior",
    "Lead": "Lead",
    "Tech Lead": "Lead",
    "Team Lead": "Lead",
    "Manager": "Manager",
    "Director": "Manager",
    "Nhân viên": "Nhân viên",
}
LEVEL_KEYWORDS = list(LEVEL_NORMALIZE_MAP.keys())

def normalize_level(detected_levels):
    """Trả về cấp bậc chuẩn hóa từ danh sách keyword detect được."""
    if not detected_levels:
        return "Nhân viên"
    return LEVEL_NORMALIZE_MAP.get(detected_levels[0], "Nhân viên")

SKILL_KEYWORDS = [
    "Python", "C", "C++", "C#", "Java", "JavaScript", "TypeScript", "Go", "Rust",
    "Kotlin", "Swift", "PHP", "Ruby", "Dart", "R", "MATLAB", "Bash", "PowerShell",
    "HTML", "CSS", "Sass", "Tailwind CSS", "Bootstrap", "ReactJS", "Next.js",
    "Vue.js", "Nuxt.js", "Angular", "Svelte", "Node.js", "Express.js", "NestJS",
    "Django", "Flask", "Spring Boot", "ASP.NET", "Laravel",
    "MySQL", "PostgreSQL", "SQL Server", "Oracle", "MongoDB", "Redis", "SQLite", "Firebase",
    "REST API", "GraphQL", "gRPC",
    "Git", "GitHub", "GitLab", "Bitbucket",
    "Docker", "Kubernetes", "CI/CD", "Jenkins", "GitHub Actions", "GitLab CI",
    "AWS", "Azure", "Google Cloud",
    "Linux", "Ubuntu", "CentOS", "Windows Server", "Nginx", "Apache",
    "Machine Learning", "Deep Learning", "Computer Vision", "NLP",
    "TensorFlow", "PyTorch", "Scikit-learn", "Data Analysis", "Data Visualization",
    "Big Data", "Hadoop", "Spark",
    "Cybersecurity", "Penetration Testing", "Ethical Hacking",
    "Networking", "TCP/IP", "DNS", "HTTP/HTTPS",
    "Microservices", "System Design", "Distributed Systems",
    "Agile", "Scrum", "Kanban",
    "Testing", "Unit Test", "Integration Test", "Automation Test",
    "Figma", "Adobe XD", "Photoshop", "Illustrator", "CapCut",
    "Adobe Premiere", "After Effects",
    "Unity", "Unreal Engine",
    "Android Development", "iOS Development", "Web Development",
    "Mobile Development", "Game Development", "Embedded Systems",
]

def clean_text(text):
    if not text: return ""
    return re.sub(r'\s+', ' ', text).strip()
def parse_deadline(deadline_text):
    if not deadline_text:
        return "N/A"

    match = re.search(r'\d{2}/\d{2}/\d{4}', deadline_text)
    return match.group(0) if match else "N/A"
def parse_ward(address):
    match = re.search(r'(?:Phường|P\.|P|Xã|Thị trấn)\s+([^,(]+)', address)
    return clean_text(match.group(1)) if match else "N/A"

def detect_from_text(text, keywords):
    found = []
    text_lower = text.lower()
    for kw in keywords:
        if re.search(r'\b' + re.escape(kw.lower()) + r'\b', text_lower):
            found.append(kw)
    return found

# Tỷ giá USD → VND (xấp xỉ, cập nhật khi cần)
USD_TO_VND = 25_000

def parse_salary(salary_str):
    """Parse lương và chuẩn hóa về đơn vị TRIỆU VND.
    
    Hỗ trợ các định dạng:
      - "10 - 15 triệu"           → 10, 15   (giữ nguyên)
      - "1,000 - 2,000 USD"       → 25, 50   (USD → VND → triệu)
      - "500 - 1000 $"            → 12.5, 25 (USD → VND → triệu)
      - "10,000,000 - 15,000,000" → 10, 15   (VND → triệu)
      - "Thỏa thuận"              → 0, 0
    """
    if not salary_str:
        return 0.0, 0.0
    try:
        s_lower = salary_str.lower().strip()

        # Phát hiện đơn vị tiền tệ
        is_usd = bool(re.search(r'\busd\b|\$|dollar', s_lower))
        is_trieu = bool(re.search(r'tri[eệ]u', s_lower))

        # Loại bỏ dấu chấm/phẩy phân cách hàng nghìn rồi tách số
        s_clean = salary_str.replace('.', '').replace(',', '')
        nums = re.findall(r'\d+', s_clean)

        if not nums:
            return 0.0, 0.0

        if len(nums) >= 2:
            n1, n2 = float(nums[0]), float(nums[1])
            sal_min, sal_max = min(n1, n2), max(n1, n2)
        else:
            n = float(nums[0])
            sal_min, sal_max = n, n

        # Chuyển đổi về đơn vị TRIỆU VND
        if is_usd:
            # USD → VND → triệu
            sal_min = sal_min * USD_TO_VND / 1_000_000
            sal_max = sal_max * USD_TO_VND / 1_000_000
        elif is_trieu:
            # Đã là triệu → giữ nguyên
            pass
        else:
            # Số thô không có đơn vị → nếu >= 1,000,000 thì là VND, chia về triệu
            if sal_min >= 1_000_000:
                sal_min /= 1_000_000
            if sal_max >= 1_000_000:
                sal_max /= 1_000_000

        return sal_min, sal_max
    except Exception:  # FIX: không dùng bare except
        pass
    return 0.0, 0.0

def parse_info_sections(soup):
    """FIX: Parse lương & kinh nghiệm theo label thay vì index cứng."""
    salary_raw = "Thỏa thuận"
    exp_raw = "N/A"
    for section in soup.select('.job-detail__info--section'):
        title_el = section.select_one('.job-detail__info--section-title')
        value_el = section.select_one('.job-detail__info--section-content-value')
        if not title_el or not value_el:
            continue
        title_text = clean_text(title_el.text).lower()
        value_text = clean_text(value_el.text)
        if 'lương' in title_text or 'salary' in title_text:
            salary_raw = value_text
        elif 'kinh nghiệm' in title_text or 'experience' in title_text:
            exp_raw = value_text
    # Fallback: dùng index nếu label-based không tìm được
    if salary_raw == "Thỏa thuận" and exp_raw == "N/A":
        vals = soup.select('.job-detail__info--section-content-value')
        if len(vals) >= 1:
            salary_raw = clean_text(vals[0].text)
        if len(vals) >= 3:
            exp_raw = clean_text(vals[2].text)
    return salary_raw, exp_raw

init_lock = threading.Lock()

class WorkerThread(threading.Thread):
    def __init__(self, thread_id, start_page, step, db_instance):
        threading.Thread.__init__(self)
        self.thread_id = thread_id
        self.start_page = start_page
        self.step = step
        self.db = db_instance
        self.driver = None
        self.skipped_urls = set()
        self.skip_count = {}          # FIX: đếm số lần thất bại trước khi blacklist
        self._empty_retries = 0       # FIX: khai báo rõ ràng thay vì dùng getattr
        self.daemon = True

    def init_driver(self):
        with init_lock:
            try:
                logger.info(f"[Luồng {self.thread_id}] Đang khởi tạo trình duyệt...")
                options = uc.ChromeOptions()
                self.driver = uc.Chrome(options=options, version_main=148)
                time.sleep(3)
            except Exception as e:
                logger.error(f"[Luồng {self.thread_id}] ❌ Lỗi khởi tạo Chrome: {e}")
                self.driver = None
                raise  # Ném lại để run() bắt và retry

    def _is_driver_alive(self):
        """Kiểm tra xem driver/Chrome còn sống không."""
        try:
            _ = self.driver.current_url
            return True
        except Exception:
            return False

    def get_job_details(self, url):
        try:
            if not self._is_driver_alive():
                logger.warning(f"[Luồng {self.thread_id}] Chrome đã crash, đang khởi động lại...")
                self.restart_driver()

            title_tag = None
            soup = None

            for attempt in range(1, 4):
                self.driver.get(url)
                time.sleep(random.uniform(7, 10))

                soup = BeautifulSoup(self.driver.page_source, 'html.parser')
                title_tag = (
                    soup.select_one('h1.job-detail__info--title')
                    or soup.select_one('h1.title')
                    or soup.select_one('h2.title')
                    or soup.select_one('h1')
                )

                if title_tag:
                    break

                logger.warning(f"[Luồng {self.thread_id}] Không tìm được title, thử lại {attempt}/3: {url[-30:]}")
                time.sleep(5)

            if not title_tag:
                self.skipped_urls.add(url)
                logger.warning(f"[Luồng {self.thread_id}] Bỏ qua URL sau 3 lần không tìm được title: {url[-30:]}")
                return True

            title = clean_text(title_tag.text)

            requirement = ""
            for sec in soup.select('.job-description__item'):
                h3 = sec.find('h3')
                h3_t = h3.get_text().lower() if h3 else ""
                cont = sec.select_one('.job-description__item--content')
                if "yêu cầu" in h3_t and cont:
                    requirement = cont.get_text(separator="\n", strip=True)

            level = normalize_level(detect_from_text(title + " " + requirement, LEVEL_KEYWORDS))
            skills = detect_from_text(requirement, SKILL_KEYWORDS)

            ten_vi_tri = "Khác"
            for group in soup.select('.job-tags__group'):
                if "Chuyên môn:" in group.get_text():
                    links = group.select('a.item')
                    if links:
                        ten_vi_tri = clean_text(links[0].text)
                    break

            comp_tag = (soup.select_one('.company-name-label a.name') or
                        soup.select_one('.job-detail__company--information-item.company-name a.name'))
            comp_name = clean_text(comp_tag.text).upper() if comp_tag else "N/A"

            # FIX: dùng .get() thay vì [] để tránh KeyError nếu tag không có href
            comp_href = comp_tag.get('href', '').split('?')[0] if comp_tag else ""

            # FIX: parse lương & kinh nghiệm theo label thay vì index cứng
            salary_raw, exp_raw = parse_info_sections(soup)
            s_min, s_max = parse_salary(salary_raw)
            exp_years = int(re.search(r'\d+', exp_raw).group(0)) if re.search(r'\d+', exp_raw) else 0

            deadline_el = soup.select_one('.job-detail__info--deadline')
            deadline_raw = clean_text(deadline_el.text) if deadline_el else ""
            deadline = parse_deadline(deadline_raw)

            linhvuc_el = soup.select_one('.company-field .company-value')
            quumo_el = soup.select_one('.company-scale .company-value')

            job_data = {
                'job_url': url,
                'title': title,
                'salary': {'min': s_min, 'max': s_max},
                'exp': {'years': exp_years},
                'deadline': deadline,
                'crawl_time': datetime.now(),
                'level': level,
                'company': {
                    'ten': comp_name,
                    'link': comp_href,
                    'linhVuc': clean_text(linhvuc_el.text) if linhvuc_el else "N/A",
                    'quyMo': clean_text(quumo_el.text) if quumo_el else "N/A",
                },
                'viTri': {'ten': ten_vi_tri},
                'skills': list(set(skills)),
                'locations': [],
            }

            addr_rows = (soup.select('.job-description__item--content div[style*="margin-bottom"]') or
                         [soup.select_one('.job-description__item--content')])
            for row in addr_rows:
                if not row: continue
                txt = clean_text(row.text).replace('-', '').strip()
                if not txt or "địa điểm làm việc" in txt.lower():
                    continue
                if ":" in txt:
                    city, detail = txt.split(":")[0].strip(), txt.split(":")[1].strip()
                else:
                    city, detail = "Khác", txt
                job_data['locations'].append({'city': city, 'ward': parse_ward(detail)})

            if self.db.save_job(job_data):
                logger.info(f"[Luồng {self.thread_id}] ✓ {title[:40]}")
                print(f"[Luồng {self.thread_id}] ✓ {title[:40]}")
            return True

        except Exception as e:
            logger.error(f"[Luồng {self.thread_id}] ✗ Lỗi: {e}")
            print(f"[Luồng {self.thread_id}] ✗ Lỗi: {e}")
            if any(kw in str(e).lower() for kw in ("session", "chrome", "disconnected", "invalid session", "connection aborted", "connection reset")):
                return False  # Signal cần restart driver
            return True

    def restart_driver(self):
        """Tự động khởi động lại Chrome khi driver bị crash."""
        try:
            self.driver.quit()
        except Exception:
            pass
        self.driver = None
        logger.info(f"[Luồng {self.thread_id}] 🔄 Đang khởi động lại Chrome...")
        time.sleep(5)
        self.init_driver()

    def run(self):
        max_total_restarts = 10
        total_restarts = 0
        p = self.start_page

        while total_restarts < max_total_restarts:
            try:
                if self.driver is None:
                    self.init_driver()

                consecutive_errors = 0
                max_retries = 3
                prev_page_links = set()  # FIX: theo dõi links trang trước để detect redirect vô hạn

                while True:
                    target_url = f"https://www.topcv.vn/tim-viec-lam-cong-nghe-thong-tin-cr257?type_keyword=1&page={p}"
                    logger.info(f"[LUỒNG {self.thread_id}] TRANG {p}")
                    print(f"\n>>> [LUỒNG {self.thread_id}] TRANG {p}")
                    try:
                        if not self._is_driver_alive():
                            raise Exception("Chrome driver đã mất kết nối")

                        self.driver.get(target_url)
                        time.sleep(8)

                        # FIX: Kiểm tra TopCV có redirect về trang khác không
                        # VD: request page=12 nhưng URL thực tế lại là page=7 → đã vượt max
                        actual_url = self.driver.current_url
                        actual_page_match = re.search(r'page=(\d+)', actual_url)
                        if actual_page_match:
                            actual_page = int(actual_page_match.group(1))
                            if actual_page < p:
                                logger.info(f"[Luồng {self.thread_id}] ⛔ Yêu cầu trang {p} nhưng bị redirect về trang {actual_page} → hết trang, dừng.")
                                print(f"[Luồng {self.thread_id}] ⛔ Redirect về trang {actual_page}, dừng crawl.")
                                break

                        # FIX: Bảo vệ get_attribute("href") khỏi trả về None
                        raw_links = []
                        for a in self.driver.find_elements(
                            By.CSS_SELECTOR,
                            ".job-item-default h3.title a, .job-item-search-result h3.title a"
                        ):
                            href = a.get_attribute("href")
                            if href:
                                raw_links.append(href.split('?')[0])
                        clean_links = list(set([l for l in raw_links if l and "/viec-lam/" in l]))

                        if not clean_links:
                            # Có thể do anti-bot/CAPTCHA → retry trang này trước khi dừng
                            empty_retries = getattr(self, '_empty_retries', 0) + 1
                            self._empty_retries = empty_retries
                            if empty_retries <= 3:
                                wait = 10 + (empty_retries * 5)
                                logger.warning(f"[Luồng {self.thread_id}] ⚠ Trang {p} trống (có thể anti-bot), thử lại lần {empty_retries}/3 sau {wait}s...")
                                print(f"[Luồng {self.thread_id}] ⚠ Trang {p} trống, thử lại lần {empty_retries}/3...")
                                time.sleep(wait)
                                # Reload trang bằng cách quay lại đầu vòng while
                                continue
                            else:
                                logger.info(f"[Luồng {self.thread_id}] Trang {p} trống sau 3 lần thử → thật sự hết trang, dừng.")
                                print(f"[Luồng {self.thread_id}] Hết trang, dừng lại.")
                                self._empty_retries = 0
                                break
                        else:
                            self._empty_retries = 0  # Reset khi trang có dữ liệu

                        # Phát hiện trang trùng links với trang trước → redirect vô hạn
                        current_page_links = set(clean_links)
                        if current_page_links == prev_page_links:
                            logger.info(f"[Luồng {self.thread_id}] ⛔ Trang {p} trả về links giống trang trước → đã đến trang cuối, dừng.")
                            print(f"[Luồng {self.thread_id}] ⛔ Phát hiện redirect trang cuối, dừng crawl.")
                            break
                        prev_page_links = current_page_links

                        consecutive_errors = 0
                        for link in clean_links:
                            if link in self.skipped_urls:
                                continue
                            if not self.db.is_job_exists(link):
                                success = self.get_job_details(link)
                                if not success:
                                    logger.warning(f"[Luồng {self.thread_id}] Driver crash khi crawl chi tiết, restart...")
                                    self.restart_driver()
                                time.sleep(4)
                            else:
                                print(f"[Luồng {self.thread_id}] - Bỏ qua: {link[-20:]}")
                        p += self.step

                    except Exception as e:
                        consecutive_errors += 1
                        logger.error(f"[Luồng {self.thread_id}] ⚠ Lỗi trang {p}: {e}")
                        print(f"[Luồng {self.thread_id}] ⚠ Lỗi trang {p}: {e}")
                        if consecutive_errors >= max_retries:
                            logger.warning(f"[Luồng {self.thread_id}] ❌ Lỗi {max_retries} lần liên tiếp, restart Chrome...")
                            self.restart_driver()
                            consecutive_errors = 0
                        else:
                            print(f"[Luồng {self.thread_id}] 🔁 Thử lại trang {p} (lần {consecutive_errors}/{max_retries})...")
                            time.sleep(10)

                break  # Thoát vòng while True bình thường → kết thúc thread

            except Exception as e:
                total_restarts += 1
                logger.error(f"[Luồng {self.thread_id}] 💥 Lỗi nghiêm trọng (lần {total_restarts}/{max_total_restarts}): {e}")
                try:
                    self.driver.quit()
                except Exception:
                    pass
                self.driver = None
                if total_restarts < max_total_restarts:
                    wait_time = min(30, 10 * total_restarts)
                    print(f"[Luồng {self.thread_id}] ⏳ Chờ {wait_time}s rồi thử lại...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"[Luồng {self.thread_id}] 💀 Đã hết lượt restart, thread dừng hẳn.")

        try:
            self.driver.quit()
        except Exception:
            pass
        logger.info(f"[Luồng {self.thread_id}] 🏁 Kết thúc.")
        print(f"[Luồng {self.thread_id}] 🏁 Kết thúc.")

def cleanup_removed_jobs(db):
    """Check each TopCV URL and delete only jobs confirmed as removed."""
    def classify_removed_page(driver):
        current_url = driver.current_url.lower()
        title = driver.title.lower()
        page_src = driver.page_source.lower()

        transient_markers = (
            "captcha", "cloudflare", "access denied", "verify you are human",
            "too many requests", "unusual traffic", "robot", "blocked",
        )
        if any(marker in title or marker in page_src or marker in current_url for marker in transient_markers):
            return False, "transient/anti-bot page"

        # FIX: tách "404" riêng, chỉ check trong title để tránh false positive
        # (page source thường chứa "404" trong CSS/JS/SĐT/địa chỉ)
        removed_title_markers = (
            "không tìm thấy", "khong tim thay", "không tồn tại",
            "khong ton tai", "đã bị gỡ", "da bi go",
        )
        if any(marker in title for marker in removed_title_markers):
            return True, "removed marker in title"
        if "404" in title:
            return True, "404 in title"

        if "/viec-lam/" not in current_url:
            if current_url.rstrip("/") in ("https://www.topcv.vn", "https://topcv.vn"):
                return True, "redirected to home"
            if "/tim-viec-lam" in current_url:
                return True, "redirected to search"
            return False, f"unexpected redirect: {driver.current_url}"

        soup = BeautifulSoup(driver.page_source, 'html.parser')
        title_tag = soup.select_one('h1.job-detail__info--title') or soup.select_one('h2.title')
        if not title_tag:
            return False, "missing job title; skipped to avoid false delete"
        return False, "active"

    jobs = db.get_all_jobs()
    if not jobs:
        print("Không có tin nào trong DB.")
        return 0

    print(f"\n🔍 Kiểm tra {len(jobs)} tin trên TopCV...")
    options = uc.ChromeOptions()
    driver = uc.Chrome(options=options, version_main=148)
    deleted = 0
    skipped_uncertain = 0

    try:
        for i, (job_id, url, deadline) in enumerate(jobs):
            try:
                driver.get(url)
                time.sleep(random.uniform(3, 5))
                is_removed, reason = classify_removed_page(driver)

                if is_removed:
                    # FIX: redirect cần xác nhận kỹ hơn để tránh xóa nhầm do rate-limit
                    if "redirect" in reason:
                        # Redirect có thể do rate-limit tạm thời → cần 3 lần xác nhận
                        confirm_count = 0
                        for _ in range(3):
                            time.sleep(random.uniform(10, 15))
                            driver.get(url)
                            time.sleep(random.uniform(5, 8))
                            is_removed, reason = classify_removed_page(driver)
                            if is_removed:
                                confirm_count += 1
                            else:
                                break
                        is_removed = (confirm_count >= 3)
                    else:
                        # Removed marker trong title → double check như cũ
                        time.sleep(random.uniform(2, 4))
                        driver.get(url)
                        time.sleep(random.uniform(3, 5))
                        is_removed, reason = classify_removed_page(driver)

                if is_removed:
                    if db.delete_job(job_id):
                        deleted += 1
                        print(f"  🗑️ [{i+1}/{len(jobs)}] Đã xóa (bị gỡ): {url[-50:]}")
                else:
                    if reason != "active":
                        skipped_uncertain += 1
                        logger.warning(f"Bỏ qua không xóa {url[-50:]}: {reason}")
                    if (i + 1) % 20 == 0:
                        print(f"  ✓ [{i+1}/{len(jobs)}] Đã kiểm tra...")

            except Exception as e:
                logger.warning(f"Lỗi kiểm tra {url[-30:]}: {e}")
                # Nếu driver crash, restart
                if any(kw in str(e).lower() for kw in ("session", "chrome", "disconnected")):
                    try: driver.quit()
                    except Exception: pass
                    time.sleep(5)
                    driver = uc.Chrome(options=uc.ChromeOptions(), version_main=148)
                continue
    finally:
        try: driver.quit()
        except Exception: pass

    print(f"\n✓ Đã xóa {deleted} tin bị gỡ xuống. Bỏ qua {skipped_uncertain} tin chưa chắc chắn.")
    return deleted


if __name__ == "__main__":
    if "--cleanup" in sys.argv:
        print("=" * 50)
        print("🧹 CHẾ ĐỘ DỌN DẸP DATABASE")
        print("=" * 50)
        db = TopCVDatabase()

        # Bước 1: Xóa tin hết hạn theo ngày
        print("\n📅 Bước 1: Xóa tin đã hết hạn nộp hồ sơ...")
        expired = db.cleanup_expired_by_date()

        # Bước 2: Kiểm tra URL trên TopCV, xóa tin bị gỡ
        print("\n🌐 Bước 2: Kiểm tra tin bị gỡ trên TopCV...")
        removed = cleanup_removed_jobs(db)

        # Bước 3: Dọn bản ghi mồ côi
        print("\n🧹 Bước 3: Dọn bảng dữ liệu mồ côi...")
        db.cleanup_orphaned_records()

        print(f"\n{'=' * 50}")
        print(f"✅ HOÀN TẤT: Đã xóa {expired} tin hết hạn + {removed} tin bị gỡ.")
    else:
        db = TopCVDatabase()
        num_threads = 5
        threads = [WorkerThread(i + 1, i + 1, num_threads, db) for i in range(num_threads)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
