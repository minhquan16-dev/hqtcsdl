const chatPlanService = require('./chatPlanService');
const geminiService = require('./geminiService');
const { answerSystemInstruction } = require('../prompts/salaryAssistantPrompt');

function createValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function validateChatMessage(message) {
  if (typeof message !== 'string') {
    throw createValidationError('Tin nhắn phải là chuỗi');
  }

  const trimmed = message.trim();
  if (!trimmed) {
    throw createValidationError('Tin nhắn không được để trống');
  }

  if (trimmed.length > 1000) {
    throw createValidationError('Tin nhắn không được vượt quá 1000 ký tự');
  }

  return trimmed;
}

function validateChatHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .filter((item) => item && ['user', 'assistant'].includes(item.role))
    .map((item) => ({
      role: item.role,
      content: typeof item.content === 'string' ? item.content.trim().slice(0, 500) : '',
    }))
    .filter((item) => item.content)
    .slice(-6);
}

function getSampleSize(data) {
  if (Array.isArray(data)) {
    return data.reduce((sum, item) => {
      if (item && typeof item === 'object' && 'data' in item) {
        return sum + getSampleSize(item.data);
      }

      return sum + getSampleSize(item);
    }, 0);
  }

  if (data && typeof data === 'object') {
    return Number(data.sampleSize) || 0;
  }

  return 0;
}

function getConfidence(data) {
  const sampleSize = getSampleSize(data);
  if (sampleSize < 5) return 'low';
  if (sampleSize < 10) return 'medium';
  return 'high';
}

function sanitizePublicAnswer(answer = '') {
  return String(answer)
    .replace(/\bcơ sở dữ liệu\s+JobDW\b/gi, 'dữ liệu hiện có')
    .replace(/\bJobDW\b/gi, 'dữ liệu hiện có')
    .replace(/\bcơ sở dữ liệu\s+dữ liệu hiện có\b/gi, 'dữ liệu hiện có')
    .replace(/\bSQL\s*Server\b/gi, 'hệ thống dữ liệu')
    .trim();
}

function hasTaskData(data) {
  if (Array.isArray(data)) {
    return data.some((item) => {
      if (item && typeof item === 'object' && 'sampleSize' in item) {
        return Number(item.sampleSize) > 0;
      }

      return Boolean(item);
    });
  }

  if (data && typeof data === 'object' && 'sampleSize' in data) {
    return Number(data.sampleSize) > 0;
  }

  return Boolean(data);
}

function hasNoData(data) {
  return !Array.isArray(data) || data.length === 0 || !data.some((task) => hasTaskData(task?.data));
}

function fallbackAnswer(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return 'Mình chưa đủ thông tin để trả lời câu hỏi này. Bạn có thể hỏi về lương theo vị trí, kỹ năng, top vị trí lương cao hoặc kỹ năng theo vị trí.';
  }

  if (hasNoData(data)) {
    return 'Không đủ dữ liệu phù hợp để trả lời câu hỏi này.';
  }

  const sampleSize = getSampleSize(data);
  return `Có ${sampleSize} mẫu phù hợp, nhưng chưa thể diễn giải tự động ở thời điểm này.`;
}

async function generateAnswer({ message, data }, deps = {}) {
  const generateText = deps.generateText || geminiService.generateText;
  const contents = [
    {
      role: 'user',
      parts: [{
        text: JSON.stringify({
          userQuestion: message,
          DB_CONTEXT: data,
        }),
      }],
    },
  ];

  const answer = await generateText({
    contents,
    systemInstruction: answerSystemInstruction,
  });

  return sanitizePublicAnswer(answer.trim() || fallbackAnswer(data));
}

function logChatEvent(logger, event, payload) {
  const targetLogger = logger || console;
  const logPayload = {
    event,
    requestId: payload.requestId,
    taskCount: payload.taskCount,
    confidence: payload.confidence,
    sampleSize: payload.sampleSize,
    messageLength: payload.messageLength,
    historyLength: payload.historyLength,
    durationMs: payload.durationMs,
  };

  if (payload.error) {
    logPayload.error = payload.error;
  }

  const logMethod = event === 'chat_error' ? 'error' : 'info';
  targetLogger[logMethod]('[chatbot]', logPayload);
}

async function handleChat(message, deps = {}) {
  const startedAt = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  const createChatPlan = deps.createChatPlan || chatPlanService.createChatPlan;
  const repository = deps.repository || require('../repositories/chat/salaryInsightRepository');
  const answerGenerator = deps.generateAnswer || generateAnswer;
  const logger = deps.logger || console;
  let cleanMessage = '';

  try {
    cleanMessage = validateChatMessage(message);
    const history = validateChatHistory(deps.history);
    const planningContext = repository.getChatPlanningContext
      ? await repository.getChatPlanningContext()
      : {};
    const plan = chatPlanService.validateChatPlan(
      await createChatPlan({ message: cleanMessage, history, planningContext }),
    );
    const data = plan.tasks.length && repository.executeChatPlan
      ? await repository.executeChatPlan(plan)
      : [];
    const confidence = getConfidence(data);
    const answer = sanitizePublicAnswer(
      await answerGenerator({ message: cleanMessage, data }),
    );

    logChatEvent(logger, 'chat_success', {
      requestId,
      taskCount: plan.tasks.length,
      confidence,
      sampleSize: getSampleSize(data),
      messageLength: cleanMessage.length,
      historyLength: history.length,
      durationMs: Date.now() - startedAt,
    });

    return {
      answer: answer || sanitizePublicAnswer(fallbackAnswer(data)),
    };
  } catch (error) {
    logChatEvent(logger, 'chat_error', {
      requestId,
      taskCount: 0,
      confidence: 'low',
      sampleSize: 0,
      messageLength: cleanMessage.length || (typeof message === 'string' ? message.length : 0),
      durationMs: Date.now() - startedAt,
      error: error.message,
    });
    throw error;
  }
}

module.exports = {
  handleChat,
  validateChatMessage,
  validateChatHistory,
  generateAnswer,
  getConfidence,
  sanitizePublicAnswer,
};
