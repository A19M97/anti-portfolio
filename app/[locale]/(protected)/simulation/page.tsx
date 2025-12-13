"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Send, ArrowLeft, Award, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { ContextSidebar } from "@/components/simulation/context-sidebar";
import { MobileContextTabs } from "@/components/simulation/mobile-context-tabs";

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
  type?: "BRIEF" | "TEAM" | "TIMELINE" | "TASK" | "CHALLENGE" | "FEEDBACK";
}

type SimulationStatus = "loading" | "ready" | "sending" | "error" | "completed";

interface SimulationProgress {
  completedTasks: number;
  totalTasks: number;
  isCompleted: boolean;
}

interface ChatContentProps {
  chatOnlyMessages: ChatMessage[];
  status: SimulationStatus;
  progress: SimulationProgress;
  inputMessage: string;
  setInputMessage: (value: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  simulationId: string | null;
  onViewResults: () => void;
}

// Chat content component (used in both desktop and mobile)
const ChatContent = ({
  chatOnlyMessages,
  status,
  progress,
  inputMessage,
  setInputMessage,
  handleSendMessage,
  messagesEndRef,
  chatContainerRef,
  simulationId,
  onViewResults,
}: ChatContentProps) => (
  <div className="flex flex-col h-full">
    {/* Messages Area */}
    <div
      ref={chatContainerRef}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
    >
      {chatOnlyMessages.map((message, index) => (
        <div
          key={index}
          className={`flex ${
            message.role === "user" ? "justify-end" : "justify-start"
          } animate-in fade-in slide-in-from-bottom-2 duration-300`}
        >
          <div
            className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
              message.role === "user"
                ? "bg-blue-600 text-white rounded-br-none"
                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-none"
            }`}
          >
            {message.type && message.role === "assistant" && (
              <div className={`text-xs font-semibold mb-1 uppercase ${
                message.type === "CHALLENGE"
                  ? "text-red-600 dark:text-red-400"
                  : message.type === "FEEDBACK"
                  ? "text-green-600 dark:text-green-400"
                  : "text-blue-600 dark:text-blue-400"
              }`}>
                {message.type === "CHALLENGE" ? "⚠️ SFIDA CRITICA" : message.type}
              </div>
            )}
            <div
              className={`prose prose-sm max-w-none ${
                message.role === "user"
                  ? "prose-invert"
                  : "dark:prose-invert"
              }`}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      ))}

      {status === "sending" && (
        <div className="flex justify-start">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-none px-4 py-3">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Digitando...
              </span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>

    {/* Input Area */}
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-4">
      {progress.isCompleted ? (
        <div className="space-y-3">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 text-center">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              🎉 Simulazione completata con successo!
            </p>
          </div>
          <Button
            onClick={onViewResults}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            size="lg"
          >
            <Award className="w-4 h-4 mr-2" />
            Visualizza Risultati
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <div className="flex-1">
            <Input
              placeholder="Scrivi un messaggio..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={status === "sending"}
              className="resize-none"
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!inputMessage.trim() || status === "sending"}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  </div>
);

export default function SimulationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const simulationIdFromUrl = searchParams.get("id");
  const [status, setStatus] = useState<SimulationStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [progress, setProgress] = useState<SimulationProgress>({
    completedTasks: 0,
    totalTasks: 10,
    isCompleted: false,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);

  // Load scenario on mount
  useEffect(() => {
    // Prevent duplicate calls
    if (hasLoadedRef.current) {
      return;
    }
    hasLoadedRef.current = true;
    loadScenario();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadScenario = async () => {
    console.log("[Simulation] Loading scenario");
    setStatus("loading");
    setError(null);

    try {
      // Check if we should resume an existing simulation
      if (simulationIdFromUrl) {
        console.log("[Simulation] Resuming existing simulation", { id: simulationIdFromUrl });
        await resumeSimulation(simulationIdFromUrl);
        return;
      }

      // Create new simulation
      const response = await fetch("/api/generate-scenario", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate scenario");
      }

      const result = await response.json();
      console.log("[Simulation] Scenario loaded", {
        simulationId: result.simulationId,
        messagesCount: result.messages.length,
      });

      // Save simulation ID
      setSimulationId(result.simulationId);

      // Convert scenario messages to chat messages
      const scenarioMessages: ChatMessage[] = result.messages.map((msg: any) => ({
        role: "assistant" as const,
        content: msg.content,
        type: msg.type,
      }));

      setChatMessages(scenarioMessages);
      setStatus("ready");
      toast.success("Scenario caricato!");
    } catch (err) {
      console.error("[Simulation] Failed to load scenario", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setStatus("error");
      toast.error("Errore nel caricamento dello scenario");
    }
  };

  const resumeSimulation = async (simId: string) => {
    try {
      const response = await fetch(`/api/simulations/${simId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Simulazione non trovata");
        }
        if (response.status === 403) {
          throw new Error("Non autorizzato ad accedere a questa simulazione");
        }
        throw new Error("Errore nel caricamento della simulazione");
      }

      const { simulation } = await response.json();
      console.log("[Simulation] Simulation resumed", {
        id: simulation.id,
        messagesCount: simulation.messages.length,
      });

      // Set simulation ID
      setSimulationId(simulation.id);

      // Convert messages to ChatMessage format
      const messages: ChatMessage[] = simulation.messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        type: msg.type,
      }));

      setChatMessages(messages);

      // Set progress
      setProgress({
        completedTasks: simulation.completedTasks,
        totalTasks: simulation.totalTasks,
        isCompleted: simulation.status === "completed",
      });

      // Set status
      setStatus(simulation.status === "completed" ? "completed" : "ready");
      toast.success("Simulazione ripresa!");
    } catch (err) {
      console.error("[Simulation] Failed to resume simulation", err);
      setError(err instanceof Error ? err.message : "Errore nel caricamento");
      setStatus("error");
      toast.error("Errore nel ripristino della simulazione");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim() || !simulationId) {
      return;
    }

    if (progress.isCompleted) {
      toast.info("La simulazione è completata!");
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: inputMessage.trim(),
    };

    // Add user message to chat
    setChatMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setStatus("sending");

    console.log("[Simulation] User message sent", {
      messageLength: userMessage.content.length,
      simulationId,
    });

    try {
      const response = await fetch("/api/continue-simulation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          simulationId,
          userMessage: userMessage.content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to continue simulation");
      }

      const result = await response.json();
      console.log("[Simulation] AI response received", {
        type: result.message.type,
        isCompleted: result.simulation.isCompleted,
      });

      // Add AI response to chat
      const aiMessage: ChatMessage = {
        role: "assistant",
        content: result.message.content,
        type: result.message.type,
      };
      setChatMessages((prev) => [...prev, aiMessage]);

      // Update progress
      setProgress({
        completedTasks: result.simulation.completedTasks,
        totalTasks: result.simulation.totalTasks,
        isCompleted: result.simulation.isCompleted,
      });

      // Update status
      if (result.simulation.isCompleted) {
        setStatus("completed");
        toast.success("Simulazione completata! 🎉");
      } else {
        setStatus("ready");
      }
    } catch (err) {
      console.error("[Simulation] Failed to send message", err);
      toast.error("Errore nell'invio del messaggio");
      setStatus("ready");
      // Remove the user message from chat on error
      setChatMessages((prev) => prev.slice(0, -1));
    }
  };

  const handleViewResults = () => {
    if (!simulationId) {
      toast.error("ID simulazione non disponibile");
      return;
    }
    router.push(`/simulations/${simulationId}/results`);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Generazione Scenario</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Stiamo creando un'esperienza personalizzata per te...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna alla Dashboard
          </Button>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <div className="mt-4">
            <Button onClick={loadScenario}>Riprova</Button>
          </div>
        </div>
      </div>
    );
  }

  // Filter messages: exclude only context messages (BRIEF, TEAM, TIMELINE) from chat
  const chatOnlyMessages = chatMessages.filter(
    (msg) =>
      msg.role === "user" ||
      (msg.role === "assistant" && msg.type !== "BRIEF" && msg.type !== "TEAM" && msg.type !== "TIMELINE")
  );

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Resumed Banner */}
      {simulationIdFromUrl && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-2 text-sm text-blue-700 dark:text-blue-300">
          📋 Scenario ripreso - Task {progress.completedTasks}/{progress.totalTasks}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-semibold text-lg">Simulazione Scenario</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Task {progress.completedTasks}/{progress.totalTasks}
              {progress.isCompleted && " • Completata"}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop: Two-panel layout | Mobile: Tabs */}
      <div className="flex-1 overflow-hidden">
        {/* Desktop Layout */}
        <div className="hidden md:flex h-full">
          {/* Sidebar - Context */}
          <ContextSidebar messages={chatMessages} className="w-80 lg:w-96" />

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <ChatContent
              chatOnlyMessages={chatOnlyMessages}
              status={status}
              progress={progress}
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              handleSendMessage={handleSendMessage}
              messagesEndRef={messagesEndRef}
              chatContainerRef={chatContainerRef}
              simulationId={simulationId}
              onViewResults={handleViewResults}
            />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden h-full">
          <MobileContextTabs
            messages={chatMessages}
            chatContent={
              <ChatContent
                chatOnlyMessages={chatOnlyMessages}
                status={status}
                progress={progress}
                inputMessage={inputMessage}
                setInputMessage={setInputMessage}
                handleSendMessage={handleSendMessage}
                messagesEndRef={messagesEndRef}
                chatContainerRef={chatContainerRef}
                simulationId={simulationId}
                onViewResults={handleViewResults}
              />
            }
          />
        </div>
      </div>
    </div>
  );
}
