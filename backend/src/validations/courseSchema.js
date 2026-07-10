const { z } = require('zod');

const objectIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'ID is required.' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format.'),
  }),
});

const modulesSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }
  return val;
}, z.array(
  z.object({
    _id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid module ID format.').optional(),
    title: z.string({ required_error: 'Module title is required.' }).trim().min(1, 'Module title cannot be empty.'),
    type: z.enum(['video', 'document']).default('video'),
    content: z.string().default(''),
    durationMinutes: z.preprocess((val) => val === undefined || val === '' ? 10 : Number(val), z.number().nonnegative().default(10)),
  })
).default([]));

const createCourseSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required.' }).trim().min(1, 'Title cannot be empty.'),
    description: z.string().default(''),
    category: z.string().default('General'),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced']).default('Beginner'),
    price: z.preprocess((val) => val === undefined || val === '' ? 0 : Number(val), z.number().nonnegative().default(0)),
    modules: modulesSchema,
  }),
});

const updateCourseSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format.'),
  }),
  body: z.object({
    title: z.string().trim().min(1, 'Title cannot be empty.').optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
    price: z.preprocess((val) => val === undefined || val === '' ? undefined : Number(val), z.number().nonnegative().optional()),
    isPublished: z.preprocess((val) => {
      if (typeof val === 'string') return val === 'true';
      return val;
    }, z.boolean().optional()),
    modules: modulesSchema.optional(),
  }),
});

const updateProgressSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format.'),
  }),
  body: z.object({
    completedLessons: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid module ID format.')).default([]),
  }),
});

const setStudyGoalSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format.'),
  }),
  body: z.object({
    studyDays: z.array(z.string()).default([]),
    studyTime: z.string().default(''),
    duration: z.string().default(''),
    receiveWhatsapp: z.preprocess((val) => {
      if (typeof val === 'string') return val === 'true';
      return !!val;
    }, z.boolean().default(false)),
  }),
});

const toggleStudySessionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format.'),
  }),
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.').optional(),
  }),
});

module.exports = {
  objectIdParamSchema,
  createCourseSchema,
  updateCourseSchema,
  updateProgressSchema,
  setStudyGoalSchema,
  toggleStudySessionSchema,
};
