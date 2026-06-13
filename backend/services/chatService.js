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
  if (!data) return 0;
  if (typeof data.sampleSize === 'number') return data.sampleSize;
  if (Array.isArray(data)) {
    return data.reduce((sum, row) => {
      if (typeof row?.sampleSize === 'number') return sum + row.sampleSize;
      if (typeof row?.data?.sampleSize === 'number') return sum + row.data.sampleSize;
      if (Array.isArray(row?.data)) {
        return sum + row.data.reduce((innerSum, item) => innerSum + (Number(item.sampleSize) || 0), 0);
      }
      return sum;
    }, 0);
  }
  if (data.first || data.second) {
    return Math.min(
      Number(data.first?.data?.sampleSize) || 0,
      Number(data.second?.data?.sampleSize) || 0,
    );
  }
  return 0;
}

function getPlanIntent(plan) {
  return {
    intent: 'chat_plan',
    taskCount: Array.isArray(plan?.tasks) ? plan.tasks.length : 0,
  };
}

function getConfidence(data) {
  const sampleSize = getSampleSize(data);
  if (sampleSize < 5) return 'low';
  if (sampleSize < 10) return 'medium';
  return 'high';
}

function sanitizePublicAnswer(answer = '') {
  return String(answer)
    .replace(/\(?\b(sampleSize|avgSalary|minSalary|maxSalary|medianSalary|DB_CONTEXT|intent|queryTemplate)\s*[:=]\s*[^,\n)]+[\)]?/gi, '')
    .replace(/\b(sampleSize|avgSalary|minSalary|maxSalary|medianSalary|DB_CONTEXT|intent|queryTemplate)\b/gi, '')
    .replace(/\bcơ sở dữ liệu\s+JobDW\b/gi, 'dữ liệu hiện có')
    .replace(/\bJobDW\b/gi, 'dữ liệu hiện có')
    .replace(/\bcơ sở dữ liệu\s+dữ liệu hiện có\b/gi, 'dữ liệu hiện có')
    .replace(/không có dữ liệu tuyển dụng trong dữ liệu hiện có/gi, 'không có dữ liệu tuyển dụng phù hợp')
    .replace(/không có dữ liệu trong dữ liệu hiện có/gi, 'không có dữ liệu phù hợp')
    .replace(/\bSQL\s*Server\b/gi, 'hệ thống dữ liệu')
    .replace(/\bdata\s*warehouse\b/gi, 'dữ liệu hiện có')
    .replace(/\bwarehouse\b/gi, 'dữ liệu hiện có')
    .replace(/\bFactTuyenDung\b/gi, 'dữ liệu hiện có')
    .replace(/\bDim(ViTri|CapBac|DiaDiem|KyNang)\b/gi, 'dữ liệu hiện có')
    .trim();
}

function hasNoData(data) {
  if (!data) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data.sampleSize === 'number') return data.sampleSize === 0;
  if (data.first || data.second) {
    return !data.first?.data?.sampleSize && !data.second?.data?.sampleSize;
  }
  return false;
}

function fallbackAnswer(intent, data) {
  if (intent.intent === 'unknown') {
    return 'Mình chưa đủ thông tin để trả lời câu hỏi này. Bạn có thể hỏi về lương theo vị trí, kỹ năng, top vị trí lương cao hoặc kỹ năng theo vị trí.';
  }

  if (hasNoData(data)) {
    return 'Không đủ dữ liệu phù hợp để trả lời câu hỏi này.';
  }

  const sampleSize = getSampleSize(data);
  return `Có ${sampleSize} mẫu phù hợp, nhưng chưa thể diễn giải tự động ở thời điểm này.`;
}

async function generateAnswer({ message, intent, data }, deps = {}) {
  const generateText = deps.generateText || geminiService.generateText;
  const contents = [
    {
      role: 'user',
      parts: [{
        text: JSON.stringify({
          userQuestion: message,
          DB_CONTEXT: data,
          rules: {
            salaryUnit: 'triệu VNĐ',
            hideInternalDetails: true,
          },
        }),
      }],
    },
  ];

  const answer = await generateText({
    contents,
    systemInstruction: answerSystemInstruction,
  });

  return sanitizePublicAnswer(answer.trim() || fallbackAnswer(intent, data));
}

function logChatEvent(logger, event, payload) {
  const targetLogger = logger || console;
  const logPayload = {
    event,
    requestId: payload.requestId,
    intent: payload.intent?.intent || 'unknown',
    taskCount: payload.intent?.taskCount,
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
    const intent = getPlanIntent(plan);
    const data = plan.tasks.length && repository.executeChatPlan
      ? await repository.executeChatPlan(plan)
      : [];
    const confidence = getConfidence(data);
    const answer = sanitizePublicAnswer(
      await answerGenerator({ message: cleanMessage, intent, data }),
    );

    logChatEvent(logger, 'chat_success', {
      requestId,
      intent,
      confidence,
      sampleSize: getSampleSize(data),
      messageLength: cleanMessage.length,
      historyLength: history.length,
      durationMs: Date.now() - startedAt,
    });

    return {
      answer: answer || sanitizePublicAnswer(fallbackAnswer(intent, data)),
    };
  } catch (error) {
    logChatEvent(logger, 'chat_error', {
      requestId,
      intent: { intent: 'unknown' },
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
