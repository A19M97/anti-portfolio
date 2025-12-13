"use client";

import { Briefcase, Users, Calendar, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
  type?: "BRIEF" | "TEAM" | "TIMELINE" | "TASK" | "CHALLENGE" | "FEEDBACK";
}

interface MobileContextTabsProps {
  messages: ChatMessage[];
  chatContent: React.ReactNode;
}

export function MobileContextTabs({ messages, chatContent }: MobileContextTabsProps) {
  // Extract context messages
  const briefMessage = messages.find((msg) => msg.type === "BRIEF");
  const teamMessage = messages.find((msg) => msg.type === "TEAM");
  const timelineMessage = messages.find((msg) => msg.type === "TIMELINE");

  return (
    <Tabs defaultValue="chat" className="flex flex-col h-full">
      <TabsList className="w-full justify-start rounded-none border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0 h-auto">
        <TabsTrigger value="chat" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 py-3">
          <MessageSquare className="h-4 w-4 mr-2" />
          Chat
        </TabsTrigger>
        <TabsTrigger value="brief" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 py-3">
          <Briefcase className="h-4 w-4 mr-2" />
          Brief
        </TabsTrigger>
        <TabsTrigger value="team" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 py-3">
          <Users className="h-4 w-4 mr-2" />
          Team
        </TabsTrigger>
        <TabsTrigger value="timeline" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 py-3">
          <Calendar className="h-4 w-4 mr-2" />
          Timeline
        </TabsTrigger>
      </TabsList>

      <TabsContent value="chat" className="flex-1 m-0">
        {chatContent}
      </TabsContent>

      <TabsContent value="brief" className="flex-1 m-0 overflow-y-auto">
        <div className="px-4 py-6">
          {briefMessage ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{briefMessage.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              Nessun brief disponibile
            </p>
          )}
        </div>
      </TabsContent>

      <TabsContent value="team" className="flex-1 m-0 overflow-y-auto">
        <div className="px-4 py-6">
          {teamMessage ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{teamMessage.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              Nessun team disponibile
            </p>
          )}
        </div>
      </TabsContent>

      <TabsContent value="timeline" className="flex-1 m-0 overflow-y-auto">
        <div className="px-4 py-6">
          {timelineMessage ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{timelineMessage.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              Nessuna timeline disponibile
            </p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
