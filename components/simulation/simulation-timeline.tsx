"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  MessageSquare,
  Target,
  Zap,
  Clock,
  User
} from "lucide-react";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";

interface SimulationMessage {
  role: string;
  content: string;
  type?: string;
  orderIndex: number;
}

interface SimulationTimelineProps {
  messages: SimulationMessage[];
  scenarioTitle?: string;
}

export function SimulationTimeline({ messages, scenarioTitle }: SimulationTimelineProps) {
  // Filter messages: exclude initial setup messages (BRIEF, TEAM, TIMELINE)
  const timelineMessages = messages.filter(msg => {
    // Include all user messages
    if (msg.role === 'user') return true;
    // Include only TASK, CHALLENGE, FEEDBACK from assistant
    return msg.type && ['TASK', 'CHALLENGE', 'FEEDBACK'].includes(msg.type);
  });

  const getMessageStyle = (role: string, type?: string) => {
    if (role === 'user') {
      return {
        background: 'rgb(59, 130, 246)', // blue-500
        icon: User,
        iconStyle: { background: 'rgb(59, 130, 246)', color: '#fff' },
        contentStyle: { background: 'rgb(239, 246, 255)', color: '#1f2937', border: '2px solid rgb(59, 130, 246)' },
        contentArrowStyle: { borderRight: '7px solid rgb(59, 130, 246)' },
        position: 'right' as const,
      };
    }

    // Assistant messages
    switch (type) {
      case 'CHALLENGE':
        return {
          background: 'rgb(249, 115, 22)', // orange-500
          icon: AlertTriangle,
          iconStyle: { background: 'rgb(249, 115, 22)', color: '#fff' },
          contentStyle: { background: 'rgb(255, 247, 237)', color: '#1f2937', border: '2px solid rgb(249, 115, 22)' },
          contentArrowStyle: { borderRight: '7px solid rgb(249, 115, 22)' },
          position: 'left' as const,
        };
      case 'TASK':
        return {
          background: 'rgb(99, 102, 241)', // indigo-500
          icon: Target,
          iconStyle: { background: 'rgb(99, 102, 241)', color: '#fff' },
          contentStyle: { background: 'rgb(238, 242, 255)', color: '#1f2937', border: '2px solid rgb(99, 102, 241)' },
          contentArrowStyle: { borderRight: '7px solid rgb(99, 102, 241)' },
          position: 'left' as const,
        };
      case 'FEEDBACK':
        return {
          background: 'rgb(16, 185, 129)', // green-500
          icon: MessageSquare,
          iconStyle: { background: 'rgb(16, 185, 129)', color: '#fff' },
          contentStyle: { background: 'rgb(236, 253, 245)', color: '#1f2937', border: '2px solid rgb(16, 185, 129)' },
          contentArrowStyle: { borderRight: '7px solid rgb(16, 185, 129)' },
          position: 'left' as const,
        };
      default:
        return {
          background: 'rgb(107, 114, 128)', // gray-500
          icon: MessageSquare,
          iconStyle: { background: 'rgb(107, 114, 128)', color: '#fff' },
          contentStyle: { background: 'rgb(249, 250, 251)', color: '#1f2937', border: '2px solid rgb(107, 114, 128)' },
          contentArrowStyle: { borderRight: '7px solid rgb(107, 114, 128)' },
          position: 'left' as const,
        };
    }
  };

  const getMessageLabel = (role: string, type?: string) => {
    if (role === 'user') {
      return 'La tua risposta';
    }

    switch (type) {
      case 'CHALLENGE':
        return 'Sfida';
      case 'TASK':
        return 'Task';
      case 'FEEDBACK':
        return 'Feedback';
      default:
        return 'Messaggio';
    }
  };

  if (timelineMessages.length === 0) {
    return null;
  }

  // Count tasks and challenges for summary
  const tasksCount = timelineMessages.filter(m => m.type === 'TASK').length;
  const challengesCount = timelineMessages.filter(m => m.type === 'CHALLENGE').length;
  const userResponsesCount = timelineMessages.filter(m => m.role === 'user').length;

  return (
    <Card className="shadow-xl border-2 border-indigo-200 dark:border-indigo-800">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle>Timeline della Simulazione</CardTitle>
            <CardDescription>
              Cronologia completa delle decisioni e sfide affrontate
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <VerticalTimeline layout="2-columns" lineColor="rgb(209, 213, 219)">
          {timelineMessages.map((message, index) => {
            const style = getMessageStyle(message.role, message.type);
            const Icon = style.icon;
            const label = getMessageLabel(message.role, message.type);
            const isChallenge = message.type === 'CHALLENGE';

            return (
              <VerticalTimelineElement
                key={index}
                className="vertical-timeline-element--work"
                contentStyle={style.contentStyle}
                contentArrowStyle={style.contentArrowStyle}
                iconStyle={style.iconStyle}
                position={style.position}
                icon={<Icon />}
              >
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {label}
                  </h3>
                  {isChallenge && (
                    <Zap className="w-5 h-5 text-orange-500 animate-pulse" />
                  )}
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                  {message.content}
                </p>
              </VerticalTimelineElement>
            );
          })}
        </VerticalTimeline>

        {/* Summary footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {tasksCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Task Completati</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {challengesCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Sfide Affrontate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {userResponsesCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Tue Risposte</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
