# backend/api/app.py
from flask import Flask, jsonify, render_template
import os

# try docker, but fallback to stub if not available
try:
    import docker
    docker_client = docker.from_env()
except Exception:
    docker_client = None

app = Flask(__name__, template_folder=os.path.join(os.path.dirname(__file__), '../../frontend/templates'),
            static_folder=os.path.join(os.path.dirname(__file__), '../../frontend/static'))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/containers')
def api_containers():
    if docker_client:
        containers = []
        for c in docker_client.containers.list(all=True):
            containers.append({
                'id': c.id[:12],
                'name': c.name,
                'status': c.status,
                'image': c.attrs.get('Config', {}).get('Image')
            })
    else:
        containers = [
            {'id': 'stub-1', 'name': 'demo-service', 'status': 'running', 'image': 'busybox:latest'}
        ]
    return jsonify(containers)

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
