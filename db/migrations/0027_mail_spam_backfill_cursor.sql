-- CoopenPlaces · 0027 · cursor del backfill de spam de Correo (0026).
-- El backfill (re-revisar los hilos ya guardados contra Gmail) llama a la API de Gmail una
-- vez por hilo — con una cartera de decenas de hilos, hacerlo todo en el mismo tick del cron
-- puede pasarse del límite de subrequests por invocación de Cloudflare Workers. Este cursor
-- (último mail_threads.id ya revisado) permite partirlo en tandas chicas a lo largo de
-- varios ticks de 1 minuto en vez de todo de una vez.
ALTER TABLE mail_account ADD COLUMN spam_backfill_cursor INTEGER;
