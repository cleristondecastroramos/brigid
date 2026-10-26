import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { RiscoNivel, SimNao } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { chamarContasPromotorias } from "@/services/promotorias-service";

export interface Weights {
  pesoFeminicidios: number;
  pesoTentativas: number;
  pesoOPM: number;
  pesoCREAS: number;
}

export interface Thresholds {
  medio: number;
  alto: number;
  critico: number;
}

export interface SimulationInfo {
  usuario: string;
  data: string;
  versao: number;
}

export type UserRole = "admin" | "public" | null;

interface AppContextProps {
  userRole: UserRole;
  // true enquanto a sessão do Supabase ainda está sendo verificada
  authLoading: boolean;
  enterPublic: () => void;
  loginAdmin: (email: string, password: string) => Promise<{ error?: string }>;
  // Login do módulo de coleta (Promotores vinculados e CAOCRIM)
  // admin: perfil conferido no banco, para decidir a página de destino após o login
  loginRespondente: (
    email: string,
    password: string,
  ) => Promise<{ error?: string; admin?: boolean }>;
  // Usuário autenticado no Supabase (qualquer perfil)
  userEmail: string | null;
  isAuthenticated: boolean;
  // Conta sem senha definitiva: o primeiro acesso é obrigatório antes de usar o Diagnóstico
  senhaProvisoria: boolean;
  definirSenhaDefinitiva: (
    credencial: string,
    novaSenha: string,
  ) => Promise<{ error?: string; admin?: boolean }>;
  logout: () => Promise<void>;
  weights: Weights;
  thresholds: Thresholds;
  simulationInfo: SimulationInfo;
  updateWeights: (newWeights: Weights) => void;
  updateThresholds: (newThresholds: Thresholds) => void;
  resetToDefaults: () => void;
}

const DEFAULT_WEIGHTS: Weights = {
  pesoFeminicidios: 3,
  pesoTentativas: 1,
  pesoOPM: 2,
  pesoCREAS: 2,
};

const DEFAULT_THRESHOLDS: Thresholds = {
  medio: 140,
  alto: 270,
  critico: 390,
};

// Lida do banco a cada verificação (e não do token), para valer logo após uma redefinição
async function verificarSenhaProvisoria(): Promise<boolean> {
  const { data, error } = await supabase.rpc("senha_provisoria_ativa");
  if (error) console.error("Erro ao verificar a senha provisória:", error);
  return data === true;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // O acesso público é só uma escolha de navegação; o papel admin vem exclusivamente
  // da sessão do Supabase Auth validada pela função is_admin() no banco.
  const [isPublic, setIsPublic] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("brigid_publicAccess") === "1";
    }
    return false;
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [senhaProvisoria, setSenhaProvisoria] = useState(false);
  const userRole: UserRole = isAdmin ? "admin" : isPublic ? "public" : null;
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);
  const [simulationInfo, setSimulationInfo] = useState<SimulationInfo>({
    usuario: "Sistema (Padrão)",
    data: new Date().toLocaleDateString("pt-BR"),
    versao: 1,
  });

  useEffect(() => {
    let active = true;

    const syncAdmin = async (session: Session | null) => {
      if (active) setUserEmail(session?.user.email ?? null);
      if (!session) {
        if (active) {
          setIsAdmin(false);
          setSenhaProvisoria(false);
          setAuthLoading(false);
        }
        return;
      }
      const [{ data, error }, provisoria] = await Promise.all([
        supabase.rpc("is_admin"),
        verificarSenhaProvisoria(),
      ]);
      if (error) console.error("Erro ao verificar perfil de administrador:", error);
      if (active) {
        setIsAdmin(data === true);
        setSenhaProvisoria(provisoria);
        setAuthLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data }) => syncAdmin(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Adiado para fora do callback, conforme recomendação do supabase-js
      setTimeout(() => syncAdmin(session), 0);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const enterPublic = () => {
    setIsPublic(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("brigid_publicAccess", "1");
    }
  };

  const loginAdmin = async (email: string, password: string): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      return { error: "Credenciais inválidas. Verifique o e-mail e a senha informados." };
    }

    const { data: admin, error: rpcError } = await supabase.rpc("is_admin");
    if (rpcError || admin !== true) {
      await supabase.auth.signOut();
      return { error: "Este usuário não possui perfil de administrador." };
    }

    setIsAdmin(true);
    return {};
  };

  const loginRespondente = async (
    email: string,
    password: string,
  ): Promise<{ error?: string; admin?: boolean }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      return { error: "Credenciais inválidas. Verifique o e-mail e a senha informados." };
    }
    const [{ data: admin }, provisoria] = await Promise.all([
      supabase.rpc("is_admin"),
      verificarSenhaProvisoria(),
    ]);
    setIsAdmin(admin === true);
    setSenhaProvisoria(provisoria);
    setUserEmail(data.user?.email ?? null);
    return { admin: admin === true };
  };

  // Primeiro acesso pela função de borda, que confere a conta, a credencial e a validade no
  // servidor antes de gravar a senha e retirar a marca provisória
  const definirSenhaDefinitiva = async (
    credencial: string,
    novaSenha: string,
  ): Promise<{ error?: string; admin?: boolean }> => {
    try {
      await chamarContasPromotorias({
        acao: "definir_senha_definitiva",
        credencial_provisoria: credencial,
        nova_senha: novaSenha,
      });
    } catch (e) {
      return { error: (e as Error).message };
    }
    // Só depois da confirmação do servidor: renova a sessão e relê do banco o perfil e a
    // marca provisória antes de liberar a navegação
    await supabase.auth.refreshSession();
    const [{ data: admin }, provisoria] = await Promise.all([
      supabase.rpc("is_admin"),
      verificarSenhaProvisoria(),
    ]);
    setIsAdmin(admin === true);
    setSenhaProvisoria(provisoria);
    if (provisoria) {
      return {
        error: "A senha foi registrada, mas a conta ainda consta como provisória. Entre novamente.",
      };
    }
    return { admin: admin === true };
  };

  const logout = async () => {
    setIsAdmin(false);
    setUserEmail(null);
    setSenhaProvisoria(false);
    setIsPublic(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("brigid_publicAccess");
    }
    await supabase.auth.signOut();
  };

  const updateWeights = (newWeights: Weights) => {
    setWeights(newWeights);
    setSimulationInfo((prev) => ({
      usuario: "Administrador CAOCRIM",
      data: new Date().toLocaleDateString("pt-BR"),
      versao: prev.versao + 1,
    }));
  };

  const updateThresholds = (newThresholds: Thresholds) => {
    setThresholds(newThresholds);
    setSimulationInfo((prev) => ({
      usuario: "Administrador CAOCRIM",
      data: new Date().toLocaleDateString("pt-BR"),
      versao: prev.versao + 1,
    }));
  };

  const resetToDefaults = () => {
    setWeights(DEFAULT_WEIGHTS);
    setThresholds(DEFAULT_THRESHOLDS);
    setSimulationInfo({
      usuario: "Sistema (Padrão)",
      data: new Date().toLocaleDateString("pt-BR"),
      versao: 1,
    });
  };

  return (
    <AppContext.Provider
      value={{
        userRole,
        authLoading,
        enterPublic,
        loginAdmin,
        loginRespondente,
        userEmail,
        isAuthenticated: userEmail !== null,
        senhaProvisoria,
        definirSenhaDefinitiva,
        logout,
        weights,
        thresholds,
        simulationInfo,
        updateWeights,
        updateThresholds,
        resetToDefaults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
