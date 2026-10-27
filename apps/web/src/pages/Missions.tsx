import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiJson } from "../lib/api";
import { Clock, Plus, ChevronRight, RefreshCw } from "lucide-react";

export default function Missions() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const r = await apiJson<any>("/api/v1/missions?status=pending");
    setMissions(r.data ?? []);
    setLoading(false);
  }

  async function createMission() {
    if (!newTitle.trim()) return;
    await apiJson("/api/v1/missions", {
      method: "POST",
      body: JSON.stringify({
        title: newTitle.trim(),
        category: "geral",
        difficulty: "medium",
        type: "one_time",
        xpReward: 15,
      }),
    });
    setNewTitle("");
    load();
  }

  async function complete(id: string) {
    const r = await apiJson<any>(`/api/v1/missions/${id}/complete`, {
      method: "POST",
    });
    alert(`Missão concluída! +${r.xpAwarded} XP${r.leveledUp ? " — Subiu de nível!" : ""}`);
    load();
  }

  if (loading) return (
    <div className="flex h-[400px] items-center justify-center">
      <div className="animate-pulse panel p-8 text-center">Carregando...</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-rpg-foreground">Missões</h1>
          <p className="text-rpg-foreground/60">Suas missões pendentes</p>
        </div>
        <div className="flex gap-2">
          <input
            className="input-rpg w-64"
            placeholder="Nova missão"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createMission()}
          />
          <button className="btn-rpg" onClick={createMission}>
            <Plus size={18} className="mr-2" />Criar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {missions.length ? (
          missions.map((m) => (
            <div key={m.id} className="panel p-4 hover:border-rpg-purple/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-rpg-foreground">{m.title}</h3>
                <span className="text-xs px-2 py-1 rounded border border-rpg-purple/30 text-rpg-purple bg-rpg-purple/10">
                  {m.difficulty}
                </span>
              </div>
              {m.description && (
                <p className="text-xs text-rpg-foreground/50 mb-3">{m.description}</p>
              )}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-rpg-foreground/40">{m.category}</span>
                <span className="text-xs text-rpg-foreground/40">+{m.xpReward} XP</span>
              </div>
              <button
                className="btn-rpg w-full"
                onClick={() => complete(m.id)}
              >
                Concluir missão <ChevronRight size={16} className="ml-2" />
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full panel p-12 text-center">
            <Clock className="w-12 h-12 mx-auto mb-3 text-rpg-foreground/20" />
            <h3 className="text-sm font-medium text-rpg-foreground">Nenhuma missão pendente</h3>
            <p className="text-xs text-rpg-foreground/50">Crie sua primeira missão para começar sua jornada.</p>
            <button className="btn-rpg mt-4" onClick={() => setNewTitle("")}>
              <Plus size={18} className="mr-2" />Criar missão
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
