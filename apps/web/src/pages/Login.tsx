import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Dados inválidos");
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Falha no login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-rpg-dark px-4">
      <div className="w-full max-w-md panel p-8">
        <div className="mb-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-rpg-purple flex items-center justify-center text-white font-bold">LX</div>
          <h1 className="font-display font-bold text-2xl text-rpg-foreground">LifeXP</h1>
        </div>
        <h2 className="mb-6 text-lg font-medium text-rpg-foreground">Bem-vindo de volta</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rpg-red/10 border border-rpg-red/30 text-rpg-red text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm text-rpg-foreground/70">E-mail</label>
            <input
              className="input-rpg"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-rpg-foreground/70">Senha</label>
            <input
              className="input-rpg"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button
            className="btn-rpg w-full"
            disabled={loading}
          >
            {loading ? "Entrando..." : <><ArrowRight size={18} className="mr-2" />Entrar</>}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-rpg-foreground/60">
          Não tem uma conta?{" "}
          <a href="/register" className="text-rpg-purple hover:underline">Cadastre-se</a>
        </p>
      </div>
    </div>
  );
}
