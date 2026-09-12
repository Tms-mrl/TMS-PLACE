// Guards de pertenencia para FKs que llegan del body (property_id, client_id).
// Regla multi-tenant: nunca persistir un id de otra tabla sin validar que pertenece
// al scope del user; si no, un id crafteado se puede leer después vía un JOIN de display
// (fuga cross-tenant). Ver memoria places-foreign-id-scope-leak.

/** Scope de escritura: agencia (agencyId) o propietario particular (userId). */
export type OwnerScope = { agencyId: number | null; userId: number };

/** ¿La propiedad pertenece al scope? null = FK opcional (permitido). */
export async function propertyInScope(db: D1Database, s: OwnerScope, propertyId: number | null): Promise<boolean> {
  if (propertyId == null) return true;
  const where = s.agencyId != null ? 'agency_id = ?' : "owner_kind = 'particular' AND owner_user_id = ?";
  const binds = s.agencyId != null ? [s.agencyId] : [s.userId];
  const row = await db.prepare(`SELECT id FROM properties WHERE id = ? AND ${where}`).bind(propertyId, ...binds).first();
  return !!row;
}

/** ¿El contacto (CRM) pertenece a la agencia? null = permitido. Un particular (agencyId null)
 *  no tiene CRM: un client_id no-null es inválido. */
export async function clientInAgency(db: D1Database, agencyId: number | null, clientId: number | null): Promise<boolean> {
  if (clientId == null) return true;
  if (agencyId == null) return false;
  const row = await db.prepare('SELECT id FROM clients WHERE id = ? AND agency_id = ?').bind(clientId, agencyId).first();
  return !!row;
}

/** ¿La sucursal pertenece a la agencia? null = permitido (desasignar). */
export async function branchInAgency(db: D1Database, agencyId: number | null, branchId: number | null): Promise<boolean> {
  if (branchId == null) return true;
  if (agencyId == null) return false;
  const row = await db.prepare('SELECT id FROM branches WHERE id = ? AND agency_id = ?').bind(branchId, agencyId).first();
  return !!row;
}
