import * as z from "zod";


export const  emailSchema = z.string().email("Invalid email address");
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  // .regex(/^[A-Z]/, "Password must start with a capital letter")
  // .regex(/[^A-Za-z0-9]/, "Password must include at least one symbol");

export const loginSchema = z.object({
    email:emailSchema,
    password:passwordSchema,
})

export const signupSchema = z.object({
    firstName : z.string().min(1, "First name is required"),
    lastName:z.string().min(1, "Last name is required"),
    email:emailSchema,
    password:passwordSchema,
    confirmPassword: z.string().min(8, "Confirm password must be at least 6 characters"),
})
.refine((data) => data.password === data.confirmPassword, {
    message:"Password do not match",
    path:["confirmPassword"],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

export type LoginType = z.infer<typeof loginSchema>;
export type SignupType = z.infer<typeof signupSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;