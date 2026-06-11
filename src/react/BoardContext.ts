import { createContext, useContext } from "react";
import type { ConnectionData, NodeId, Viewport } from "../core";

export type BoardContextValue = {
  nodes: Array<{ id: NodeId; label?: string }>;
  connections: ConnectionData[];
  viewport: Viewport;
  canEdit: boolean;
  canPan: boolean;
  canZoom: boolean;
  addNode: () => void;
  addConnection: (connection: ConnectionData) => void;
  removeConnection: (id: string) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetViewport: () => void;
  panBy: (delta: { x: number; y: number }) => void;
  deleteNode: (id: NodeId) => void;
  removeConnectionsForNode: (id: NodeId) => void;
};

export const BoardContext = createContext<BoardContextValue | null>(null);

export function useBoardContext(): BoardContextValue {
  const value = useContext(BoardContext);

  if (!value) {
    throw new Error("nodes-connector controls must be rendered inside a Board.");
  }

  return value;
}

export const useBoard = useBoardContext;
