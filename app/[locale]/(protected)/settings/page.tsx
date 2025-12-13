"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Settings as SettingsIcon, Sparkles, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { CLAUDE_MODELS } from "@/lib/validations/profile-analysis";

type LoadingState = "idle" | "loading" | "saving" | "error";

export default function SettingsPage() {
  const t = useTranslations("Settings");
  const [selectedModel, setSelectedModel] = useState(CLAUDE_MODELS.HAIKU);
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);

  const MODEL_INFO = {
    [CLAUDE_MODELS.HAIKU]: {
      name: t("models.haiku.name"),
      description: t("models.haiku.description"),
      cost: t("models.haiku.cost"),
    },
    [CLAUDE_MODELS.SONNET]: {
      name: t("models.sonnet.name"),
      description: t("models.sonnet.description"),
      cost: t("models.sonnet.cost"),
    },
    [CLAUDE_MODELS.OPUS]: {
      name: t("models.opus.name"),
      description: t("models.opus.description"),
      cost: t("models.opus.cost"),
    },
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoadingState("loading");
      setError(null);

      const response = await fetch("/api/settings");
      const data = await response.json();

      if (response.status === 403) {
        setIsForbidden(true);
        setError(t("errors.forbidden"));
        setLoadingState("error");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || t("errors.loadFailed"));
      }

      setSelectedModel(data.settings.defaultClaudeModel);
      setLoadingState("idle");
    } catch (err) {
      console.error("Error loading settings:", err);
      setError(err instanceof Error ? err.message : t("errors.loadFailed"));
      setLoadingState("error");
    }
  };

  const handleSave = async () => {
    try {
      setLoadingState("saving");
      setError(null);

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          defaultClaudeModel: selectedModel,
        }),
      });

      const data = await response.json();

      if (response.status === 403) {
        setIsForbidden(true);
        setError(t("errors.forbidden"));
        setLoadingState("error");
        toast.error(t("errors.forbidden"));
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || t("errors.saveFailed"));
      }

      setLoadingState("idle");
      toast.success(t("toasts.saveSuccess"));
    } catch (err) {
      console.error("Error saving settings:", err);
      setError(err instanceof Error ? err.message : t("errors.saveFailed"));
      setLoadingState("error");
      toast.error(t("toasts.saveError"));
    }
  };

  if (loadingState === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">{t("loading")}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isForbidden) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2">{t("title")}</h1>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t("errors.forbidden")}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <SettingsIcon className="h-8 w-8" />
            <h1 className="text-4xl font-bold">{t("title")}</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {t("subtitle")}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5" />
                <CardTitle>{t("claudeModel.title")}</CardTitle>
              </div>
              <CardDescription>
                {t("claudeModel.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model">{t("claudeModel.label")}</Label>
                  <select
                    id="model"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value as any)}
                    className="w-full p-2 border rounded-md bg-background"
                    disabled={loadingState === "saving"}
                  >
                    {Object.entries(MODEL_INFO).map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.name} - {info.description} ({info.cost})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                        {t("claudeModel.currentSelection")}
                      </p>
                      <p className="mb-1">
                        <strong>{MODEL_INFO[selectedModel as keyof typeof MODEL_INFO].name}</strong>
                      </p>
                      <p>
                        {MODEL_INFO[selectedModel as keyof typeof MODEL_INFO].description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={loadingState === "saving"}
              size="lg"
              className="min-w-[200px]"
            >
              {loadingState === "saving" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("actions.saving")}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t("actions.save")}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
