export type NodeId = string;
export type ConnectionId = string;

export type Point = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type NodeData<TMeta = unknown> = Point &
  Partial<Size> & {
    id: NodeId;
    label?: string;
    meta?: TMeta;
  };

export type ConnectionData<TMeta = unknown> = {
  id?: ConnectionId;
  from: NodeId;
  to: NodeId;
  label?: string;
  meta?: TMeta;
};

export type BuiltinElementKind = "rectangle" | "circle" | "diamond" | "triangle" | "hexagon" | "pill" | "parallelogram";
export type ElementKind = BuiltinElementKind | (string & {});

export type GraphNodeKind = "node" | "element" | "custom";

export type GraphNode<TMeta = unknown> = Point &
  Partial<Size> & {
    id: NodeId;
    kind: GraphNodeKind;
    label?: string;
    shape?: ElementKind;
    meta?: TMeta;
  };

export type ElementData<TMeta = unknown> = Point &
  Partial<Size> & {
    id: string;
    type: ElementKind;
    label?: string;
    fill?: string;
    stroke?: string;
    meta?: TMeta;
  };

export type BoardSnapshot<TNodeMeta = unknown, TConnectionMeta = unknown> = {
  nodes: Array<NodeData<TNodeMeta>>;
  connections: Array<ConnectionData<TConnectionMeta>>;
  elements?: ElementData[];
};

export type NodeRect = Point &
  Size & {
    id: NodeId;
  };

export type ConnectorPath = {
  start: Point;
  end: Point;
  d: string;
};

export type Viewport = Point & {
  zoom: number;
};

export type HistoryState<T> = {
  past: T[];
  present: T;
  future: T[];
};
