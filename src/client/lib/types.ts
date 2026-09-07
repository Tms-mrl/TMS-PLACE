export type Agency = { id: number; name: string; role: string; whatsapp?: string | null };

export type Inquiry = {
  id: number; property_id: number; property_title: string;
  name: string | null; phone: string | null; message: string | null;
  source: string | null; status: string; created_at: string;
};

export type Me = {
  authed: boolean;
  user?: {
    email: string;
    name: string | null;
    isSuperAdmin: boolean;
    roles: { owner: boolean; tenant: boolean; agency: Agency | null };
    onboarded: boolean;
  };
};

export type Sub = {
  status: string;
  blocked: number;
  days_left: number | null;
  trial_ends_at: string | null;
  active_until: string | null;
} | null;

export type Branch = { id: number; name: string; address: string | null; phone: string | null };

export type Property = {
  id: number;
  operation: string;
  kind: string | null;
  title: string;
  /** Contacto del CRM que la dejó en consignación (vía `mandates`). Lo trae /mine. */
  owner_client_id?: number | null;
  owner_client_name?: string | null;
  price: number | null;
  currency: string;
  price_period: string | null;
  city: string | null;
  province: string | null;
  address: string | null;
  /** URL del aviso en el sitio propio del cliente. Es lo que se comparte por WhatsApp. */
  external_url: string | null;
  description: string | null;
  lat: number | null;
  lng: number | null;
  rooms: number | null;
  area_m2: number | null;
  bathrooms: number | null;
  amenities: string | null;
  capacity: number | null;
  available_from: string | null;
  available_until: string | null;
  status: string;
  published: number;
  archived_at: string | null;
  cover_key: string | null;
  photos?: number;
  views?: number;
  branch_id: number | null;
  branch_name: string | null;
  bookings: string | null;
  created_at?: string | null;
  /** Lo trae /mine — es el "Últ. modificación" de la fila del Inventario. */
  updated_at?: string | null;
};

export type PropertyStats = {
  total: number; last7: number; last30: number;
  series: { day: string; count: number }[];
};

export const BOOKING_KINDS = ['reserva', 'alquiler'] as const;

export type Booking = {
  id: number; from_date: string; to_date: string; kind: string;
  /** Contacto del CRM que reserva/alquila. `guest_name` es el texto libre viejo (fallback). */
  client_id: number | null; client_name: string | null; client_phone: string | null;
  guest_name: string | null; notes: string | null;
};

/** Tarifa por temporada de una propiedad — una por mes. `price_month` vale para todo el
 *  mes; día/semana cambian por quincena (1ª = 1-15, 2ª = 16-fin). Todo ARS, todo opcional.
 *  Planilla interna para cotizar; no afecta la ficha pública. */
export type SeasonPrice = {
  month: number;
  price_month: number | null;
  price_day_q1: number | null; price_week_q1: number | null;
  price_day_q2: number | null; price_week_q2: number | null;
};

export type Member = {
  member_id: number; role: string; branch_id: number | null; branch_name: string | null;
  user_id: number; name: string | null; email: string; access_token: string | null;
};

export type Deal = {
  id: number; property_id: number | null; client_id: number | null; stage: string; notes: string | null;
  created_at: string; updated_at: string;
  property_title: string | null; property_price: number | null; property_currency: string | null;
  client_name: string | null; client_phone: string | null;
};

export type Contract = {
  id: number; owner_kind: string; property_id: number | null; client_id: number | null;
  tenant_name: string | null; tenant_phone: string | null;
  operation: string; amount: number | null; currency: string; deposit: number | null;
  start_date: string | null; end_date: string | null; adjust_months: number | null; adjust_index: string | null;
  status: string; notes: string | null; created_at: string; updated_at: string;
  property_title: string | null; client_name: string | null; client_phone: string | null;
  paid_total: number; receipts_count: number;
};

export type Receipt = {
  id: number; contract_id: number; period: string | null; amount: number; currency: string;
  paid_at: string | null; method: string | null; notes: string | null; created_at: string;
};

export type Expense = {
  id: number; owner_kind: string; property_id: number | null; property_title: string | null;
  category: string; description: string | null; amount: number; currency: string;
  incurred_on: string | null; paid: number; vendor: string | null; notes: string | null; created_at: string;
  method: string | null;
};

export type FinanceRow = { property_id: number | null; title: string | null; currency: string; income: number; expense: number };
export type FinanceTotal = { currency: string; income: number; expense: number };
export type FinanceSummary = { rows: FinanceRow[]; totals: FinanceTotal[] };

// Desglose de Finanzas por período (mes 'YYYY-MM' o día 'YYYY-MM-DD'), separado por moneda.
export type PeriodRow = { period: string; currency: string; income: number; expense: number };
export type PeriodSummary = { periods: PeriodRow[]; totals: FinanceTotal[] };

