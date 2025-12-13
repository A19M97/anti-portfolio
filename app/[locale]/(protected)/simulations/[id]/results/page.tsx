"use client";

import { useState, useEffect, useRef } from "react";
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
  Sparkles,
  ChevronDown,
  ChevronUp,
  Share2,
  Download,
  Copy,
  Check,
  Info
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { SimulationTimeline } from "@/components/simulation/simulation-timeline";
import { motion, AnimatePresence, useInView } from "framer-motion";
import confetti from "canvas-confetti";
import * as Tooltip from "@radix-ui/react-tooltip";

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
  userId: string;
  scenarioTitle?: string;
  completedTasks: number;
  totalTasks: number;
  status: string;
  completedAt?: string;
  messages: SimulationMessage[];
}

type LoadingState = "loading" | "generating" | "ready" | "error";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

const scaleVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.34, 1.56, 0.64, 1] as any
    }
  }
};

export default function SimulationResultsPage() {
  const params = useParams();
  const router = useRouter();
  const simulationId = params.id as string;

  const [state, setState] = useState<LoadingState>("loading");
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentSection, setCurrentSection] = useState<string>("");

  const confettiTriggered = useRef(false);

  useEffect(() => {
    loadResults();
  }, [simulationId]);

  // Trigger confetti for high scores
  useEffect(() => {
    if (evaluation?.overallScore && evaluation.overallScore >= 80 && !confettiTriggered.current && state === "ready") {
      confettiTriggered.current = true;
      triggerConfetti();
    }
  }, [evaluation, state]);

  // Track current section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["overview", "metrics", "strengths", "weaknesses", "insights", "timeline"];
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setCurrentSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

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

  const handleShare = async () => {
    const shareText = `Ho completato la simulazione "${simulation?.scenarioTitle}" con un punteggio di ${evaluation?.overallScore}/100! 🎯`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Anti-Portfolio - Risultati Simulazione",
          text: shareText,
          url: window.location.href,
        });
        toast.success("Condiviso con successo!");
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error sharing:", err);
        }
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      toast.success("Link copiato negli appunti!");
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            Caricamento risultati...
          </p>
        </motion.div>
      </div>
    );
  }

  if (state === "generating") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <motion.div
          className="text-center space-y-6 max-w-md px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative">
            <div className="w-24 h-24 mx-auto">
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
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
        </motion.div>
      </div>
    );
  }

  if (state === "error" || !simulation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <motion.div
          className="max-w-md w-full space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || "Errore nel caricamento dei risultati"}
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => router.push("/dashboard")}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!evaluation) {
    return null;
  }

  return (
    <Tooltip.Provider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Sticky Header */}
        <motion.div
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => simulation && router.push(`/users/${simulation.userId}`)}
                className="gap-2 hover:scale-105 transition-transform"
              >
                <ArrowLeft className="w-4 h-4" />
                Profilo
              </Button>
              <div className="flex items-center gap-3">
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Completata
                  </span>
                </motion.div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="gap-2 hover:scale-105 transition-transform"
                >
                  <Share2 className="w-4 h-4" />
                  Condividi
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Navigation */}
        <motion.div
          className="sticky top-[73px] z-40 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
              {[
                { id: "overview", label: "Panoramica" },
                { id: "metrics", label: "Metriche" },
                { id: "strengths", label: "Punti di Forza" },
                { id: "weaknesses", label: "Miglioramenti" },
                { id: "insights", label: "Insights" },
                { id: "timeline", label: "Timeline" }
              ].map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    currentSection === section.id
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >

          {/* Hero Section */}
          <motion.div
            id="overview"
            className="text-center space-y-4 py-8"
            variants={itemVariants}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-medium shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Award className="w-4 h-4" />
              Valutazione Completa
            </motion.div>
            <motion.h1
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {simulation.scenarioTitle || "Risultati della Simulazione"}
            </motion.h1>
            <motion.p
              className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Ecco l'analisi dettagliata della tua performance basata su {simulation.completedTasks} decisioni completate
            </motion.p>
          </motion.div>

          {/* Overall Score Card */}
          {evaluation.overallScore && (
            <motion.div variants={scaleVariants}>
              <Card className="overflow-hidden border-2 shadow-xl hover:shadow-2xl transition-shadow">
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
                      <motion.circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="url(#gradient)"
                        strokeWidth="12"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 88}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - evaluation.overallScore / 100) }}
                        transition={{ duration: 2, delay: 0.5 }}
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" className="text-blue-500" stopColor="currentColor" />
                          <stop offset="100%" className="text-purple-600" stopColor="currentColor" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <AnimatedCounter
                        value={evaluation.overallScore}
                        className={`text-5xl font-bold ${getScoreColor(evaluation.overallScore)}`}
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400">/ 100</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Key Metrics Grid */}
          <motion.div
            id="metrics"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={containerVariants}
          >
            {evaluation.leadershipScore !== null && evaluation.leadershipScore !== undefined && (
              <motion.div variants={itemVariants}>
                <MetricCard
                  icon={Users}
                  title="Leadership"
                  score={evaluation.leadershipScore}
                  color="blue"
                  description="Capacità di guidare e motivare il team"
                />
              </motion.div>
            )}
            {evaluation.technicalScore !== null && evaluation.technicalScore !== undefined && (
              <motion.div variants={itemVariants}>
                <MetricCard
                  icon={Brain}
                  title="Competenze Tecniche"
                  score={evaluation.technicalScore}
                  color="purple"
                  description="Conoscenze e competenze specifiche del dominio"
                />
              </motion.div>
            )}
            {evaluation.communicationScore !== null && evaluation.communicationScore !== undefined && (
              <motion.div variants={itemVariants}>
                <MetricCard
                  icon={MessageSquare}
                  title="Comunicazione"
                  score={evaluation.communicationScore}
                  color="green"
                  description="Capacità di comunicare in modo efficace"
                />
              </motion.div>
            )}
            {evaluation.adaptabilityScore !== null && evaluation.adaptabilityScore !== undefined && (
              <motion.div variants={itemVariants}>
                <MetricCard
                  icon={Zap}
                  title="Adattabilità"
                  score={evaluation.adaptabilityScore}
                  color="orange"
                  description="Flessibilità e capacità di adattamento"
                />
              </motion.div>
            )}
          </motion.div>

          {/* Qualities Section */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
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
                  <AnimatedQualityBar key={index} quality={quality} delay={index * 0.1} />
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Strengths Section */}
          <motion.div id="strengths" variants={itemVariants}>
            <Card className="shadow-lg border-l-4 border-l-green-500 hover:shadow-xl transition-shadow">
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
                  <ExpandableStrengthCard key={index} strength={strength} index={index} />
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Weaknesses Section */}
          <motion.div id="weaknesses" variants={itemVariants}>
            <Card className="shadow-lg border-l-4 border-l-orange-500 hover:shadow-xl transition-shadow">
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
                  <ExpandableWeaknessCard key={index} weakness={weakness} index={index} />
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Insights Grid */}
          {(evaluation.leadershipStyle || evaluation.decisionMaking || evaluation.communicationStyle || evaluation.problemSolving) && (
            <motion.div
              id="insights"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              variants={containerVariants}
            >
              {evaluation.leadershipStyle && (
                <motion.div variants={itemVariants}>
                  <InsightCard
                    icon={Users}
                    title="Stile di Leadership"
                    content={evaluation.leadershipStyle}
                    color="blue"
                  />
                </motion.div>
              )}
              {evaluation.decisionMaking && (
                <motion.div variants={itemVariants}>
                  <InsightCard
                    icon={Brain}
                    title="Decision Making"
                    content={evaluation.decisionMaking}
                    color="purple"
                  />
                </motion.div>
              )}
              {evaluation.communicationStyle && (
                <motion.div variants={itemVariants}>
                  <InsightCard
                    icon={MessageSquare}
                    title="Stile Comunicativo"
                    content={evaluation.communicationStyle}
                    color="green"
                  />
                </motion.div>
              )}
              {evaluation.problemSolving && (
                <motion.div variants={itemVariants}>
                  <InsightCard
                    icon={Lightbulb}
                    title="Problem Solving"
                    content={evaluation.problemSolving}
                    color="yellow"
                  />
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Overall Assessment */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-xl border-2 border-blue-200 dark:border-blue-800 hover:shadow-2xl transition-shadow">
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
          </motion.div>

          {/* Simulation Timeline */}
          <motion.div id="timeline" variants={itemVariants}>
            <SimulationTimeline
              messages={simulation.messages}
              scenarioTitle={simulation.scenarioTitle}
            />
          </motion.div>

          {/* CTA Section */}
          <motion.div
            className="text-center py-8 space-y-4"
            variants={itemVariants}
          >
            <p className="text-gray-600 dark:text-gray-400">
              Vuoi mettere alla prova le tue competenze in un nuovo scenario?
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => router.push("/simulation")}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Inizia Nuova Simulazione
              </Button>
            </motion.div>
          </motion.div>

        </motion.div>
      </div>
    </Tooltip.Provider>
  );
}

// Helper Components

function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <span className={className}>{count}</span>;
}

