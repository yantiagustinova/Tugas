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
