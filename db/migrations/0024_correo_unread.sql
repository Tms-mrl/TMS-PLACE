-- CoopenPlaces · 0024 · "Correo": leído/no-leído (independiente de `status`), como en
-- Gmail — abrir un hilo lo marca leído; un entrante nuevo lo vuelve a marcar no-leído.
-- Aditivo/idempotente: el runner (scripts/migrate-d1.mjs) re-ejecuta todo.

ALTER TABLE mail_threads ADD COLUMN unread INTEGER NOT NULL DEFAULT 1;

-- Backfill: los hilos que ya tienen nuestra última respuesta no deberían arrancar en
-- negrita (ya los "leyó" alguien para poder responder).
UPDATE mail_threads SET unread = 0 WHERE last_from_me = 1;
