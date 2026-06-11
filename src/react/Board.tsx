import {
  Children,
  cloneElement,
  isValidElement,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  clampZoom,
  createConnectorPath,
  moveNode,
  normalizeConnection,
  removeConnection,
  removeNode,
  removeNodeConnections,
  upsertConnection,
  validateSnapshot,
  zoomViewport,
  type ConnectionData,
  type ElementData,
  type ElementKind,
  type GraphNode,
  type NodeData,
  type NodeId,
  type NodeRect,
  type Viewport
} from "../core";
import { BoardContext } from "./BoardContext";
import { Connector, type ConnectorProps } from "./Connector";
import { Controls } from "./Controls";
import { Element, type ElementProps } from "./Element";
import { Node, type NodeProps } from "./Node";
import "./styles.css";

export type NodeRenderItem = NodeData & {
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
};

export type ElementRenderItem = ElementData & {
  className?: string;
  style?: CSSProperties;
};

export type ShapeRenderProps = {
  element: ElementRenderItem;
  width: number;
  height: number;
};

export type ShapeDefinition = {
  type: ElementKind;
  render: (props: ShapeRenderProps) => ReactNode;
  renderIcon?: () => ReactNode;
};

export type RenderNodeProps = {
  node: NodeRenderItem;
  width: number;
  height: number;
  editing: boolean;
};

export type RenderElementProps = ShapeRenderProps & {
  editing: boolean;
};

export type RenderConnectionProps = {
  connection: ConnectionData;
  id: string;
  from: NodeRect;
  to: NodeRect;
  path: string;
  remove: () => void;
};

export type ContextActionScope = "board" | "item";

export type ContextActionContext = {
  scope: ContextActionScope;
  itemId?: NodeId;
  itemType?: "node" | "element";
  world: { x: number; y: number };
  board: { x: number; y: number };
  nodes: NodeRenderItem[];
  elements: ElementRenderItem[];
  graphNodes: GraphNode[];
};

export type ContextAction = {
  id: string;
  label: string;
  scope: ContextActionScope;
  danger?: boolean;
  disabled?: (context: ContextActionContext) => boolean;
  onSelect: (context: ContextActionContext) => void;
};

export type RenderContextMenuProps = {
  context: ContextActionContext;
  actions: Array<ContextAction & { disabledValue: boolean }>;
};

export type CreateNodeContext = {
  world: { x: number; y: number };
  board: { x: number; y: number };
  nodes: NodeRenderItem[];
  elements: ElementRenderItem[];
  graphNodes: GraphNode[];
};

export type ActionOverride = (args: {
  context: ContextActionContext;
  defaultAction: ContextAction;
}) => void;

export type BoardGraphState = {
  nodes: NodeRenderItem[];
  elements: ElementRenderItem[];
  graphNodes: GraphNode[];
  connections: ConnectionData[];
};

export type BeforeConnectContext = {
  connection: ConnectionData;
  fromNode: GraphNode;
  toNode: GraphNode;
  fromRect: NodeRect;
  toRect: NodeRect;
};

export type BoardValidator = (snapshot: {
  nodes: NodeRenderItem[];
  connections: ConnectionData[];
  elements: ElementRenderItem[];
}) => string[];

export type BoardProps = {
  nodes?: NodeRenderItem[];
  connections?: ConnectionData[];
  elements?: ElementRenderItem[];
  defaultNodes?: NodeRenderItem[];
  defaultConnections?: ConnectionData[];
  defaultElements?: ElementRenderItem[];
  children?: ReactNode;
  editable?: boolean;
  className?: string;
  style?: CSSProperties;
  nodeWidth?: number;
  nodeHeight?: number;
  pannable?: boolean;
  zoomable?: boolean;
  minZoom?: number;
  maxZoom?: number;
  defaultViewport?: Viewport;
  onNodesChange?: (nodes: NodeRenderItem[]) => void;
  onConnectionsChange?: (connections: ConnectionData[]) => void;
  onElementsChange?: (elements: ElementRenderItem[]) => void;
  onViewportChange?: (viewport: Viewport) => void;
  onSnapshotError?: (errors: string[]) => void;
  showNavigationControls?: boolean;
  shapes?: ShapeDefinition[];
  contextActions?: ContextAction[];
  actionOverrides?: Record<string, ActionOverride>;
  hiddenActions?: string[];
  validators?: BoardValidator[];
  nodeFactory?: (context: CreateNodeContext) => NodeRenderItem;
  elementFactory?: (context: CreateNodeContext & { type: ElementKind }) => ElementRenderItem;
  createId?: (context: { graphNodes: GraphNode[]; type: "node" | "element"; elementType?: ElementKind }) => string;
  createLabel?: (context: { id: string; graphNodes: GraphNode[]; type: "node" | "element"; elementType?: ElementKind }) => string;
  renderNode?: (props: RenderNodeProps) => ReactNode;
  renderElement?: (props: RenderElementProps) => ReactNode;
  renderConnection?: (props: RenderConnectionProps) => ReactNode;
  renderContextMenuContent?: (props: RenderContextMenuProps) => ReactNode;
  renderContextMenu?: (props: RenderContextMenuProps) => ReactNode;
  onNodeClick?: (node: NodeRenderItem) => void;
  onNodeDoubleClick?: (node: NodeRenderItem) => void;
  onElementClick?: (element: ElementRenderItem) => void;
  onElementDoubleClick?: (element: ElementRenderItem) => void;
  onGraphChange?: (state: BoardGraphState) => void;
  onBeforeConnect?: (context: BeforeConnectContext) => ConnectionData | null;
  onConnect?: (connection: ConnectionData) => void;
  onDelete?: (id: NodeId, type: "node" | "element") => void;
};

