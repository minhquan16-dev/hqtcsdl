# PROMPT.md

You are a senior Node.js backend engineer.

Build a Node.js Express backend for a Microsoft SQL Server Data Warehouse.

## 1. Project context

The project is a web system for analyzing the IT recruitment market in Vietnam.

The Data Warehouse is built from IT job postings collected from TopCV. The system collects recruitment data, cleans and normalizes it, loads it into a relational database, transforms it into a Data Warehouse, then exposes analytics results through REST APIs for a frontend dashboard.

The backend must be designed for data analysis and reporting, not CRUD management.

Use the project document `BTL CSDL.md` as the main business reference.

Before designing any API:

1. Read and understand `BTL CSDL.md`.
2. Understand the business problem.
3. Inspect the real SQL Server Data Warehouse schema.
4. Compare the project document requirements with the real database schema.
5. Design APIs based on what the Data Warehouse actually supports.

Do not design generic APIs.
Do not design ecommerce APIs.
Do not design sales dashboard APIs.
Do not generate CRUD endpoints for every table.

The business goal is to support dashboard analysis for the Vietnam IT recruitment market.

## 2. Project folder

The current project folder is named:

```text
backend
```

The main backend file must be:

```text
server.js
```

Do not use `src/app.js` as the main file.

The app must run with:

```bash
npm run dev
npm start
```

## 3. Tech stack

Use:

* Node.js
* Express
* Microsoft SQL Server
* mssql
* dotenv
* cors

Do not use:

* Sequelize
* Prisma
* TypeORM
* Any ORM
* Fake data
* Mock database
* Frontend code

## 4. Authentication

Do not implement authentication for now.

Do not create:

* Login
* Register
* JWT
* Auth middleware
* Role-based permission
* User table
* Password handling

All APIs are public for now.

Focus only on reading and analyzing data from the Data Warehouse.

## 5. Language requirements

All API response messages must be in Vietnamese.

This includes:

* Success messages
* Error messages
* Empty data messages
* Validation messages
* 404 messages
* Database connection messages printed to console
* README.md

Code identifiers should remain in English for readability.

Use English for:

* Variable names
* Function names
* File names
* Folder names
* Route module names

Vietnamese is required for:

* API response messages
* README.md
* User-facing documentation
* Error text returned to frontend

## 6. Environment variables

Read all database credentials from `.env`.

Required `.env` variables:

```env
PORT=3001

DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=JobDW
DB_USER=sa
DB_PASSWORD=Kien05112005@

DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

Do not hardcode database credentials anywhere.

Do not expose the database password in README.md.

Do not print the database password in logs.

## 7. Required project structure

Create and use this structure:

```text
backend/
  server.js
  .env
  .gitignore
  package.json
  README.md
  PROMPT.md
  docs/
    database-schema.md
    api-proposal.md
  config/
    db.js
  repositories/
  services/
  controllers/
  routes/
  middleware/
  utils/
