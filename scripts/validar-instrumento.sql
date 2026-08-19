-- Control de integridad del instrumento.
-- Toda columna con prefijo "err_" debe ser 0.
-- D1 restringe el número de términos en un SELECT compuesto,
-- por eso se usan subconsultas escalares en lugar de UNION ALL.
SELECT
  (SELECT COUNT(*) FROM questions WHERE instrument_version = 2 AND is_scored = 1) AS items_calificables,
  (SELECT COUNT(*) FROM questions WHERE instrument_version = 2 AND is_scored = 1 AND inference_type = 'causal') AS causales,
  (SELECT COUNT(*) FROM questions WHERE instrument_version = 2 AND is_scored = 1 AND inference_type = 'predictiva') AS predictivas,
  (SELECT COUNT(*) FROM texts WHERE instrument_version = 2 AND display_order_index > 0) AS textos,
  (SELECT COUNT(*) FROM options WHERE question_id IN (SELECT id FROM questions WHERE instrument_version = 2)) AS opciones_totales,
  (SELECT COUNT(*) FROM (SELECT o.question_id FROM options o JOIN questions q ON q.id = o.question_id WHERE q.instrument_version = 2 GROUP BY o.question_id HAVING COUNT(*) <> 4)) AS err_sin_4_opciones,
  (SELECT COUNT(*) FROM questions q WHERE q.instrument_version = 2 AND NOT EXISTS (SELECT 1 FROM options o WHERE o.question_id = q.id AND o.letter = q.correct_option)) AS err_clave_inexistente,
  (SELECT COUNT(*) FROM (SELECT o.question_id, o.content FROM options o JOIN questions q ON q.id = o.question_id WHERE q.instrument_version = 2 GROUP BY o.question_id, o.content HAVING COUNT(*) > 1)) AS err_opciones_duplicadas,
  (SELECT COUNT(*) FROM questions q WHERE q.instrument_version = 2 AND NOT EXISTS (SELECT 1 FROM texts t WHERE t.id = q.text_id AND t.instrument_version = q.instrument_version)) AS err_items_huerfanos,
  (SELECT COUNT(*) FROM texts t WHERE t.instrument_version = 2 AND t.display_order_index > 0 AND (SELECT COUNT(*) FROM questions q WHERE q.text_id = t.id AND q.is_scored = 1) <> 4) AS err_texto_sin_4_items,
  (SELECT GROUP_CONCAT(correct_option, '') FROM (SELECT correct_option FROM questions WHERE instrument_version = 2 AND is_scored = 1 ORDER BY display_number)) AS clave;
