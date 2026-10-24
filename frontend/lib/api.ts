const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface RecebivelItem {
  id: number;
  linha: number;
  nome_fundo: string;
  doc_fundo: string;
  nome_cedente: string;
  doc_cedente: string;
  nome_sacado: string;
  doc_sacado: string;
  nu_documento: string;
  tipo_recebivel: string;
  valor_nominal: string;
  data_vencimento_original: string;
  data_aquisicao: string;
  raiz_cnpj_sacado: string;
  hash_id: string;
  status: 'APROVADO' | 'BARRADO' | 'PENDENTE';
  barrado_por: string[];
  motivo_recusa: string;
  prazo_dias: number | null;
  desconto: string | null;
  valor_liquido: string | null;
  criado_em: string;
}

export interface RecebivelResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RecebivelItem[];
}

export interface ValidadorConfig {
  codigo: string;
  ativo: boolean;
  parametros: Record<string, any>;
}

export interface FundoConfig {
  fundo: {
    nome: string;
    cnpj: string;
  };
  validadores: ValidadorConfig[];
  precificacao: {
    metodo?: string;
    taxa_mensal_percentual: number;
    base_dias: number;
  };
}

export async function fetchRecebiveis(params: {
  page?: number;
  status?: string;
  nu_documento?: string;
  doc_fundo?: string;
  tipo_recebivel?: string;
}): Promise<RecebivelResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.status && params.status !== 'TODOS') query.set('status', params.status);
  if (params.nu_documento) query.set('nu_documento', params.nu_documento);

  const res = await fetch(`${API_BASE}/recebiveis/?${query.toString()}`);
  if (!res.ok) throw new Error('Falha ao carregar recebíveis');
  return res.json();
}

export async function fetchRegras(): Promise<FundoConfig> {
  const res = await fetch(`${API_BASE}/regras/`);
  if (!res.ok) throw new Error('Falha ao obter regras do fundo');
  return res.json();
}

export async function updateRegras(config: FundoConfig): Promise<any> {
  const res = await fetch(`${API_BASE}/regras/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.erro || 'Falha ao atualizar regras');
  }
  return res.json();
}

export async function uploadCSV(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/upload-csv/`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.erro || 'Erro ao enviar CSV');
  }
  return res.json();
}
