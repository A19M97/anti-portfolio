import { db } from "@/lib/db";
import { CLAUDE_MODELS } from "@/lib/validations/profile-analysis";

const SETTINGS_KEYS = {
  DEFAULT_CLAUDE_MODEL: "default_claude_model",
} as const;

/**
 * Get the default Claude model from app settings
 * @returns Promise<string> - The default Claude model
 */
export async function getDefaultClaudeModel(): Promise<string> {
  const setting = await db.appSettings.findUnique({
    where: { key: SETTINGS_KEYS.DEFAULT_CLAUDE_MODEL },
  });

  return setting?.value || CLAUDE_MODELS.HAIKU;
}

/**
 * Update the default Claude model in app settings
 * @param model - The new default model
 * @returns Promise<void>
 */
export async function updateDefaultClaudeModel(model: string): Promise<void> {
  await db.appSettings.upsert({
    where: { key: SETTINGS_KEYS.DEFAULT_CLAUDE_MODEL },
    update: { value: model },
    create: {
      key: SETTINGS_KEYS.DEFAULT_CLAUDE_MODEL,
      value: model,
      description: "Default Claude model used for profile analysis and simulations",
    },
  });
}

/**
 * Get all app settings
 * @returns Promise<Record<string, string>>
 */
export async function getAllSettings(): Promise<Record<string, string>> {
  const settings = await db.appSettings.findMany();

  return settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);
}
