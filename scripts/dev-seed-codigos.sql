-- Códigos de prueba para desarrollo local. NO se aplica en producción:
-- en producción los códigos se generan desde el panel gestor.
--
-- Uso:
--   npx wrangler d1 execute prueba-inferencial --local --file scripts/dev-seed-codigos.sql

DELETE FROM answers;
DELETE FROM attempts;
DELETE FROM access_codes WHERE batch_id = 'lote_desarrollo';
-- El contador de canjes fallidos persiste entre ejecuciones y acabaría
-- bloqueando las pruebas automatizadas, que repiten canjes desde la misma IP.
DELETE FROM redeem_attempts;

-- Los caracteres O, 0, I, 1 y L no existen en el alfabeto de códigos,
-- por eso los códigos de prueba usan solo símbolos válidos.
INSERT INTO access_codes (code, label, phase, status, batch_id, created_at) VALUES
('MAC-TEST-AAAA', 'Estudiante de prueba 1', 'pretest', 'active', 'lote_desarrollo', unixepoch() * 1000),
('MAC-TEST-BBBB', 'Estudiante de prueba 2', 'pretest', 'active', 'lote_desarrollo', unixepoch() * 1000),
('MAC-TEST-CCCC', 'Estudiante de prueba 3', 'postest', 'active', 'lote_desarrollo', unixepoch() * 1000);
