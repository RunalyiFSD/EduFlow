const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required.' }).trim().min(1, 'Name cannot be empty.'),
    email: z.string({ required_error: 'Email is required.' }).trim().email('Invalid email address.'),
    password: z.string({ required_error: 'Password is required.' }).min(6, 'Password must be at least 6 characters.'),
    role: z.enum(['student', 'instructor'], { required_error: 'Role is required.' }),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required.' }).trim().email('Invalid email address.'),
    password: z.string({ required_error: 'Password is required.' }).min(1, 'Password is required.'),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required.' }).trim().email('Invalid email address.'),
  }),
});



const resetPasswordSchema = z.object({
  params: z.object({
    token: z.string({ required_error: 'Reset token is required.' }).min(1, 'Reset token is required.'),
  }),
  body: z.object({
    password: z.string({ required_error: 'New password is required.' }).min(6, 'Password must be at least 6 characters.'),
  }),
});

const googleAuthSchema = z.object({
  body: z.object({
    credential: z.string({ required_error: 'Google credential token is required.' }).min(1, 'Google credential token is required.'),
    defaultRole: z.enum(['student', 'instructor']).optional(),
  }),
});

const registerAdminSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required.' }).trim().min(1, 'Name cannot be empty.'),
    email: z.string({ required_error: 'Email is required.' }).trim().email('Invalid email address.'),
    password: z.string({ required_error: 'Password is required.' }).min(6, 'Password must be at least 6 characters.'),
    adminSecret: z.string({ required_error: 'Admin secret key is required.' }).min(1, 'Admin secret key is required.'),
  }),
});

const googleAdminSchema = z.object({
  body: z.object({
    credential: z.string({ required_error: 'Google credential is required.' }).min(1, 'Google credential is required.'),
    adminSecret: z.string({ required_error: 'Admin secret key is required.' }).min(1, 'Admin secret key is required.'),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleAuthSchema,
  registerAdminSchema,
  googleAdminSchema,
};