function MetricCard({
  icon: Icon,
  title,
  score,
  color,
  description
}: {
  icon: any;
  title: string;
  score: number;
  color: "blue" | "purple" | "green" | "orange";
  description: string;
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 text-blue-600",
    purple: "from-purple-500 to-purple-600 text-purple-600",
    green: "from-green-500 to-green-600 text-green-600",
    orange: "from-orange-500 to-orange-600 text-orange-600",
  }[color];

  return (
    <Tooltip.Root delayDuration={300}>
      <Tooltip.Trigger asChild>
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="shadow-md hover:shadow-xl transition-all cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <Icon className={`w-8 h-8 ${colorClasses.split(' ')[2]}`} />
                <AnimatedCounter
                  value={score}
                  className={`text-3xl font-bold ${colorClasses.split(' ')[2]}`}
                />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
              <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${colorClasses.split(' ').slice(0, 2).join(' ')} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 1.5, delay: 0.3 }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm max-w-xs shadow-lg z-50"
          sideOffset={5}
        >
          {description}
          <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-700" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function AnimatedQualityBar({ quality, delay }: { quality: Quality; delay: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "from-green-500 to-emerald-600";
    if (score >= 60) return "from-blue-500 to-indigo-600";
    if (score >= 40) return "from-yellow-500 to-orange-600";
    return "from-red-500 to-rose-600";
  };

  return (
    <motion.div
      ref={ref}
      className="space-y-2"
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay }}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-900 dark:text-white">{quality.name}</span>
        <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{quality.score}/100</span>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${getScoreColor(quality.score)}`}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${quality.score}%` } : {}}
          transition={{ duration: 1, delay: delay + 0.2 }}
        />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{quality.description}</p>
    </motion.div>
  );
}

