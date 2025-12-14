"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SimulationCard } from "@/components/simulations/simulation-card";
import { Link } from "@/i18n/routing";
import { ArrowLeft, Loader2, User, Award, Plus, Activity, LogIn } from "lucide-react";
import { toast } from "sonner";

interface Simulation {
  id: string;
  scenarioTitle: string;
  scenarioDescription: string | null;
  status: string;
  completedTasks: number;
  totalTasks: number;
  lastUpdated: Date;
  createdAt: Date;
  messageCount: number;
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  createdAt: Date;
}

interface UserStats {
  totalSimulations: number;
  completedSimulations: number;
  activeSimulations: number;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const { userId: currentUserId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    totalSimulations: 0,
    completedSimulations: 0,
    activeSimulations: 0
  });
  const [hasProfileAnalysis, setHasProfileAnalysis] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  useEffect(() => {
    if (isOwnProfile) {
      checkProfileAnalysis();
    }
  }, [isOwnProfile]);

  const checkProfileAnalysis = async () => {
    try {
      const response = await fetch("/api/analyze-profile");
      if (response.ok) {
        const data = await response.json();
        // data.data è un array di ProfileAnalysis
        const completedAnalyses = data.data.filter(
          (pa: any) => pa.analysisStatus === "completed"
        );
        setHasProfileAnalysis(completedAnalyses.length > 0);
      }
    } catch (err) {
      console.error("Error checking profile analysis:", err);
    }
  };

  const handleNewSimulation = () => {
    router.push("/onboarding");
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${userId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Utente non trovato");
        }
        throw new Error("Errore nel caricamento del profilo");
      }

      const data = await response.json();
      setUser(data.user);
      setSimulations(data.simulations || []);
      setIsOwnProfile(data.isOwnProfile);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
      toast.error("Errore nel caricamento del profilo");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-8">
        <Button
          variant="ghost"
          onClick={() => router.push(currentUserId ? "/dashboard" : "/")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {currentUserId ? "Torna alla Dashboard" : "Torna alla Home"}
        </Button>
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          {error || "Utente non trovato"}
        </div>
      </div>
    );
  }

  const activeSimulations = simulations.filter(s => s.status === "active");
  const completedSimulations = simulations.filter(s => s.status === "completed");

  // Generate initials for avatar
  const initials = `${user.firstName.charAt(0).toUpperCase()}${user.lastName.charAt(0).toUpperCase()}`;

  return (
    <div className="p-8">
      {/* Header with back button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(currentUserId ? "/dashboard" : "/")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {currentUserId ? "Torna alla Dashboard" : "Torna alla Home"}
        </Button>
      </div>

      {/* User Profile Card */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-3xl">
                {initials}
              </div>

              <div>
                <CardTitle className="text-3xl mb-2">
                  {user.firstName} {user.lastName}
                </CardTitle>
                {isOwnProfile && (
                  <Badge variant="default" className="mb-2">
                    Il tuo profilo
                  </Badge>
                )}
                <CardDescription className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Membro da {new Date(user.createdAt).toLocaleDateString("it-IT")}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="text-2xl font-bold">{stats.totalSimulations}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Simulazioni totali
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Award className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div>
                <div className="text-2xl font-bold">{stats.completedSimulations}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Completate
                </div>
              </div>
            </div>

            {isOwnProfile && (
              <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <Activity className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                <div>
                  <div className="text-2xl font-bold">{stats.activeSimulations}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    In corso
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* New Simulation Button or CTA */}
      <div className="mb-6 flex justify-end">
        {isOwnProfile && (
          <Button size="lg" className="gap-2" onClick={handleNewSimulation}>
            <Plus className="h-5 w-5" />
            Nuova Simulazione
          </Button>
        )}
      </div>

      {/* Active Simulations - Only for own profile */}
      {isOwnProfile && activeSimulations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Simulazioni in Corso</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeSimulations.map((simulation) => (
              <SimulationCard key={simulation.id} simulation={simulation} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Simulations */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          Simulazioni Completate
        </h2>

        {completedSimulations.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {isOwnProfile
                ? "Non hai ancora completato nessuna simulazione"
                : "Questo utente non ha ancora completato simulazioni"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {completedSimulations.map((simulation) => (
              <SimulationCard key={simulation.id} simulation={simulation} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
