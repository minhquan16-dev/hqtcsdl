import { useMutation } from "@tanstack/react-query"
import { analyticsApi } from "@/lib/api/analyticsApi"

export function useChatMutation() {
  return useMutation({
    mutationFn: ({ message, history }) => analyticsApi.postChat(message, history),
  })
}
