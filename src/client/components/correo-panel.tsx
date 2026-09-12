import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Mail, Paperclip, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from '../lib/toast';
import type { Branch, MailMessage, MailStatus, MailThread, Property } from '../lib/types';
import { shareBlocks } from '../lib/share-block';
import { DateRangePicker } from './properties-panel';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// Apartado "Correo": bandeja de equipo sobre elmuellepropiedades@gmail.com. Ver docs/ideas.md y
// src/worker/routes/correo.ts. Sin storage de mensajes: el detalle de cada hilo se
// pide a Gmail en vivo al abrirlo (GET /api/correo/threads/:id).

const ALL = '_all';
const NONE = '_none';
const STATUSES = ['nuevo', 'pendiente', 'respondido', 'archivado'] as const;
const STATUS_LABEL: Record<string, string> = { nuevo: 'Nuevo', pendiente: 'Pendiente', respondido: 'Respondido', archivado: 'Archivado' };
// nuevo=azul, pendiente=amarillo/naranja, respondido=verde, archivado=gris — mismos
// colores (bien saturados, ver .mail-status en styles.css) en el chip de la lista y en
// el puntito de los <Select>.
const STATUS_CHIP: Record<string, string> = { nuevo: 'mail-status st-nuevo', pendiente: 'mail-status st-pendiente', respondido: 'mail-status st-respondido', archivado: 'mail-status st-archivado' };
const STATUS_DOT: Record<string, string> = { nuevo: '#2563eb', pendiente: '#d97706', respondido: '#16a34a', archivado: '#57534e' };

/** Opción de <SelectItem> con un puntito del color del estado — así el Select de
 *  filtro/asignación queda coloreado igual que los chips de la lista. */
function StatusOption({ status }: { status: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 10, height: 10, borderRadius: 999, background: STATUS_DOT[status], flex: 'none' }} />
      {STATUS_LABEL[status]}
    </span>
  );
}

/** received_at/receivedAt vienen en UTC "YYYY-MM-DD HH:MM:SS" (mismo formato que el
 *  resto del panel, ver ConsultasPanel en agency-workspace.tsx). */
const fmt = (iso: string | null) => (iso ? new Date(`${iso.replace(' ', 'T')}Z`).toLocaleString('es-AR') : '');

