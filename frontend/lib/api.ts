// Normaliza a URL base da API garantindo que o prefixo '/api' esteja sempre presente
// independentemente de como a variável NEXT_PUBLIC_API_URL for configurada no Vercel.
function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const rawUrl = (envUrl && envUrl.trim().length > 0)
    ? envUrl.trim()
    : 'http://localhost:8000/api';

  const cleanUrl = rawUrl.replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
}

const API_BASE = getApiBaseUrl();

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

export interface AuthResponse {
  token: string;
  refresh: string;
  username: string;
  role: 'GESTOR' | 'EMPRESA';
  nome?: string;
  cnpj?: string;
  mensagem?: string;
}

function getAuthHeader(): Record<string, string> {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('antecipe_auth_token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
}

export async function loginApi(username: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.erro || 'Falha ao realizar login');
  }
  return res.json();
}

export async function registerApi(data: {
  username: string;
  password: string;
  role: 'GESTOR' | 'EMPRESA';
  nome: string;
  cnpj: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.erro || 'Falha ao criar conta');
  }
  return res.json();
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

  const res = await fetch(`${API_BASE}/recebiveis/?${query.toString()}`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error('Falha ao carregar recebíveis');
  return res.json();
}

export async function fetchRegras(): Promise<FundoConfig> {
  const res = await fetch(`${API_BASE}/regras/`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('Acesso restrito a Gestores do Fundo');
    }
    throw new Error('Falha ao obter regras do fundo');
  }
  return res.json();
}

export async function updateRegras(config: FundoConfig): Promise<any> {
  const res = await fetch(`${API_BASE}/regras/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
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
    headers: getAuthHeader(),
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.erro || 'Erro ao enviar CSV');
  }
  return res.json();
}

export interface AnalyticsData {
  kpis: {
    volume_total_aprovado: number;
    volume_total_recusado: number;
    quantidade_total_processada: number;
    quantidade_aprovadas: number;
    quantidade_recusadas: number;
  };
  taxa_rejeicao: {
    percentual_rejeicao: number;
    percentual_aprovacao: number;
  };
  motivos_recusa: Array<{ motivo: string; total: number }>;
  risco_concentracao: Array<{
    doc_sacado: string;
    nome_sacado: string;
    volume: number;
    quantidade: number;
    percentual_exposicao: number;
  }>;
}

export async function fetchAnalyticsDashboard(): Promise<AnalyticsData> {
  const res = await fetch(`${API_BASE}/analytics/dashboard/`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('Acesso restrito a Gestores do Fundo');
    }
    throw new Error('Falha ao carregar dashboard de analytics');
  }
  return res.json();
}

