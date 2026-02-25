from fastapi.testclient import TestClient

from app.database import init_db, seed_data_if_empty
from app.main import app

init_db()
seed_data_if_empty()
client = TestClient(app)


def test_segmentation_offsets_correctness():
    note = client.post('/api/notes', json={"raw_text": "Alpha. Beta sentence."}).json()
    segments = client.post(f"/api/notes/{note['note_id']}/segment").json()
    assert len(segments) >= 2
    for s in segments:
        assert s['start_char'] < s['end_char']


def test_annotation_crud():
    txt = "Neuro exam intact."
    note = client.post('/api/notes', json={"raw_text": txt}).json()
    span = client.post(f"/api/notes/{note['note_id']}/spans", json={"start_char":0,"end_char":10,"label":"NEURO_EXAM"})
    assert span.status_code == 200
    sid = span.json()['id']
    d = client.delete(f"/api/spans/{sid}")
    assert d.status_code == 200


def test_training_produces_model_version_row():
    r = client.post('/api/train', json={"base_model":"en","max_steps":5,"lr":0.001})
    assert r.status_code == 200
    import time
    for _ in range(80):
        p = client.get('/api/train/progress').json()
        if p['status'] == 'done':
            break
        time.sleep(0.2)
    models = client.get('/api/models').json()
    assert len(models) >= 1


def test_inference_schema_no_hallucinated_keys():
    out = client.post('/api/infer', json={"text":"MAP 70 on norepi. No focal deficit."}).json()
    assert set(out.keys()) == {"cleaned_text", "structured_json", "confidence", "warnings"}
    assert "unknown" not in out['structured_json']
