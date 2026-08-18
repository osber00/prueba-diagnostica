-- Limpieza completa de datos de prueba en desarrollo local.
-- Borra códigos, intentos, respuestas, sesiones de gestor y el contador de
-- intentos de canje. NO toca el instrumento (textos/preguntas/opciones).
--
-- Uso:
--   npx wrangler d1 execute prueba-inferencial --local --file scripts/dev-reset-todo.sql
DELETE FROM answers;
DELETE FROM attempts;
DELETE FROM access_codes;
DELETE FROM admin_sessions;
DELETE FROM redeem_attempts;
DELETE FROM audit_log;
