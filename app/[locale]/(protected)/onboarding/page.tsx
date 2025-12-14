"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { FileUpload } from "@/components/ui/file-upload";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, FileText, MessageSquare, Code, Briefcase } from "lucide-react";
import { toast } from "sonner";
import AntiPortfolioDestruction from "@/components/AntiPortfolioDestruction";

type AnalysisStatus = "idle" | "uploading" | "analyzing" | "success" | "error";

export default function OnboardingPage() {
  const router = useRouter();
  const t = useTranslations("Onboarding");
  const [files, setFiles] = useState<File[]>([]);
  const [freeText, setFreeText] = useState("");
  const [desiredRole, setDesiredRole] = useState("");
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [usedModel, setUsedModel] = useState<string | null>(null);
  const [rawAnalysis, setRawAnalysis] = useState<any>(null);
  const [claudeResponse, setClaudeResponse] = useState<string | null>(null);
  const [showDestruction, setShowDestruction] = useState(false);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[Frontend] handleSubmit started");

    setError(null);
    setStatus("uploading");

    // Start visual destruction immediately
    setShowDestruction(true);

    const startTime = Date.now();

    try {
      // Validate that desired role is provided
      console.log("[Frontend] Validating input", {
        filesCount: files.length,
        hasFreeText: !!freeText.trim(),
        hasDesiredRole: !!desiredRole.trim(),
      });

      if (!desiredRole.trim()) {
        console.warn("[Frontend] Validation failed: no desired role provided");
        setError(t("errors.noRole"));
        setStatus("error");
        setShowDestruction(false); // Cancel destruction if validation fails
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

      if (desiredRole.trim()) {
        console.log("[Frontend] Adding desired role", {
          role: desiredRole,
        });
        formData.append("desiredRole", desiredRole);
      }

      setStatus("analyzing");
      // toast.info(t("toasts.analyzing")); // Suppress toast as we have the visual animation

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

      // toast.success(t("toasts.success")); // Will show results instead
    } catch (err) {
      const totalDuration = Date.now() - startTime;
      console.error("[Frontend] Analysis failed", {
        error: err,
        durationMs: totalDuration,
      });

      setError(err instanceof Error ? err.message : t("errors.analysisFailed"));
      setStatus("error");
      toast.error(t("toasts.error"));
      // Maybe keep destruction visible or show error state?
      // For now, let user retry.
      setShowDestruction(false);
    }
  };

  const handleAnimationComplete = () => {
    setIsAnimationComplete(true);
  };

  const isLoading = status === "uploading" || status === "analyzing";
  const canSubmit = !isLoading && desiredRole.trim().length > 0;

  // If destruction is active and animation isn't "complete" (modal dismissed)
  if (showDestruction && !isAnimationComplete) {
    // If API failed, we might want to exit this view? 
    // Handled by setStatus('error') -> setShowDestruction(false) in catch block.
    return (
      <AntiPortfolioDestruction
        file={files[0]}
        onComplete={handleAnimationComplete}
        autoStart={true}
      />
    );
  }

  // If analysis success AND animation passed -> Show Results
  if (status === "success" && analysisResult && isAnimationComplete) {
    // ... render success view ...
    // (Copying expected success rendering block below)
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Result Cards Block */}
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
                      setDesiredRole("");
                      setUsedModel(null);
                      setShowDestruction(false);
                      setIsAnimationComplete(false);
                    }}
                  >
                    {t("success.analyzeAnother")}
                  </Button>
                </div>
              </CardContent>
            </Card>
            {/* Debug Cards ... */}
            {(prompt && false) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Code className="h-5 w-5" />
                    <CardTitle>{t("debug.promptTitle")}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-x-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono">{prompt}</pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {(rawAnalysis && false) && (
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

            {(claudeResponse && false) && (
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
                    <strong>{t("debug.size")}</strong> {claudeResponse?.length} {t("additionalInfo.characters")}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Wait, if animation complete BUT status is still analyzing (slow API)?
  if (showDestruction && isAnimationComplete && status !== "success") {
    // Show a loader waiting for API?
    // Or keep showing the AntiPortfolioDestruction modal until success?
    // "AntiPortfolioDestruction" onComplete is called when user CLOSES the modal. 
    // If they close it, they expect to see something.
    // Let's show a loading state.
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Generazione Scenario in corso...</h2>
          <p className="text-gray-500">Stiamo preparando la tua prima sfida.</p>
        </div>
      </div>
    );
  }

  // DEFAULT: Show Form
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">{t("title")}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t("subtitle")}
          </p>
        </div>

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
                <Briefcase className="h-5 w-5" />
                <CardTitle>{t("desiredRole.title")}</CardTitle>
              </div>
              <CardDescription>
                {t("desiredRole.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="text"
                placeholder={t("desiredRole.placeholder")}
                value={desiredRole}
                onChange={(e) => setDesiredRole(e.target.value)}
                required
              />
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

          <div className="flex justify-end">
            <Button type="submit" disabled={!canSubmit} className="min-w-[200px]">
              {t("actions.analyzeProfile")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
