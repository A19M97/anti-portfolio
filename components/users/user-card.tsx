"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { User, Award } from "lucide-react";

interface UserCardProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    completedSimulationsCount: number;
  };
}

export function UserCard({ user }: UserCardProps) {
  // Generate initials for avatar
  const initials = `${user.firstName.charAt(0).toUpperCase()}${user.lastName.charAt(0).toUpperCase()}`;

  return (
    <Link href={`/users/${user.id}`}>
      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar with initials */}
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg shrink-0">
                {initials}
              </div>

              <div>
                <CardTitle className="text-lg">
                  {user.firstName} {user.lastName}
                </CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                  <User className="h-3 w-3" />
                  Profilo Utente
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium">
              {user.completedSimulationsCount}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user.completedSimulationsCount === 1
                ? "simulazione completata"
                : "simulazioni completate"}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
