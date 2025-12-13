"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Award,
  Target,
  Brain,
  Users,
  MessageSquare,
  Zap,
  BarChart3,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { SimulationTimeline } from "@/components/simulation/simulation-timeline";

interface Strength {
  title: string;
  description: string;
  examples: string[];
}

interface Weakness {
  title: string;
  description: string;
  suggestions: string[];
}

interface Quality {
  name: string;
  score: number;
  description: string;
}

interface Evaluation {
  id: string;
  strengths: Strength[];
  weaknesses: Weakness[];
  qualities: Quality[];
  overallAssessment: string;
  leadershipStyle?: string;
  decisionMaking?: string;
  communicationStyle?: string;
  problemSolving?: string;
  overallScore?: number;
  leadershipScore?: number;
  technicalScore?: number;
  communicationScore?: number;
  adaptabilityScore?: number;
  createdAt: string;
}

interface SimulationMessage {
  role: string;
  content: string;
  type?: string;
  orderIndex: number;
}

interface Simulation {
  id: string;
  scenarioTitle?: string;
  completedTasks: number;
  totalTasks: number;
  status: string;
  completedAt?: string;
  messages: SimulationMessage[];
}

type LoadingState = "loading" | "generating" | "ready" | "error";

export default function SimulationResultsPage() {
  const params = useParams();
  const router = useRouter();
  const simulationId = params.id as string;

  const [state, setState] = useState<LoadingState>("loading");
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadResults();
  }, [simulationId]);

  const loadResults = async () => {
    try {
      setState("loading");
      setError(null);

      // Fetch simulation
      const simResponse = await fetch(`/api/simulations/${simulationId}`);
      if (!simResponse.ok) {
        throw new Error("Failed to fetch simulation");
      }
      const simData = await simResponse.json();
      setSimulation(simData.simulation);

      // Check if simulation is completed
      if (simData.simulation.status !== "completed") {
        setError("La simulazione non è ancora completata");
        setState("error");
        return;
      }

      // Try to fetch existing evaluation
      const evalResponse = await fetch(`/api/simulations/${simulationId}/evaluation`);

      if (evalResponse.ok) {
        const evalData = await evalResponse.json();
        if (evalData.exists && evalData.evaluation) {
          setEvaluation(evalData.evaluation);
          setState("ready");
          return;
        }
      }

      // If no evaluation exists, generate it
      setState("generating");
      const generateResponse = await fetch(`/api/simulations/${simulationId}/evaluation`, {
        method: "POST",
      });

      if (!generateResponse.ok) {
        throw new Error("Failed to generate evaluation");
      }

      const generatedData = await generateResponse.json();
      setEvaluation(generatedData.evaluation);
      setState("ready");
      toast.success("Valutazione generata con successo!");

    } catch (err) {
      console.error("Error loading results:", err);
      setError(err instanceof Error ? err.message : "Errore nel caricamento dei risultati");
      setState("error");
      toast.error("Errore nel caricamento dei risultati");
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreGradient = (score: number): string => {
    if (score >= 80) return "from-green-500 to-emerald-600";
    if (score >= 60) return "from-blue-500 to-indigo-600";
    if (score >= 40) return "from-yellow-500 to-orange-600";
    return "from-red-500 to-rose-600";
  };

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            Caricamento risultati...
          </p>
        </div>
      </div>
    );
  }

  if (state === "generating") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="relative">
            <div className="w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse"></div>
              <div className="absolute inset-2 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                <Brain className="w-10 h-10 text-blue-600 animate-pulse" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analisi in corso...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              L'AI sta analizzando la tua performance nella simulazione. Questo potrebbe richiedere alcuni secondi.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-500">
            <Sparkles className="w-4 h-4" />
            <span>Powered by Claude AI</span>
          </div>
        </div>
      </div>
    );
  }

  if (state === "error" || !simulation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || "Errore nel caricamento dei risultati"}
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => router.push("/simulations")}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alle simulazioni
          </Button>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push("/simulations")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Tutte le simulazioni
            </Button>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Completata
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-medium shadow-lg">
            <Award className="w-4 h-4" />
            Valutazione Completa
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            {simulation.scenarioTitle || "Risultati della Simulazione"}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Ecco l'analisi dettagliata della tua performance basata su {simulation.completedTasks} decisioni completate
          </p>
        </div>

        {/* Overall Score Card */}
        {evaluation.overallScore && (
          <Card className="overflow-hidden border-2 shadow-xl">
            <div className={`h-2 bg-gradient-to-r ${getScoreGradient(evaluation.overallScore)}`} />
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">Punteggio Complessivo</CardTitle>
            </CardHeader>
            <CardContent className="text-center pb-8">
              <div className="relative inline-block">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="url(#gradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - evaluation.overallScore / 100)}`}
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" className="text-blue-500" stopColor="currentColor" />
                      <stop offset="100%" className="text-purple-600" stopColor="currentColor" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-5xl font-bold ${getScoreColor(evaluation.overallScore)}`}>
                    {evaluation.overallScore}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">/ 100</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {evaluation.leadershipScore !== null && evaluation.leadershipScore !== undefined && (
            <MetricCard
              icon={Users}
              title="Leadership"
              score={evaluation.leadershipScore}
              color="blue"
            />
          )}
          {evaluation.technicalScore !== null && evaluation.technicalScore !== undefined && (
            <MetricCard
              icon={Brain}
              title="Competenze Tecniche"
              score={evaluation.technicalScore}
              color="purple"
            />
          )}
          {evaluation.communicationScore !== null && evaluation.communicationScore !== undefined && (
            <MetricCard
              icon={MessageSquare}
              title="Comunicazione"
              score={evaluation.communicationScore}
              color="green"
            />
          )}
          {evaluation.adaptabilityScore !== null && evaluation.adaptabilityScore !== undefined && (
            <MetricCard
              icon={Zap}
              title="Adattabilità"
              score={evaluation.adaptabilityScore}
              color="orange"
            />
          )}
        </div>

        {/* Qualities Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Qualità Professionali</CardTitle>
                <CardDescription>Le competenze chiave emerse dalla simulazione</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {evaluation.qualities.map((quality, index) => (
              <QualityBar key={index} quality={quality} />
            ))}
          </CardContent>
        </Card>

        {/* Strengths Section */}
        <Card className="shadow-lg border-l-4 border-l-green-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-green-900 dark:text-green-100">Punti di Forza</CardTitle>
                <CardDescription>Le tue competenze distintive</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {evaluation.strengths.map((strength, index) => (
              <StrengthCard key={index} strength={strength} />
            ))}
          </CardContent>
        </Card>

        {/* Weaknesses Section */}
        <Card className="shadow-lg border-l-4 border-l-orange-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <CardTitle className="text-orange-900 dark:text-orange-100">Aree di Miglioramento</CardTitle>
                <CardDescription>Opportunità di crescita professionale</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {evaluation.weaknesses.map((weakness, index) => (
              <WeaknessCard key={index} weakness={weakness} />
            ))}
          </CardContent>
        </Card>

        {/* Insights Grid */}
        {(evaluation.leadershipStyle || evaluation.decisionMaking || evaluation.communicationStyle || evaluation.problemSolving) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {evaluation.leadershipStyle && (
              <InsightCard
                icon={Users}
                title="Stile di Leadership"
                content={evaluation.leadershipStyle}
                color="blue"
              />
            )}
            {evaluation.decisionMaking && (
              <InsightCard
                icon={Brain}
                title="Decision Making"
                content={evaluation.decisionMaking}
                color="purple"
              />
            )}
            {evaluation.communicationStyle && (
              <InsightCard
                icon={MessageSquare}
                title="Stile Comunicativo"
                content={evaluation.communicationStyle}
                color="green"
              />
            )}
            {evaluation.problemSolving && (
              <InsightCard
                icon={Lightbulb}
                title="Problem Solving"
                content={evaluation.problemSolving}
                color="yellow"
              />
            )}
          </div>
        )}

        {/* Overall Assessment */}
        <Card className="shadow-xl border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Valutazione Complessiva</CardTitle>
                <CardDescription>Sintesi della tua performance</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-blue dark:prose-invert max-w-none">
              <ReactMarkdown>{evaluation.overallAssessment}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        {/* Simulation Timeline */}
        <SimulationTimeline
          messages={simulation.messages}
          scenarioTitle={simulation.scenarioTitle}
        />

        {/* CTA Section */}
        <div className="text-center py-8 space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Vuoi mettere alla prova le tue competenze in un nuovo scenario?
          </p>
          <Button
            onClick={() => router.push("/simulation")}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Inizia Nuova Simulazione
          </Button>
        </div>

      </div>
    </div>
  );
}

// Helper Components

function MetricCard({
  icon: Icon,
  title,
  score,
  color
}: {
  icon: any;
  title: string;
  score: number;
  color: string;
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 text-blue-600",
    purple: "from-purple-500 to-purple-600 text-purple-600",
    green: "from-green-500 to-green-600 text-green-600",
    orange: "from-orange-500 to-orange-600 text-orange-600",
  }[color];

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <Icon className={`w-8 h-8 ${colorClasses.split(' ')[2]}`} />
          <span className={`text-3xl font-bold ${colorClasses.split(' ')[2]}`}>
            {score}
          </span>
        </div>
        <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
        <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${colorClasses.split(' ').slice(0, 2).join(' ')} transition-all duration-1000 ease-out rounded-full`}
            style={{ width: `${score}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function QualityBar({ quality }: { quality: Quality }) {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return "from-green-500 to-emerald-600";
    if (score >= 60) return "from-blue-500 to-indigo-600";
    if (score >= 40) return "from-yellow-500 to-orange-600";
    return "from-red-500 to-rose-600";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-900 dark:text-white">{quality.name}</span>
        <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{quality.score}/100</span>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${getScoreColor(quality.score)} transition-all duration-1000 ease-out`}
          style={{ width: `${quality.score}%` }}
        />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{quality.description}</p>
    </div>
  );
}

