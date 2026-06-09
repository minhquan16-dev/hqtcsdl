Bạn là Codex đang làm frontend cho dashboard phân tích thị trường tuyển dụng IT.

Quan trọng:

* Chỉ làm việc trong folder `frontend/`.
* Không sửa backend trừ khi tôi yêu cầu.
* Đặc tả API chính thức nằm ở `backend/docs/api-spec.md`.
* README backend nằm ở `backend/README.md`.
* Các skill đã được cài sẵn trong folder `frontend/`.
* Frontend phải dùng JavaScript, không dùng TypeScript.
* Không tạo file `.ts` hoặc `.tsx`.
* Dùng `.js` và `.jsx`.
* Phải dùng preset shadcn này:
  `npx shadcn@latest init --preset b3SRvuwbo --template vite --pointer`

Mục tiêu:
Xây dựng frontend React Vite hoàn chỉnh, đẹp, sạch, có gu, không AI slop, bám tuyệt đối theo `backend/docs/api-spec.md`.

Trước khi code, hãy làm theo thứ tự:

1. Vào đúng folder frontend

   * Kiểm tra repo root.
   * Xác nhận tồn tại:

     * `frontend/`
     * `backend/docs/api-spec.md`
     * `backend/README.md`
   * Tất cả lệnh npm, shadcn, build, lint phải chạy trong `frontend/`.

2. Đọc tài liệu backend

   * Đọc `backend/docs/api-spec.md`.
   * Đọc `backend/README.md` để biết cách backend chạy, port, base URL, lưu ý môi trường.
   * Không dùng API ngoài `backend/docs/api-spec.md`.
   * Không tự thêm endpoint.
   * Không đổi endpoint.
   * Không đổi query param.
   * Không đổi response field.

3. Đọc và dùng skill trong `frontend/`

   * Tìm các skill đã cài trong `frontend/`, đặc biệt:

     * `taste-skill`
     * `shadcn/ui`
   * Đọc file hướng dẫn của skill, thường là `SKILL.md` hoặc tài liệu tương đương trong folder skill.
   * Áp dụng `taste-skill` để kiểm tra:

     * layout
     * visual hierarchy
     * spacing
     * typography
     * density
     * empty state
     * loading state
     * responsive behavior
     * tránh UI generic, thô, AI slop
   * Áp dụng `shadcn/ui` skill để chọn đúng component, pattern, composition, variant, form control, chart/table/card layout.
   * Nếu skill có checklist, hãy dùng checklist đó trước khi hoàn tất.

4. Khởi tạo hoặc đồng bộ shadcn

   * Chạy trong `frontend/`:
     `npx shadcn@latest init --preset b1tf4zFsu --template vite --pointer`
   * Nếu CLI hỏi TypeScript hay JavaScript, chọn JavaScript.
   * Nếu frontend đã có cấu hình shadcn, kiểm tra trước khi ghi đè.
   * Nếu có conflict, báo rõ file conflict và chọn hướng ít phá code nhất.
   * Sau đó cài các component shadcn cần dùng bằng CLI, không tự copy bừa.

Stack bắt buộc:

* React + Vite.
* JavaScript.
* JSX.
* Không TypeScript.
* Không tạo `types/api.ts`.
* Không tạo interface/type của TypeScript.
* Nếu cần mô tả shape dữ liệu, dùng JSDoc trong file `.js`.
* Tailwind CSS theo preset.
* shadcn/ui làm UI foundation.
* Recharts cho biểu đồ nếu chưa có chart lib.
* Axios hoặc fetch đều được, nhưng API client phải gom vào một nơi rõ ràng.

Base URL:

* Backend local theo docs: `http://localhost:3001`.
* Tạo hoặc cập nhật `frontend/.env.example`:
  `VITE_API_BASE_URL=http://localhost:3001`
* API client đọc từ:
  `import.meta.env.VITE_API_BASE_URL`

Quy tắc API bắt buộc:

* Response chuẩn có:

  * `success`
  * `message`
  * `data`
  * `error`
