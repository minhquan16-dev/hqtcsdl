const geminiService = require('./geminiService');
const { chatPlanSystemInstruction } = require('../prompts/salaryAssistantPrompt');

const allowedTaskTypes = new Set(['salary_aggregate', 'top_skills', 'breakdown']);
const allowedGroupBy = new Set(['city', 'position', 'skill', 'company', 'level']);

const chatPlanJsonSchema = {
  type: 'object',
  properties: {
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['salary_aggregate', 'top_skills', 'breakdown'],
          },
          label: { type: 'string' },
          groupBy: {
            type: ['string', 'null'],
            enum: ['city', 'position', 'skill', 'company', 'level', null],
          },
          filters: {
            type: 'object',
            properties: {
              position: { type: ['string', 'null'] },
              level: { type: ['string', 'null'] },
              city: { type: ['string', 'null'] },
              company: { type: ['string', 'null'] },
              companyField: { type: ['string', 'null'] },
              skills: {
                type: 'array',
                items: { type: 'string' },
              },
              skillMatch: {
                type: ['string', 'null'],
                enum: ['any', 'all', null],
              },
            },
          },
        },
        required: ['type', 'label', 'groupBy', 'filters'],
      },
    },
  },
  required: ['tasks'],
};

function normalizeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeCity(value) {
  const city = normalizeString(value);
  if (!city) return null;

  const normalized = city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.\s-]+/g, ' ')
    .trim();

  if (['hcm', 'tp hcm', 'tphcm', 'ho chi minh', 'sai gon', 'saigon'].includes(normalized)) {
    return 'Hồ Chí Minh';
  }

  return city;
}

function normalizeSkills(value) {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeString).filter(Boolean).slice(0, 6);
}

function normalizeSkillMatch(value, skills) {
  if (value === 'all') return 'all';
  if (value === 'any') return 'any';
  return skills.length > 1 ? 'any' : 'all';
}

function normalizeFilters(filters = {}) {
  const skills = normalizeSkills(filters.skills);

  return {
    position: normalizeString(filters.position),
    level: normalizeString(filters.level),
    city: normalizeCity(filters.city),
    company: normalizeString(filters.company),
    companyField: normalizeString(filters.companyField),
    skills,
    skillMatch: normalizeSkillMatch(filters.skillMatch, skills),
  };
}

function validateTask(task) {
  if (!task || typeof task !== 'object') return null;
  if (!allowedTaskTypes.has(task.type)) return null;

  const groupBy = allowedGroupBy.has(task.groupBy) ? task.groupBy : null;
  if (task.type === 'breakdown' && !groupBy) return null;

  return {
    type: task.type,
    label: normalizeString(task.label) || task.type,
    groupBy,
    filters: normalizeFilters(task.filters),
  };
}

function validateChatPlan(rawPlan) {
  const tasks = Array.isArray(rawPlan?.tasks) ? rawPlan.tasks : [];
  return {
    tasks: tasks.map(validateTask).filter(Boolean).slice(0, 6),
  };
}

async function createChatPlan({ message, history, planningContext }, deps = {}) {
  const generateJson = deps.generateJson || geminiService.generateJson;
  const rawPlan = await generateJson({
    contents: [
      {
        role: 'user',
        parts: [{
          text: JSON.stringify({
            currentQuestion: message,
            conversationContext: history,
            planningContext,
          }),
        }],
      },
    ],
    systemInstruction: chatPlanSystemInstruction,
    responseJsonSchema: chatPlanJsonSchema,
  });

  return validateChatPlan(rawPlan);
}

module.exports = {
  chatPlanJsonSchema,
  createChatPlan,
  validateChatPlan,
};
