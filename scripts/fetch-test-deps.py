"""Fetch exact repository versions for integration tests via the user's gh login."""
import base64
import hashlib
import json
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'tests/dependencies' / (sys.argv[1] + '.json')).read_text())
target = root / '.test-deps'
target.mkdir(exist_ok=True)
for item in manifest:
    file = target / item['file']
    def blob_sha(data):
        return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
    if file.exists() and blob_sha(file.read_bytes()) == item['blob']:
        continue
    if '--offline' in sys.argv:
        raise SystemExit('Missing or mismatched dependency: ' + item['file'])
    endpoint = 'repos/cristiancarvajal22/arquitectura-parcial2/contents/' + item['path'] + '?ref=' + item['ref']
    result = subprocess.run(['gh', 'api', endpoint], check=True, capture_output=True, text=True)
    data = base64.b64decode(json.loads(result.stdout)['content'])
    if blob_sha(data) != item['blob']:
        raise SystemExit('Dependency hash mismatch: ' + item['file'])
    file.write_bytes(data)
print('Verified dependencies:', len(manifest))
