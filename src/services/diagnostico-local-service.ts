export interface DiagnosticoFormModel {
  id?: string;
  promotoria_id: string;
  promotoria_nome?: string;
  codigo_ibge: string;
  municipio: string;
  comarca?: string;
  polo_regional?: string;
  atribuicao: string[];
  status: 'rascunho' | 'concluido' | 'validacao' | 'devolvido';
  data_criacao: string;
  data_atualizacao: string;
  respostas: Record<string, any>;
  gargalos: any[];
}

class DiagnosticoLocalService {
  private readonly STORAGE_KEY = 'brigid_diagnosticos';

  private getAll(): DiagnosticoFormModel[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load diagnosticos from local storage', e);
      return [];
    }
  }

  private saveAll(data: DiagnosticoFormModel[]) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save diagnosticos to local storage', e);
    }
  }

  async getById(id: string): Promise<DiagnosticoFormModel | null> {
    const all = this.getAll();
    return all.find(d => d.id === id) || null;
  }

  async getMyDiagnosticos(): Promise<DiagnosticoFormModel[]> {
    return this.getAll();
  }

  async save(diagnostico: DiagnosticoFormModel): Promise<DiagnosticoFormModel> {
    const all = this.getAll();
    const agora = new Date().toISOString();

    if (diagnostico.id) {
      const index = all.findIndex(d => d.id === diagnostico.id);
      if (index >= 0) {
        diagnostico.data_atualizacao = agora;
        all[index] = diagnostico;
      } else {
        all.push(diagnostico);
      }
    } else {
      diagnostico.id = 'DGN-' + Date.now();
      diagnostico.data_criacao = agora;
      diagnostico.data_atualizacao = agora;
      all.push(diagnostico);
    }

    this.saveAll(all);
    return diagnostico;
  }
}

export const diagnosticoLocalService = new DiagnosticoLocalService();
