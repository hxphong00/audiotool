import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_create_and_fetch_dialogue():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "title": "API Test Dialogue",
            "script": "Alex: Testing API.\nSarah: Works well!"
        }
        create_res = await client.post("/api/dialogue/create", json=payload)
        assert create_res.status_code == 200
        data = create_res.json()
        assert "conversation_id" in data
        conv_id = data["conversation_id"]
        
        # Test fetch metadata
        fetch_res = await client.get(f"/api/dialogue/{conv_id}")
        assert fetch_res.status_code == 200
        assert fetch_res.json()["title"] == "API Test Dialogue"
        
        # Test Byte-Range audio stream (HTTP 206)
        stream_res = await client.get(
            f"/api/audio/{conv_id}/stream",
            headers={"Range": "bytes=0-100"}
        )
        assert stream_res.status_code == 206
        assert "bytes 0-100/" in stream_res.headers.get("content-range", "")
        assert stream_res.headers.get("accept-ranges") == "bytes"
