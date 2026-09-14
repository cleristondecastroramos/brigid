import { promotorias, promotoriaMunicipios, Promotoria, PromotoriaMunicipio } from "@/data/promotorias-seed";

class PromotoriasService {
  private readonly OVERRIDES_KEY = "brigid_promotorias_overrides";

  private getOverrides(): Record<string, Partial<Promotoria>> {
    try {
      const data = localStorage.getItem(this.OVERRIDES_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private saveOverrides(overrides: Record<string, Partial<Promotoria>>) {
    localStorage.setItem(this.OVERRIDES_KEY, JSON.stringify(overrides));
  }

  // Retorna a lista mesclada (Seed + LocalStorage)
  private getPromotoriasList(): Promotoria[] {
    const overrides = this.getOverrides();
    return promotorias.map(p => ({
      ...p,
      ...overrides[p.id]
    }));
  }

  async listarPromotorias(): Promise<Promotoria[]> {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulando delay
    return this.getPromotoriasList().sort((a, b) => a.nome.localeCompare(b.nome));
  }

  async buscarPromotoriaPorId(id: string): Promise<Promotoria | undefined> {
    const list = this.getPromotoriasList();
    return list.find(p => p.id === id);
  }

  async listarMunicipiosDaPromotoria(promotoriaId: string): Promise<PromotoriaMunicipio[]> {
    return promotoriaMunicipios
      .filter(pm => pm.promotoria_id === promotoriaId)
      .sort((a, b) => a.municipio.localeCompare(b.municipio));
  }

  async buscarDadosTerritoriais(codigoIbge: string): Promise<PromotoriaMunicipio | undefined> {
    return promotoriaMunicipios.find(pm => pm.codigo_ibge === codigoIbge);
  }

  // --- Funções de Administração --- //

  async atualizarAtribuicao(id: string, tipo_atribuicao: string): Promise<void> {
    const overrides = this.getOverrides();
    overrides[id] = { ...overrides[id], tipo_atribuicao };
    this.saveOverrides(overrides);
  }

  // Retorna todos os dados para backup JSON
  async exportarBackupJson(): Promise<string> {
    const list = this.getPromotoriasList();
    return JSON.stringify(list, null, 2);
  }

  // Retorna os UPDATEs SQL
  async exportarScriptSql(): Promise<string> {
    const list = this.getPromotoriasList();
    let sql = "-- Script gerado para atualização de atribuições das Promotorias\n";
    sql += "-- Executar no banco de dados para consolidar as escolhas feitas no painel\n\n";

    list.forEach(p => {
      sql += `UPDATE public.promotorias_justica SET tipo_atribuicao = '${p.tipo_atribuicao}', updated_at = NOW() WHERE id = '${p.id}';\n`;
    });

    return sql;
  }
}

export const promotoriasService = new PromotoriasService();
