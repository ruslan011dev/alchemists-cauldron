interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
}

function isInstallPrompt(event: Event): event is InstallPrompt {
  if (!("prompt" in event)) {
    return false;
  }

  return typeof event.prompt === "function";
}

export function listenForInstall(
  onReady: (prompt: () => Promise<void>) => void,
): void {
  window.addEventListener("beforeinstallprompt", (event) => {
    if (!isInstallPrompt(event)) {
      return;
    }

    event.preventDefault();
    onReady(() => event.prompt());
  });
}

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    return;
  }

  const base = import.meta.env.BASE_URL;
  void navigator.serviceWorker.register(`${base}sw.js`, { scope: base });
}

export function watchConnection(note: HTMLElement): void {
  const paint = (): void => {
    note.hidden = navigator.onLine;
  };

  window.addEventListener("online", paint);
  window.addEventListener("offline", paint);
  paint();
}
