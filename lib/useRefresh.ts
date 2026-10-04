import { useSyncExternalStore } from "react";

let listeners = new Set<() => void>();
let version = 0;

export function triggerRefresh() {
  version++; 
  listeners.forEach((l) => l());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return version; 
}

export function useRefreshSignal() {
  return useSyncExternalStore(subscribe, getSnapshot);
}