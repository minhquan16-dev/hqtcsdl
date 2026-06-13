import { axiosClient } from "../axiosClient"

export const systemApi = {
  runCrawl() {
    return axiosClient.post("/api/system/crawl")
  },
  runEtl() {
    return axiosClient.post("/api/system/etl")
  },
  runCrawlThenEtl() {
    return axiosClient.post("/api/system/crawl-then-etl")
  },
  getSchedule() {
    return axiosClient.get("/api/system/schedule")
  },
  saveSchedule(schedule) {
    return axiosClient.put("/api/system/schedule", schedule)
  },
  clearSchedule() {
    return axiosClient.delete("/api/system/schedule")
  },
}
