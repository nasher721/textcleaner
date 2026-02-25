CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  source TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  meta_json TEXT
);

CREATE TABLE IF NOT EXISTS sentences (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL,
  idx INTEGER NOT NULL,
  text TEXT NOT NULL,
  start_char INTEGER NOT NULL,
  end_char INTEGER NOT NULL,
  FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sentence_labels (
  id TEXT PRIMARY KEY,
  sentence_id TEXT NOT NULL,
  label TEXT NOT NULL CHECK(label IN ('KEEP','REMOVE')),
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL DEFAULT 'user',
  FOREIGN KEY(sentence_id) REFERENCES sentences(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS span_annotations (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL,
  label TEXT NOT NULL CHECK(label IN ('NEURO_EXAM','IMAGING','VENT','HEMODYNAMICS','LAB','MEDICATION','PROCEDURE','ASSESSMENT','OTHER')),
  start_char INTEGER NOT NULL,
  end_char INTEGER NOT NULL,
  text TEXT NOT NULL,
  negated INTEGER,
  temporal TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS model_versions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  spacy_model_path TEXT NOT NULL,
  sentence_model_path TEXT NOT NULL,
  metrics_json TEXT NOT NULL,
  training_config_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inference_runs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  model_version_id TEXT,
  input_text TEXT NOT NULL,
  cleaned_text TEXT NOT NULL,
  output_json TEXT NOT NULL,
  confidence_json TEXT NOT NULL,
  FOREIGN KEY(model_version_id) REFERENCES model_versions(id)
);
