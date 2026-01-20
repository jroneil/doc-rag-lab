"use client";

import { useMemo } from "react";
import type { BackendKey, QueryRun } from "../types/runs";

const BACKEND_COLORS: Record<BackendKey, string> = {
  python: "#7c6cf4",
  java: "#06b6d4",
};

const STATUS_COLORS = {
  ok: "#22c55e",
  error: "#ef4444",
};

type RunChartsProps = {
  runs: QueryRun[];
  limit: number;
  error?: string | null;
};

function formatTimeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getMinMax(values: number[]) {
  if (!values.length) {
    return { min: 0, max: 1 };
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return { min: min - 1, max: max + 1 };
  }
  return { min, max };
}

function createLinePath(
  values: Array<number | null>,
  width: number,
  height: number,
) {
  const safeValues = values.filter((value): value is number => value !== null);
  const { min, max } = getMinMax(safeValues);
  const padding = 10;
  const chartHeight = height - padding * 2;
  const chartWidth = width - padding * 2;

  return values
    .map((value, index) => {
      if (value === null) {
        return null;
      }
      const x = padding + (chartWidth * index) / Math.max(values.length - 1, 1);
      const normalized = (value - min) / (max - min);
      const y = padding + chartHeight - normalized * chartHeight;
      return `${x},${y}`;
    })
    .filter(Boolean)
    .join(" ");
}