type DragState = {
  id: NodeId;
  type: "node" | "element";
  startPointer: { x: number; y: number };
  startNode: { x: number; y: number };
};

type PanState = {
  startPointer: { x: number; y: number };
  startViewport: Viewport;
};

type ContextMenuState = {
  type: "item" | "board";
  itemId?: NodeId;
  itemType?: "node" | "element";
  screen: { x: number; y: number };
  board: { x: number; y: number };
  world: { x: number; y: number };
};

type ConnectionDraft = {
  from: NodeId;
  pointer: { x: number; y: number };
};

type ResizeState = {
  id: NodeId;
  type: "node" | "element";
  startPointer: { x: number; y: number };
  startSize: { width: number; height: number };
};

type EditingState = {
  id: NodeId;
  type: "node" | "element";
};

const DEFAULT_NODE_WIDTH = 160;
const DEFAULT_NODE_HEIGHT = 72;
const DEFAULT_ELEMENT_WIDTH = 96;
const DEFAULT_ELEMENT_HEIGHT = 64;
const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };
const ELEMENT_KINDS: ElementKind[] = ["rectangle", "circle", "diamond", "triangle", "hexagon", "pill", "parallelogram"];

function isNodeElement(element: ReactElement): element is ReactElement<NodeProps> {
  return element.type === Node || (element.type as { displayName?: string }).displayName === Node.displayName;
}

function isConnectorElement(element: ReactElement): element is ReactElement<ConnectorProps> {
  return element.type === Connector || (element.type as { displayName?: string }).displayName === Connector.displayName;
}

function isElementElement(element: ReactElement): element is ReactElement<ElementProps> {
  return element.type === Element || (element.type as { displayName?: string }).displayName === Element.displayName;
}

function readChildren(children: ReactNode): {
  childNodes: NodeRenderItem[];
  childConnections: ConnectionData[];
  childElements: ElementRenderItem[];
} {
  const childNodes: NodeRenderItem[] = [];
  const childConnections: ConnectionData[] = [];
  const childElements: ElementRenderItem[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      return;
    }

    if (isNodeElement(child)) {
      const { children: nodeChildren, ...node } = child.props;
      childNodes.push({ ...node, children: nodeChildren });
    }

    if (isConnectorElement(child)) {
      childConnections.push(child.props);
    }

    if (isElementElement(child)) {
      childElements.push(child.props);
    }
  });

  return { childNodes, childConnections, childElements };
}

function getElementPolygon(type: ElementKind, width: number, height: number): string | null {
  if (type === "diamond") {
    return `${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}`;
  }

  if (type === "triangle") {
    return `${width / 2},0 ${width},${height} 0,${height}`;
  }

  if (type === "hexagon") {
    return `${width * 0.25},0 ${width * 0.75},0 ${width},${height / 2} ${width * 0.75},${height} ${width * 0.25},${height} 0,${height / 2}`;
  }

  if (type === "parallelogram") {
    return `${width * 0.2},0 ${width},0 ${width * 0.8},${height} 0,${height}`;
  }

  return null;
}

function renderElementShape(element: ElementRenderItem, customShape?: ShapeDefinition) {
  const width = element.width ?? DEFAULT_ELEMENT_WIDTH;
  const height = element.height ?? DEFAULT_ELEMENT_HEIGHT;

  if (customShape) {
    return customShape.render({ element, width, height });
  }

  const fill = element.fill ?? "#ffffff";
  const stroke = element.stroke ?? "#64748b";
  const commonProps = {
    className: ["nodes-connector-element-shape", element.className].filter(Boolean).join(" "),
    fill,
    stroke,
    style: element.style
  };
  const polygon = getElementPolygon(element.type, width, height);

  if (element.type === "circle") {
    return <ellipse {...commonProps} cx={width / 2} cy={height / 2} rx={width / 2} ry={height / 2} />;
  }

  if (element.type === "pill") {
    return <rect {...commonProps} width={width} height={height} rx={height / 2} ry={height / 2} />;
  }

  if (polygon) {
    return <polygon {...commonProps} points={polygon} />;
  }

  return <rect {...commonProps} width={width} height={height} rx={8} ry={8} />;
}

function getElementIcon(type: ElementKind, customShape?: ShapeDefinition) {
  if (customShape?.renderIcon) {
    return customShape.renderIcon();
  }

  const element: ElementRenderItem = {
    id: type,
    type,
    x: 0,
    y: 0,
    width: 16,
    height: 16,
    fill: "#f8fafc",
    stroke: "#475569"
  };

  return renderElementShape(element);
}

