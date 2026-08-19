-- Migración 0001 — Esquema base
-- Prueba diagnóstica de comprensión lectora inferencial
-- I.E. Macaján · Grado noveno

-- ===========================================================================
-- INSTRUMENTO
-- El contenido y la clave viven aquí, nunca en el bundle del cliente.
-- ===========================================================================

CREATE TABLE texts (
  id              INTEGER PRIMARY KEY,
  order_index     INTEGER NOT NULL UNIQUE,
  title           TEXT    NOT NULL,
  body            TEXT    NOT NULL,
  genre           TEXT    NOT NULL CHECK (genre IN ('narrativo', 'expositivo')),
  illustration_key TEXT   NOT NULL
);

CREATE TABLE questions (
  id             INTEGER PRIMARY KEY,
  text_id        INTEGER NOT NULL REFERENCES texts(id) ON DELETE CASCADE,
  -- Número del ítem en el instrumento impreso (1-16).
  -- 0 = ítem de calentamiento, no calificable.
  number         INTEGER NOT NULL UNIQUE,
  inference_type TEXT    NOT NULL CHECK (inference_type IN ('causal', 'predictiva')),
  stem           TEXT    NOT NULL,
  -- La clave. Solo el Worker la lee; jamás se serializa hacia el cliente.
  correct_option TEXT    NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  -- El ítem de calentamiento se muestra pero no suma al puntaje.
  is_scored      INTEGER NOT NULL DEFAULT 1 CHECK (is_scored IN (0, 1)),
  -- Justificación de la clave, para el informe de investigación.
  rationale      TEXT
);

CREATE INDEX idx_questions_text ON questions(text_id, number);

CREATE TABLE options (
  id          INTEGER PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  letter      TEXT    NOT NULL CHECK (letter IN ('A', 'B', 'C', 'D')),
  content     TEXT    NOT NULL,
  UNIQUE (question_id, letter)
);

CREATE INDEX idx_options_question ON options(question_id);

-- ===========================================================================
-- ACCESO
-- ===========================================================================

CREATE TABLE access_codes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Formato MAC-XXXX-XXXX, alfabeto sin caracteres ambiguos.
  code       TEXT    NOT NULL UNIQUE,
  -- Nombre del estudiante. Visible solo en el panel gestor:
  -- la aplicación es anónima desde la perspectiva del estudiante.
  label      TEXT,
  phase      TEXT    NOT NULL DEFAULT 'pretest' CHECK (phase IN ('pretest', 'postest')),
  status     TEXT    NOT NULL DEFAULT 'active'
             CHECK (status IN ('active', 'in_use', 'used', 'revoked')),
  -- Agrupa los códigos emitidos en una misma generación.
  batch_id   TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  notes      TEXT
);

CREATE INDEX idx_codes_status ON access_codes(status, phase);
CREATE INDEX idx_codes_batch  ON access_codes(batch_id);

-- ===========================================================================
-- APLICACIÓN
-- ===========================================================================

CREATE TABLE attempts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  access_code_id  INTEGER NOT NULL REFERENCES access_codes(id) ON DELETE CASCADE,
  status          TEXT    NOT NULL DEFAULT 'in_progress'
                  CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  -- Semilla del barajado determinista de opciones.
   -- Neutraliza pistas y sesgos de posición sin alterar el instrumento.
  option_seed     INTEGER NOT NULL,
  started_at      INTEGER NOT NULL,
  last_seen_at    INTEGER NOT NULL,
  completed_at    INTEGER,
  -- Tiempo efectivo acumulado, en milisegundos.
  elapsed_ms      INTEGER NOT NULL DEFAULT 0,
  score_total     INTEGER,
  score_causal    INTEGER,
  score_predictive INTEGER,
  -- Contexto técnico, útil para interpretar tiempos anómalos.
  user_agent      TEXT,
  -- Un código solo puede tener un intento activo o completado.
  UNIQUE (access_code_id)
);

CREATE INDEX idx_attempts_status ON attempts(status, last_seen_at);

CREATE TABLE answers (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  attempt_id        INTEGER NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id       INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  -- Letra CANÓNICA del instrumento, ya traducida desde el orden barajado.
  selected_option   TEXT    NOT NULL CHECK (selected_option IN ('A', 'B', 'C', 'D')),
  -- Posición en pantalla (0-3) en que se mostró la opción elegida.
  -- Permite analizar sesgo posicional en la investigación.
  displayed_position INTEGER NOT NULL,
  is_correct        INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
  answered_at       INTEGER NOT NULL,
  -- Tiempo dedicado al ítem. Detecta respuestas al azar.
  time_spent_ms     INTEGER NOT NULL DEFAULT 0,
  -- Cuántas veces cambió de opción antes de enviar.
  revision_count    INTEGER NOT NULL DEFAULT 0,
  UNIQUE (attempt_id, question_id)
);

CREATE INDEX idx_answers_attempt  ON answers(attempt_id);
CREATE INDEX idx_answers_question ON answers(question_id, is_correct);

-- ===========================================================================
-- GESTOR
-- ===========================================================================

CREATE TABLE admin_sessions (
  id           TEXT    PRIMARY KEY,
  -- Solo se guarda el hash del token; el valor plano vive en la cookie.
  token_hash   TEXT    NOT NULL UNIQUE,
  created_at   INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);

CREATE INDEX idx_admin_sessions_expiry ON admin_sessions(expires_at);

CREATE TABLE audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  actor      TEXT    NOT NULL,
  action     TEXT    NOT NULL,
  detail     TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- Control de intentos fallidos por clave/IP para canje y acceso del gestor.
CREATE TABLE redeem_attempts (
  ip           TEXT    PRIMARY KEY,
  count        INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL
);
