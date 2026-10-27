import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string()
    .min(8, "Senha deve ter ao menos 8 caracteres")
    .regex(/[A-Z]/, "Uma letra maiúscula")
    .regex(/[a-z]/, "Uma letra minúscula")
    .regex(/[0-9]/, "Um número")
    .regex(/[^A-Za-z0-9]/, "Um caractere especial"),
});

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
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
      await register(form);
      navigate("/login", { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Falha no cadastro");
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
        <h2 className="mb-6 text-lg font-medium text-rpg-foreground">Criar conta</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rpg-red/10 border border-rpg-red/30 text-rpg-red text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm text-rpg-foreground/70">Nome completo</label>
            <input
              className="input-rpg"
              type="text"
              placeholder="Seu nome"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
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
          <button className="btn-rpg w-full" disabled={loading}>
            {loading ? "Criando..." : <><ArrowRight size={18} className="mr-2" />Criar conta</>}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-rpg-foreground/60">
          Já tem uma conta?{" "}
          <a href="/login" className="text-rpg-purple hover:underline">Entrar</a>
        </p>
      </div>
    </div>
  );
}
