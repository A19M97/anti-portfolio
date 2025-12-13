"use client";

import { useState } from "react";
import { ChevronDown, Briefcase, Users, Calendar } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
  type?: "BRIEF" | "TEAM" | "TIMELINE" | "TASK";
}

interface ContextSidebarProps {
  messages: ChatMessage[];
  className?: string;
}

export function ContextSidebar({ messages, className }: ContextSidebarProps) {
  const [openSections, setOpenSections] = useState({
    brief: true,
    team: true,
    timeline: true,
  });

  // Extract context messages
  const briefMessage = messages.find((msg) => msg.type === "BRIEF");
  const teamMessage = messages.find((msg) => msg.type === "TEAM");
  const timelineMessage = messages.find((msg) => msg.type === "TIMELINE");

  const toggleSection = (section: "brief" | "team" | "timeline") => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const Section = ({
    title,
    icon: Icon,
    content,
    sectionKey,
    iconColor,
  }: {
    title: string;
    icon: any;
    content?: string;
    sectionKey: "brief" | "team" | "timeline";
    iconColor: string;
  }) => {
    if (!content) return null;

    return (
      <Collapsible
        open={openSections[sectionKey]}
        onOpenChange={() => toggleSection(sectionKey)}
        className="border-b border-gray-200 dark:border-gray-700 last:border-b-0"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <div className="flex items-center space-x-2">
            <Icon className={cn("h-4 w-4", iconColor)} />
            <span className="font-semibold text-sm">{title}</span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-gray-500 transition-transform duration-200",
              openSections[sectionKey] && "transform rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-sm prose-p:text-sm prose-li:text-sm">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className={cn("bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col", className)}>
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-lg">Contesto Scenario</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Informazioni chiave per la simulazione
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Section
          title="Brief"
          icon={Briefcase}
          content={briefMessage?.content}
          sectionKey="brief"
          iconColor="text-blue-600"
        />
        <Section
          title="Il Tuo Team"
          icon={Users}
          content={teamMessage?.content}
          sectionKey="team"
          iconColor="text-green-600"
        />
        <Section
          title="Timeline"
          icon={Calendar}
          content={timelineMessage?.content}
          sectionKey="timeline"
          iconColor="text-orange-600"
        />
      </div>

      {(!briefMessage && !teamMessage && !timelineMessage) && (
        <div className="flex-1 flex items-center justify-center px-4 py-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nessun contesto disponibile
          </p>
        </div>
      )}
    </div>
  );
}
