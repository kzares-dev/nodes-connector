import type { BoardSnapshot, ConnectionData, ElementData, GraphNode, HistoryState, NodeData, NodeId, Point, Size } from "./types";

export function createConnectionId(from: NodeId, to: NodeId): string {
  return `${from}->${to}`;
}

export function normalizeConnection(connection: ConnectionData): Required<Pick<ConnectionData, "id" | "from" | "to">> &
  Omit<ConnectionData, "id" | "from" | "to"> {
  return {
    ...connection,
    id: connection.id ?? createConnectionId(connection.from, connection.to)
  };
}

export function moveNode<TMeta>(
  nodes: Array<NodeData<TMeta>>,
  id: NodeId,
  position: { x: number; y: number }
): Array<NodeData<TMeta>> {
  return nodes.map((node) => (node.id === id ? { ...node, ...position } : node));
}

export function upsertConnection<TMeta>(
  connections: Array<ConnectionData<TMeta>>,
  nextConnection: ConnectionData<TMeta>
): Array<ConnectionData<TMeta>> {
  const normalized = normalizeConnection(nextConnection) as ConnectionData<TMeta>;
  const exists = connections.some(
    (connection) =>
      normalizeConnection(connection).id === normalized.id ||
      (connection.from === normalized.from && connection.to === normalized.to)
  );

  return exists ? connections : [...connections, normalized];
}

export function removeConnection<TMeta>(
  connections: Array<ConnectionData<TMeta>>,
  id: string
): Array<ConnectionData<TMeta>> {
  return connections.filter((connection) => normalizeConnection(connection).id !== id);
}

export function removeNode<TNodeMeta, TConnectionMeta>(
  snapshot: BoardSnapshot<TNodeMeta, TConnectionMeta>,
  id: NodeId
): BoardSnapshot<TNodeMeta, TConnectionMeta> {
  return {
    nodes: snapshot.nodes.filter((node) => node.id !== id),
    connections: snapshot.connections.filter((connection) => connection.from !== id && connection.to !== id),
    elements: snapshot.elements?.filter((element) => element.id !== id)
  };
}

export function removeNodeConnections<TMeta>(
  connections: Array<ConnectionData<TMeta>>,
  id: NodeId
): Array<ConnectionData<TMeta>> {
  return connections.filter((connection) => connection.from !== id && connection.to !== id);
}

export function toGraphNodes<TNodeMeta = unknown, TElementMeta = unknown>(
  nodes: Array<NodeData<TNodeMeta>>,
  elements: Array<ElementData<TElementMeta>> = []
): Array<GraphNode<TNodeMeta | TElementMeta>> {
  return [
    ...nodes.map((node) => ({
      ...node,
      kind: node.meta ? "custom" : "node"
    }) as GraphNode<TNodeMeta | TElementMeta>),
    ...elements.map((element) => ({
      ...element,
      kind: "element",
      shape: element.type
    }) as GraphNode<TNodeMeta | TElementMeta>)
  ];
}

export function addNodeToSnapshot<TNodeMeta, TConnectionMeta>(
  snapshot: BoardSnapshot<TNodeMeta, TConnectionMeta>,
  node: NodeData<TNodeMeta>
): BoardSnapshot<TNodeMeta, TConnectionMeta> {
  return {
    ...snapshot,
    nodes: [...snapshot.nodes, node]
  };
}

export function updateNodeInSnapshot<TNodeMeta, TConnectionMeta>(
  snapshot: BoardSnapshot<TNodeMeta, TConnectionMeta>,
  id: NodeId,
  patch: Partial<NodeData<TNodeMeta>>
): BoardSnapshot<TNodeMeta, TConnectionMeta> {
  return {
    ...snapshot,
    nodes: snapshot.nodes.map((node) => (node.id === id ? { ...node, ...patch } : node)),
    elements: snapshot.elements?.map((element) => (element.id === id ? { ...element, ...patch } : element))
  };
}

