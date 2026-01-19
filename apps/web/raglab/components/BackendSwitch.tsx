"use client";

import { useEffect, useState } from "react";
import type { BackendKey } from "@/lib/raglabApi";
import { getBackend, setBackend } from "@/lib/backendStore";

export function BackendSwitch(props: {
  value?: BackendKey;
  onChange?: (v: BackendKey) => void;
}) {
  const [backend, setLocalBackend] = useState<BackendKey>("python");

  useEffect(() => {
    const saved = getBackend();
    setLocalBackend(saved);
    props.onChange?.(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(v: BackendKey) {
    setLocalBackend(v);
    setBackend(v);
    props.onChange?.(v);
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <span style={{ fontWeight: 600 }}>Backend</span>

      <button
        type="button"
        onClick={() => update("python")}
        style={{
          padding: "6px 10px",
          borderRadius: 10,
          border: "1px solid #ddd",
          background: backend === "python" ? "#eee" : "white",
          cursor: "pointer",
        }}
      >
        Python
      </button>

      <button
        type="button"
        onClick={() => update("java")}
        style={{
          padding: "6px 10px",
          borderRadius: 10,
          border: "1px solid #ddd",
          background: backend === "java" ? "#eee" : "white",
          cursor: "pointer",
        }}
      >
        Java
      </button>
    </div>
  );
}
