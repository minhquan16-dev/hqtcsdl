import axios from "axios"

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001",
  timeout: 15000,
})

axiosClient.interceptors.response.use(
  (response) => {
    const body = response.data

    if (body?.success === false) {
      throw new Error(body.error || body.message || "Yêu cầu thất bại")
    }

    return body?.data
  },
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Không thể kết nối đến máy chủ"

    return Promise.reject(new Error(message))
  }
)
