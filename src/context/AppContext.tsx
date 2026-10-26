import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { RiscoNivel, SimNao } from "@/lib/types";
import { supabase } from "@/lib/supabase";

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
  loginRespondente: (email: string, password: string) => Promise<{ error?: string }>;
  // Usuário autenticado no Supabase (qualquer perfil)
  userEmail: string | null;
  isAuthenticated: boolean;
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
          setAuthLoading(false);
        }
        return;
      }
      const { data, error } = await supabase.rpc("is_admin");
      if (error) console.error("Erro ao verificar perfil de administrador:", error);
      if (active) {
        setIsAdmin(data === true);
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

  const loginRespondente = async (email: string, password: string): Promise<{ error?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      return { error: "Credenciais inválidas. Verifique o e-mail e a senha informados." };
    }
    const { data: admin } = await supabase.rpc("is_admin");
    setIsAdmin(admin === true);
    setUserEmail(data.user?.email ?? null);
    return {};
  };

  const logout = async () => {
    setIsAdmin(false);
    setUserEmail(null);
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