* Field trong `data` dùng tên tiếng Việt theo `backend/docs/api-spec.md`, ví dụ:

  * `tongSoTin`
  * `soTin`
  * `soTinCoLuong`
  * `luongTrungBinh`
  * `kinhNghiemTB`
  * `tenThanhPho`
  * `tenPhuongXa`
  * `tenKyNang`
  * `tenKyNangLienQuan`
  * `tenViTriChuan`
  * `tenCongTy`
  * `tenCapBac`
  * `nhanQuy`
  * `nam`
  * `quy`
  * `thang`
* Query params vẫn là tiếng Anh theo docs:

  * `year`
  * `quarter`
  * `month`
  * `fromDate`
  * `toDate`
  * `city`
  * `ward`
  * `skill`
  * `position`
  * `company`
  * `level`
  * `salaryMin`
  * `salaryMax`
  * `experienceMin`
  * `experienceMax`
  * `limit`
  * `sortBy`
  * `sortOrder`
  * `groupBy`
* Không đọc response bằng field cũ như:

  * `jobCount`
  * `averageSalary`
  * `averageExperience`
  * `city`
  * `ward`
  * `skill`
  * `position`
  * `company`
  * `level`
* Các field cũ chỉ được xuất hiện khi là query param, `sortBy`, `groupBy`, hoặc mapping helper.

Cấu trúc code đề xuất trong `frontend/src/`:

* `pages/`
* `components/`
* `components/ui/`
* `components/charts/`
* `components/dashboard/`
* `components/filters/`
* `hooks/`
* `lib/api.js`
* `lib/format.js`
* `lib/constants.js`

Không tạo:

* `types/api.ts`
* file `.ts`
* file `.tsx`

Có thể tạo:

* `lib/api.js`
* `lib/format.js`
* `lib/query.js`
* `hooks/useApi.js`
* `components/**/*.jsx`

Các màn hình hoặc section cần làm:

1. Dashboard Overview

* Gọi `GET /api/analytics/overview`
* KPI cards:

  * Tổng số tin: `tongSoTin`
  * Tin có lương: `soTinCoLuong`
  * Công ty: `soCongTy`
  * Vị trí: `soViTri`
  * Kỹ năng: `soKyNang`
  * Lương trung bình: `luongTrungBinh`
  * Thành phố nổi bật: `thanhPhoNoiBat.tenThanhPho`
  * Kỹ năng nổi bật: `kyNangNoiBat.tenKyNang`
* Có loading skeleton, empty state, error state.

2. Bộ lọc tổng

* Gọi `GET /api/analytics/filters`
* Options từ response:

  * `nam`
  * `nhanQuy`
  * `tenThanhPho`
  * `tenCapBac`
  * `tenViTriChuan`
  * `tenKyNang`
  * `tenCongTy`
* Khi user chọn filter, convert sang query param tiếng Anh:

  * `tenThanhPho` -> `city`
  * `tenKyNang` -> `skill`
  * `tenViTriChuan` -> `position`
  * `tenCongTy` -> `company`
  * `tenCapBac` -> `level`
  * `nam` -> `year`
* Với option dài như công ty, dùng combobox hoặc searchable select.

3. Xu hướng tuyển dụng

* `GET /api/analytics/trends/quarters`
* `GET /api/analytics/trends/months`
* Chart dùng:

  * label `nhanQuy` hoặc `thang`
  * value `soTin`
  * có thể thêm `soTinCoLuong`
* Nếu data chưa sort, sort tăng dần theo `nam`, `quy`, `thang`.

4. Phân tích vị trí

* `GET /api/analytics/positions`
* Render chart/table:

  * `tenViTriChuan`
  * `soTin`
  * `soTinCoLuong`
  * `luongTrungBinh`
  * `luongMin`
  * `luongMax`
  * `kinhNghiemTB`
* `sortBy` vẫn dùng:

  * `jobCount`
  * `averageSalary`
  * `averageExperience`
* Khi chọn vị trí, gọi:

  * `GET /api/analytics/positions/:position/skills`
