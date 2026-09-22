-- CoopenPlaces · 0026 · marca de "ya se hizo el backfill de spam" en Correo.
-- El fix de 2026-09-22 (ver gmail.ts, syncOneThread) hace que el sync incremental deje de
-- traer mensajes en Spam/Papelera, pero no toca los hilos que ya habían quedado mal
-- sincronizados de antes (listHistory no los vuelve a tocar si no tienen actividad nueva).
-- Esta columna es la marca de "ya se re-revisaron los hilos existentes contra Gmail y se
-- borraron los que resultaron spam/papelera" — corre UNA sola vez, disparada por syncGmail()
-- en el primer tick del cron después de deployar. Re-poner en NULL fuerza que corra de nuevo.
ALTER TABLE mail_account ADD COLUMN spam_backfilled_at TEXT;
