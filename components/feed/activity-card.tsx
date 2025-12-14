"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { Trophy, Briefcase, Users, Calendar, Target, FileText, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface ActivityCardProps {
  activity: {
    id: string;
    userId: string;
    user: {
      name: string;
      firstName: string;
      lastName: string;
      initials: string;
    };
    role: string;
    seniority: string | null;
    scenarioTitle: string;
    scenarioDescription: string | null;
    companyName: string | null;
    teamSize: number | null;
    score: number | null;
    completedTasks: number;
    totalTasks: number;
    completedAt: Date;
  };
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const getScoreColor = (score: number | null) => {
    if (!score) return "text-gray-500";
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const getScoreBg = (score: number | null) => {
    if (!score) return "from-gray-400 to-gray-500";
    if (score >= 80) return "from-green-400 to-emerald-600";
    if (score >= 60) return "from-blue-400 to-blue-600";
    if (score >= 40) return "from-yellow-400 to-yellow-600";
    return "from-orange-400 to-orange-600";
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <div className="p-6">
          {/* Header with User Info */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              {/* Avatar */}
              <div className="relative">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-xl transition-shadow ring-2 ring-white dark:ring-gray-800">
                  {activity.user.initials}
                </div>
                <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse" />
              </div>

              {/* User Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {activity.user.name}
                  </h3>
                  <span className="text-gray-400 dark:text-gray-600">•</span>
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                    <Briefcase className="h-3 w-3" />
                    {activity.role}
                  </Badge>
                  {activity.seniority && (
                    <Badge variant="outline" className="text-xs">
                      {activity.seniority}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(activity.completedAt), {
                      addSuffix: true,
                      locale: it,
                    })}
                  </span>
                </div>
              </div>

              {/* Score Badge */}
              {activity.score !== null && (
                <div className="flex flex-col items-center">
                  <div className={`relative h-16 w-16 rounded-full bg-gradient-to-br ${getScoreBg(activity.score)} shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <div className="absolute inset-1 bg-white dark:bg-gray-900 rounded-full flex flex-col items-center justify-center">
                      <Trophy className={`h-4 w-4 ${getScoreColor(activity.score)} mb-0.5`} />
                      <span className={`text-lg font-bold ${getScoreColor(activity.score)}`}>
                        {activity.score}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Score</span>
                </div>
              )}
            </div>
          </div>

          {/* Scenario Title */}
          <div className="mb-3">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {activity.scenarioTitle}
            </h4>
            {activity.scenarioDescription && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                {activity.scenarioDescription}
              </p>
            )}
          </div>

          {/* Scenario Details */}
          <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
            {activity.companyName && (
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                <span>{activity.companyName}</span>
              </div>
            )}
            {activity.teamSize && (
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{activity.teamSize} persone</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Target className="h-4 w-4" />
              <span>{activity.completedTasks}/{activity.totalTasks} task completati</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-3 flex-wrap">
            <Link href={`/simulations/${activity.id}/results`} className="flex-1">
              <Button
                variant="default"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                Vedi Risultati
              </Button>
            </Link>
            <Link href={`/users/${activity.userId}`} className="flex-1">
              <Button variant="outline" className="w-full">
                <User className="h-4 w-4 mr-2" />
                Profilo Utente
              </Button>
            </Link>
          </div>
        </div>
      </Card>
  );
}