export function CorreoPanel({ branches, myBranchId, onStartAttach, attachResult, onConsumeAttachResult }: {
  branches: Branch[]; myBranchId: number | null;
  /** "Adjuntar propiedades" (en el hilo abierto) salta al Inventario completo en vez de
   *  un picker aparte — ver PropertiesPanel `mailAttach`/`onSendToMail` en agency-workspace.tsx. */
  onStartAttach: () => void; attachResult: Property[] | null; onConsumeAttachResult: () => void;
}) {
  const [status, setStatus] = useState<MailStatus | null>(null);
  const [threads, setThreads] = useState<MailThread[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [fStatus, setFStatus] = useState(ALL);
  const [fBranch, setFBranch] = useState<'all' | 'mine'>('all');
  const [q, setQ] = useState('');
  const [syncing, setSyncing] = useState(false);
  const autoSynced = useRef(false);

  const loadStatus = () => api<MailStatus>('/api/correo/status').then(setStatus).catch(() => {});
  const loadThreads = () => {
    const params = new URLSearchParams();
    if (fStatus !== ALL) params.set('status', fStatus);
    if (fBranch === 'mine' && myBranchId != null) params.set('branch', String(myBranchId));
    return api<{ threads: MailThread[] }>(`/api/correo/threads?${params}`).then((r) => setThreads(r.threads)).catch(() => {});
  };
  // Trae lo nuevo de Gmail YA (no esperar al próximo tick del cron de 1 min) y recién
  // ahí recarga la lista. Es lo que dispara el botón "Actualizar"; también se corre
  // solo una vez si la casilla está conectada pero nunca sincronizó (recién conectada).
  async function syncNow() {
    setSyncing(true);
    try {
      await api('/api/correo/sync', { method: 'POST' });
    } catch (e) { toast(String((e as Error).message), 'err'); }
    finally {
      setSyncing(false);
      loadThreads(); loadStatus();
    }
  }
  useEffect(() => { loadStatus(); }, []);
  useEffect(() => { if (status?.connected) loadThreads(); }, [status?.connected, fStatus, fBranch]);
  useEffect(() => {
    if (status?.connected && !status.lastSyncAt && !autoSynced.current) { autoSynced.current = true; syncNow(); }
  }, [status?.connected, status?.lastSyncAt]);

  if (openId != null) {
    return (
      <ThreadDetail
        id={openId}
        branches={branches}
        onBack={() => { setOpenId(null); loadThreads(); loadStatus(); }}
        onStartAttach={onStartAttach}
        attachResult={attachResult}
        onConsumeAttachResult={onConsumeAttachResult}
      />
    );
  }

  if (!status) return <p className="muted">Cargando…</p>;

  if (!status.connected) {
    return (
      <div className="panel-lite">
        <h4>Conectar la casilla de Gmail</h4>
        <p className="muted small">
          El Correo del equipo funciona sobre <b>elmuellepropiedades@gmail.com</b>: se conecta una sola
          vez (con la cuenta de esa casilla) y después todo el equipo lee y responde desde acá.
        </p>
        <Button onClick={() => { window.location.href = '/api/correo/connect?return_to=/app'; }}>
          <Mail className="h-4 w-4" />Conectar casilla de Gmail
        </Button>
      </div>
    );
  }

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? threads.filter((t) => [t.subject, t.from_name, t.from_addr, t.snippet].filter(Boolean).some((s) => s!.toLowerCase().includes(needle)))
    : threads;

  return (
    <div>
      {(status.needsReconnect || status.lastError) && (
        <div className="pnotice">
          La conexión con Gmail necesita renovarse{status.lastError ? ` (${status.lastError})` : ''}.{' '}
          <a href="/api/correo/connect?return_to=/app" style={{ fontWeight: 600 }}>Reconectar casilla</a>
        </div>
      )}
      <div className="panel-head">
        <h3>Correo · {filtered.length}</h3>
        <span className="muted small">{status.email} · sync {syncing ? 'corriendo…' : status.lastSyncAt ? fmt(status.lastSyncAt) : 'todavía no corrió'}</span>
      </div>
      <div className="row" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <Select value={fStatus} onValueChange={setFStatus}>
          <SelectTrigger className="h-9 w-auto min-w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los estados</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}><StatusOption status={s} /></SelectItem>)}
          </SelectContent>
        </Select>
        {myBranchId != null && (
          <Select value={fBranch} onValueChange={(v) => setFBranch(v as 'all' | 'mine')}>
            <SelectTrigger className="h-9 w-auto min-w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las sucursales</SelectItem>
              <SelectItem value="mine">Solo mi sucursal</SelectItem>
            </SelectContent>
          </Select>
        )}
        <input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: '1 1 200px' }} />
        <Button variant="ghost" size="icon" title="Buscar mensajes nuevos en Gmail" onClick={syncNow} disabled={syncing}>
          <RefreshCw className={syncing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
        </Button>
      </div>
      {filtered.length === 0 ? (
        <p className="muted">
          {status.lastSyncAt ? 'No hay consultas para este filtro.' : 'Todavía no se sincronizó con Gmail — '}
          {!status.lastSyncAt && (
            <button className="link-btn" onClick={syncNow} disabled={syncing}>{syncing ? 'sincronizando…' : 'sincronizar ahora'}</button>
          )}
        </p>
      ) : (
        <div className="client-list">
          {filtered.map((t) => (
            <div
              className="client-card" key={t.id} role="button" tabIndex={0} style={{ cursor: 'pointer' }}
              onClick={() => setOpenId(t.id)}
              onKeyDown={(e) => { if (e.key === 'Enter') setOpenId(t.id); }}
            >
              <div className="client-main">
                <div className="client-name">
                  {t.from_name || t.from_addr || '(sin remitente)'}{' '}
                  <span className={STATUS_CHIP[t.status]}>{STATUS_LABEL[t.status]}</span>
                  {t.branch_name && <span className="chip">🏢 {t.branch_name}</span>}
                </div>
                <div className="small">{t.subject || '(sin asunto)'}</div>
                <div className="muted small">{t.snippet}{t.received_at ? ` · ${fmt(t.received_at)}` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BackBtn({ onBack }: { onBack: () => void }) {
  return <button className="btn ghost sm" onClick={onBack} style={{ marginBottom: 12 }}><ArrowLeft className="h-4 w-4" /> Volver</button>;
}

function ThreadDetail({ id, branches, onBack, onStartAttach, attachResult, onConsumeAttachResult }: {
  id: number; branches: Branch[]; onBack: () => void;
  onStartAttach: () => void; attachResult: Property[] | null; onConsumeAttachResult: () => void;
}) {
  const [thread, setThread] = useState<MailThread | null>(null);
  const [messages, setMessages] = useState<MailMessage[] | null>(null);
  const [err, setErr] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [attached, setAttached] = useState<Property[]>([]);
  const [dFrom, setDFrom] = useState('');
  const [dTo, setDTo] = useState('');

  const load = () => {
    setErr('');
    api<{ thread: MailThread; messages: MailMessage[] }>(`/api/correo/threads/${id}`)
      .then((r) => { setThread(r.thread); setMessages(r.messages); })
      .catch((e) => setErr(String((e as Error).message)));
  };
  useEffect(() => { load(); }, [id]);

  // Vuelta del Inventario con propiedades elegidas (ver "Adjuntar propiedades" abajo):
  // se suman a lo que ya estaba adjunto (no lo reemplaza — así se puede ir a buscar más
  // sin perder lo elegido antes) y se consume para no volver a aplicarlo en cada render.
  useEffect(() => {
    if (!attachResult) return;
    setAttached((prev) => {
      const have = new Set(prev.map((p) => p.id));
      return [...prev, ...attachResult.filter((p) => !have.has(p.id))];
    });
    onConsumeAttachResult();
  }, [attachResult]);

  async function patch(body: Record<string, unknown>) {
    try {
      const r = await api<{ thread: MailThread }>(`/api/correo/threads/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
      setThread(r.thread);
    } catch (e) { toast(String((e as Error).message), 'err'); }
  }

  const attachedBlock = attached.length ? shareBlocks(attached, dFrom, dTo) : '';
  const fullBody = [replyText.trim(), attachedBlock].filter(Boolean).join('\n\n');

  async function send() {
    if (!fullBody.trim()) return toast('Escribí una respuesta o adjuntá una propiedad', 'err');
    setSending(true);
    try {
      const r = await api<{ thread: MailThread }>(`/api/correo/threads/${id}/reply`, { method: 'POST', body: JSON.stringify({ body: fullBody }) });
      setThread(r.thread);
      setReplyText(''); setAttached([]); setDFrom(''); setDTo('');
      toast('Respuesta enviada', 'ok');
    } catch (e) { toast(String((e as Error).message), 'err'); }
    finally { setSending(false); }
  }

  if (err) return <div><BackBtn onBack={onBack} /><p className="err">{err}</p></div>;
  if (!thread || !messages) return <div><BackBtn onBack={onBack} /><p className="muted">Cargando hilo…</p></div>;

  return (
    <div>
      <BackBtn onBack={onBack} />
      <div className="cd-head">
        <div>
          <h3 className="cd-title">{thread.subject || '(sin asunto)'}</h3>
          <div className="muted small">{thread.from_name ? `${thread.from_name} · ` : ''}{thread.from_addr}</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Select value={thread.branch_id != null ? String(thread.branch_id) : NONE} onValueChange={(v) => patch({ branch_id: v === NONE ? null : Number(v) })}>
            <SelectTrigger className="h-9 w-auto min-w-[140px]"><SelectValue placeholder="Sucursal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Sin sucursal</SelectItem>
              {branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={thread.status} onValueChange={(v) => patch({ status: v })}>
            <SelectTrigger className="h-9 w-auto min-w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => <SelectItem key={s} value={s}><StatusOption status={s} /></SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mail-thread">
        {messages.map((m) => (
          <div className="mail-msg" key={m.id}>
            <div className="muted small mail-msg-head"><b>{m.fromName || m.fromAddr}</b> · {fmt(m.receivedAt)}</div>
            <div className="mail-msg-body">{m.bodyText}</div>
            {m.attachments.length > 0 && (
              <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {m.attachments.map((a) => (
                  <a key={a.id} className="chip-btn" href={`/api/correo/threads/${id}/attachments/${m.id}/${a.id}`} target="_blank" rel="noopener noreferrer">
                    📎 {a.filename}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="panel-lite" style={{ marginTop: 16 }}>
        <h4>Responder</h4>
        <textarea rows={4} placeholder="Escribí la respuesta…" value={replyText} onChange={(e) => setReplyText(e.target.value)} />
        <div className="row" style={{ gap: 10, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="outline" size="sm" onClick={onStartAttach} title="Te lleva al Inventario para elegir">
            <Paperclip className="h-4 w-4" />Adjuntar propiedades{attached.length ? ` (${attached.length})` : ''}
          </Button>
          {attached.length > 0 && <DateRangePicker from={dFrom} to={dTo} onChange={(f, t) => { setDFrom(f); setDTo(t); }} />}
          {attached.length > 0 && (
            <button type="button" className="link-btn" onClick={() => { setAttached([]); setDFrom(''); setDTo(''); }}>Quitar todas</button>
          )}
        </div>
        {attachedBlock && (
          <div className="mail-preview">
            <div className="muted small">Así se ve lo adjuntado:</div>
            <pre>{attachedBlock}</pre>
          </div>
        )}
        <Button style={{ marginTop: 12 }} onClick={send} disabled={sending}>{sending ? 'Enviando…' : 'Enviar respuesta'}</Button>
      </div>
    </div>
  );
}
