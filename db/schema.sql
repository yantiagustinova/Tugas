-- Envilog Task Tracker — skema database (PostgreSQL)
-- Dijalankan lewat: npm run db:setup

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        TEXT        NOT NULL UNIQUE,
  phone       TEXT        NOT NULL DEFAULT '',
  pin_hash    TEXT        NOT NULL,
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  target      TEXT        NOT NULL DEFAULT '',
  due_date    DATE        NOT NULL,
  progress    INTEGER     NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  status      TEXT        NOT NULL DEFAULT 'Proses'
                          CHECK (status IN ('Proses', 'Terkendala', 'Selesai')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tasks_user_id_idx  ON tasks (user_id);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks (due_date);

-- Riwayat perubahan (Fase 2). Satu baris per penyimpanan yang benar-benar
-- mengubah progress, status, atau due date. Kolom *_from NULL berarti field
-- itu tidak ikut berubah pada perubahan tersebut.
CREATE TABLE IF NOT EXISTS task_history (
  id             SERIAL PRIMARY KEY,
  task_id        INTEGER     NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id        INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind           TEXT        NOT NULL CHECK (kind IN ('dibuat', 'update')),
  progress_from  INTEGER,
  progress_to    INTEGER,
  status_from    TEXT,
  status_to      TEXT,
  due_date_from  DATE,
  due_date_to    DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS task_history_task_idx
  ON task_history (task_id, created_at DESC, id DESC);

-- Jejak pengiriman WA supaya satu tugas hanya diingatkan sekali per hari,
-- walaupun cron dipanggil ulang / di-retry.
CREATE TABLE IF NOT EXISTS reminder_log (
  id        SERIAL PRIMARY KEY,
  kind      TEXT        NOT NULL CHECK (kind IN ('personal', 'recap')),
  task_id   INTEGER     REFERENCES tasks(id) ON DELETE CASCADE,
  user_id   INTEGER     REFERENCES users(id) ON DELETE CASCADE,
  run_date  DATE        NOT NULL,
  ok        BOOLEAN     NOT NULL DEFAULT TRUE,
  detail    TEXT,
  sent_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS reminder_log_personal_uniq
  ON reminder_log (task_id, run_date)
  WHERE kind = 'personal';

CREATE UNIQUE INDEX IF NOT EXISTS reminder_log_recap_uniq
  ON reminder_log (run_date)
  WHERE kind = 'recap';
