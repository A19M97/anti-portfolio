"use client";

import { useEffect, useState } from "react";
import { ActivityCard } from "./activity-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Search, Filter, Loader2, TrendingUp, ArrowUpDown, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FeedItem {
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
}

const commonRoles = [
  "Product Manager",
  "Engineering Manager",
  "Tech Lead",
  "Software Engineer",
  "CTO",
  "CEO",
  "Designer"
];

type SortOption = "recent" | "score-high" | "score-low" | "name";

export function SocialFeed() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [filteredFeed, setFilteredFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchFeed();
  }, []);

  useEffect(() => {
    filterFeed();
  }, [feed, searchQuery, selectedRole, sortBy]);

  const fetchFeed = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await fetch("/api/feed?limit=50");
      const data = await response.json();

      if (data.success) {
        setFeed(data.feed);
      }
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchFeed(true);
  };

  const filterFeed = () => {
    let filtered = [...feed];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.user.name.toLowerCase().includes(query) ||
          item.scenarioTitle.toLowerCase().includes(query) ||
          item.role.toLowerCase().includes(query) ||
          item.companyName?.toLowerCase().includes(query)
      );
    }

    if (selectedRole) {
      filtered = filtered.filter((item) =>
        item.role.toLowerCase().includes(selectedRole.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
        case "score-high":
          return (b.score || 0) - (a.score || 0);
        case "score-low":
          return (a.score || 0) - (b.score || 0);
        case "name":
          return a.user.name.localeCompare(b.user.name);
        default:
          return 0;
      }
    });

    setFilteredFeed(filtered);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedRole(null);
    setSortBy("recent");
  };

  const hasActiveFilters = searchQuery || selectedRole || sortBy !== "recent";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="text-gray-500 dark:text-gray-400">Caricamento del feed...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Feed Sociale</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {feed.length} simulazioni completate di recente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className="relative"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Ordina per" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Più recenti</SelectItem>
              <SelectItem value="score-high">Score più alto</SelectItem>
              <SelectItem value="score-low">Score più basso</SelectItem>
              <SelectItem value="name">Nome utente</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtri
            {hasActiveFilters && (
              <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                !
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6 border border-blue-200 dark:border-gray-700 space-y-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtra il feed
            </h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Pulisci filtri
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cerca per nome, scenario, azienda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Role Filters */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Ruolo</p>
            <div className="flex flex-wrap gap-2">
              {commonRoles.map((role) => {
                const count = feed.filter((item) =>
                  item.role.toLowerCase().includes(role.toLowerCase())
                ).length;

                if (count === 0) return null;

                return (
                  <Badge
                    key={role}
                    variant={selectedRole === role ? "default" : "outline"}
                    className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                    onClick={() => setSelectedRole(selectedRole === role ? null : role)}
                  >
                    {role} ({count})
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      {filteredFeed.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Score medio</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {Math.round(
                    filteredFeed.reduce((acc, item) => acc + (item.score || 0), 0) / filteredFeed.length
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Simulazioni</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {filteredFeed.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Utenti attivi</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {new Set(filteredFeed.map((item) => item.userId)).size}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feed Grid */}
      {filteredFeed.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredFeed.map((item, index) => (
            <div
              key={item.id}
              className="animate-in fade-in slide-in-from-bottom duration-500"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ActivityCard activity={item} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="inline-flex h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-4">
            <Search className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Nessuna simulazione trovata
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {hasActiveFilters
              ? "Prova a modificare i filtri per vedere più risultati"
              : "Sii il primo a completare una simulazione!"}
          </p>
          {hasActiveFilters && (
            <Button onClick={clearFilters} variant="outline">
              Pulisci filtri
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