export default function RunCharts({ runs, limit, error }: RunChartsProps) {
  const recentRuns = useMemo(() => {
    const sorted = [...runs].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    return sorted.slice(-limit);
  }, [runs, limit]);

  const backendSet = useMemo(
    () => new Set(recentRuns.map((run) => run.backend)),
    [recentRuns],
  );
  const hasMultipleBackends = backendSet.size > 1;

  const latencyData = useMemo(() => {
    return recentRuns.map((run) => {
      const timeLabel = formatTimeLabel(run.createdAt);

      return {
        timeLabel,
        python: run.backend === "python" ? run.latencyMs : null,
        java: run.backend === "java" ? run.latencyMs : null,
        latencyMs: run.latencyMs,
      };
    });
  }, [recentRuns]);

  const retrievedData = useMemo(() => {
    return recentRuns.map((run) => {
      const timeLabel = formatTimeLabel(run.createdAt);

      return {
        timeLabel,
        python: run.backend === "python" ? run.retrievedCount : null,
        java: run.backend === "java" ? run.retrievedCount : null,
        retrievedCount: run.retrievedCount,
      };
    });
  }, [recentRuns]);

  const retrievedMax = useMemo(() => {
    const values = retrievedData.flatMap((entry) =>
      hasMultipleBackends
        ? [entry.python ?? 0, entry.java ?? 0]
        : [entry.retrievedCount ?? 0],
    );
    return Math.max(...values, 1);
  }, [retrievedData, hasMultipleBackends]);

  const statusData = useMemo(() => {
    const okCount = recentRuns.filter((run) => run.status === "ok").length;
    const errorCount = recentRuns.length - okCount;

    return [
      { name: "ok", value: okCount },
      { name: "error", value: errorCount },
    ];
  }, [recentRuns]);

  if (error) {
    return <p className="empty-state">{error}</p>;
  }

  if (!recentRuns.length) {
    return <p className="empty-state">No run data yet.</p>;
  }

  const chartWidth = 320;
  const chartHeight = 180;

  return (
    <div className="dashboard-grid">
      <article className="dashboard-card">
        <header>
          <h3>Latency (ms) over last N runs</h3>
          <p>Track response time by backend.</p>
        </header>
        <div className="chart-wrapper">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="chart-svg">
            <polyline
              fill="none"
              stroke="#1f2937"
              strokeWidth="1"
              points={`10,${chartHeight - 10} ${chartWidth - 10},${
                chartHeight - 10
              }`}
            />
            {hasMultipleBackends ? (
              <>
                <polyline
                  fill="none"
                  stroke={BACKEND_COLORS.python}
                  strokeWidth="2"
                  points={createLinePath(
                    latencyData.map((item) => item.python),
                    chartWidth,
                    chartHeight,
                  )}
                />
                <polyline
                  fill="none"
                  stroke={BACKEND_COLORS.java}
                  strokeWidth="2"
                  points={createLinePath(
                    latencyData.map((item) => item.java),
                    chartWidth,
                    chartHeight,
                  )}
                />
              </>
            ) : (
              <polyline
                fill="none"
                stroke={BACKEND_COLORS[recentRuns[0].backend]}
                strokeWidth="2"
                points={createLinePath(
                  latencyData.map((item) => item.latencyMs),
                  chartWidth,
                  chartHeight,
                )}
              />
            )}
          </svg>
          <div className="chart-axis">
            {recentRuns.map((run) => (
              <span key={run.id}>{formatTimeLabel(run.createdAt)}</span>
            ))}
          </div>
          {hasMultipleBackends ? (
            <div className="chart-legend">
              <span>
                <i style={{ background: BACKEND_COLORS.python }} /> python
              </span>
              <span>
                <i style={{ background: BACKEND_COLORS.java }} /> java
              </span>
            </div>
          ) : null}
        </div>
      </article>

      <article className="dashboard-card">
        <header>
          <h3>Retrieved count</h3>
          <p>Documents surfaced in each run.</p>
        </header>
        <div className="chart-wrapper">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="chart-svg">
            {retrievedData.map((entry, index) => {
              const barWidth = chartWidth / retrievedData.length - 10;
              const startX = index * (chartWidth / retrievedData.length) + 6;
              const values = hasMultipleBackends
                ? [entry.python ?? 0, entry.java ?? 0]
                : [entry.retrievedCount ?? 0];

              return values.map((value, barIndex) => {
                const height = (value / retrievedMax) * (chartHeight - 30);
                const xOffset = startX +
                  (barIndex * barWidth) / values.length;
                return (
                  <rect
                    key={`${index}-${barIndex}`}
                    x={xOffset}
                    y={chartHeight - height - 14}
                    width={barWidth / values.length - 4}
                    height={height}
                    rx="4"
                    fill={
                      hasMultipleBackends
                        ? barIndex === 0
                          ? BACKEND_COLORS.python
                          : BACKEND_COLORS.java
                        : BACKEND_COLORS[recentRuns[0].backend]
                    }
                  />
                );
              });
            })}
          </svg>
          <div className="chart-axis">
            {recentRuns.map((run) => (
              <span key={run.id}>{formatTimeLabel(run.createdAt)}</span>
            ))}
          </div>
          {hasMultipleBackends ? (
            <div className="chart-legend">
              <span>
                <i style={{ background: BACKEND_COLORS.python }} /> python
              </span>
              <span>
                <i style={{ background: BACKEND_COLORS.java }} /> java
              </span>
            </div>
          ) : null}
        </div>
      </article>

      <article className="dashboard-card">
        <header>
          <h3>Run status</h3>
          <p>Success vs error runs.</p>
        </header>
        <div className="chart-wrapper donut">
          <svg viewBox="0 0 120 120" className="donut-svg">
            {(() => {
              const total = statusData[0].value + statusData[1].value || 1;
              const okRatio = statusData[0].value / total;
              const okDash = okRatio * 283;
              const errorDash = 283 - okDash;
              return (
                <>
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    stroke={STATUS_COLORS.error}
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    stroke={STATUS_COLORS.ok}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${okDash} ${errorDash}`}
                    strokeDashoffset="70"
                    strokeLinecap="round"
                  />
                </>
              );
            })()}
          </svg>
        </div>
        <div className="donut-metrics">
          <span className="status-dot ok">ok {statusData[0].value}</span>
          <span className="status-dot error">error {statusData[1].value}</span>
        </div>
      </article>
    </div>
  );
}
