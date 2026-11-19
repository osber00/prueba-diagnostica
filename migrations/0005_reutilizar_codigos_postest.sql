-- Relaciona el código original con un acceso independiente de postest.
-- No modifica ni elimina códigos, intentos o respuestas anteriores.
-- El vínculo se crea al canjear el código original, no durante la migración.
CREATE TABLE postest_code_links (
  pretest_access_code_id INTEGER PRIMARY KEY
    REFERENCES access_codes(id) ON DELETE RESTRICT,
  postest_access_code_id INTEGER NOT NULL UNIQUE
    REFERENCES access_codes(id) ON DELETE RESTRICT,
  created_at INTEGER NOT NULL,
  CHECK (pretest_access_code_id <> postest_access_code_id)
);
