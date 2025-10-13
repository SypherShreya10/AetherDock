import sqlite3
import time
import argparse
import os

# ---------------------------
# CONFIGURATION
# ---------------------------
DB_FILE = "aetherdock.db"  # same DB used by collector
# ---------------------------

def log_event(experiment_id, container_id, event_type, details=""):
    """Insert a labeled event into the container_events table."""
    if not os.path.exists(DB_FILE):
        print("❌ Database not found. Run collector.py first to create it.")
        return

    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO container_events (ts, experiment_id, container_id, event_type, details)
        VALUES (?, ?, ?, ?, ?)
    """, (int(time.time()), experiment_id, container_id, event_type, details))

    conn.commit()
    conn.close()

    print(f"✅ Logged event '{event_type}' for container '{container_id}' in experiment '{experiment_id}'.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Log experiment events to the AetherDock database.")
    parser.add_argument("--exp", required=True, help="Experiment ID (same as in collector.py)")
    parser.add_argument("--cid", required=True, help="Container ID or name")
    parser.add_argument("--type", required=True, help="Event type (e.g. memory_leak_start, cpu_spike_injected, experiment_end)")
    parser.add_argument("--details", default="", help="Optional details or notes")

    args = parser.parse_args()

    log_event(args.exp, args.cid, args.type, args.details)