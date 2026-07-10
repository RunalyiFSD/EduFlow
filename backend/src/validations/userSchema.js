const { z } = require('zod');

const userObjectIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'ID is required.' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format.'),
  }),
});

const updateUserStatusSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'ID is required.' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format.'),
  }),
  body: z.object({
    isApproved: z.boolean().optional(),
    isSuspended: z.boolean().optional(),
    role: z.enum(['student', 'instructor', 'admin']).optional(),
  }),
});

module.exports = {
  userObjectIdParamSchema,
  updateUserStatusSchema,
};
