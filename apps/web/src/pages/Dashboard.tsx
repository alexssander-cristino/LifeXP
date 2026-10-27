import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiJson } from "../lib/api";
import { Activity, CheckCircle, Clock, Trophy, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiJson("/api/v1/dashboard")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex h-[400px] items-center justify-center">
      <div className="animate-pulse panel p-8 text-center">Carregando...</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-rpg-foreground">Dashboard</h1>
          <p className="text-rpg-foreground/60">Seu progresso em tempo real</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-rpg-secondary">Filtrar</button>
          <button className="btn-rpg">Nova missão</button>
        </div>
      </div>

      {/* Estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Activity className="text-rpg-blue" />}
          label="Nível"
          value={data?.level ?? 1}
          sub="XP total"
          subValue={data?.xp ?? 0}
        />
        <StatCard
          icon={<CheckCircle className="text-rpg-green" />}
          label="Próximo nível"
          value={data?.xpToNextLevel ?? 0}
          sub="XP necessários"
        />
        <StatCard
          icon={<Clock className="text-rpg-purple" />}
          label="Hoje"
          value={data?.completedMissionsToday ?? 0}
          sub="Missões concluídas"
        />
        <StatCard
          icon={<Trophy className="text-rpg-gold" />}
          label="Progresso"
          value={data?.progressPercent ?? 0}
          sub="% para o próximo nível"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Missões de hoje */}
        <div className="panel p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-rpg-foreground">Missões de hoje</h3>
            <TrendingUp className="w-4 h-4 text-rpg-foreground/50" />
          </div>
          <div className="space-y-3">
            {data?.todayMissions?.length ? (
              data.todayMissions.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-rpg-border bg-rpg-dark/50">
                  <div>
                    <div className="text-sm font-medium text-rpg-foreground">{m.title}</div>
                    <div className="text-xs text-rpg-foreground/50">{m.category} • {m.difficulty}</div>
                  </div>
                  <div className="text-xs text-rpg-foreground/40">{m.dueDate?.slice(11, 16) ?? "—"}</div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-rpg-foreground/50 text-sm">Nenhuma missão para hoje</div>
            )}
          </div>
        </div>

        {/* Resumo lateral */}
        <div className="space-y-4 lg:col-span-1">
          <div className="panel p-4">
            <h3 className="text-sm font-medium text-rpg-foreground/70 mb-3">Conquistas recentes</h3>
            <div className="space-y-3">
              {data?.recentAchievements?.length ? (
                data.recentAchievements.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-3 p-2 rounded bg-rpg-dark/30">
                    <div className="w-8 h-8 rounded bg-rpg-purple/20 flex items-center justify-center text-rpg-purple">
                      ⭐
                    </div>
                    <div>
                      <div className="text-sm font-medium text-rpg-foreground">{a.title}</div>
                      <div className="text-xs text-rpg-foreground/50">{a.earnedAt?.slice(0, 10)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-2 text-rpg-foreground/50 text-sm">Nenhuma conquista ainda</div>
              )}
            </div>
          </div>
          <div className="panel p-4">
            <h3 className="text-sm font-medium text-rpg-foreground/70 mb-3">Esta semana</h3>
            <div className="text-2xl font-bold text-rpg-foreground">{data?.weeklyXp ?? 0}</div>
            <p className="text-xs text-rpg-foreground/50">XP ganho nos últimos 7 dias</p>
          </div>
        </div>
      </div>

      {/* Próximas metas */}
      <div className="panel p-4">
        <h3 className="text-sm font-medium text-rpg-foreground/70 mb-3">Próximas metas</h3>
        <div className="space-y-3">
          {data?.upcomingGoals?.length ? (
            data.upcomingGoals.map((g: any) => (
              <div key={g.id} className="flex items-center justify-between p-3 rounded-lg border border-rpg-border bg-rpg-dark/50">
                <div>
                  <div className="text-sm font-medium text-rpg-foreground">{g.title}</div>
                </div>
                <div className="text-xs text-rpg-foreground/40">{g.dueDate?.slice(0, 16)}</div>
              </div>
            ))
          ) : (
            <div className="text-center py-2 text-rpg-foreground/50 text-sm">Sem metas próximas</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, subValue }: any) {
  return (
    <div className="card-stat">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-rpg-foreground/50">{label}</div>
          <div className="text-2xl font-bold text-rpg-foreground">{value}</div>
          {subValue !== undefined && (
            <div className="text-xs text-rpg-foreground/50">{sub}: {subValue}</div>
          )}
        </div>
        <div className="p-2 rounded bg-rpg-purple/10 text-rpg-purple">{icon}</div>
      </div>
      {sub && !subValue && (
        <div className="text-xs text-rpg-foreground/50 mt-1">{sub}</div>
      )}
    </div>
  );
}
