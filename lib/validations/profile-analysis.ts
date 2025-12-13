import { z } from "zod";

// Schema for work experience
export const workExperienceSchema = z.object({
  company: z.string(),
  position: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  technologies: z.array(z.string()).optional(),
});

// Schema for education
export const educationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

// Schema for personal projects
export const personalProjectSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  url: z.string().optional(),
  repository: z.string().optional(),
});

// Schema for skills
export const skillSchema = z.object({
  name: z.string(),
  category: z.string().optional(), // e.g., "Frontend", "Backend", "DevOps"
  proficiency: z.string().optional(), // e.g., "Beginner", "Intermediate", "Advanced"
});

// LLM Output Schema - what we expect from Claude
export const llmAnalysisOutputSchema = z.object({
  role: z.string().optional(),
  seniority: z.string().optional(), // e.g., "Junior", "Mid-level", "Senior", "Lead"
  sectors: z.array(z.string()).optional(), // e.g., ["FinTech", "E-commerce", "Healthcare"]
  skills: z.array(skillSchema).optional(),
  workExperiences: z.array(workExperienceSchema).optional(),
  education: z.array(educationSchema).optional(),
  personalProjects: z.array(personalProjectSchema).optional(),
  additionalData: z.record(z.string(), z.any()).optional(), // Flexible field for future additions
  summary: z.string().optional(), // Overall professional summary
});

export type LLMAnalysisOutput = z.infer<typeof llmAnalysisOutputSchema>;

// Available Claude models
export const CLAUDE_MODELS = {
  HAIKU: "claude-3-5-haiku-20241022",
  SONNET: "claude-sonnet-4-5",
  OPUS: "claude-opus-4-5",
} as const;

export const claudeModelSchema = z.enum([
  CLAUDE_MODELS.HAIKU,
  CLAUDE_MODELS.SONNET,
  CLAUDE_MODELS.OPUS,
]);

export type ClaudeModel = z.infer<typeof claudeModelSchema>;

// Form input schema for the onboarding page
export const profileAnalysisInputSchema = z.object({
  freeText: z.string().optional(),
  model: claudeModelSchema.optional().default(CLAUDE_MODELS.HAIKU),
  // Files will be handled separately via FormData
});

export type ProfileAnalysisInput = z.infer<typeof profileAnalysisInputSchema>;

// Constants for file validation
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES = 5;