```

Responsibilities:

```text
server.js
```

* Load dotenv
* Create Express app
* Enable cors
* Enable express.json()
* Mount routes under `/api`
* Add health check
* Add 404 handler
* Add global error handler
* Start server

```text
config/db.js
```

* Configure SQL Server connection
* Create reusable connection pool
* Export sql and poolPromise
* Use env variables only

```text
repositories/
```

* Store SQL queries
* Use parameterized queries only
* Do not contain HTTP request or response logic

```text
services/
```

* Store business logic
* Validate business-level conditions
* Transform raw query results if needed

```text
controllers/
```

* Handle req and res
* Parse query parameters
* Return Vietnamese JSON responses

```text
routes/
```

* Define API routes
* Connect routes to controllers

```text
middleware/
```

* Global error handler
* 404 handler
* Request validation helpers if needed

```text
utils/
```

* Shared helpers
* Response helpers
* Date parsing helpers
* Number parsing helpers

## 8. Database connection requirements

Use the `mssql` package.

Create a reusable SQL Server connection pool.

Do not open a new database connection for every request.

The database config must use:

* DB_SERVER
* DB_PORT
* DB_DATABASE
* DB_USER
* DB_PASSWORD
* DB_ENCRYPT
* DB_TRUST_SERVER_CERTIFICATE

`config/db.js` should export:

```js
sql
poolPromise
```

If the database connection succeeds, print a Vietnamese message:

```text
Kết nối SQL Server thành công
```

If the database connection fails, print a clear Vietnamese error message and stop the process.

## 9. API response format

Use this format for successful responses:

```json
{
  "success": true,
  "message": "Lấy dữ liệu thành công",
  "data": []
}
```

Use this format for errors:

```json
{
  "success": false,
  "message": "Đã xảy ra lỗi khi xử lý yêu cầu",
  "error": "Chi tiết lỗi"
}
```

Use this format for empty data:

```json
{
  "success": true,
  "message": "Không có dữ liệu phù hợp",
  "data": []
}
```

Use this format for validation errors:

```json
{
  "success": false,
  "message": "Tham số không hợp lệ",
  "error": "Mô tả lỗi"
}
```

Use this format for 404:

```json
{
  "success": false,
  "message": "Không tìm thấy API yêu cầu"
}
```

## 10. Health check

Add:

```text
GET /api/health
```

Purpose:

* Confirm that the backend is running.
* Do not expose database credentials.
* Do not expose sensitive environment variables.
* Do not expose internal stack traces.

Example response:

```json
{
  "success": true,
  "message": "Backend đang hoạt động",
  "data": {
    "status": "ok",
    "timestamp": "2026-06-05T00:00:00.000Z"
  }
}
```

Do not require authentication for health check.

## 11. Main business domain

The system analyzes IT recruitment data in Vietnam.

The backend should help answer questions such as:

* Mỗi quý có bao nhiêu tin tuyển dụng IT?
* Kỹ năng hoặc ngôn ngữ nào được yêu cầu nhiều nhất?
* Vị trí nào đang được tuyển nhiều nhất?
* Backend, Frontend, DevOps, Data, AI, Tester khác nhau như thế nào?
* Mức lương trung bình theo vị trí là bao nhiêu?
* Mức lương trung bình theo kinh nghiệm là bao nhiêu?
* Mức lương trung bình theo thành phố là bao nhiêu?
* Nhu cầu tuyển dụng tăng hay giảm theo quý?
* Công ty nào tuyển nhiều nhất?
* Fresher, Junior, Middle, Senior chiếm tỉ lệ bao nhiêu?
* Thị trường tuyển dụng khác nhau như thế nào theo địa điểm, kỹ năng, vị trí và cấp bậc?

## 12. Business reference from BTL CSDL.md

Use the project document `BTL CSDL.md` as the main reference.

The document describes these important areas:

1. Problem scope:

   * Analyze the IT recruitment market in Vietnam.
   * Provide dashboard insights for students, developers, recruiters and end users.

2. Data flow:

   * Crawl job posts.
   * Clean and normalize data.
   * Store in relational database.
   * Transform into Data Warehouse.
   * Provide REST APIs.
   * Display dashboard on frontend.

3. Core analysis goals:

   * Number of IT job postings by quarter.
   * Most requested skills and programming languages.
   * Hot job positions.
   * Average salary by position, experience and city.
   * Recruitment demand trend by quarter.
   * Top hiring companies.
   * Distribution by job level.
   * Market comparison by location, skill, salary and experience.

4. Important entities:

   * TinTuyenDung
   * CongTy
   * DiaDiem
   * KyNang
   * CapBacCongViec
   * ViTriCongViec
   * TinTuyenDung_DiaDiem
   * TinTuyenDung_KyNang

5. Important fields:

   * tinTuyenDungId
   * linkBaiDang
   * tieuDeCongViec
   * luongMin
   * luongMax
   * soNamKinhNghiem
   * hanNopHoSo
   * thoiDiemThuThap
   * congTyId
   * viTriId
   * capBacId
   * tenCongTy
   * linkCongTy
   * linhVuc
   * quyMo
   * diaDiemId
   * tenThanhPho
   * tenPhuongXa
   * kyNangId
   * tenKyNang
   * tenCapBac
   * tenViTriChuan

6. Important relationships:

   * CongTy has many TinTuyenDung.
   * ViTriCongViec has many TinTuyenDung.
   * CapBacCongViec has many TinTuyenDung.
   * TinTuyenDung has many DiaDiem through TinTuyenDung_DiaDiem.
   * TinTuyenDung has many KyNang through TinTuyenDung_KyNang.

## 13. Data Warehouse inspection requirement

Before writing backend APIs, inspect the real `JobDW` schema.

Do not assume that the Data Warehouse table names are exactly the same as the OLTP names in the document.

You must discover the actual schema using SQL Server metadata.

Inspect:

* Tables
* Views
* Columns
* Data types
* Nullable fields
* Primary keys
* Foreign keys
* Fact tables
* Dimension tables
* Measures
* Date fields
* Relationships
* Useful indexes if available

Use SQL Server metadata sources such as:

* INFORMATION_SCHEMA.TABLES
* INFORMATION_SCHEMA.COLUMNS
* INFORMATION_SCHEMA.KEY_COLUMN_USAGE
* sys.tables
* sys.columns
* sys.key_constraints
* sys.foreign_keys
* sys.foreign_key_columns
* sys.views

After inspection, create:

```text
docs/database-schema.md
```

This document must include:

1. Database overview
2. List of tables and views
3. Columns and data types
4. Primary keys
5. Foreign keys
6. Identified fact tables
7. Identified dimension tables
8. Relationships
9. Possible business measures
10. Notes about schema limitations

Write this document in Vietnamese.

## 14. API design requirement

Do not blindly follow predefined endpoint names.

You must design the API yourself based on:

1. The business requirements in `BTL CSDL.md`
2. The real `JobDW` Data Warehouse schema
3. The available fact tables
4. The available dimension tables
5. The available measures
6. The available date fields
7. The available relationships

Only propose APIs that can be implemented from the actual schema.

Do not invent:

* Tables
* Columns
* Metrics
* Joins
* Relationships
* Filters
* Fake values

If `BTL CSDL.md` requires a metric but the real schema does not support it, clearly mention the limitation in Vietnamese.

If the real schema supports a useful metric not explicitly listed in `BTL CSDL.md`, you may propose it, but explain why it is useful for analyzing the IT recruitment market.

## 15. API proposal requirement

Before generating backend code, create:

```text
docs/api-proposal.md
```

Write it in Vietnamese.

For each proposed API, include:

1. Endpoint path
2. HTTP method
3. Query parameters
4. Business purpose
5. Tables or views used
6. Main joins
7. Main metrics returned
8. Example response in Vietnamese
9. Notes or limitations

API proposal must be based on the real schema.

After creating `docs/api-proposal.md`, stop and wait for my approval.

Do not generate the full backend code until I approve the API proposal.

## 16. Suggested API analysis directions

These are analysis directions, not fixed endpoint names.

You must adapt them based on the real Data Warehouse schema.

Possible groups:

1. Dashboard overview:

   * Tổng số tin tuyển dụng
   * Tổng số công ty
   * Tổng số kỹ năng
   * Tổng số vị trí
   * Lương trung bình
   * Thành phố tuyển dụng nhiều nhất
   * Kỹ năng được yêu cầu nhiều nhất

2. Recruitment trend:

   * Số tin tuyển dụng theo tháng
   * Số tin tuyển dụng theo quý
   * Xu hướng tăng giảm theo thời gian

3. Job position analysis:

   * Nhu cầu tuyển dụng theo vị trí
   * Vị trí hot nhất
   * Lương trung bình theo vị trí
   * Kinh nghiệm trung bình theo vị trí

4. Skill analysis:

   * Top kỹ năng được yêu cầu nhiều nhất
   * Kỹ năng theo vị trí
   * Kỹ năng theo cấp bậc
   * Kỹ năng theo thời gian
   * Các kỹ năng thường xuất hiện cùng nhau nếu schema hỗ trợ

5. Salary analysis:

   * Lương trung bình
   * Lương min, max, average
   * Lương theo vị trí
   * Lương theo kỹ năng
   * Lương theo thành phố
   * Lương theo cấp bậc
   * Lương theo kinh nghiệm

6. Location analysis:

   * Số tin theo thành phố
   * Số tin theo phường hoặc khu vực nếu schema hỗ trợ
   * Lương theo thành phố
   * Vị trí phổ biến theo thành phố
   * Kỹ năng phổ biến theo thành phố

7. Company analysis:

   * Công ty tuyển nhiều nhất
   * Công ty theo lĩnh vực
   * Công ty theo quy mô
   * Số tin tuyển dụng theo công ty
   * Lương trung bình theo công ty nếu schema hỗ trợ

8. Level and experience analysis:

   * Phân bố Fresher, Junior, Middle, Senior
   * Kinh nghiệm trung bình theo vị trí
   * Kỹ năng theo cấp bậc
   * Lương theo cấp bậc

9. Search and filter:

   * Tìm kiếm dữ liệu phân tích theo kỹ năng
   * Lọc theo vị trí
   * Lọc theo thành phố
   * Lọc theo công ty
   * Lọc theo cấp bậc
   * Lọc theo khoảng lương
   * Lọc theo kinh nghiệm
   * Lọc theo thời gian

Only implement these if the real schema supports them.

## 17. Query parameter rules

Validate all query parameters.

Common possible query parameters:

* fromDate
* toDate
* year
* quarter
* month
* city
* skill
* position
* company
* level
* salaryMin
* salaryMax
* experienceMin
* experienceMax
* limit
* page
* pageSize
* sortBy
* sortOrder

Rules:

* Numeric filters must be parsed safely.
* Date filters must be validated.
* limit must have a safe maximum.
* page and pageSize must be positive integers.
* sortBy must be whitelisted.
* sortOrder must only allow asc or desc.
* Use default values when appropriate.
* Return Vietnamese validation errors.

## 18. SQL rules

Use parameterized SQL queries only.

Do not concatenate user input directly into SQL strings.

Avoid:

```sql
SELECT *
```

in analytics APIs.

Prefer:

* Explicit column selection
* GROUP BY
* ORDER BY
* COUNT
* AVG
* MIN
* MAX
* SUM
* CTEs
* Window functions when useful

Do not load unnecessary rows into Node.js.

Let SQL Server perform aggregation.

Use pagination for list endpoints.

Keep SQL queries inside repositories.

## 19. Architecture rules

Use this flow:

```text
Route -> Controller -> Service -> Repository -> SQL Server
```

Routes:

* Define endpoints only
* Call controller functions

Controllers:

* Read req.params and req.query
* Validate basic request inputs
* Call services
* Return Vietnamese JSON responses

Services:

* Contain business logic
* Decide empty data messages
* Transform or enrich data if needed

Repositories:

* Contain SQL queries
* Use mssql request input parameters
* Return raw database results

Middleware:

* Handle errors centrally
* Handle 404 centrally
* Do not expose internal stack traces in production responses

## 20. Comment policy

Write self-explanatory code.

Avoid unnecessary comments.

Do not add comments that simply repeat what the code already says.

Do not comment obvious Express, JavaScript, or SQL Server logic.

Do not add decorative comment blocks.

Do not add comments like:

```js
// Import express
// Create router
// Get data
// Return response
// Connect to database
// Handle error
```

Prefer clear function names, variable names and file structure instead of comments.

Only add comments when they explain why something is done, not what the code does.

Comments are allowed only for:

1. Complex business logic
2. Non-obvious SQL queries
3. Data Warehouse-specific assumptions
4. Important temporary TODO notes
5. Workarounds for SQL Server, Docker or mssql behavior

Keep comments short and useful.

Before adding any comment, ask:

```text
Would this comment still be useful after 6 months?
```

If the answer is no, do not add it.

## 21. README requirement

Create `README.md` in Vietnamese.

README must include:

1. Mục tiêu backend
2. Công nghệ sử dụng
3. Cấu trúc thư mục
4. Cách tạo file `.env`
5. Cách cài dependencies
6. Cách chạy development
7. Cách chạy production
8. Cách test health check
9. Danh sách API sau khi được phê duyệt
10. Lưu ý không commit `.env`

Do not include the real database password in README.

Use placeholder:

```env
DB_PASSWORD=your_password
```

## 22. package.json scripts

Ensure `package.json` has:

```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js"
  }
}
```

## 23. Required dependencies

Install:

```bash
npm install express mssql cors dotenv
npm install -D nodemon
```

## 24. Required .gitignore

Create `.gitignore`:

```gitignore
node_modules
.env
.DS_Store
```

## 25. Development workflow

Follow this order strictly:

1. Read `BTL CSDL.md`.
2. Verify `.env` exists.
3. Verify SQL Server connection.
4. Inspect the real `JobDW` schema.
5. Create `docs/database-schema.md`.
6. Identify fact tables and dimension tables.
7. Compare the schema with the business requirements in `BTL CSDL.md`.
8. Create `docs/api-proposal.md`.
9. Stop and wait for my approval.
10. Only after approval, generate backend code.
11. Run and test the backend.
12. Update README.md.

Do not skip steps.

## 26. Stop condition

After creating:

```text
docs/database-schema.md
docs/api-proposal.md
```

Stop.

Do not generate full backend code yet.

Wait for my approval.

## 27. Final reminders

* Main file must be `server.js`.
* API response messages must be Vietnamese.
* No authentication for now.
* No CRUD for every table.
* No fake data.
* No invented schema.
* No hardcoded password.
* No unnecessary comments.
* Design APIs from the real Data Warehouse schema.
* Use `BTL CSDL.md` as the main business reference.
* The final backend must support a dashboard for analyzing the IT recruitment market in Vietnam.
