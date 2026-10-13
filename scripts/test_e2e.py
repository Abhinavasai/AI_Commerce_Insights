#!/usr/bin/env python3
"""Smoke test against local core-api."""

from __future__ import annotations

import sys

import httpx

BASE = "http://localhost:8100/api/v1"


def main() -> int:
    client = httpx.Client(timeout=60)
    r = client.get(f"{BASE}/health")
    r.raise_for_status()
    print("health:", r.json())

    r = client.post(
        f"{BASE}/auth/login",
        json={"email": "analyst@demo.com", "password": "demo1234"},
    )
    r.raise_for_status()
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    r = client.get(f"{BASE}/dashboard/stats", headers=headers)
    r.raise_for_status()
    print("dashboard totals:", r.json()["totals"])

    r = client.get(f"{BASE}/documents", headers=headers)
    r.raise_for_status()
    print("documents:", len(r.json()))

    r = client.get(f"{BASE}/insights", headers=headers)
    r.raise_for_status()
    print("insights:", len(r.json()))

    r = client.get(f"{BASE}/catalog/products", headers=headers)
    r.raise_for_status()
    print("products:", len(r.json()))

    r = client.post(f"{BASE}/chat/sessions", headers=headers, json={"title": "E2E"})
    r.raise_for_status()
    sid = r.json()["id"]
    with client.stream(
        "POST",
        f"{BASE}/chat/sessions/{sid}/messages",
        headers=headers,
        json={"content": "Which sellers lead Electronics?"},
        timeout=120,
    ) as resp:
        resp.raise_for_status()
        chunks = 0
        for line in resp.iter_lines():
            if line:
                chunks += 1
        print("chat sse lines:", chunks)

    print("E2E OK")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print("E2E FAILED:", exc, file=sys.stderr)
        raise SystemExit(1)