* Dữ liệu skills:

  * `data.tenViTriChuan`
  * `data.kyNang[].tenKyNang`
  * `data.kyNang[].soTin`
  * `data.kyNang[].tyLe`

5. Kỹ năng và ngôn ngữ

* `GET /api/analytics/skills/top`
* `GET /api/analytics/languages/top`
* `GET /api/analytics/skills/co-occurrence`
* Render:

  * Top kỹ năng: `xepHang`, `tenKyNang`, `soTin`, `tyLeTheoTongTin`
  * Top ngôn ngữ: `xepHang`, `ngonNgu`, `soTin`, `tyLeTheoTongTin`
  * Kỹ năng đi kèm: `tenKyNang`, `tenKyNangLienQuan`, `soTin`
* Với co-occurrence, input query param vẫn là `skill`.

6. Phân tích lương

* `GET /api/analytics/salaries/by-position`
* `GET /api/analytics/salaries/by-experience`
* `GET /api/analytics/salaries/by-city`
* `GET /api/analytics/salaries/by-skill`
* Render đúng field:

  * `tenViTriChuan`
  * `nhomKinhNghiem`
  * `tenThanhPho`
  * `tenKyNang`
  * `luongTrungBinh`
  * `soTin`
  * `soTinCoLuong`
  * `xepHang`
* Nếu `luongTrungBinh` null, hiển thị "Chưa có dữ liệu".

7. Địa điểm và thị trường

* `GET /api/analytics/locations`
* `GET /api/analytics/locations/wards`
* `GET /api/analytics/markets/cities`
* Render:

  * `tenThanhPho`
  * `tenPhuongXa`
  * `soTin`
  * `luongTrungBinh`
  * `kinhNghiemTB`
  * `soViTriKhacNhau`
* Với tiếng Việt trong query như Hà Nội, phải encode URL đúng.

8. Công ty

* `GET /api/analytics/companies/top`
* `GET /api/analytics/companies/by-field`
* Render:

  * `xepHang`
  * `tenCongTy`
  * `linhVuc`
  * `quyMo`
  * `soTin`
  * `soCongTy`
* Tên công ty dài phải truncate đẹp, có tooltip hoặc title.

9. Cấp bậc và kinh nghiệm

* `GET /api/analytics/levels`
* `GET /api/analytics/experience/by-position`
* `GET /api/analytics/levels/:level/skills`
* Render:

  * `tenCapBac`
  * `tyLe`
  * `tenViTriChuan`
  * `kinhNghiemTB`
  * `kyNang[].tenKyNang`
  * `kyNang[].soTin`
  * `kyNang[].tyLe`

10. Bộ lọc tổng hợp

* `GET /api/analytics/jobs/summary`
* `GET /api/analytics/jobs/breakdown`
* Summary cards:

  * `soTin`
  * `soTinCoLuong`
  * `luongTrungBinh`
  * `kinhNghiemTB`
  * `soCongTy`
  * `soViTri`
  * `soKyNang`
* Breakdown:

  * query bắt buộc `groupBy`
  * `groupBy` nhận `quarter`, `month`, `city`, `ward`, `skill`, `position`, `company`, `level`
  * response dùng `nhom`, `soTin`, `soTinCoLuong`, `luongTrungBinh`

UI yêu cầu:

* Dashboard chuyên nghiệp, không giống template thô.
* Có sidebar hoặc top navigation rõ ràng.
* Header có title, subtitle, trạng thái backend.
* Filter bar dễ dùng, responsive.
* Cards có hierarchy rõ, spacing thoáng.
* Chart card có title, description, legend, empty state.
* Table responsive, có overflow hợp lý.
* Dùng shadcn components:

  * `Card`
  * `Button`
  * `Badge`
  * `Input`
  * `Select`
  * `Popover`
  * `Command`
  * `Table`
  * `Tabs`
  * `Skeleton`
  * `Alert`
  * `Tooltip`
  * `Separator`
