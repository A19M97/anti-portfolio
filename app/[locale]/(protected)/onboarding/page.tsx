"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { FileUpload } from "@/components/ui/file-upload";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, FileText, MessageSquare, Code } from "lucide-react";
import { toast } from "sonner";

type AnalysisStatus = "idle" | "uploading" | "analyzing" | "success" | "error";

export default function OnboardingPage() {
  const router = useRouter();
  const t = useTranslations("Onboarding");
  const [files, setFiles] = useState<File[]>([]);
  const [freeText, setFreeText] = useState("");
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [usedModel, setUsedModel] = useState<string | null>(null);
  const [rawAnalysis, setRawAnalysis] = useState<any>(null);
  const [claudeResponse, setClaudeResponse] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[Frontend] handleSubmit started");

    setError(null);
    setStatus("uploading");

    const startTime = Date.now();

    try {
      // Validate that at least one input is provided
      console.log("[Frontend] Validating input", {
        filesCount: files.length,
        hasFreeText: !!freeText.trim(),
      });

      if (files.length === 0 && !freeText.trim()) {
        console.warn("[Frontend] Validation failed: no input provided");
        setError(t("errors.noInput"));
        setStatus("error");
        return;
      }

      // Create FormData
      console.log("[Frontend] Creating FormData");
      const formData = new FormData();

      files.forEach((file, idx) => {
        console.log(`[Frontend] Adding file ${idx + 1}:`, {
          name: file.name,
          size: file.size,
          type: file.type,
        });
        formData.append("files", file);
      });

      if (freeText.trim()) {
        console.log("[Frontend] Adding free text", {
          length: freeText.length,
        });
        formData.append("freeText", freeText);
      }

      setStatus("analyzing");
      toast.info(t("toasts.analyzing"));

      // Send to API
      console.log("[Frontend] Sending request to API");
      const apiStartTime = Date.now();

      const response = await fetch("/api/analyze-profile", {
        method: "POST",
        body: formData,
      });

      const apiDuration = Date.now() - apiStartTime;
      console.log("[Frontend] API response received", {
        durationMs: apiDuration,
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[Frontend] API error response:", errorData);
        throw new Error(errorData.error || t("errors.analysisFailed"));
      }

      const result = await response.json();
      console.log("[Frontend] Analysis result received", {
        hasData: !!result.data,
        hasPrompt: !!result.prompt,
        model: result.model,
        hasRawAnalysis: !!result.rawAnalysis,
        hasClaudeResponse: !!result.claudeResponse,
      });

      setAnalysisResult(result.data);
      setPrompt(result.prompt);
      setUsedModel(result.model);
      setRawAnalysis(result.rawAnalysis);
      setClaudeResponse(result.claudeResponse);
      setStatus("success");

      const totalDuration = Date.now() - startTime;
      console.log("[Frontend] Analysis completed successfully", {
        totalDurationMs: totalDuration,
      });

      toast.success(t("toasts.success"));
    } catch (err) {
      const totalDuration = Date.now() - startTime;
      console.error("[Frontend] Analysis failed", {
        error: err,
        durationMs: totalDuration,
      });

      setError(err instanceof Error ? err.message : t("errors.analysisFailed"));
      setStatus("error");
      toast.error(t("toasts.error"));
    }
  };

  const isLoading = status === "uploading" || status === "analyzing";
  const canSubmit = !isLoading && (files.length > 0 || freeText.trim().length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">{t("title")}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t("subtitle")}
          </p>
        </div>

        {status === "success" && analysisResult ? (
          <div className="space-y-6">
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <CardTitle className="text-green-600">{t("success.title")}</CardTitle>
                </div>
                <CardDescription>
                  {t("success.description", { model: usedModel || 'Claude' })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysisResult.role && (
                  <div>
                    <Label className="text-sm font-medium">{t("success.role")}</Label>
                    <p className="text-lg">{analysisResult.role}</p>
                  </div>
                )}
                {analysisResult.seniority && (
                  <div>
                    <Label className="text-sm font-medium">{t("success.seniority")}</Label>
                    <p className="text-lg">{analysisResult.seniority}</p>
                  </div>
                )}
                {analysisResult.sectors && analysisResult.sectors.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">{t("success.sectors")}</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {analysisResult.sectors.map((sector: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                        >
                          {sector}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-4 flex gap-3 flex-wrap">
                  <Button onClick={() => router.push("/simulation")} size="lg" className="flex-1 min-w-[200px]">
                    {t("success.continueSimulation")}
                  </Button>
                  <Button onClick={() => router.push("/dashboard")} variant="outline">
                    {t("success.goToDashboard")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStatus("idle");
                      setAnalysisResult(null);
                      setPrompt(null);
                      setRawAnalysis(null);
                      setClaudeResponse(null);
                      setFiles([]);
                      setFreeText("");
                      setUsedModel(null);
                    }}
                  >
                    {t("success.analyzeAnother")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {prompt && (
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Code className="h-5 w-5" />
                    <CardTitle>{t("debug.promptTitle")}</CardTitle>
                  </div>
                  <CardDescription>
                    {t("debug.promptDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-x-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono">{prompt}</pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {rawAnalysis && (
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Code className="h-5 w-5 text-green-600" />
                    <CardTitle>{t("debug.jsonTitle")}</CardTitle>
                  </div>
                  <CardDescription>
                    {t("debug.jsonDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-x-auto max-h-96 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {JSON.stringify(rawAnalysis, null, 2)}
                    </pre>
                  </div>
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    <strong>{t("debug.size")}</strong> {JSON.stringify(rawAnalysis).length} {t("additionalInfo.characters")}
                  </div>
                </CardContent>
              </Card>
            )}

            {claudeResponse && (
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Code className="h-5 w-5 text-blue-600" />
                    <CardTitle>{t("debug.textTitle")}</CardTitle>
                  </div>
                  <CardDescription>
                    {t("debug.textDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-x-auto max-h-96 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono">{claudeResponse}</pre>
                  </div>
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    <strong>{t("debug.size")}</strong> {claudeResponse.length} {t("additionalInfo.characters")}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <CardTitle>{t("uploadDocuments.title")}</CardTitle>
                </div>
                <CardDescription>
                  {t("uploadDocuments.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload onFilesChange={setFiles} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <CardTitle>{t("additionalInfo.title")}</CardTitle>
                </div>
                <CardDescription>
                  {t("additionalInfo.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder={t("additionalInfo.placeholder")}
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <p className="text-sm text-gray-500 mt-2">
                  {freeText.length} {t("additionalInfo.characters")}
                </p>
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard")}
                disabled={isLoading}
              >
                {t("actions.skipForNow")}
              </Button>
              <Button type="submit" disabled={!canSubmit} className="min-w-[200px]">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {status === "uploading" ? t("loading.uploading") : t("loading.analyzing")}
                  </>
                ) : (
                  t("actions.analyzeProfile")
                )}
              </Button>
            </div>

            {isLoading && (
              <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        {status === "uploading"
                          ? t("loading.uploadingMessage")
                          : t("loading.analyzingMessage")}
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {t("loading.pleaseWait")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
