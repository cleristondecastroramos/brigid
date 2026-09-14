import { diagnosticoLocalService, DiagnosticoFormModel } from "./diagnostico-local-service";

// O serviço que a UI consome. No futuro, pode apontar para diagnosticoApiService.
class DiagnosticoService {
  async getById(id: string): Promise<DiagnosticoFormModel | null> {
    return diagnosticoLocalService.getById(id);
  }

  async getMyDiagnosticos(): Promise<DiagnosticoFormModel[]> {
    return diagnosticoLocalService.getMyDiagnosticos();
  }

  async save(diagnostico: DiagnosticoFormModel): Promise<DiagnosticoFormModel> {
    return diagnosticoLocalService.save(diagnostico);
  }
}

export const diagnosticoService = new DiagnosticoService();
export type { DiagnosticoFormModel };
