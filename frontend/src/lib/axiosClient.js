import axios from "axios"

export const axiosClient = axios.create({
  baseURL: import.meta.env?.VITE_API_BASE_URL || "http://localhost:3001",
  timeout: 55000,
})

export function unwrapApiResponse(response) {
  const body = response.data

  if (body?.success === false) {
    throw new Error(body.error || body.message || "Yêu cầu thất bại")
  }

  if (body?.answer !== undefined) {
    return body
  }

  return body?.data
}

axiosClient.interceptors.response.use(
  unwrapApiResponse,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      (error.code === "ECONNABORTED"
        ? "Chatbot phản hồi lâu hơn dự kiến. Vui lòng thử lại sau."
        : error.message) ||
      "Không thể kết nối đến máy chủ"

    return Promise.reject(new Error(message))
  }
)