function ExpandableStrengthCard({ strength, index }: { strength: Strength; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = `${strength.title}\n${strength.description}\n\nEsempi:\n${strength.examples.join('\n')}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiato negli appunti!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      className="space-y-3 border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
          <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
              {strength.title}
            </h4>
            <div className="flex items-center gap-1">
              <motion.button
                onClick={handleCopy}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </motion.button>
              <motion.button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </motion.button>
            </div>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-3">
            {strength.description}
          </p>
          <AnimatePresence>
            {isExpanded && strength.examples && strength.examples.length > 0 && (
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Esempi:</p>
                <ul className="space-y-1 ml-4">
                  {strength.examples.map((example, i) => (
                    <motion.li
                      key={i}
                      className="text-sm text-gray-600 dark:text-gray-400 list-disc"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      {example}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function ExpandableWeaknessCard({ weakness, index }: { weakness: Weakness; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = `${weakness.title}\n${weakness.description}\n\nSuggerimenti:\n${weakness.suggestions.join('\n')}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiato negli appunti!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      className="space-y-3 border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex-shrink-0">
          <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
              {weakness.title}
            </h4>
            <div className="flex items-center gap-1">
              <motion.button
                onClick={handleCopy}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </motion.button>
              <motion.button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </motion.button>
            </div>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-3">
            {weakness.description}
          </p>
          <AnimatePresence>
            {isExpanded && weakness.suggestions && weakness.suggestions.length > 0 && (
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Suggerimenti:
                </p>
                <ul className="space-y-1 ml-4">
                  {weakness.suggestions.map((suggestion, i) => (
                    <motion.li
                      key={i}
                      className="text-sm text-gray-600 dark:text-gray-400 list-disc"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      {suggestion}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
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
  color: "blue" | "purple" | "green" | "yellow";
}) {
  const [copied, setCopied] = useState(false);

  const colorClasses = {
    blue: "from-blue-500 to-blue-600 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    purple: "from-purple-500 to-purple-600 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    green: "from-green-500 to-green-600 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    yellow: "from-yellow-500 to-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
  }[color];

  const [bgClass, iconBgClass, iconColorClass] = colorClasses.split(' ');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${title}\n\n${content}`);
    setCopied(true);
    toast.success("Copiato negli appunti!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="shadow-md hover:shadow-xl transition-shadow h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${iconBgClass} rounded-lg`}>
                <Icon className={`w-5 h-5 ${iconColorClass}`} />
              </div>
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            <motion.button
              onClick={handleCopy}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500" />
              )}
            </motion.button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 dark:text-gray-300">{content}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