* Không lạm dụng gradient, shadow, icon, màu sắc.
* Không dùng lorem ipsum.
* Không hardcode số liệu thật.
* Không tạo UI giả nếu chưa gọi API.

API client:

* Tạo `apiClient` trong `frontend/src/lib/api.js`.
* Dùng base URL từ `VITE_API_BASE_URL`.
* Có helper build query params:

  * bỏ qua `undefined`
  * bỏ qua `null`
  * bỏ qua chuỗi rỗng
* Handle response:

  * Nếu `success === false`, throw error bằng `message` hoặc `error`.
  * Nếu `data` rỗng, UI hiển thị empty state.
* Không crash khi field null.
* Không assume nested object tồn tại, ví dụ `kyNangNoiBat` hoặc `thanhPhoNoiBat` có thể null.

JSDoc:

* Nếu cần mô tả shape data, dùng JSDoc trong `.js`.
* Không dùng TypeScript type/interface.
* Ví dụ được phép:
  `/** @typedef {{ success: boolean, message: string, data: any, error?: string }} ApiResponse */`
* Không lạm dụng `any` bằng JSDoc nếu có thể mô tả object rõ.

Quality gate:

* Sau khi code, chạy trong `frontend/`:

  * install nếu cần
  * lint nếu có
  * build nếu có
* Tự grep hoặc kiểm tra code:

  * Không đọc `jobCount` từ response.
  * Không đọc `averageSalary` từ response.
  * Không đọc `averageExperience` từ response.
  * Không đọc `city`, `skill`, `position`, `company`, `level` từ response.
  * Các tên đó chỉ được phép xuất hiện trong query param, sortBy, groupBy, hoặc mapping helper.
* Nếu backend đang chạy, test nhanh:

  * `/api/health`
  * `/api/analytics/overview`
  * `/api/analytics/filters`
  * `/api/analytics/skills/top`
  * `/api/analytics/jobs/summary?city=H%C3%A0%20N%E1%BB%99i&skill=Python`

Quy trình báo cáo:

* Sau mỗi phase lớn, báo ngắn:

  * đã đọc file nào
  * đã tạo/sửa file nào
  * đã chạy lệnh nào
  * lỗi còn lại nếu có
* Không dừng giữa chừng chỉ vì thiếu dữ liệu nhỏ, hãy đưa best effort.
* Nếu gặp điểm mâu thuẫn giữa README và API spec, ưu tiên `backend/docs/api-spec.md` cho contract API, dùng README để biết cách chạy backend.

Điều cấm:

* Không làm ngoài `frontend/` trừ việc đọc `backend/docs/api-spec.md` và `backend/README.md`.
* Không sửa backend.
* Không thêm authentication, JWT, CRUD, login, register.
* Không tạo endpoint mới.
* Không đổi query param sang tiếng Việt.
* Không đọc response bằng field tiếng Anh cũ.
* Không hardcode data production.
* Không bỏ qua loading, error, empty state.
* Không tạo component quá dài.
* Không dùng TypeScript.
* Không tạo `.ts` hoặc `.tsx`.
* Không tự ý thay đổi cấu trúc backend.


Bổ sung bắt buộc về API layer:

* Phải dùng `axios`.
* Phải dùng `@tanstack/react-query`.
* Không fetch API trực tiếp trong component.
* Không gọi `axios.get/post` rải rác trong component.
* Toàn bộ API phải gom vào một nơi rõ ràng.
* Dữ liệu server phải được lấy qua custom hook dùng TanStack React Query.

Cài dependency nếu chưa có, chạy trong `frontend/`:

```bash
npm install axios @tanstack/react-query
```

Cấu trúc API bắt buộc:

```text
frontend/src/
  lib/
    axiosClient.js
    queryClient.js
    queryKeys.js
    api/
      analyticsApi.js
  hooks/
    queries/
      useHealthQuery.js
      useOverviewQuery.js
      useFiltersQuery.js
      useTrendsQueries.js
      usePositionsQueries.js
      useSkillsQueries.js
      useSalaryQueries.js
      useLocationQueries.js
      useCompanyQueries.js
      useLevelQueries.js
      useJobsQueries.js
```

