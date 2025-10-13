# import docker
# import time
# import sqlite3
# import os

# # Connect to Docker Engine
# client = docker.from_env()

# # Database file path
# DB_FILE = os.path.join(os.path.dirname(_file_), "../../aetherdock.db")

# # Ensure database exists
# def setup_db():
#     conn = sqlite3.connect(DB_FILE)
#     c = conn.cursor()
#     c.execute('''
#         CREATE TABLE IF NOT EXISTS container_metrics (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             timestamp INTEGER,
#             container_id TEXT,
#             container_name TEXT,
#             cpu_percent REAL,
#             mem_usage_mb REAL,
#             net_input_mb REAL,
#             net_output_mb REAL
#         )
#     ''')
#     conn.commit()
#     conn.close()

# # Collect metrics once
# def collect_metrics():
#     containers = client.containers.list()
#     conn = sqlite3.connect(DB_FILE)
#     c = conn.cursor()

#     for container in containers:
#         stats = container.stats(stream=False)
#         cpu_total = stats['cpu_stats']['cpu_usage']['total_usage']          #stats - This is the big dictionary containing all the container statistics
# # stats['cpu_stats'] - Opens the cpu_stats box inside stats
# # stats['cpu_stats']['cpu_usage'] - Opens the cpu_usage box inside the cpu_stats box
# # stats['cpu_stats']['cpu_usage']['total_usage'] - Gets the actual value from total_usage inside the cpu_usage box
#         system_cpu = stats['cpu_stats']['system_cpu_usage']
#         cpu_percent = (cpu_total / system_cpu) * 100 if system_cpu else 0

#         mem_usage = stats['memory_stats']['usage'] / (1024 * 1024)      #convert from bytes to megabytes (MB)
#         net_input = stats['networks']['eth0']['rx_bytes'] / (1024 * 1024)       #Gets network input bytes (rx_bytes means "received bytes") and converts to MB
#         net_output = stats['networks']['eth0']['tx_bytes'] / (1024 * 1024)      # Gets network output bytes (tx_bytes means "transmitted bytes") and converts to MB

#         c.execute('''
#             INSERT INTO container_metrics
#             (timestamp, container_id, container_name, cpu_percent, mem_usage_mb, net_input_mb, net_output_mb)
#             VALUES (?, ?, ?, ?, ?, ?, ?)
#         ''', (int(time.time()), container.id[:12], container.name, cpu_percent, mem_usage, net_input, net_output))

#     conn.commit()
#     conn.close()
#     #This inserts a new row into the database with all the metrics we just calculated.

# # Continuous collection loop
# def run_collector(interval=10):    #10 secs interval
#     setup_db()
#     print(f"Collector started. Saving data every {interval} seconds.\nPress Ctrl+C to stop.")
#     while True:         #This creates an infinite loop. It will run forever until you stop it.
#         collect_metrics()
#         time.sleep(interval)        #Pauses the program for the specified number of seconds before collecting again

# if _name_ == "_main_":
#     run_collector()









# updated code:

import docker
import sqlite3
import time
import os
from datetime import datetime

# ---------------------------------------------------------
# 🧩 CONFIGURATION SECTION
# ---------------------------------------------------------
COLLECTION_INTERVAL = 10        # seconds between each sample
DB_FILE = "aetherdock.db"       # database filename
EXPERIMENT_ID = "exp_demo_1"    # change for each experiment
# ---------------------------------------------------------

def init_database():
    """Create database and tables if they don't exist."""
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()

    # Create container_metrics table
    cur.execute("""
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
    """)

    # Create container_events table (for labeling or actions)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS container_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts INTEGER,
            experiment_id TEXT,
            container_id TEXT,
            event_type TEXT,
            details TEXT
        );
    """)

    conn.commit()
    conn.close()


def collect_metrics():
    """Continuously collect metrics from all running containers."""
    client = docker.from_env()
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()

    print("✅ Collector started...")
    print(f"Collecting data every {COLLECTION_INTERVAL} seconds.")
    print(f"Experiment ID: {EXPERIMENT_ID}")
    print("Press Ctrl+C to stop.\n")

    try:
        while True:
            timestamp = int(time.time())
            containers = client.containers.list()

            for container in containers:
                try:
                    stats = container.stats(stream=False)

                    # --- CPU ---
                    cpu_total = stats["cpu_stats"]["cpu_usage"].get("total_usage", 0)
                    precpu_total = stats.get("precpu_stats", {}).get("cpu_usage", {}).get("total_usage", 0)
                    system_cpu = stats["cpu_stats"].get("system_cpu_usage", 0)
                    pre_system_cpu = stats.get("precpu_stats", {}).get("system_cpu_usage", 0)
                    cpu_delta = cpu_total - precpu_total
                    system_delta = system_cpu - pre_system_cpu
                    cpu_count = len(stats["cpu_stats"].get("cpu_usage", {}).get("percpu_usage", [])) or 1
                    cpu_percent = 0.0
                    if system_delta > 0 and cpu_delta > 0:
                        cpu_percent = (cpu_delta / system_delta) * cpu_count * 100.0

                    # --- Memory ---
                    mem_usage = stats["memory_stats"].get("usage", 0)
                    mem_limit = stats["memory_stats"].get("limit", 1)
                    mem_percent = (mem_usage / mem_limit) * 100.0

                    # --- Network ---
                    net_rx = net_tx = 0
                    networks = stats.get("networks", {})
                    for iface, n in networks.items():
                        net_rx += n.get("rx_bytes", 0)
                        net_tx += n.get("tx_bytes", 0)

                    # --- Block I/O ---
                    blk_read = blk_write = 0
                    blkio = stats.get("blkio_stats", {}).get("io_service_bytes_recursive", [])
                    if blkio:
                        for entry in blkio:
                            if entry.get("op") == "Read":
                                blk_read += entry.get("value", 0)
                            elif entry.get("op") == "Write":
                                blk_write += entry.get("value", 0)

                    # --- Other info ---
                    pids = stats.get("pids_stats", {}).get("current", 0)
                    status = container.status
                    image = container.image.tags[0] if container.image.tags else "unknown"

                    # --- Insert into DB ---
                    cur.execute("""
                        INSERT INTO container_metrics (
                            timestamp, container_id, container_name, image,
                            cpu_percent, mem_used_bytes, mem_limit_bytes, mem_percent,
                            net_rx_bytes, net_tx_bytes, blk_read_bytes, blk_write_bytes,
                            pids, status, experiment_id, sample_interval
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        timestamp, container.id[:12], container.name, image,
                        cpu_percent, mem_usage, mem_limit, mem_percent,
                        net_rx, net_tx, blk_read, blk_write,
                        pids, status, EXPERIMENT_ID, COLLECTION_INTERVAL
                    ))

                except Exception as e:
                    print(f"⚠ Error reading container {container.name}: {e}")
                    continue

            conn.commit()
            time.sleep(COLLECTION_INTERVAL)

    except KeyboardInterrupt:
        print("\n🛑 Collector stopped by user.")
    except Exception as e:
        print(f"❌ Collector error: {e}")
    finally:
        conn.close()


if __name__ == "__main__":
    if not os.path.exists(DB_FILE):
        print("Creating database...")
    init_database()
    collect_metrics()