export function resizeNodeInSnapshot<TNodeMeta, TConnectionMeta>(
  snapshot: BoardSnapshot<TNodeMeta, TConnectionMeta>,
  id: NodeId,
  size: Partial<Size>
): BoardSnapshot<TNodeMeta, TConnectionMeta> {
  return updateNodeInSnapshot(snapshot, id, size as Partial<NodeData<TNodeMeta>>);
}

export function connectSnapshot<TNodeMeta, TConnectionMeta>(
  snapshot: BoardSnapshot<TNodeMeta, TConnectionMeta>,
  connection: ConnectionData<TConnectionMeta>
): BoardSnapshot<TNodeMeta, TConnectionMeta> {
  return {
    ...snapshot,
    connections: upsertConnection(snapshot.connections, connection)
  };
}

export function deleteItemFromSnapshot<TNodeMeta, TConnectionMeta>(
  snapshot: BoardSnapshot<TNodeMeta, TConnectionMeta>,
  id: NodeId
): BoardSnapshot<TNodeMeta, TConnectionMeta> {
  return removeNode(snapshot, id);
}

export function serializeSnapshot(snapshot: BoardSnapshot): string {
  return JSON.stringify(snapshot);
}

export function deserializeSnapshot<TNodeMeta = unknown, TConnectionMeta = unknown>(value: string): BoardSnapshot<TNodeMeta, TConnectionMeta> {
  const parsed = JSON.parse(value) as BoardSnapshot<TNodeMeta, TConnectionMeta>;

  return {
    nodes: parsed.nodes ?? [],
    connections: parsed.connections ?? [],
    elements: parsed.elements ?? []
  };
}

export function applyGridLayout<TNodeMeta, TConnectionMeta>(
  snapshot: BoardSnapshot<TNodeMeta, TConnectionMeta>,
  options: { origin?: Point; columns?: number; gap?: Partial<Size> } = {}
): BoardSnapshot<TNodeMeta, TConnectionMeta> {
  const origin = options.origin ?? { x: 80, y: 80 };
  const columns = options.columns ?? 3;
  const gap = { width: options.gap?.width ?? 220, height: options.gap?.height ?? 140 };

  return {
    ...snapshot,
    nodes: snapshot.nodes.map((node, index) => ({
      ...node,
      x: origin.x + (index % columns) * gap.width,
      y: origin.y + Math.floor(index / columns) * gap.height
    })),
    elements: snapshot.elements?.map((element, index) => {
      const offset = snapshot.nodes.length + index;

      return {
        ...element,
        x: origin.x + (offset % columns) * gap.width,
        y: origin.y + Math.floor(offset / columns) * gap.height
      };
    })
  };
}

export function createHistory<T>(present: T): HistoryState<T> {
  return {
    past: [],
    present,
    future: []
  };
}

export function pushHistory<T>(history: HistoryState<T>, present: T): HistoryState<T> {
  return {
    past: [...history.past, history.present],
    present,
    future: []
  };
}

export function undoHistory<T>(history: HistoryState<T>): HistoryState<T> {
  const previous = history.past[history.past.length - 1];

  if (!previous) {
    return history;
  }

  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future]
  };
}

export function redoHistory<T>(history: HistoryState<T>): HistoryState<T> {
  const next = history.future[0];

  if (!next) {
    return history;
  }

  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1)
  };
}

export function validateSnapshot(snapshot: BoardSnapshot): string[] {
  const errors: string[] = [];
  const nodeIds = new Set([...snapshot.nodes.map((node) => node.id), ...(snapshot.elements ?? []).map((element) => element.id)]);

  for (const node of snapshot.nodes) {
    if (!node.id) {
      errors.push("Every node needs a non-empty id.");
    }
  }

  for (const element of snapshot.elements ?? []) {
    if (!element.id) {
      errors.push("Every element needs a non-empty id.");
    }
  }

  for (const connection of snapshot.connections) {
    if (!nodeIds.has(connection.from)) {
      errors.push(`Connection '${normalizeConnection(connection).id}' references missing source node '${connection.from}'.`);
    }

    if (!nodeIds.has(connection.to)) {
      errors.push(`Connection '${normalizeConnection(connection).id}' references missing target node '${connection.to}'.`);
    }
  }

  return errors;
}