Yêu cầu `axiosClient.js`:

* Tạo axios instance bằng `axios.create`.
* Dùng `baseURL` từ `import.meta.env.VITE_API_BASE_URL`.
* Có fallback local:
  `http://localhost:3001`
* Có timeout hợp lý, ví dụ 15000ms.
* Có response interceptor hoặc helper xử lý response chuẩn:

  * Nếu `response.data.success === false`, throw Error bằng `message` hoặc `error`.
  * Nếu thành công, trả về `response.data.data`.
* Không để component phải tự bóc `response.data.data`.
* Không để component phải tự check `success`.
* Không thêm Authorization/JWT vì docs không có authentication.

Ví dụ style mong muốn:

```js
import axios from "axios";

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001",
  timeout: 15000,
});

axiosClient.interceptors.response.use(
  (response) => {
    const body = response.data;

    if (body?.success === false) {
      throw new Error(body.error || body.message || "Yêu cầu thất bại");
    }

    return body?.data;
  },
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Không thể kết nối đến máy chủ";

    return Promise.reject(new Error(message));
  }
);
```

Yêu cầu `analyticsApi.js`:

* Chỉ file này biết endpoint cụ thể.
* Export function cho từng API trong `backend/docs/api-spec.md`.
* Function nhận object query params.
* Dùng helper build params để bỏ qua `undefined`, `null`, chuỗi rỗng.
* Không encode thủ công nếu dùng axios `params`, để axios xử lý.
* Không đổi query param sang tiếng Việt.

Ví dụ style mong muốn:

```js
import { axiosClient } from "../axiosClient";

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      return value !== undefined && value !== null && value !== "";
    })
  );
}

export const analyticsApi = {
  getHealth() {
    return axiosClient.get("/api/health");
  },

  getOverview(params) {
    return axiosClient.get("/api/analytics/overview", {
      params: cleanParams(params),
    });
  },

  getFilters() {
    return axiosClient.get("/api/analytics/filters");
  },

  getQuarterTrends(params) {
    return axiosClient.get("/api/analytics/trends/quarters", {
      params: cleanParams(params),
    });
  },

  getMonthTrends(params) {
    return axiosClient.get("/api/analytics/trends/months", {
      params: cleanParams(params),
    });
  },

  getPositions(params) {
    return axiosClient.get("/api/analytics/positions", {
      params: cleanParams(params),
    });
  },

  getPositionSkills(position, params) {
    return axiosClient.get(
      `/api/analytics/positions/${encodeURIComponent(position)}/skills`,
      { params: cleanParams(params) }
    );
  },
};
```

Yêu cầu `queryClient.js`:

* Tạo `QueryClient` riêng.
* Cấu hình default hợp lý:

  * `staleTime` vừa phải cho dashboard, ví dụ 60 giây.
  * `refetchOnWindowFocus: false` để tránh refetch quá nhiều khi demo.
  * `retry: 1` hoặc `retry: false` tùy lỗi, nhưng mặc định nên `retry: 1`.
* Provider phải bọc app ở `main.jsx`.

Ví dụ:

```js
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

Trong `main.jsx` phải có:

```jsx
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
```

Yêu cầu `queryKeys.js`:

* Tạo query key factory, không viết query key lung tung.
* Query key phải ổn định và có params đi kèm.
* Không dùng string rời rạc khắp nơi.

Ví dụ:

```js
export const queryKeys = {
  health: ["health"],
  analytics: {
    overview: (params) => ["analytics", "overview", params],
    filters: ["analytics", "filters"],
    quarterTrends: (params) => ["analytics", "trends", "quarters", params],
    monthTrends: (params) => ["analytics", "trends", "months", params],
    positions: (params) => ["analytics", "positions", params],
    positionSkills: (position, params) => [
      "analytics",
      "positions",
      position,
      "skills",
      params,
    ],
  },
};
```

Yêu cầu custom hooks:

* Mỗi nhóm API có hook riêng.
* Component chỉ gọi hook, không gọi API trực tiếp.
* Hook dùng `useQuery`.
* Hook nhận params object.
* Hook truyền `queryKey` từ `queryKeys`.
* Hook truyền `queryFn` gọi `analyticsApi`.
* Dùng `enabled` đúng cách với path param bắt buộc, ví dụ `position`, `level`.
* Không dùng `useEffect + useState` để fetch server data nếu đã dùng React Query.

Ví dụ:

```js
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../../lib/api/analyticsApi";
import { queryKeys } from "../../lib/queryKeys";

