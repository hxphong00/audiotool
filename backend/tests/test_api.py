import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
import app.api.routes as routes_module


@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_create_fetch_dynamic_url_and_stream(tmp_path, monkeypatch):
    # Isolate storage to tmp_path so tests never pollute production app/storage
    monkeypatch.setattr(routes_module, "STORAGE_DIR", str(tmp_path))

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://localhost:8000") as client:
        payload = {
            "title": "API Test Dialogue",
            "script": "Alex: Testing API, Sarah.\nSarah: Works well!",
        }
        create_res = await client.post("/api/dialogue/create", json=payload)
        assert create_res.status_code == 200
        data = create_res.json()
        conv_id = data["conversation_id"]
        assert "local_audio_path" not in data

    # Fetch from a different LAN IP host (simulating iPhone 13 on Wi-Fi)
    async with AsyncClient(transport=transport, base_url="http://192.168.1.220:8000") as iphone_client:
        fetch_res = await iphone_client.get(f"/api/dialogue/{conv_id}")
        assert fetch_res.status_code == 200
        fetched = fetch_res.json()
        assert fetched["title"] == "API Test Dialogue"
        # URLs must dynamically rewrite to the requesting host (192.168.1.220), NOT stay localhost!
        assert fetched["audio_stream_url"].startswith("http://192.168.1.220:8000/api/audio/")
        assert fetched["audio_url"].startswith("http://192.168.1.220:8000/static/")

        # Path traversal attempt must be rejected
        bad_res = await iphone_client.get("/api/dialogue/..%2Fmain")
        assert bad_res.status_code in (400, 404)

        # Byte-Range audio stream (HTTP 206)
        stream_res = await iphone_client.get(
            f"/api/audio/{conv_id}/stream",
            headers={"Range": "bytes=0-100"},
        )
        assert stream_res.status_code == 206
        assert "bytes 0-100/" in stream_res.headers.get("content-range", "")
        assert stream_res.headers.get("accept-ranges") == "bytes"

        # Dictionary lookup with IPA, POS, and context
        dict_res = await iphone_client.get(
            "/api/dictionary/lookup",
            params={"word": "traffic,", "context": "The highway traffic is heavy."},
        )
        assert dict_res.status_code == 200
        dict_data = dict_res.json()
        assert dict_data["word"] == "traffic"
        assert "phonetic" in dict_data
        assert "part_of_speech" in dict_data
        assert len(dict_data["translation_vi"]) > 0