export function Board({
  nodes,
  connections,
  elements,
  defaultNodes,
  defaultConnections,
  defaultElements,
  children,
  editable = false,
  className,
  style,
  nodeWidth = DEFAULT_NODE_WIDTH,
  nodeHeight = DEFAULT_NODE_HEIGHT,
  pannable = true,
  zoomable = true,
  minZoom = 0.25,
  maxZoom = 2,
  defaultViewport = DEFAULT_VIEWPORT,
  onNodesChange,
  onConnectionsChange,
  onElementsChange,
  onViewportChange,
  onSnapshotError,
  showNavigationControls = true,
  shapes = [],
  contextActions = [],
  actionOverrides = {},
  hiddenActions = [],
  validators = [],
  nodeFactory,
  elementFactory,
  createId,
  createLabel,
  renderNode,
  renderElement,
  renderConnection,
  renderContextMenuContent,
  renderContextMenu,
  onNodeClick,
  onNodeDoubleClick,
  onElementClick,
  onElementDoubleClick,
  onGraphChange,
  onBeforeConnect,
  onConnect,
  onDelete
}: BoardProps) {
  const { childNodes, childConnections, childElements } = useMemo(() => readChildren(children), [children]);
  const [internalNodes, setInternalNodes] = useState<NodeRenderItem[]>(defaultNodes ?? childNodes);
  const [internalConnections, setInternalConnections] = useState<ConnectionData[]>(defaultConnections ?? childConnections);
  const [internalElements, setInternalElements] = useState<ElementRenderItem[]>(defaultElements ?? childElements);
  const [viewport, setViewport] = useState<Viewport>(defaultViewport);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [panState, setPanState] = useState<PanState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [connectionDraft, setConnectionDraft] = useState<ConnectionDraft | null>(null);
  const [editingItem, setEditingItem] = useState<EditingState | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);

  const currentNodes = nodes ?? internalNodes;
  const currentConnections = connections ?? internalConnections;
  const currentElements = elements ?? internalElements;
  const shapeMap = useMemo(() => new Map(shapes.map((shape) => [shape.type, shape])), [shapes]);
  const graphNodes = useMemo<GraphNode[]>(
    () => [
      ...currentNodes.map((node) => ({
        ...node,
        kind: node.children ? "custom" : "node"
      }) as GraphNode),
      ...currentElements.map((element) => ({
        ...element,
        kind: "element",
        shape: element.type
      }) as GraphNode)
    ],
    [currentElements, currentNodes]
  );
  const hiddenActionSet = useMemo(() => new Set(hiddenActions), [hiddenActions]);

  const nodeMap = useMemo(() => {
    return new Map(
      [
        ...currentNodes.map(
          (node) =>
            [
              node.id,
              {
                id: node.id,
                x: node.x,
                y: node.y,
                width: node.width ?? nodeWidth,
                height: node.height ?? nodeHeight
              } satisfies NodeRect
            ] as const
        ),
        ...currentElements.map(
          (element) =>
            [
              element.id,
              {
                id: element.id,
                x: element.x,
                y: element.y,
                width: element.width ?? DEFAULT_ELEMENT_WIDTH,
                height: element.height ?? DEFAULT_ELEMENT_HEIGHT
              } satisfies NodeRect
            ] as const
        )
      ]
    );
  }, [currentElements, currentNodes, nodeHeight, nodeWidth]);

  useEffect(() => {
    const snapshot = { nodes: currentNodes, connections: currentConnections, elements: currentElements };
    const errors = [...validateSnapshot(snapshot), ...validators.flatMap((validator) => validator(snapshot))];
    if (errors.length > 0) {
      onSnapshotError?.(errors);
    }
  }, [currentConnections, currentElements, currentNodes, onSnapshotError, validators]);

  useEffect(() => {
    onGraphChange?.({
      nodes: currentNodes,
      elements: currentElements,
      graphNodes,
      connections: currentConnections
    });
  }, [currentConnections, currentElements, currentNodes, graphNodes, onGraphChange]);

  useEffect(() => {
    if (!panState) {
      return;
    }

    const activePan = panState;

    function onPointerMove(event: PointerEvent) {
      commitViewport({
        ...activePan.startViewport,
        x: activePan.startViewport.x + event.clientX - activePan.startPointer.x,
        y: activePan.startViewport.y + event.clientY - activePan.startPointer.y
      });
    }

    function onPointerUp() {
      setPanState(null);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [panState]);

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const activeDrag = dragState;

    function onPointerMove(event: PointerEvent) {
      const position = {
        x: activeDrag.startNode.x + (event.clientX - activeDrag.startPointer.x) / viewport.zoom,
        y: activeDrag.startNode.y + (event.clientY - activeDrag.startPointer.y) / viewport.zoom
      };

      if (activeDrag.type === "element") {
        commitElements(currentElements.map((element) => (element.id === activeDrag.id ? { ...element, ...position } : element)));
        return;
      }

      const nextNodes = moveNode(currentNodes, activeDrag.id, position);
      commitNodes(nextNodes);
    }

    function onPointerUp() {
      setDragState(null);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [currentElements, currentNodes, dragState, viewport.zoom]);

  useEffect(() => {
    if (!resizeState) {
      return;
    }

    const activeResize = resizeState;

    function onPointerMove(event: PointerEvent) {
      const width = Math.max(64, activeResize.startSize.width + (event.clientX - activeResize.startPointer.x) / viewport.zoom);
      const height = Math.max(40, activeResize.startSize.height + (event.clientY - activeResize.startPointer.y) / viewport.zoom);

      if (activeResize.type === "element") {
        commitElements(
          currentElements.map((element) =>
            element.id === activeResize.id
              ? {
                  ...element,
                  width,
                  height
                }
              : element
          )
        );
        return;
      }

      commitNodes(
        currentNodes.map((node) =>
          node.id === activeResize.id
            ? {
                ...node,
                width,
                height
              }
            : node
        )
      );
    }

    function onPointerUp() {
      setResizeState(null);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [currentElements, currentNodes, resizeState, viewport.zoom]);

  useEffect(() => {
    if (!connectionDraft) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setConnectionDraft(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [connectionDraft]);

  function commitNodes(nextNodes: NodeRenderItem[]) {
    if (!nodes) {
      setInternalNodes(nextNodes);
    }

    onNodesChange?.(nextNodes);
  }

  function commitConnections(nextConnections: ConnectionData[]) {
    if (!connections) {
      setInternalConnections(nextConnections);
    }

    onConnectionsChange?.(nextConnections);
  }

  function commitElements(nextElements: ElementRenderItem[]) {
    if (!elements) {
      setInternalElements(nextElements);
    }

    onElementsChange?.(nextElements);
  }

  function commitSnapshot(nextNodes: NodeRenderItem[], nextConnections: ConnectionData[]) {
    commitNodes(nextNodes);
    commitConnections(nextConnections);
  }

  function commitViewport(nextViewport: Viewport) {
    setViewport(nextViewport);
    onViewportChange?.(nextViewport);
  }

  function createDefaultId(type: "node" | "element", elementType?: ElementKind) {
    return createId?.({ graphNodes, type, elementType }) ?? `${type}-${Date.now().toString(36)}`;
  }

  function createDefaultLabel(id: string, type: "node" | "element", elementType?: ElementKind) {
    return createLabel?.({ id, graphNodes, type, elementType }) ?? (type === "node" ? `Node ${currentNodes.length + 1}` : undefined);
  }

  function getUniqueId(id: string) {
    const ids = new Set(graphNodes.map((node) => node.id));

    if (!ids.has(id)) {
      return id;
    }

    let index = 2;
    let nextId = `${id}-${index}`;

    while (ids.has(nextId)) {
      index += 1;
      nextId = `${id}-${index}`;
    }

    onSnapshotError?.([`Duplicate id '${id}' was replaced with '${nextId}'.`]);
    return nextId;
  }

  function createNodeContext(world: { x: number; y: number }, board: { x: number; y: number }): CreateNodeContext {
    return {
      world,
      board,
      nodes: currentNodes,
      elements: currentElements,
      graphNodes
    };
  }

  function createNodeAt(world: { x: number; y: number }, board: { x: number; y: number }): NodeRenderItem {
    const context = createNodeContext(world, board);
    const factoryNode = nodeFactory?.(context);
    const id = getUniqueId(factoryNode?.id ?? createDefaultId("node"));

    if (factoryNode) {
      return { ...factoryNode, id };
    }

    return {
      id,
      label: createDefaultLabel(id, "node"),
      x: world.x - nodeWidth / 2,
      y: world.y - nodeHeight / 2,
      width: nodeWidth,
      height: nodeHeight
    };
  }

  function createElementAt(type: ElementKind, world: { x: number; y: number }, board: { x: number; y: number }): ElementRenderItem {
    const context = { ...createNodeContext(world, board), type };
    const factoryElement = elementFactory?.(context);
    const id = getUniqueId(factoryElement?.id ?? createDefaultId("element", type));

    if (factoryElement) {
      return { ...factoryElement, id, type: factoryElement.type ?? type };
    }

    return {
      id,
      type,
      label: createDefaultLabel(id, "element", type),
      x: world.x - DEFAULT_ELEMENT_WIDTH / 2,
      y: world.y - DEFAULT_ELEMENT_HEIGHT / 2,
      width: DEFAULT_ELEMENT_WIDTH,
      height: DEFAULT_ELEMENT_HEIGHT,
      fill: "#ffffff",
      stroke: "#64748b"
    };
  }

  function getBoardAnchor() {
    const rect = boardRef.current?.getBoundingClientRect();

    if (!rect) {
      return { x: 0, y: 0 };
    }

    return {
      x: rect.width / 2,
      y: rect.height / 2
    };
  }

  function setZoom(nextZoom: number) {
    commitViewport(zoomViewport(viewport, nextZoom, getBoardAnchor(), minZoom, maxZoom));
  }

  function panBy(delta: { x: number; y: number }) {
    commitViewport({
      ...viewport,
      x: viewport.x + delta.x,
      y: viewport.y + delta.y
    });
  }

  function addNode() {
    const rect = boardRef.current?.getBoundingClientRect();
    const board = rect ? { x: rect.width / 2, y: rect.height / 2 } : { x: 240, y: 180 };
    const world = {
      x: (board.x - viewport.x) / viewport.zoom,
      y: (board.y - viewport.y) / viewport.zoom
    };
    const nextNode = createNodeAt(world, board);

    commitNodes([...currentNodes, nextNode]);
  }

  function addNodeAt(world: { x: number; y: number }, board = contextMenu?.board ?? { x: 0, y: 0 }) {
    const nextNode = createNodeAt(world, board);

    commitNodes([...currentNodes, nextNode]);
    setEditingItem({ id: nextNode.id, type: "node" });
    setContextMenu(null);
  }

  function addElementAt(type: ElementKind, world: { x: number; y: number }, board = contextMenu?.board ?? { x: 0, y: 0 }) {
    const nextElement = createElementAt(type, world, board);

    commitElements([...currentElements, nextElement]);
    setContextMenu(null);
  }

  function updateNodeLabel(id: NodeId, label: string) {
    commitNodes(currentNodes.map((node) => (node.id === id ? { ...node, label } : node)));
  }

  function updateElementLabel(id: NodeId, label: string) {
    commitElements(currentElements.map((element) => (element.id === id ? { ...element, label } : element)));
  }

  function screenToBoardPoint(clientX: number, clientY: number) {
    const rect = boardRef.current?.getBoundingClientRect();

    return {
      x: clientX - (rect?.left ?? 0),
      y: clientY - (rect?.top ?? 0)
    };
  }

  function screenToWorldPoint(clientX: number, clientY: number) {
    const point = screenToBoardPoint(clientX, clientY);

    return {
      x: (point.x - viewport.x) / viewport.zoom,
      y: (point.y - viewport.y) / viewport.zoom
    };
  }

  function startConnectionFromItem(id: NodeId) {
    const item = nodeMap.get(id);

    if (!item) {
      return;
    }

    setContextMenu(null);
    setConnectionDraft({
      from: id,
      pointer: {
        x: item.x + item.width / 2,
        y: item.y + item.height / 2
      }
    });
  }

  function deleteItem(id: NodeId) {
    const itemType = currentElements.some((element) => element.id === id) ? "element" : "node";
    const next = removeNode({ nodes: currentNodes, connections: currentConnections, elements: currentElements }, id);
    commitSnapshot(next.nodes, next.connections);
    commitElements(next.elements ?? []);
    setContextMenu(null);
    setConnectionDraft((draft) => (draft?.from === id ? null : draft));
    onDelete?.(id, itemType);
  }

  function removeConnectionsForItem(id: NodeId) {
    commitConnections(removeNodeConnections(currentConnections, id));
    setContextMenu(null);
  }

  function handleNodePointerDown(event: ReactPointerEvent, node: NodeRenderItem) {
    const target = event.target as HTMLElement;

    if (!editable || editingItem?.id === node.id || target.closest(".nodes-connector-resize-handle")) {
      return;
    }

    event.stopPropagation();
    setDragState({
      id: node.id,
      type: "node",
      startPointer: { x: event.clientX, y: event.clientY },
      startNode: { x: node.x, y: node.y }
    });
  }

  function handleElementPointerDown(event: ReactPointerEvent, element: ElementRenderItem) {
    const target = event.target as HTMLElement;

    if (!editable || editingItem?.id === element.id || target.closest(".nodes-connector-resize-handle")) {
      return;
    }

    event.stopPropagation();
    setDragState({
      id: element.id,
      type: "element",
      startPointer: { x: event.clientX, y: event.clientY },
      startNode: { x: element.x, y: element.y }
    });
  }

  function handleBoardPointerDown(event: ReactPointerEvent) {
    setContextMenu(null);

    if (connectionDraft) {
      return;
    }

    if (!pannable || event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest(".nodes-connector-node") || target.closest(".nodes-connector-controls") || target.closest(".nodes-connector-context-menu")) {
      return;
    }

    setPanState({
      startPointer: { x: event.clientX, y: event.clientY },
      startViewport: viewport
    });
  }

  function handleBoardPointerMove(event: ReactPointerEvent) {
    if (!connectionDraft) {
      return;
    }

    setConnectionDraft({
      ...connectionDraft,
      pointer: screenToWorldPoint(event.clientX, event.clientY)
    });
  }

  function handleBoardClick() {
    if (connectionDraft) {
      setConnectionDraft(null);
    }

    setContextMenu(null);
    setEditingItem(null);
  }

  function handleWheel(event: ReactWheelEvent) {
    if (!zoomable) {
      return;
    }

    event.preventDefault();
    const rect = boardRef.current?.getBoundingClientRect();
    const anchor = rect
      ? {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        }
      : getBoardAnchor();
    const nextZoom = clampZoom(viewport.zoom * (event.deltaY > 0 ? 0.9 : 1.1), minZoom, maxZoom);

    commitViewport(zoomViewport(viewport, nextZoom, anchor, minZoom, maxZoom));
  }

  function handleNodeContextMenu(event: ReactMouseEvent, node: NodeRenderItem) {
    if (!editable) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      type: "item",
      itemId: node.id,
      itemType: "node",
      screen: { x: event.clientX, y: event.clientY },
      board: screenToBoardPoint(event.clientX, event.clientY),
      world: screenToWorldPoint(event.clientX, event.clientY)
    });
  }

  function handleElementContextMenu(event: ReactMouseEvent, element: ElementRenderItem) {
    if (!editable) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      type: "item",
      itemId: element.id,
      itemType: "element",
      screen: { x: event.clientX, y: event.clientY },
      board: screenToBoardPoint(event.clientX, event.clientY),
      world: screenToWorldPoint(event.clientX, event.clientY)
    });
  }

  function handleBoardContextMenu(event: ReactMouseEvent) {
    if (!editable) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest(".nodes-connector-node") || target.closest(".nodes-connector-controls") || target.closest(".nodes-connector-context-menu")) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    setEditingItem(null);
    setContextMenu({
      type: "board",
      screen: { x: event.clientX, y: event.clientY },
      board: screenToBoardPoint(event.clientX, event.clientY),
      world: screenToWorldPoint(event.clientX, event.clientY)
    });
  }

  function completeConnectionToItem(id: NodeId) {
    if (!connectionDraft) {
      return;
    }

    if (connectionDraft.from !== id) {
      const connection = { from: connectionDraft.from, to: id };
      const fromNode = graphNodes.find((node) => node.id === connectionDraft.from);
      const toNode = graphNodes.find((node) => node.id === id);
      const fromRect = nodeMap.get(connectionDraft.from);
      const toRect = nodeMap.get(id);

      if (!fromNode || !toNode || !fromRect || !toRect) {
        setConnectionDraft(null);
        return;
      }

      const beforeConnectResult = onBeforeConnect?.({
        connection,
        fromNode,
        toNode,
        fromRect,
        toRect
      });
      const nextConnection = beforeConnectResult === undefined ? connection : beforeConnectResult;

      if (nextConnection) {
        commitConnections(upsertConnection(currentConnections, nextConnection));
        onConnect?.(nextConnection);
      }
    }

    setConnectionDraft(null);
  }

  function handleNodeClick(event: ReactMouseEvent, node: NodeRenderItem) {
    onNodeClick?.(node);

    if (!connectionDraft) {
      return;
    }

    event.stopPropagation();
    completeConnectionToItem(node.id);
  }

  function handleElementClick(event: ReactMouseEvent, element: ElementRenderItem) {
    onElementClick?.(element);

    if (!connectionDraft) {
      return;
    }

    event.stopPropagation();
    completeConnectionToItem(element.id);
  }

  function handleNodeDoubleClick(event: ReactMouseEvent, node: NodeRenderItem) {
    if (!editable) {
      return;
    }

    event.stopPropagation();
    setContextMenu(null);
    setEditingItem({ id: node.id, type: "node" });
    onNodeDoubleClick?.(node);
  }

  function handleElementDoubleClick(event: ReactMouseEvent, element: ElementRenderItem) {
    if (!editable) {
      return;
    }

    event.stopPropagation();
    setContextMenu(null);
    setEditingItem({ id: element.id, type: "element" });
    onElementDoubleClick?.(element);
  }

  function handleResizeStart(event: ReactPointerEvent, id: NodeId, type: "node" | "element", width: number, height: number) {
    event.preventDefault();
    event.stopPropagation();
    setResizeState({
      id,
      type,
      startPointer: { x: event.clientX, y: event.clientY },
      startSize: { width, height }
    });
  }

  const rootClassName = ["nodes-connector-board", editable ? "is-editable" : "", className].filter(Boolean).join(" ");
  const activeMenuConnections = contextMenu?.type === "item" && contextMenu.itemId
    ? currentConnections.filter((connection) => connection.from === contextMenu.itemId || connection.to === contextMenu.itemId)
    : [];
  const menuContext: ContextActionContext | null = contextMenu
    ? {
        scope: contextMenu.type === "board" ? "board" : "item",
        itemId: contextMenu.itemId,
        itemType: contextMenu.itemType,
        world: contextMenu.world,
        board: contextMenu.board,
        nodes: currentNodes,
        elements: currentElements,
        graphNodes
      }
    : null;
  const internalActions = useMemo<ContextAction[]>(() => {
    if (!contextMenu) {
      return [];
    }

    if (contextMenu.type === "board") {
      return [
        {
          id: "add-node",
          label: "Add node",
          scope: "board",
          onSelect: (context) => addNodeAt(context.world, context.board)
        },
        ...ELEMENT_KINDS.map((kind) => ({
          id: `add-${kind}`,
          label: `Add ${kind}`,
          scope: "board" as const,
          onSelect: (context: ContextActionContext) => addElementAt(kind, context.world, context.board)
        })),
        ...shapes.map((shape) => ({
          id: `add-${shape.type}`,
          label: `Add ${shape.type}`,
          scope: "board" as const,
          onSelect: (context: ContextActionContext) => addElementAt(shape.type, context.world, context.board)
        }))
      ];
    }

    return [
      {
        id: "connect",
        label: "Add connection",
        scope: "item",
        onSelect: (context) => context.itemId && startConnectionFromItem(context.itemId)
      },
      {
        id: "remove-connections",
        label: "Remove connections",
        scope: "item",
        disabled: () => activeMenuConnections.length === 0,
        onSelect: (context) => context.itemId && removeConnectionsForItem(context.itemId)
      },
      {
        id: "delete",
        label: contextMenu.itemType === "element" ? "Delete element" : "Delete node",
        scope: "item",
        danger: true,
        onSelect: (context) => context.itemId && deleteItem(context.itemId)
      }
    ];
  }, [activeMenuConnections.length, contextMenu, shapes]);
  const menuActions = menuContext
    ? [...internalActions, ...contextActions.filter((action) => action.scope === menuContext.scope)]
        .filter((action) => !hiddenActionSet.has(action.id))
        .map((action) => {
          const override = actionOverrides[action.id];
          const nextAction = override
            ? {
                ...action,
                onSelect: (context: ContextActionContext) => override({ context, defaultAction: action })
              }
            : action;

          return {
            ...nextAction,
            disabledValue: nextAction.disabled?.(menuContext) ?? false
          };
        })
    : [];
  const draftPath = useMemo(() => {
    if (!connectionDraft) {
      return null;
    }

    const from = nodeMap.get(connectionDraft.from);

    if (!from) {
      return null;
    }

    const start = {
      x: from.x + from.width / 2,
      y: from.y + from.height / 2
    };
    const distance = Math.max(80, Math.abs(connectionDraft.pointer.x - start.x) * 0.5);

    return `M ${start.x} ${start.y} C ${start.x + distance} ${start.y}, ${connectionDraft.pointer.x - distance} ${connectionDraft.pointer.y}, ${connectionDraft.pointer.x} ${connectionDraft.pointer.y}`;
  }, [connectionDraft, nodeMap]);
  const contextValue = {
    nodes: [
      ...currentNodes.map((node) => ({ id: node.id, label: node.label })),
      ...currentElements.map((element) => ({ id: element.id, label: element.label ?? element.type }))
    ],
    connections: currentConnections,
    viewport,
    canEdit: editable,
    canPan: pannable,
    canZoom: zoomable,
    addNode,
    addConnection: (connection: ConnectionData) => commitConnections(upsertConnection(currentConnections, connection)),
    removeConnection: (id: string) => commitConnections(removeConnection(currentConnections, id)),
    zoomIn: () => setZoom(viewport.zoom * 1.2),
    zoomOut: () => setZoom(viewport.zoom / 1.2),
    resetViewport: () => commitViewport(DEFAULT_VIEWPORT),
    panBy,
    deleteNode: deleteItem,
    removeConnectionsForNode: removeConnectionsForItem
  };

  return (
    <BoardContext.Provider value={contextValue}>
      <div
        ref={boardRef}
        className={rootClassName}
        style={style}
        onPointerDown={handleBoardPointerDown}
        onPointerMove={handleBoardPointerMove}
        onClick={handleBoardClick}
        onWheel={handleWheel}
        onContextMenu={handleBoardContextMenu}
      >
        <div
          className="nodes-connector-viewport"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
          }}
        >
          <svg className="nodes-connector-layer" aria-hidden="true">
            <defs>
              <marker id="nodes-connector-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" />
              </marker>
            </defs>
            {currentConnections.map((connection) => {
              const normalized = normalizeConnection(connection);
              const from = nodeMap.get(normalized.from);
              const to = nodeMap.get(normalized.to);

              if (!from || !to) {
                return null;
              }

              const path = createConnectorPath(from, to);
              const remove = () => editable && commitConnections(removeConnection(currentConnections, normalized.id));

              return (
                <g key={normalized.id} className="nodes-connector-connection">
                  {renderConnection ? (
                    renderConnection({ connection, id: normalized.id, from, to, path: path.d, remove })
                  ) : (
                    <>
                      <path className="nodes-connector-path" d={path.d} markerEnd="url(#nodes-connector-arrow)" onClick={remove} />
                      {connection.label ? (
                        <text className="nodes-connector-label" x={(path.start.x + path.end.x) / 2} y={(path.start.y + path.end.y) / 2 - 8}>
                          {connection.label}
                        </text>
                      ) : null}
                    </>
                  )}
                </g>
              );
            })}
            {draftPath ? <path className="nodes-connector-draft-path" d={draftPath} /> : null}
          </svg>

          {currentElements.map((element) => {
            const width = element.width ?? DEFAULT_ELEMENT_WIDTH;
            const height = element.height ?? DEFAULT_ELEMENT_HEIGHT;

            return (
              <div
                key={element.id}
                className={["nodes-connector-node", "is-geometry", connectionDraft?.from === element.id ? "is-connecting" : ""]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  left: element.x,
                  top: element.y,
                  width,
                  height
                }}
                onPointerDown={(event) => handleElementPointerDown(event, element)}
                onContextMenu={(event) => handleElementContextMenu(event, element)}
                onClick={(event) => handleElementClick(event, element)}
                onDoubleClick={(event) => handleElementDoubleClick(event, element)}
              >
                <svg className="nodes-connector-geometry-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
                  {renderElement
                    ? renderElement({
                        element,
                        width,
                        height,
                        editing: editingItem?.id === element.id && editingItem.type === "element"
                      })
                    : renderElementShape(element, shapeMap.get(element.type))}
                </svg>
                <div className="nodes-connector-geometry-label">
                  {editingItem?.id === element.id && editingItem.type === "element" ? (
                    <input
                      className="nodes-connector-node-input"
                      value={element.label ?? ""}
                      autoFocus
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                      onChange={(event) => updateElementLabel(element.id, event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === "Escape") {
                          setEditingItem(null);
                        }
                      }}
                    />
                  ) : (
                    element.label
                  )}
                </div>
                {editingItem?.id === element.id && editingItem.type === "element" ? (
                  <button
                    type="button"
                    className="nodes-connector-resize-handle"
                    aria-label="Resize element"
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => handleResizeStart(event, element.id, "element", width, height)}
                  />
                ) : null}
              </div>
            );
          })}

          {currentNodes.map((node) => {
            const width = node.width ?? nodeWidth;
            const height = node.height ?? nodeHeight;
            const hasCustomContent = node.children != null;
            const nodeStyle: CSSProperties = {
              left: node.x,
              top: node.y,
              ...node.style
            };

            if (!hasCustomContent || node.width != null || editingItem?.id === node.id) {
              nodeStyle.width = width;
            }

            if (!hasCustomContent || node.height != null || editingItem?.id === node.id) {
              nodeStyle.minHeight = height;
            }

            return (
              <div
                key={node.id}
                className={[
                  "nodes-connector-node",
                  hasCustomContent ? "is-custom" : "is-default",
                  connectionDraft?.from === node.id ? "is-connecting" : "",
                  node.className
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={nodeStyle}
                onPointerDown={(event) => handleNodePointerDown(event, node)}
                onContextMenu={(event) => handleNodeContextMenu(event, node)}
                onClick={(event) => handleNodeClick(event, node)}
                onDoubleClick={(event) => handleNodeDoubleClick(event, node)}
              >
                <div className={["nodes-connector-node-content", node.contentClassName].filter(Boolean).join(" ")}>
                  {editingItem?.id === node.id && editingItem.type === "node" && !hasCustomContent ? (
                    <input
                      className="nodes-connector-node-input"
                      value={node.label ?? ""}
                      autoFocus
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                      onChange={(event) => updateNodeLabel(node.id, event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === "Escape") {
                          setEditingItem(null);
                        }
                      }}
                    />
                  ) : (
                    renderNode?.({ node, width, height, editing: editingItem?.id === node.id && editingItem.type === "node" }) ??
                    node.children ?? <span>{node.label ?? node.id}</span>
                  )}
                </div>
                {editingItem?.id === node.id && editingItem.type === "node" ? (
                  <button
                    type="button"
                    className="nodes-connector-resize-handle"
                    aria-label="Resize node"
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => handleResizeStart(event, node.id, "node", width, height)}
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        {contextMenu && menuContext && renderContextMenu ? renderContextMenu({ context: menuContext, actions: menuActions }) : null}

        {contextMenu && menuContext && renderContextMenuContent ? (
          <div
            className="nodes-connector-context-menu"
            style={{ left: contextMenu.board.x, top: contextMenu.board.y }}
            role="menu"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {renderContextMenuContent({ context: menuContext, actions: menuActions })}
          </div>
        ) : null}

        {contextMenu?.type === "item" && contextMenu.itemId && !renderContextMenu && !renderContextMenuContent ? (
          <div
            className="nodes-connector-context-menu"
            style={{ left: contextMenu.board.x, top: contextMenu.board.y }}
            role="menu"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {menuActions
              .filter((action) => action.id === "add-node" || !action.id.startsWith("add-"))
              .map((action) => (
                <button
                  key={action.id}
                  type="button"
                  role="menuitem"
                  className={action.danger ? "is-danger" : undefined}
                  disabled={action.disabledValue}
                  onClick={() => {
                    if (menuContext) {
                      action.onSelect(menuContext);
                    }
                  }}
                >
                  {action.label}
                </button>
              ))}
            {activeMenuConnections.map((connection) => {
              const normalized = normalizeConnection(connection);

              return (
                <button
                  key={normalized.id}
                  type="button"
                  role="menuitem"
                  className="nodes-connector-context-subitem"
                  onClick={() => {
                    commitConnections(removeConnection(currentConnections, normalized.id));
                    setContextMenu(null);
                  }}
                >
                  {normalized.from} {"->"} {normalized.to}
                </button>
              );
            })}
          </div>
        ) : null}

        {contextMenu?.type === "board" && !renderContextMenu && !renderContextMenuContent ? (
          <div
            className="nodes-connector-context-menu nodes-connector-board-menu"
            style={{ left: contextMenu.board.x, top: contextMenu.board.y }}
            role="menu"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {menuActions
              .filter((action) => action.id === "add-node" || !action.id.startsWith("add-"))
              .map((action) => (
                <button
                  key={action.id}
                  type="button"
                  role="menuitem"
                  className={action.danger ? "is-danger" : undefined}
                  disabled={action.disabledValue}
                  onClick={() => {
                    if (menuContext) {
                      action.onSelect(menuContext);
                    }
                  }}
                >
                  {action.label}
                </button>
              ))}
            <div className="nodes-connector-element-picker" aria-label="Element shapes">
              {menuActions
                .filter((action) => action.id.startsWith("add-") && action.id !== "add-node")
                .map((action) => {
                  const kind = action.id.slice(4) as ElementKind;
                  const customShape = shapeMap.get(kind);

                  return (
                    <button
                      key={action.id}
                      type="button"
                      title={action.label}
                      disabled={action.disabledValue}
                      onClick={() => {
                        if (menuContext) {
                          action.onSelect(menuContext);
                        }
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                        {getElementIcon(kind, customShape)}
                      </svg>
                    </button>
                  );
                })}
            </div>
          </div>
        ) : null}

        {showNavigationControls && (pannable || zoomable) ? <Controls variant="navigation" position="bottom-right" /> : null}

        {children
          ? Children.map(children, (child) => {
              if (!isValidElement(child) || isNodeElement(child) || isConnectorElement(child) || isElementElement(child)) {
                return null;
              }

              return cloneElement(child);
            })
          : null}
      </div>
    </BoardContext.Provider>
  );
}
