"use client";

/**
 * Cross-device sync scaffold.
 *
 * We expose a minimal WebSocket client plus a deterministic pairing-code
 * generator. A real backend isn't bundled — pass any `wss://…` endpoint that
 * echoes `{ channel, payload }` messages and it will Just Work. The QR image
 * uses `api.qrserver.com` (public, no key) to keep the scaffold dependency-free.
 */

export interface SyncClient {
  code: string;
  url: string;
  qrUrl: string;
  send: (payload: unknown) => void;
  close: () => void;
  onMessage: (cb: (data: unknown) => void) => () => void;
}

/** 6-character base32 pairing code (Crockford alphabet, unambiguous). */
export function generatePairingCode(): string {
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  let out = "";
  const bytes = new Uint8Array(6);
  if (typeof crypto !== "undefined") crypto.getRandomValues(bytes);
  else for (let i = 0; i < 6; i++) bytes[i] = Math.floor(Math.random() * 256);
  for (let i = 0; i < 6; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

/**
 * Open a sync session. `endpoint` defaults to a public echo server so the
 * scaffold is testable out of the box.
 */
export function createSyncClient(
  endpoint = "wss://echo.websocket.events",
): SyncClient {
  const code = generatePairingCode();
  const url = `${endpoint}?channel=${code}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    `markdown-studio://pair?code=${code}&url=${encodeURIComponent(endpoint)}`,
  )}&bgcolor=0f1219&color=22e4ff&qzone=2`;

  let ws: WebSocket | null = null;
  const listeners = new Set<(data: unknown) => void>();
  const queue: string[] = [];

  if (typeof window !== "undefined") {
    try {
      ws = new WebSocket(url);
      ws.onopen = () => {
        while (queue.length && ws?.readyState === WebSocket.OPEN) {
          ws.send(queue.shift()!);
        }
      };
      ws.onmessage = (evt) => {
        let parsed: unknown = evt.data;
        try {
          parsed = JSON.parse(evt.data);
        } catch {
          /* leave as string */
        }
        listeners.forEach((cb) => cb(parsed));
      };
    } catch {
      // Silent: scaffold is non-fatal if the browser blocks the endpoint.
    }
  }

  return {
    code,
    url,
    qrUrl,
    send(payload) {
      const serialized = JSON.stringify({ channel: code, payload });
      if (ws && ws.readyState === WebSocket.OPEN) ws.send(serialized);
      else queue.push(serialized);
    },
    close() {
      ws?.close();
      listeners.clear();
    },
    onMessage(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}
