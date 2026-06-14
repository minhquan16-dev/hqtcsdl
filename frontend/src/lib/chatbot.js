export const suggestedChatPrompts = [
  "Intern AI ở HCM lương khoảng bao nhiêu?",
  "Top vị trí có lương cao nhất hiện nay là gì?",
  "Kỹ năng phổ biến cho Backend Developer là gì?",
  "Tôi biết Python, SQL và Machine Learning cơ bản, muốn làm Intern AI ở HCM. Lương thường nằm khoảng nào và nên bổ sung kỹ năng gì?",
  "So sánh lương và độ tin cậy dữ liệu giữa AI Engineer Intern, Data Analyst Intern và Backend Developer Intern ở Hồ Chí Minh.",
  "Ở Hà Nội và Hồ Chí Minh, Backend Developer khác nhau thế nào về lương, số tin tuyển và kỹ năng phổ biến?",
  "Với kỹ năng Python và SQL, tôi nên nhắm Data Analyst, Data Engineer hay AI Engineer? So sánh lương và kỹ năng cần bổ sung.",
  "Top vị trí có lương trung bình tốt nhưng vẫn có ít nhất 5 tin phù hợp là gì, và kỹ năng nổi bật của từng vị trí?",
]

function createMessageId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function normalizeChatResponse(response = {}) {
  return {
    answer: response.answer || "Không nhận được câu trả lời từ chatbot.",
  }
}

export function createUserMessage(content) {
  return {
    id: createMessageId(),
    role: "user",
    content: content.trim(),
  }
}

export function createAssistantMessage(response) {
  const normalized = normalizeChatResponse(response)

  return {
    id: createMessageId(),
    role: "assistant",
    content: normalized.answer,
  }
}

export function createChatHistoryPayload(messages, limit = 6) {
  if (!Array.isArray(messages)) return []

  return messages
    .filter((message) => ["user", "assistant"].includes(message.role))
    .map((message) => ({
      role: message.role,
      content:
        typeof message.content === "string"
          ? message.content.trim().slice(0, 500)
          : "",
    }))
    .filter((message) => message.content)
    .slice(-limit)
}