export function useOverviewQuery(params) {
  return useQuery({
    queryKey: queryKeys.analytics.overview(params),
    queryFn: () => analyticsApi.getOverview(params),
  });
}

export function useFiltersQuery() {
  return useQuery({
    queryKey: queryKeys.analytics.filters,
    queryFn: analyticsApi.getFilters,
  });
}

export function usePositionSkillsQuery(position, params) {
  return useQuery({
    queryKey: queryKeys.analytics.positionSkills(position, params),
    queryFn: () => analyticsApi.getPositionSkills(position, params),
    enabled: Boolean(position),
  });
}
```

Yêu cầu dùng React Query trong UI:

* Component dùng:

  * `data`
  * `isLoading`
  * `isFetching`
  * `isError`
  * `error`
  * `refetch` nếu cần nút thử lại.
* Loading dùng shadcn `Skeleton`.
* Error dùng shadcn `Alert`.
* Empty state kiểm tra `Array.isArray(data) && data.length === 0` hoặc object KPI null/0 theo docs.
* Không duplicate server state vào `useState` nếu không cần.
* Chỉ dùng `useState` cho UI state:

  * selected tab
  * selected filter
  * selected position
  * open/close combobox
* Không copy `data` từ React Query sang state khác chỉ để render.

Yêu cầu với filter:

* Filter state nằm ở page/container.
* Truyền filter object vào custom hooks.
* Query key phải chứa filter object để React Query cache đúng.
* Khi filter thay đổi, query tự refetch qua query key.
* Không gọi refetch thủ công nếu query key đã đổi.
* Trước khi đưa filter vào query key, nên tạo params object ổn định và sạch.

Ví dụ:

```js
const queryParams = useMemo(
  () => ({
    year: filters.year,
    quarter: filters.quarter,
    city: filters.city,
    skill: filters.skill,
    position: filters.position,
  }),
  [filters]
);

