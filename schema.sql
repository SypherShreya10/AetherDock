CREATE TABLE IF NOT EXISTS container_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER,
  container_id TEXT,
  container_name TEXT,
  image TEXT,
  cpu_percent REAL,
  mem_used_bytes INTEGER,
  mem_limit_bytes INTEGER,
  mem_percent REAL,
  net_rx_bytes INTEGER,
  net_tx_bytes INTEGER,
  blk_read_bytes INTEGER,
  blk_write_bytes INTEGER,
  pids INTEGER,
  status TEXT,
  experiment_id TEXT,
  sample_interval INTEGER
);

CREATE TABLE IF NOT EXISTS container_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER,
  experiment_id TEXT,
  container_id TEXT,
  event_type TEXT,
  details TEXT
);

CREATE TABLE IF NOT EXISTS predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER,
  container_id TEXT,
  metric TEXT,
  time_to_limit_min REAL,
  explanation TEXT,
  confidence REAL
);

CREATE TABLE IF NOT EXISTS actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER,
  container_id TEXT,
  action TEXT,
  result TEXT
);