// Movimiento individual (ingreso o gasto) del libro diario de un día puntual.
export type Transaction = {
  id: number; source: 'receipt' | 'expense'; date: string | null; type: 'income' | 'expense';
  category: string | null; description: string | null; method: string | null;
  amount: number; currency: string; property_title: string | null;
};

export type Favorite = {
  id: number; title: string; operation: string; price: number | null; currency: string;
  city: string | null; price_period: string | null; cover_key: string | null; saved_at: string;
};

export type SavedSearch = { id: number; query_json: string; notify: number; last_notified_at: string | null; created_at: string };

export type Media = { id: number; r2_key: string; sort: number };

export type Client = {
  id: number;
  kind: 'interesado' | 'propietario';
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  prefs: string | null;
  created_at: string;
};

/** Ficha completa de un contacto (GET /api/clients/:id). Los totales van POR MONEDA:
 *  ARS y USD nunca se suman entre sí, igual criterio que el P&L de Finanzas. */
export type ClientDetail = {
  client: Client;
  properties: {
    id: number; title: string; operation: string; status: string;
    price: number | null; currency: string; price_period: string | null;
    city: string | null; published: number; archived_at: string | null;
    commission_pct: number | null; exclusive: number; ends_at: string | null;
    cover_key: string | null;
  }[];
  deals: { id: number; stage: string; notes: string | null; created_at: string; property_title: string | null }[];
  contracts: {
    id: number; operation: string; amount: number | null; currency: string; status: string;
    start_date: string | null; end_date: string | null; property_title: string | null; collected: number;
    /** 'parte' = él firma (inquilino/comprador) · 'propietario' = es sobre una propiedad suya. */
    role: 'parte' | 'propietario';
  }[];
  income: { currency: string; total: number }[];
  expenses: { currency: string; paid: number; pending: number }[];
};

export type Summary = {
  agency: Agency | null;
  role?: string;
  totals?: { total: number; publicadas: number };
  byStatus?: { status: string; n: number }[];
  byOperation?: { operation: string; n: number }[];
  byBranch?: { id: number; name: string; n: number; disponibles: number }[];
  clientsByKind?: { kind: string; n: number }[];
};

export type Match = {
  id: number; title: string; operation: string; price: number | null; currency: string;
  city: string | null; rooms: number | null; capacity: number | null; area_m2: number | null;
  status: string; cover_key: string | null;
  // Próxima ocupación (reserva/alquiler vigente o futuro): una casa "reservada" puede
  // estar libre justo en las fechas que el interesado busca.
  busy_from: string | null; busy_to: string | null;
};

export const STATUSES = ['disponible', 'reservada', 'alquilada', 'vendida'] as const;

// Tipos de propiedad predefinidos (dropdown del alta/edición). `kind` en la base sigue
// siendo texto libre (sin CHECK ni enum) — así una propiedad importada de Argenprop o
// cargada antes de este dropdown, con un valor que no está en esta lista, se sigue
// mostrando bien (ver el fallback en property-form.tsx) en vez de perderse.
export const PROPERTY_KINDS: { v: string; label: string }[] = [
  { v: 'casa', label: 'Casas/Chalet' },
  { v: 'duplex', label: 'Duplex/Triplex' },
  { v: 'departamento', label: 'Departamento' },
  { v: 'ph', label: 'PH' },
  { v: 'lote', label: 'Lotes' },
  { v: 'local', label: 'Locales' },
  { v: 'cabana', label: 'Cabañas' },
  { v: 'apart', label: 'Apart' },
];

export const PRICE_PERIODS: { v: string; label: string; suffix: string }[] = [
  { v: '', label: 'Sin especificar', suffix: '' },
  { v: 'mes', label: 'Por mes', suffix: '/mes' },
  { v: 'noche', label: 'Por noche', suffix: '/noche' },
  { v: 'dia', label: 'Por día', suffix: '/día' },
  { v: 'semana', label: 'Por semana', suffix: '/semana' },
  { v: 'total', label: 'Precio total', suffix: '' },
];
export const PERIOD_SUFFIX: Record<string, string> = Object.fromEntries(PRICE_PERIODS.map((p) => [p.v, p.suffix]));

export const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'] as const;
/** Orden del selector de "Precios por temporada": verano (dic-mar) primero. */
export const SEASON_MONTH_ORDER = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

export function money(price: number | null, currency = 'USD', period?: string | null): string {
  if (price == null) return 'Consultar';
  const suf = period ? PERIOD_SUFFIX[period] ?? '' : '';
  return `${currency} ${price.toLocaleString('es-AR')}${suf ? ' ' + suf : ''}`;
}

export type User = NonNullable<Me['user']>;

/** URL pública de una foto en R2. */
export const mediaUrl = (key: string) => `/media/${key.split('/').map(encodeURIComponent).join('/')}`;