const overviewQuery = useOverviewQuery(queryParams);
```

Yêu cầu phân tách trách nhiệm:

* `axiosClient.js`: cấu hình axios và unwrap response.
* `analyticsApi.js`: endpoint functions.
* `queryKeys.js`: query keys.
* `hooks/queries/*.js`: custom hooks dùng React Query.
* Component: render UI, gọi hooks, không biết chi tiết endpoint.

Điều cấm bổ sung:

* Không dùng `fetch`.
* Không gọi API trực tiếp trong component.
* Không tạo axios instance trong component.
* Không viết `useEffect(() => axios...)` để fetch data.
* Không để mỗi component tự xử lý `success`, `message`, `data`, `error`.
* Không dùng React Query sai kiểu bằng cách gọi `queryFn: analyticsApi.getOverview(params)`. Phải là function:
  `queryFn: () => analyticsApi.getOverview(params)`.
* Không dùng query key thiếu params.
* Không dùng cùng một query key cho nhiều params khác nhau.
* Không mutate trực tiếp params object sau khi đưa vào query key.
* Không dùng TypeScript.
* Không tạo file `.ts` hoặc `.tsx`.

Quality gate bổ sung:

* Sau khi implement, kiểm tra trong `frontend/src`:

  * Không có `fetch(`.
  * Không có `axios.get(` trong component.
  * Không có `axios.post(` trong component.
  * Không có API endpoint string rải rác ngoài `lib/api/analyticsApi.js`.
  * Tất cả server data trong page lấy qua custom hook React Query.
  * `main.jsx` đã bọc `QueryClientProvider`.
  * Query key có chứa params đối với API có filter.
Bổ sung bắt buộc về routing:

* Phải dùng `react-router`.
* Không dùng `react-router-dom`.
* Không cài `react-router-dom`.
* Nếu đã lỡ cài `react-router-dom`, không import từ package đó.
* Cài dependency nếu chưa có, chạy trong `frontend/`:

```bash id="2p9ula"
npm install react-router
```

* Không tự viết router thủ công bằng `window.location.href`.
* Không dùng state tab đơn giản để thay thế routing chính.
* Các section chính của dashboard phải có route rõ ràng.
* Navigation phải dùng `NavLink` hoặc `Link` từ `react-router`.
* Điều hướng trong code dùng `useNavigate` khi cần.
* URL phải phản ánh màn hình hiện tại để refresh không mất page.

Cấu trúc route đề xuất:

```text id="eopzga"
/
  -> redirect hoặc render Dashboard Overview

/overview
  -> Dashboard Overview

/trends
  -> Xu hướng tuyển dụng

/positions
  -> Phân tích vị trí

/skills
  -> Kỹ năng và ngôn ngữ

/salaries
  -> Phân tích lương

/locations
  -> Địa điểm và thị trường

/companies
  -> Công ty

/levels
  -> Cấp bậc và kinh nghiệm

/jobs
  -> Bộ lọc tổng hợp
```

Cấu trúc file đề xuất:

```text id="9kcbxx"
frontend/src/
  main.jsx
  App.jsx
  routes/
    AppRoutes.jsx
  layouts/
    DashboardLayout.jsx
  pages/
    OverviewPage.jsx
    TrendsPage.jsx
    PositionsPage.jsx
    SkillsPage.jsx
    SalariesPage.jsx
    LocationsPage.jsx
    CompaniesPage.jsx
    LevelsPage.jsx
    JobsPage.jsx
    NotFoundPage.jsx
```

Yêu cầu `main.jsx`:

* Bọc app bằng cả `BrowserRouter` và `QueryClientProvider`.
* `BrowserRouter` dùng cho routing.
* `QueryClientProvider` dùng cho TanStack React Query.
* Import router từ `react-router`, không phải `react-router-dom`.

Ví dụ style mong muốn:

```jsx id="la6rhv"
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </BrowserRouter>
);
```

Yêu cầu `App.jsx`:

* Không nhét toàn bộ page logic vào `App.jsx`.
* `App.jsx` chỉ nên render `AppRoutes`.

Ví dụ:

```jsx id="wwt44m"
import { AppRoutes } from "./routes/AppRoutes";

export default function App() {
  return <AppRoutes />;
}
```

Yêu cầu `AppRoutes.jsx`:

* Dùng `Routes`, `Route`, `Navigate` từ `react-router`.
* Có layout chung `DashboardLayout`.
* Có route fallback `*`.

Ví dụ:

```jsx id="epy5qu"
import { Navigate, Route, Routes } from "react-router";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { OverviewPage } from "../pages/OverviewPage";
import { TrendsPage } from "../pages/TrendsPage";
import { PositionsPage } from "../pages/PositionsPage";
import { SkillsPage } from "../pages/SkillsPage";
import { SalariesPage } from "../pages/SalariesPage";
import { LocationsPage } from "../pages/LocationsPage";
import { CompaniesPage } from "../pages/CompaniesPage";
import { LevelsPage } from "../pages/LevelsPage";
import { JobsPage } from "../pages/JobsPage";
import { NotFoundPage } from "../pages/NotFoundPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/trends" element={<TrendsPage />} />
        <Route path="/positions" element={<PositionsPage />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/salaries" element={<SalariesPage />} />
        <Route path="/locations" element={<LocationsPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/levels" element={<LevelsPage />} />
        <Route path="/jobs" element={<JobsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
```

Yêu cầu `DashboardLayout.jsx`:

* Dùng `Outlet` để render page con.
* Sidebar hoặc top nav dùng `NavLink`.
* Active route phải có style rõ ràng.
* Header giữ thống nhất giữa các page.
* Filter tổng có thể đặt trong layout nếu dùng chung, hoặc đặt trong từng page nếu mỗi page cần filter khác nhau.
* Import từ `react-router`.

Ví dụ style mong muốn:

```jsx id="ggwgxm"
import { NavLink, Outlet } from "react-router";

const navItems = [
  { to: "/overview", label: "Tổng quan" },
  { to: "/trends", label: "Xu hướng" },
  { to: "/positions", label: "Vị trí" },
  { to: "/skills", label: "Kỹ năng" },
  { to: "/salaries", label: "Lương" },
  { to: "/locations", label: "Địa điểm" },
  { to: "/companies", label: "Công ty" },
  { to: "/levels", label: "Cấp bậc" },
  { to: "/jobs", label: "Bộ lọc tổng hợp" },
];

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background">
      <aside>
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

Yêu cầu với URL query params:

* Với filter có thể chia sẻ qua URL, ưu tiên dùng `useSearchParams` từ `react-router`.
* Ví dụ các filter phổ biến:

  * `year`
  * `quarter`
  * `city`
  * `skill`
  * `position`
  * `company`
  * `level`
* Khi user chọn filter, cập nhật URL search params.
* Khi reload page, đọc lại filter từ URL.
* Query params vẫn dùng tiếng Anh theo API docs.
* Không đưa field response tiếng Việt lên URL làm query param.

Ví dụ:

```jsx id="lsh550"
import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { useOverviewQuery } from "../hooks/queries/useOverviewQuery";

export function OverviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const queryParams = useMemo(
    () => ({
      year: searchParams.get("year") || "",
      quarter: searchParams.get("quarter") || "",
      city: searchParams.get("city") || "",
      skill: searchParams.get("skill") || "",
    }),
    [searchParams]
  );

  const overviewQuery = useOverviewQuery(queryParams);

  return (
    <section>
      {/* render loading, error, empty, data */}
    </section>
  );
}
```

Yêu cầu khi kết hợp React Router với TanStack Query:

* URL search params là nguồn state cho filter có thể share.
* React Query `queryKey` phải chứa params lấy từ URL.
* Khi URL params đổi, query key đổi và data tự refetch.
* Không gọi `refetch()` thủ công nếu chỉ đổi filter.
* Không duplicate filter URL state vào state khác nếu không cần.
* Chỉ dùng `useState` cho UI state không cần lưu URL, ví dụ open combobox, selected chart mode.

Điều cấm bổ sung:

* Không dùng `react-router-dom`.
* Không import bất cứ thứ gì từ `react-router-dom`.
* Không dùng `window.location.href` cho navigation nội bộ.
* Không dùng `<a href="/...">` cho route nội bộ, dùng `Link` hoặc `NavLink`.
* Không đặt `BrowserRouter` bên trong page.
* Không gọi `useNavigate`, `useSearchParams`, `NavLink`, `Routes`, `Route` ngoài context router.
* Không để `App.jsx` quá dài.
* Không viết tất cả page trong một file.
* Không tạo nested route phức tạp nếu chưa cần.
* Không dùng TypeScript, chỉ `.js` và `.jsx`.

Quality gate bổ sung:

* Kiểm tra `main.jsx` đã bọc `BrowserRouter`.
* Kiểm tra `main.jsx` đã bọc `QueryClientProvider`.
* Kiểm tra toàn bộ import routing đều đến từ `react-router`.
* Kiểm tra không còn import từ `react-router-dom`.
* Kiểm tra navigation dùng `NavLink` hoặc `Link`.
* Kiểm tra route reload được.
* Kiểm tra vào URL trực tiếp như `/skills`, `/positions`, `/jobs` không trắng màn hình.
* Kiểm tra filter trên URL vẫn dùng query param tiếng Anh.
* Không nhất thiết phải dập khuôn theo ví dụ trên, bạn có thể điều chỉnh sao cho phù hợp với backend API và UI hiện tại.