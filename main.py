import threading, time, re, random, sys
from datetime import datetime
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
from database import TopCVDatabase

sys.stdout.reconfigure(encoding="utf-8")

LEVEL_KEYWORDS = ["Intern", "Fresher", "Junior", "Mid-level", "Middle", "Senior", "Lead", "Team Lead", "Principal", "Staff Engineer", "Architect", "Developer", "Engineer", "Frontend Developer", "Backend Developer", "Fullstack Developer", "Tester", "QA", "QC", "DevOps Engineer", "Data Analyst", "Data Scientist", "Machine Learning Engineer", "AI Engineer", "Product Manager", "Project Manager", "Business Analyst", "System Analyst", "UI Designer", "UX Designer", "UI/UX Designer", "Scrum Master", "Technical Lead", "Engineering Manager", "CTO", "Entry-level", "Experienced", "Overqualified", "Underqualified", "Onsite", "Remote", "Hybrid", "Full-time", "Part-time", "Contract"]
SKILL_KEYWORDS = ["Python", "C", "C++", "C#", "Java", "JavaScript", "TypeScript", "Go", "Rust", "Kotlin", "Swift", "PHP", "Ruby", "Dart", "R", "MATLAB", "Bash", "PowerShell", "HTML", "CSS", "Sass", "Tailwind CSS", "Bootstrap", "ReactJS", "Next.js", "Vue.js", "Nuxt.js", "Angular", "Svelte", "Node.js", "Express.js", "NestJS", "Django", "Flask", "Spring Boot", "ASP.NET", "Laravel", "MySQL", "PostgreSQL", "SQL Server", "Oracle", "MongoDB", "Redis", "SQLite", "Firebase", "REST API", "GraphQL", "gRPC", "Git", "GitHub", "GitLab", "Bitbucket", "Docker", "Kubernetes", "CI/CD", "Jenkins", "GitHub Actions", "GitLab CI", "AWS", "Azure", "Google Cloud", "Linux", "Ubuntu", "CentOS", "Windows Server", "Nginx", "Apache", "Machine Learning", "Deep Learning", "Computer Vision", "NLP", "TensorFlow", "PyTorch", "Scikit-learn", "Data Analysis", "Data Visualization", "Big Data", "Hadoop", "Spark", "Cybersecurity", "Penetration Testing", "Ethical Hacking", "Networking", "TCP/IP", "DNS", "HTTP/HTTPS", "Microservices", "System Design", "Distributed Systems", "Agile", "Scrum", "Kanban", "Testing", "Unit Test", "Integration Test", "Automation Test", "Figma", "Adobe XD", "Photoshop", "Illustrator", "CapCut", "Adobe Premiere", "After Effects", "Unity", "Unreal Engine", "Android Development", "iOS Development", "Web Development", "Mobile Development", "Game Development", "Embedded Systems"]

def clean_text(text):
    if not text: return ""
    return re.sub(r'\s+', ' ', text).strip()

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

def parse_salary(salary_str):
    try:
        s = salary_str.replace('.', '').replace(',', '')
        nums = re.findall(r'\d+', s)
        if len(nums) >= 2:
            n1, n2 = float(nums[0]), float(nums[1])
            return min(n1, n2), max(n1, n2)
        elif len(nums) == 1:
            n = float(nums[0]); return n, n
    except: pass
    return 0.0, 0.0

init_lock = threading.Lock()

