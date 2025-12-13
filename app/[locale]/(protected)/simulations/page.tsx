"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimulationCard } from "@/components/simulations/simulation-card";
import { Link } from "@/i18n/routing";
import { Plus, Loader2 } from "lucide-react";

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

type FilterType = "active" | "all";

export default function SimulationsPage() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [filter, setFilter] = useState<FilterType>("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSimulations();
  }, []);

  const fetchSimulations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/simulations");

      if (!response.ok) {
        throw new Error("Errore nel caricamento delle simulazioni");
      }

      const data = await response.json();
      setSimulations(data.simulations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  };

  const filteredSimulations =
    filter === "active"
      ? simulations.filter((sim) => sim.status === "active")
      : simulations;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Le Mie Simulazioni</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualizza e riprendi le tue simulazioni
          </p>
        </div>
        <Link href="/simulation">
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Nuova Simulazione
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
          <TabsList>
            <TabsTrigger value="active">
              Attivi ({simulations.filter((s) => s.status === "active").length})
            </TabsTrigger>
            <TabsTrigger value="all">Tutti ({simulations.length})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredSimulations.length === 0 && (
        <div className="text-center py-12">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {filter === "active"
                ? "Nessuna simulazione attiva"
                : "Nessuna simulazione trovata"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filter === "active"
                ? "Inizia la tua prima simulazione per mettere alla prova le tue competenze"
                : "Non hai ancora creato nessuna simulazione"}
            </p>
          </div>
          <Link href="/simulation">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Inizia la Tua Prima Simulazione
            </Button>
          </Link>
        </div>
      )}

      {/* Simulations Grid */}
      {!loading && !error && filteredSimulations.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSimulations.map((simulation) => (
            <SimulationCard key={simulation.id} simulation={simulation} />
          ))}
        </div>
      )}
    </div>
  );
}
