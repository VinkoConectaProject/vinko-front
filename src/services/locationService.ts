interface State {
  id: number;
  sigla: string;
  nome: string;
}

interface City {
  id: number;
  nome: string;
}

export class LocationService {
  private static readonly IBGE_STATES_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';
  private static readonly IBGE_CITIES_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';
  
  // Cache para evitar múltiplas requisições
  private static statesCache: State[] | null = null;
  private static citiesCache: { [stateCode: string]: City[] } = {};

  // Buscar todos os estados
  static async getStates(): Promise<State[]> {
    if (this.statesCache) {
      return this.statesCache;
    }

    try {
      const response = await fetch(this.IBGE_STATES_URL);
      const states: State[] = await response.json();
      
      // Ordenar por sigla
      this.statesCache = states.sort((a, b) => a.sigla.localeCompare(b.sigla));
      return this.statesCache;
    } catch (error) {
      return [];
    }
  }

  // Buscar cidades de um estado específico
  static async getCitiesByState(stateCode: string): Promise<City[]> {
    // Verificar cache primeiro
    if (this.citiesCache[stateCode]) {
      return this.citiesCache[stateCode];
    }

    try {
      // Primeiro, precisamos encontrar o ID do estado pela sigla
      const states = await this.getStates();
      const state = states.find(s => s.sigla === stateCode);
      
      if (!state) {
        return [];
      }

      const response = await fetch(`${this.IBGE_CITIES_URL}/${state.id}/municipios`);
      const cities: City[] = await response.json();
      
      // Ordenar por nome e cachear
      const sortedCities = cities.sort((a, b) => a.nome.localeCompare(b.nome));
      this.citiesCache[stateCode] = sortedCities;
      
      return sortedCities;
    } catch (error) {
      return [];
    }
  }

  // Limpar cache (útil para testes ou atualizações)
  static clearCache(): void {
    this.statesCache = null;
    this.citiesCache = {};
  }
}
