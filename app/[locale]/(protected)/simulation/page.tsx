"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { ContextSidebar } from "@/components/simulation/context-sidebar";
import { MobileContextTabs } from "@/components/simulation/mobile-context-tabs";

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
  type?: "BRIEF" | "TEAM" | "TIMELINE" | "TASK";
}

type SimulationStatus = "loading" | "ready" | "sending" | "error";

export default function SimulationPage() {
  const router = useRouter();
  const [status, setStatus] = useState<SimulationStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load scenario on mount
  useEffect(() => {
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
      const response = await fetch("/api/generate-scenario", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate scenario");
      }

      const result = await response.json();
      console.log("[Simulation] Scenario loaded", {
        messagesCount: result.messages.length,
      });

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim()) {
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
    });

    // TODO: In the next step, this will call the API to continue the simulation
    // For now, we just show a mock response
    setTimeout(() => {
      const mockResponse: ChatMessage = {
        role: "assistant",
        content: "Grazie per la tua risposta! (Implementazione completa nel prossimo step)",
      };
      setChatMessages((prev) => [...prev, mockResponse]);
      setStatus("ready");
    }, 1000);
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

  // Filter messages: only TASK and user messages for chat
  const chatOnlyMessages = chatMessages.filter(
    (msg) => msg.role === "user" || msg.type === "TASK"
  );

  // Chat content component (used in both desktop and mobile)
  const ChatContent = () => (
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
                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1 uppercase">
                  {message.type}
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
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
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
              {chatOnlyMessages.filter(msg => msg.role === "user").length} risposte
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
            <ChatContent />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden h-full">
          <MobileContextTabs messages={chatMessages} chatContent={<ChatContent />} />
        </div>
      </div>
    </div>
  );
}
