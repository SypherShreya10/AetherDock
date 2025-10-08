# backend/collector/run.py
import time
import sqlite3
import os

DB = os.path.join(os.path.dirname(__file__), '../../aetherdock.db')

def ensure_db():
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    cur.execute('''
    CREATE TABLE IF NOT EXISTS container_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER,
      container_id TEXT,
      cpu_pct REAL,
      mem_used INTEGER,
      mem_limit INTEGER,
      net_rx INTEGER,
      net_tx INTEGER
    );
    ''')
    conn.commit()
    conn.close()

def collect_once():
    # Placeholder: in real version, use docker SDK to gather stats
    import time, random
    ts = int(time.time())
    sample = {
      'ts': ts,
      'container_id': 'stub-1',
      'cpu_pct': random.random() * 20,
      'mem_used': int(random.random() * 200 * 1024 * 1024),
      'mem_limit': 512 * 1024 * 1024,
      'net_rx': 0,
      'net_tx': 0
    }
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    cur.execute('''
      INSERT INTO container_metrics (ts, container_id, cpu_pct, mem_used, mem_limit, net_rx, net_tx)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (sample['ts'], sample['container_id'], sample['cpu_pct'], sample['mem_used'], sample['mem_limit'], sample['net_rx'], sample['net_tx']))
    conn.commit()
    conn.close()
    print("Inserted sample:", sample)

def run_loop(interval=10):
    ensure_db()
    print("Collector started (interval={}s). Press Ctrl+C to stop.".format(interval))
    try:
        while True:
            collect_once()
            time.sleep(interval)
    except KeyboardInterrupt:
        print("Collector stopped by user.")

if __name__ == '__main__':
    run_loop()
