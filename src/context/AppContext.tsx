import React, { createContext, useContext, useState } from "react";
import type { RiscoNivel, SimNao } from "@/lib/types";

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
  login: (role: UserRole) => void;
  logout: () => void;
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
  medio: 3,
  alto: 6,
  critico: 10,
};

const AppContext = createContext<AppContextProps | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);
  const [simulationInfo, setSimulationInfo] = useState<SimulationInfo>({
    usuario: "Sistema (Padrão)",
    data: new Date().toLocaleDateString("pt-BR"),
    versao: 1,
  });

  const login = (role: UserRole) => {
    setUserRole(role);
  };

  const logout = () => {
    setUserRole(null);
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
        login,
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