class WorkerThread(threading.Thread):
    def __init__(self, thread_id, start_page, step, db_instance):
        threading.Thread.__init__(self)
        self.thread_id = thread_id; self.start_page = start_page; self.step = step
        self.db = db_instance; self.driver = None

    def init_driver(self):
        with init_lock:
            print(f"[Luồng {self.thread_id}] Đang khởi tạo trình duyệt...")
            options = uc.ChromeOptions()
            self.driver = uc.Chrome(options=options, version_main=146)
            time.sleep(3)

    def get_job_details(self, url):
        try:
            self.driver.get(url)
            time.sleep(random.uniform(5, 7))
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')

            title_tag = soup.select_one('h1.job-detail__info--title') or soup.select_one('h2.title')
            if not title_tag: return
            title = clean_text(title_tag.text)
            
            description, requirement, benefit, location_raw = "", "", "", ""
            for sec in soup.select('.job-description__item'):
                h3 = sec.find('h3'); h3_t = h3.get_text().lower() if h3 else ""
                cont = sec.select_one('.job-description__item--content')
                if "mô tả" in h3_t: description = cont.get_text(separator="\n", strip=True)
                elif "yêu cầu" in h3_t: requirement = cont.get_text(separator="\n", strip=True)
                elif "quyền lợi" in h3_t: benefit = cont.get_text(separator="\n", strip=True)
                elif "địa điểm" in h3_t: location_raw = clean_text(cont.text)

            level = (detect_from_text(title + " " + requirement, LEVEL_KEYWORDS) or ["Nhân viên"])[0]
            skills = detect_from_text(requirement, SKILL_KEYWORDS)

            ten_vi_tri, mo_ta_vi_tri = "Khác", ""
            for group in soup.select('.job-tags__group'):
                if "Chuyên môn:" in group.get_text():
                    links = group.select('a.item')
                    if links: ten_vi_tri = clean_text(links[0].text); mo_ta_vi_tri = ", ".join([clean_text(l.text) for l in links])
                    break

            comp_tag = soup.select_one('.company-name-label a.name') or soup.select_one('.job-detail__company--information-item.company-name a.name')
            comp_name = clean_text(comp_tag.text).upper() if comp_tag else "N/A"
            
            job_data = {
                'job_url': url, 'title': title, 'desc': description, 'req': requirement, 'benefit': benefit,
                'salary': {'raw': clean_text(soup.select('.job-detail__info--section-content-value')[0].text if soup.select('.job-detail__info--section-content-value') else "Thỏa thuận"), 'min': 0, 'max': 0},
                'exp': {'raw': clean_text(soup.select('.job-detail__info--section-content-value')[2].text if len(soup.select('.job-detail__info--section-content-value')) >= 3 else "N/A"), 'years': 0},
                'location_raw': location_raw, 'deadline': clean_text(soup.select_one('.job-detail__info--deadline').text if soup.select_one('.job-detail__info--deadline') else "N/A"),
                'crawl_time': datetime.now(), 'level': level,
                'company': {'ten': comp_name, 'link': comp_tag['href'].split('?')[0] if comp_tag else "", 'diaChi': clean_text(soup.select_one('.company-address .company-value').text if soup.select_one('.company-address .company-value') else "N/A"), 'linhVuc': clean_text(soup.select_one('.company-field .company-value').text if soup.select_one('.company-field .company-value') else "N/A"), 'quyMo': clean_text(soup.select_one('.company-scale .company-value').text if soup.select_one('.company-scale .company-value') else "N/A")},
                'viTri': {'ten': ten_vi_tri, 'moTa': mo_ta_vi_tri}, 'skills': list(set(skills)), 'locations': []
            }

            s_min, s_max = parse_salary(job_data['salary']['raw'])
            job_data['salary']['min'], job_data['salary']['max'] = s_min, s_max
            job_data['exp']['years'] = int(re.search(r'\d+', job_data['exp']['raw']).group(0)) if re.search(r'\d+', job_data['exp']['raw']) else 0

            addr_rows = soup.select('.job-description__item--content div[style*="margin-bottom"]') or [soup.select_one('.job-description__item--content')]
            for row in addr_rows:
                txt = clean_text(row.text).replace('-', '').strip()
                if not txt or "địa điểm làm việc" in txt.lower(): continue
                city, detail = (txt.split(":")[0].strip(), txt.split(":")[1].strip()) if ":" in txt else ("Khác", txt)
                job_data['locations'].append({'city': city, 'ward': parse_ward(detail), 'detail': detail})

            if self.db.save_job(job_data): print(f"[Luồng {self.thread_id}] ✓ {title[:30]}")
        except Exception as e: print(f"[Luồng {self.thread_id}] ✗ Lỗi: {e}")

    def run(self):
        self.init_driver()
        p = self.start_page
        while True:
            target_url = f"https://www.topcv.vn/tim-viec-lam-cong-nghe-thong-tin-cr257?type_keyword=1&page={p}"
            print(f"\n>>> [LUỒNG {self.thread_id}] TRANG {p}")
            self.driver.get(target_url); time.sleep(8)
            links = [a.get_attribute("href").split('?')[0] for a in self.driver.find_elements(By.CSS_SELECTOR, ".job-item-default h3.title a, .job-item-search-result h3.title a")]
            clean_links = list(set([l for l in links if l and "/viec-lam/" in l]))
            if not clean_links: break
            for link in clean_links:
                if not self.db.is_job_exists(link): self.get_job_details(link); time.sleep(4)
                else: print(f"[Luồng {self.thread_id}] - Bỏ qua: {link[-15:]}")
            p += self.step
        self.driver.quit()

if __name__ == "__main__":
    db = TopCVDatabase(); num_threads = 5
    threads = [WorkerThread(i+1, i+1, num_threads, db) for i in range(num_threads)]
    for t in threads: t.start()
    for t in threads: t.join()