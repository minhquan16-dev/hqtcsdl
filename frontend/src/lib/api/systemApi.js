import { axiosClient } from "../axiosClient"

export const systemApi = {
  runCrawl() {
    return axiosClient.post("/api/system/crawl", undefined, {
      timeout: 30 * 60 * 1000,
    })
  },
  runEtl() {
    return axiosClient.post("/api/system/etl", undefined, {
      timeout: 30 * 60 * 1000,
    })
  },
}
