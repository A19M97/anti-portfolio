"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, PlayCircle, XCircle } from "lucide-react";
import { Link } from "@/i18n/routing";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface SimulationCardProps {
  simulation: {
    id: string;
    scenarioTitle: string;
    scenarioDescription: string | null;
    status: string;
    completedTasks: number;
    totalTasks: number;
    lastUpdated: Date;
    createdAt: Date;
    messageCount: number;
  };
}

export function SimulationCard({ simulation }: SimulationCardProps) {
  const progress = (simulation.completedTasks / simulation.totalTasks) * 100;
  const isActive = simulation.status === "active";
  const isCompleted = simulation.status === "completed";
  const isAbandoned = simulation.status === "abandoned";

  const statusConfig = {
    active: {
      badge: "Attivo",
      variant: "default" as const,
      icon: PlayCircle,
      color: "text-green-600",
    },
    completed: {
      badge: "Completato",
      variant: "secondary" as const,
      icon: CheckCircle2,
      color: "text-blue-600",
    },
    abandoned: {
      badge: "Abbandonato",
      variant: "outline" as const,
      icon: XCircle,
      color: "text-gray-600",
    },
  };

  const config = statusConfig[simulation.status as keyof typeof statusConfig] || statusConfig.active;
  const StatusIcon = config.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="line-clamp-2 mb-2">
              {simulation.scenarioTitle}
            </CardTitle>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={config.variant} className="flex items-center gap-1">
                <StatusIcon className={`h-3 w-3 ${config.color}`} />
                {config.badge}
              </Badge>
            </div>
          </div>
        </div>
        {simulation.scenarioDescription && (
          <CardDescription className="line-clamp-2">
            {simulation.scenarioDescription}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Progresso</span>
            <span className="font-medium">
              {simulation.completedTasks}/{simulation.totalTasks} task
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                isCompleted
                  ? "bg-blue-600"
                  : isActive
                  ? "bg-green-600"
                  : "bg-gray-400"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Clock className="h-4 w-4" />
          <span>
            Aggiornato{" "}
            {formatDistanceToNow(new Date(simulation.lastUpdated), {
              addSuffix: true,
              locale: it,
            })}
          </span>
        </div>

        {/* Action Button */}
        <Link href={`/simulation?id=${simulation.id}`}>
          <Button className="w-full" variant={isActive ? "default" : "outline"}>
            {isActive ? "Riprendi" : "Visualizza"}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
