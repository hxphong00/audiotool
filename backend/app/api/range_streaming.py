import os
import re
from typing import Generator
from fastapi import Request, HTTPException
from fastapi.responses import StreamingResponse

def stream_file_with_range(
    file_path: str,
    request: Request,
    media_type: str = "audio/mpeg"
) -> StreamingResponse:
    """
    Implements RFC 7233 HTTP 206 Partial Content byte-range streaming for iOS Safari and AVPlayer.
    """
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
        
    file_size = os.path.getsize(file_path)
    range_header = request.headers.get("range")
    
    if not range_header:
        # Standard full content response (HTTP 200)
        def iterfile() -> Generator[bytes, None, None]:
            with open(file_path, "rb") as f:
                while chunk := f.read(64 * 1024):
                    yield chunk
                    
        headers = {
            "Accept-Ranges": "bytes",
            "Content-Length": str(file_size),
        }
        return StreamingResponse(iterfile(), status_code=200, headers=headers, media_type=media_type)
        
    # Parse Range: bytes=start-end
    match = re.match(r"^bytes=(\d+)-(\d*)$", range_header.strip())
    if not match:
        raise HTTPException(status_code=416, detail="Requested range not satisfiable")
        
    start_str, end_str = match.groups()
    start = int(start_str)
    end = int(end_str) if end_str else file_size - 1
    
    if start >= file_size or end >= file_size or start > end:
        raise HTTPException(
            status_code=416,
            detail="Requested range not satisfiable",
            headers={"Content-Range": f"bytes */{file_size}"}
        )
        
    content_length = (end - start) + 1
    
    def iter_range() -> Generator[bytes, None, None]:
        with open(file_path, "rb") as f:
            f.seek(start)
            bytes_left = content_length
            while bytes_left > 0:
                chunk_to_read = min(bytes_left, 64 * 1024)
                data = f.read(chunk_to_read)
                if not data:
                    break
                bytes_left -= len(data)
                yield data
                
    headers = {
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(content_length),
    }
    return StreamingResponse(iter_range(), status_code=206, headers=headers, media_type=media_type)
