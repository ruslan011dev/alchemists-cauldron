const CACHE = "cauldron-v2";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./music/retro-arcade.mp3",
];

interface WaitEvent {
  waitUntil(promise: Promise<unknown>): void;
}

interface FetchEvent extends WaitEvent {
  readonly request: Request;
  respondWith(response: Promise<Response> | Response): void;
}

interface WorkerScope {
  addEventListener(
    type: "install" | "activate",
    listener: (event: WaitEvent) => void,
  ): void;
  addEventListener(type: "fetch", listener: (event: FetchEvent) => void): void;
  skipWaiting(): Promise<void>;
  clients: { claim(): Promise<void> };
  readonly location: { origin: string };
}

const worker = self as unknown as WorkerScope;

worker.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => worker.skipWaiting()),
  );
});

worker.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => worker.clients.claim()),
  );
});

worker.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);
  if (url.origin !== worker.location.origin) {
    return;
  }

  event.respondWith(fromNetwork(event.request));
});

async function fromNetwork(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    if (request.mode === "navigate") {
      const shell = await cache.match("./index.html");
      if (shell) {
        return shell;
      }
    }

    return new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