function StrengthCard({ strength }: { strength: Strength }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
          <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
            {strength.title}
          </h4>
          <p className="text-gray-700 dark:text-gray-300 mb-3">
            {strength.description}
          </p>
          {strength.examples && strength.examples.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Esempi:</p>
              <ul className="space-y-1 ml-4">
                {strength.examples.map((example, i) => (
                  <li key={i} className="text-sm text-gray-600 dark:text-gray-400 list-disc">
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WeaknessCard({ weakness }: { weakness: Weakness }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex-shrink-0">
          <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
            {weakness.title}
          </h4>
          <p className="text-gray-700 dark:text-gray-300 mb-3">
            {weakness.description}
          </p>
          {weakness.suggestions && weakness.suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Suggerimenti:
              </p>
              <ul className="space-y-1 ml-4">
                {weakness.suggestions.map((suggestion, i) => (
                  <li key={i} className="text-sm text-gray-600 dark:text-gray-400 list-disc">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  title,
  content,
  color
}: {
  icon: any;
  title: string;
  content: string;
  color: string;
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    purple: "from-purple-500 to-purple-600 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    green: "from-green-500 to-green-600 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    yellow: "from-yellow-500 to-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
  }[color];

  const [bgClass, iconBgClass, iconColorClass] = colorClasses.split(' ');

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`p-2 ${iconBgClass} rounded-lg`}>
            <Icon className={`w-5 h-5 ${iconColorClass}`} />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 dark:text-gray-300">{content}</p>
      </CardContent>
    </Card>
  );
}
