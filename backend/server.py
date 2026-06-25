"""
Reverse proxy server that forwards all /api/* requests to the Next.js app
running on localhost:3000. K8s ingress routes /api/* traffic to port 8001,
but this project keeps API routes inside Next.js, so we transparently proxy.
"""
from fastapi import FastAPI, Request, Response
from fastapi.responses import StreamingResponse
import httpx
import os

NEXT_URL = os.environ.get("NEXT_INTERNAL_URL", "http://localhost:3000")

app = FastAPI()

# Shared async http client
_client: httpx.AsyncClient | None = None


@app.on_event("startup")
async def startup():
    global _client
    _client = httpx.AsyncClient(timeout=httpx.Timeout(60.0), follow_redirects=False)


@app.on_event("shutdown")
async def shutdown():
    global _client
    if _client is not None:
        await _client.aclose()


HOP_BY_HOP = {
    "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
    "te", "trailers", "transfer-encoding", "upgrade", "host", "content-length",
    "content-encoding",
}


async def _proxy(request: Request, path: str) -> Response:
    assert _client is not None
    url = f"{NEXT_URL}/{path}"
    if request.url.query:
        url = f"{url}?{request.url.query}"

    headers = {k: v for k, v in request.headers.items() if k.lower() not in HOP_BY_HOP}
    body = await request.body()

    try:
        upstream = await _client.request(
            request.method, url, headers=headers, content=body
        )
    except httpx.RequestError as e:
        return Response(content=f"Upstream error: {e}", status_code=502)

    resp_headers = {
        k: v for k, v in upstream.headers.items() if k.lower() not in HOP_BY_HOP
    }
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=resp_headers,
        media_type=upstream.headers.get("content-type"),
    )


@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def proxy_api(request: Request, path: str):
    return await _proxy(request, f"api/{path}")


@app.get("/health")
async def health():
    return {"ok": True}
