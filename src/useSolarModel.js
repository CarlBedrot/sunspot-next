import { useEffect, useRef, useState } from "react";
export function useSolarModel(instant, overrides, duration, enabled = true) {
  const [buildings, setBuildings] = useState(null),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0);
  const [ready, setReady] = useState(false),
    [response, setResponse] = useState(null);
  const worker = useRef(null),
    sequence = useRef(0);
  const requestKey = JSON.stringify([instant, overrides, duration]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    // A new worker connection invalidates all state from the previous worker.
    /* eslint-disable react-hooks/set-state-in-effect */
    setError(false);
    setReady(false);
    setResponse(null);
    setBuildings(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    const w = new Worker(new URL("./solar.worker.js", import.meta.url), {
      type: "module",
    });
    worker.current = w;
    let currentKey,
      queued,
      busy = false;
    const pump = () => {
      if (busy || !queued) return;
      const { payload, key } = queued;
      queued = null;
      currentKey = key;
      busy = true;
      w.postMessage(payload);
    };
    w.onmessage = ({ data }) => {
      if (data.type === "ready") setReady(true);
      else if (data.type === "error") setError(true);
      else if (data.id === sequence.current)
        setResponse({ key: currentKey, ...data });
      if (data.type !== "ready") {
        busy = false;
        pump();
      }
    };
    w.onerror = () => setError(true);
    worker.current.sendRequest = (payload, key) => {
      queued = { payload, key };
      pump();
    };
    fetch("/data/copenhagen-buildings.json", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw Error(r.status);
        return r.json();
      })
      .then((data) => {
        if (data.schemaVersion !== 1 || !data.buildings?.length)
          throw Error("Invalid data");
        setBuildings(data);
        w.postMessage({ type: "init", buildings: data });
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(true);
      });
    return () => {
      controller.abort();
      w.terminate();
      worker.current = null;
    };
  }, [enabled, retry]);
  useEffect(() => {
    if (!ready || !worker.current) return;
    const id = ++sequence.current;
    const timer = setTimeout(
      () =>
        worker.current?.sendRequest(
          { type: "analyze", id, instant, overrides, duration },
          requestKey,
        ),
      60,
    );
    return () => clearTimeout(timer);
  }, [ready, instant, overrides, duration, requestKey]);
  // Never show old solar eligibility against a new slider position.
  const current = !error && response?.key === requestKey;
  return {
    buildings,
    error,
    retry: () => setRetry((n) => n + 1),
    results: current ? response.results : {},
    pending: !current && !error,
  };
}
