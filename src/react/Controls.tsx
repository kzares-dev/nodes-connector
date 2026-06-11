import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { normalizeConnection } from "../core";
import { useBoardContext, type BoardContextValue } from "./BoardContext";

export type ControlsPosition = "top" | "right" | "bottom" | "left";
export type ControlsDock = ControlsPosition | "bottom-right";
export type ControlsVariant = "navigation" | "panel";

export type ControlsProps = {
  position?: ControlsDock;
  variant?: ControlsVariant;
  className?: string;
  children?: ReactNode | ((context: BoardContextValue) => ReactNode);
};

function Icon({ name }: { name: "plus" | "minus" | "target" }) {
  if (name === "plus") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 3v10M3 8h10" />
      </svg>
    );
  }

  if (name === "minus") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3 8h10" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="5" />
      <path d="M8 1v3M8 12v3M1 8h3M12 8h3" />
    </svg>
  );
}

export function Controls({ position = "bottom-right", variant = "navigation", className, children }: ControlsProps) {
  const context = useBoardContext();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const nodeOptions = useMemo(() => context.nodes, [context.nodes]);
  const rootClassName = ["nodes-connector-controls", `is-${variant}`, `is-${position}`, className].filter(Boolean).join(" ");

  if (typeof children === "function") {
    return <div className={rootClassName}>{children(context)}</div>;
  }

  if (children) {
    return <div className={rootClassName}>{children}</div>;
  }

  function createSelectedConnection() {
    if (!from || !to || from === to) {
      return;
    }

    context.addConnection({ from, to });
  }

  if (variant === "navigation") {
    return (
      <nav className={rootClassName} aria-label="Map navigation">
        <button type="button" onClick={context.zoomIn} disabled={!context.canZoom} aria-label="Zoom in" title="Zoom in">
          <Icon name="plus" />
        </button>
        <button type="button" onClick={context.zoomOut} disabled={!context.canZoom} aria-label="Zoom out" title="Zoom out">
          <Icon name="minus" />
        </button>
        <button type="button" onClick={context.resetViewport} aria-label="Reset viewport" title="Reset viewport">
          <Icon name="target" />
        </button>
      </nav>
    );
  }

  return (
    <aside className={rootClassName} aria-label="Board controls">
      <div className="nodes-connector-control-group">
        <button type="button" onClick={context.zoomIn} aria-label="Zoom in">
          +
        </button>
        <button type="button" onClick={context.zoomOut} aria-label="Zoom out">
          -
        </button>
        <button type="button" onClick={context.resetViewport}>
          Reset
        </button>
      </div>

      <div className="nodes-connector-control-group">
        <button type="button" onClick={() => context.panBy({ x: 80, y: 0 })} aria-label="Pan left">
          Left
        </button>
        <button type="button" onClick={() => context.panBy({ x: -80, y: 0 })} aria-label="Pan right">
          Right
        </button>
        <button type="button" onClick={() => context.panBy({ x: 0, y: 80 })} aria-label="Pan up">
          Up
        </button>
        <button type="button" onClick={() => context.panBy({ x: 0, y: -80 })} aria-label="Pan down">
          Down
        </button>
      </div>

      <div className="nodes-connector-control-group">
        <button type="button" onClick={context.addNode} disabled={!context.canEdit}>
          Add node
        </button>
      </div>

      <div className="nodes-connector-control-group">
        <select value={from} onChange={(event) => setFrom(event.target.value)} disabled={!context.canEdit}>
          <option value="">From</option>
          {nodeOptions.map((node) => (
            <option key={node.id} value={node.id}>
              {node.label ?? node.id}
            </option>
          ))}
        </select>
        <select value={to} onChange={(event) => setTo(event.target.value)} disabled={!context.canEdit}>
          <option value="">To</option>
          {nodeOptions.map((node) => (
            <option key={node.id} value={node.id}>
              {node.label ?? node.id}
            </option>
          ))}
        </select>
        <button type="button" onClick={createSelectedConnection} disabled={!context.canEdit || !from || !to || from === to}>
          Connect
        </button>
      </div>

      <div className="nodes-connector-control-list">
        {context.connections.map((connection) => {
          const normalized = normalizeConnection(connection);

          return (
            <button
              key={normalized.id}
              type="button"
              onClick={() => context.removeConnection(normalized.id)}
              disabled={!context.canEdit}
              title="Remove connection"
            >
              {normalized.from} {"->"} {normalized.to}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

Controls.displayName = "NodesConnectorControls";
