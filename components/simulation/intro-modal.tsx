"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, Calendar, Rocket } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
  type?: "BRIEF" | "TEAM" | "TIMELINE" | "TASK" | "CHALLENGE" | "FEEDBACK";
}

interface IntroModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: ChatMessage[];
}

export function IntroModal({ open, onOpenChange, messages }: IntroModalProps) {
  // Extract context messages
  const briefMessage = messages.find((msg) => msg.type === "BRIEF");
  const teamMessage = messages.find((msg) => msg.type === "TEAM");
  const timelineMessage = messages.find((msg) => msg.type === "TIMELINE");

  const handleStartSimulation = () => {
    onOpenChange(false);
  };

  const Section = ({
    title,
    icon: Icon,
    content,
    iconColor,
  }: {
    title: string;
    icon: any;
    content?: string;
    iconColor: string;
  }) => {
    if (!content) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className={cn("p-2 rounded-lg bg-gray-100 dark:bg-gray-800")}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-base prose-p:text-sm prose-li:text-sm bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none max-h-none m-0 rounded-none md:max-w-2xl md:max-h-[85vh] md:rounded-lg md:m-auto p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Contesto dello Scenario
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Leggi attentamente prima di iniziare la simulazione
          </p>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <Section
            title="Brief"
            icon={Briefcase}
            content={briefMessage?.content}
            iconColor="text-blue-600"
          />
          <Section
            title="Il Tuo Team"
            icon={Users}
            content={teamMessage?.content}
            iconColor="text-green-600"
          />
          <Section
            title="Timeline"
            icon={Calendar}
            content={timelineMessage?.content}
            iconColor="text-orange-600"
          />
        </div>

        {/* Footer - Fixed */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <Button
            onClick={handleStartSimulation}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            size="lg"
          >
            <Rocket className="w-4 h-4 mr-2" />
            Inizia Simulazione
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
