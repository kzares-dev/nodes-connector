import {
  Children,
  isValidElement,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode
} from "react";
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
  type PanResponderGestureState,
  type StyleProp,
  type ViewStyle
} from "react-native";
import { Circle, G, Path, Polygon, Rect, Svg } from "react-native-svg";
import {
  clampZoom,
  createConnectorPath,
  normalizeConnection,
  toGraphNodes,
  type ConnectionData,
  type ElementData,
  type ElementKind,
  type NodeId,
  type NodeRect,
  type Point,
  type Viewport
} from "../core";
import { Connector, type ConnectorProps } from "./Connector";
import { Element, type ElementProps } from "./Element";
import { Node, type NodeProps } from "./Node";
import { NativeBoardContext } from "./BoardContext";
import type {
  NativeElementRenderItem,
  NativeNodeRenderItem,
  NativeRenderConnectionProps,
  NativeRenderElementProps,
  NativeRenderNodeProps,
  NativeShapeDefinition
} from "./types";

const DEFAULT_NODE_SIZE = { width: 144, height: 72 };
const DEFAULT_ELEMENT_SIZE = { width: 112, height: 72 };
const BUILTIN_ELEMENT_KINDS = new Set<ElementKind>(["rectangle", "circle", "diamond", "triangle", "hexagon", "pill", "parallelogram"]);

export type BoardProps = {
  nodes?: NativeNodeRenderItem[];
  connections?: ConnectionData[];
  elements?: NativeElementRenderItem[];
  defaultNodes?: NativeNodeRenderItem[];
  defaultConnections?: ConnectionData[];
  defaultElements?: NativeElementRenderItem[];
  editable?: boolean;
  pannable?: boolean;
  zoomable?: boolean;
  defaultViewport?: Viewport;
  minZoom?: number;
  maxZoom?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  children?: ReactNode;
  shapes?: NativeShapeDefinition[];
  renderNode?: (props: NativeRenderNodeProps) => ReactNode;
  renderElement?: (props: NativeRenderElementProps) => ReactNode;
  renderConnection?: (props: NativeRenderConnectionProps) => ReactNode;
  onNodesChange?: (nodes: NativeNodeRenderItem[]) => void;
  onElementsChange?: (elements: NativeElementRenderItem[]) => void;
  onConnectionsChange?: (connections: ConnectionData[]) => void;
  onNodePress?: (node: NativeNodeRenderItem) => void;
  onElementPress?: (element: NativeElementRenderItem) => void;
  onConnect?: (connection: ConnectionData) => void;
};

function isNodeElement(child: ReactNode): child is ReactElement<NodeProps> {
  return isValidElement(child) && child.type === Node;
}

function isElementElement(child: ReactNode): child is ReactElement<ElementProps> {
  return isValidElement(child) && child.type === Element;
}

function isConnectorElement(child: ReactNode): child is ReactElement<ConnectorProps> {
  return isValidElement(child) && child.type === Connector;
}

function normalizeNode(node: NativeNodeRenderItem): NativeNodeRenderItem {
  return {
    width: DEFAULT_NODE_SIZE.width,
    height: DEFAULT_NODE_SIZE.height,
    ...node
  };
}

function normalizeElement(element: NativeElementRenderItem): NativeElementRenderItem {
  return {
    width: DEFAULT_ELEMENT_SIZE.width,
    height: DEFAULT_ELEMENT_SIZE.height,
    ...element
  };
}

function eventPoint(event: GestureResponderEvent): Point {
  return {
    x: event.nativeEvent.locationX ?? event.nativeEvent.pageX,
    y: event.nativeEvent.locationY ?? event.nativeEvent.pageY
  };
}

function renderBuiltinElement(type: ElementKind, element: NativeElementRenderItem, width: number, height: number) {
  const fill = element.fill ?? "#ffffff";
  const stroke = element.stroke ?? "#64748b";
  const strokeWidth = 1.5;

  if (type === "circle") {
    return <Circle cx={width / 2} cy={height / 2} r={Math.min(width, height) / 2 - strokeWidth} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
  }

  if (type === "diamond") {
    return <Polygon points={`${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
  }

  if (type === "triangle") {
    return <Polygon points={`${width / 2},0 ${width},${height} 0,${height}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
  }

  if (type === "hexagon") {
    return <Polygon points={`${width * 0.25},0 ${width * 0.75},0 ${width},${height / 2} ${width * 0.75},${height} ${width * 0.25},${height} 0,${height / 2}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
  }

  if (type === "pill") {
    return <Rect x={0.75} y={0.75} width={width - 1.5} height={height - 1.5} rx={height / 2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
  }

  if (type === "parallelogram") {
    return <Polygon points={`${width * 0.16},0 ${width},0 ${width * 0.84},${height} 0,${height}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
  }

  return <Rect x={0.75} y={0.75} width={width - 1.5} height={height - 1.5} rx={8} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
}

export function Board({
  nodes,
  connections,
  elements,
  defaultNodes = [],
  defaultConnections = [],
  defaultElements = [],
  editable = false,
  pannable = true,
  zoomable = true,
  defaultViewport = { x: 0, y: 0, zoom: 1 },
  minZoom = 0.4,
  maxZoom = 2,
  style,
  contentStyle,
  children,
  shapes = [],
  renderNode,
  renderElement,
  renderConnection,
  onNodesChange,
  onElementsChange,
  onConnectionsChange,
  onNodePress,
  onElementPress,
  onConnect
}: BoardProps) {
  const parsedChildren = useMemo(() => {
    const childNodes: NativeNodeRenderItem[] = [];
    const childElements: NativeElementRenderItem[] = [];
    const childConnections: ConnectionData[] = [];

    Children.forEach(children, (child) => {
      if (isNodeElement(child)) {
        childNodes.push(child.props as NativeNodeRenderItem);
      } else if (isElementElement(child)) {
        childElements.push(child.props as NativeElementRenderItem);
      } else if (isConnectorElement(child)) {
        childConnections.push(child.props);
      }
    });

    return { childNodes, childElements, childConnections };
  }, [children]);

  const [innerNodes, setInnerNodes] = useState<NativeNodeRenderItem[]>(() => defaultNodes);
  const [innerElements, setInnerElements] = useState<NativeElementRenderItem[]>(() => defaultElements);
  const [innerConnections, setInnerConnections] = useState<ConnectionData[]>(() => defaultConnections);
  const [viewport, setViewport] = useState<Viewport>(defaultViewport);
  const [selectedId, setSelectedId] = useState<NodeId | null>(null);
  const [editingId, setEditingId] = useState<NodeId | null>(null);
  const [connectionDraft, setConnectionDraft] = useState<NodeId | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
  const dragStart = useRef<{ id: NodeId | null; nodes: NativeNodeRenderItem[]; elements: NativeElementRenderItem[]; viewport: Viewport }>({
    id: null,
    nodes: [],
    elements: [],
    viewport: defaultViewport
  });

  const currentNodes = (nodes ?? (parsedChildren.childNodes.length ? parsedChildren.childNodes : innerNodes)).map(normalizeNode);
  const currentElements = (elements ?? (parsedChildren.childElements.length ? parsedChildren.childElements : innerElements)).map(normalizeElement);
  const currentConnections = connections ?? (parsedChildren.childConnections.length ? parsedChildren.childConnections : innerConnections);

  const graphNodes = useMemo(() => toGraphNodes(currentNodes, currentElements), [currentNodes, currentElements]);
  const nodeMap = useMemo(() => {
    const map = new Map<NodeId, NodeRect>();

    for (const node of graphNodes) {
      map.set(node.id, {
        id: node.id,
        x: node.x,
        y: node.y,
        width: node.width ?? DEFAULT_NODE_SIZE.width,
        height: node.height ?? DEFAULT_NODE_SIZE.height
      });
    }

    return map;
  }, [graphNodes]);

  const updateNodes = useCallback((nextNodes: NativeNodeRenderItem[]) => {
    setInnerNodes(nextNodes);
    onNodesChange?.(nextNodes);
  }, [onNodesChange]);

  const updateElements = useCallback((nextElements: NativeElementRenderItem[]) => {
    setInnerElements(nextElements);
    onElementsChange?.(nextElements);
  }, [onElementsChange]);

  const updateConnections = useCallback((nextConnections: ConnectionData[]) => {
    setInnerConnections(nextConnections);
    onConnectionsChange?.(nextConnections);
  }, [onConnectionsChange]);

  const addNode = useCallback((position: Point = { x: 80, y: 80 }) => {
    const world = {
      x: (position.x - viewport.x) / viewport.zoom,
      y: (position.y - viewport.y) / viewport.zoom
    };
    updateNodes([...currentNodes, { id: `node-${Date.now()}`, label: "Node", ...world }]);
  }, [currentNodes, updateNodes, viewport]);

  const connectTo = useCallback((targetId: NodeId) => {
    if (!connectionDraft || connectionDraft === targetId) {
      setConnectionDraft(null);
      return;
    }

    const connection = normalizeConnection({ from: connectionDraft, to: targetId });
    const exists = currentConnections.some((item) => item.from === connection.from && item.to === connection.to);

    if (!exists) {
      updateConnections([...currentConnections, connection]);
      onConnect?.(connection);
    }

    setConnectionDraft(null);
  }, [connectionDraft, currentConnections, onConnect, updateConnections]);

  const moveItem = useCallback((id: NodeId, dx: number, dy: number) => {
    const x = dx / viewport.zoom;
    const y = dy / viewport.zoom;
    updateNodes(dragStart.current.nodes.map((node) => (node.id === id ? { ...node, x: node.x + x, y: node.y + y } : node)));
    updateElements(dragStart.current.elements.map((element) => (element.id === id ? { ...element, x: element.x + x, y: element.y + y } : element)));
  }, [updateElements, updateNodes, viewport.zoom]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => editable || pannable,
    onMoveShouldSetPanResponder: () => editable || pannable,
    onPanResponderGrant: () => {
      dragStart.current = {
        id: selectedId,
        nodes: currentNodes,
        elements: currentElements,
        viewport
      };
    },
    onPanResponderMove: (_event: GestureResponderEvent, gesture: PanResponderGestureState) => {
      if (editable && dragStart.current.id) {
        moveItem(dragStart.current.id, gesture.dx, gesture.dy);
        return;
      }

      if (pannable) {
        setViewport({
          ...dragStart.current.viewport,
          x: dragStart.current.viewport.x + gesture.dx,
          y: dragStart.current.viewport.y + gesture.dy
        });
      }
    },
    onPanResponderRelease: () => {
      dragStart.current.id = null;
    }
  }), [currentElements, currentNodes, editable, moveItem, pannable, selectedId, viewport]);

  const contextValue = useMemo(() => ({
    viewport,
    selectedId,
    zoomIn: () => setViewport((current) => ({ ...current, zoom: clampZoom(current.zoom + 0.1, minZoom, maxZoom) })),
    zoomOut: () => setViewport((current) => ({ ...current, zoom: clampZoom(current.zoom - 0.1, minZoom, maxZoom) })),
    resetViewport: () => setViewport(defaultViewport),
    addNode
  }), [addNode, defaultViewport, maxZoom, minZoom, selectedId, viewport]);

  const transform = {
    transform: [
      { translateX: viewport.x },
      { translateY: viewport.y },
      { scale: viewport.zoom }
    ]
  };

  return (
    <NativeBoardContext.Provider value={contextValue}>
      <View
        style={[styles.root, style]}
        onLayout={(event) => setCanvasSize(event.nativeEvent.layout)}
        {...panResponder.panHandlers}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onLongPress={(event) => editable && addNode(eventPoint(event))}>
          <View />
        </Pressable>

        <Svg width={canvasSize.width} height={canvasSize.height} style={StyleSheet.absoluteFillObject}>
          <G x={viewport.x} y={viewport.y} scale={viewport.zoom}>
            {currentConnections.map((connection) => {
              const normalized = normalizeConnection(connection);
              const from = nodeMap.get(connection.from);
              const to = nodeMap.get(connection.to);

              if (!from || !to) {
                return null;
              }

              const path = createConnectorPath(from, to).d;

              return renderConnection ? (
                <G key={normalized.id}>{renderConnection({ connection: normalized, path, selected: selectedId === normalized.id })}</G>
              ) : (
                <Path key={normalized.id} d={path} fill="none" stroke="#2563eb" strokeWidth={2} strokeLinecap="round" />
              );
            })}
          </G>
        </Svg>

        <View pointerEvents="box-none" style={[styles.layer, transform, contentStyle]}>
          {currentElements.map((element) => {
            const width = element.width ?? DEFAULT_ELEMENT_SIZE.width;
            const height = element.height ?? DEFAULT_ELEMENT_SIZE.height;
            const selected = selectedId === element.id;
            const shape = shapes.find((item) => item.type === element.type);

            return (
              <Pressable
                key={element.id}
                style={[styles.item, { left: element.x, top: element.y, width, height }, element.style]}
                onPress={() => {
                  if (connectionDraft) {
                    connectTo(element.id);
                  }
                  setSelectedId(element.id);
                  onElementPress?.(element);
                }}
                onLongPress={() => editable && setConnectionDraft(element.id)}
              >
                <Svg width={width} height={height}>
                  {renderElement ? renderElement({ element, selected, editing: editingId === element.id, width, height }) : shape ? shape.render({ element, width, height }) : renderBuiltinElement(BUILTIN_ELEMENT_KINDS.has(element.type) ? element.type : "rectangle", element, width, height)}
                </Svg>
                {element.label ? <Text style={[styles.geometryLabel, element.labelStyle]}>{element.label}</Text> : null}
              </Pressable>
            );
          })}

          {currentNodes.map((node) => {
            const width = node.width ?? DEFAULT_NODE_SIZE.width;
            const height = node.height ?? DEFAULT_NODE_SIZE.height;
            const selected = selectedId === node.id;
            const editing = editingId === node.id;

            return (
              <Pressable
                key={node.id}
                style={[styles.item, styles.node, selected ? styles.selected : null, { left: node.x, top: node.y, width, height }, node.style]}
                onPress={() => {
                  if (connectionDraft) {
                    connectTo(node.id);
                  }
                  setSelectedId(node.id);
                  onNodePress?.(node);
                }}
                onLongPress={() => editable && setConnectionDraft(node.id)}
              >
                {renderNode ? renderNode({ node, selected, editing }) : node.children ? node.children : editing ? (
                  <TextInput
                    autoFocus
                    value={node.label ?? ""}
                    onBlur={() => setEditingId(null)}
                    onChangeText={(label) => updateNodes(currentNodes.map((item) => (item.id === node.id ? { ...item, label } : item)))}
                    style={[styles.label, node.labelStyle]}
                  />
                ) : (
                  <Text numberOfLines={2} style={[styles.label, node.labelStyle]} onPress={() => editable && setEditingId(node.id)}>
                    {node.label ?? node.id}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {zoomable ? (
          <View style={styles.controls}>
            <Pressable style={styles.controlButton} onPress={contextValue.zoomIn}><Text style={styles.controlText}>+</Text></Pressable>
            <Pressable style={styles.controlButton} onPress={contextValue.zoomOut}><Text style={styles.controlText}>-</Text></Pressable>
            <Pressable style={styles.controlButton} onPress={contextValue.resetViewport}><Text style={styles.controlText}>reset</Text></Pressable>
          </View>
        ) : null}

        {children}
      </View>
    </NativeBoardContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 320,
    overflow: "hidden",
    backgroundColor: "#f8fafc"
  },
  layer: {
    ...StyleSheet.absoluteFillObject
  },
  item: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center"
  },
  node: {
    borderWidth: 1.5,
    borderColor: "#64748b",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    padding: 10
  },
  selected: {
    borderColor: "#2563eb"
  },
  label: {
    color: "#0f172a",
    fontWeight: "600",
    textAlign: "center"
  },
  geometryLabel: {
    position: "absolute",
    color: "#0f172a",
    fontWeight: "600",
    textAlign: "center"
  },
  controls: {
    position: "absolute",
    right: 16,
    bottom: 16,
    flexDirection: "row",
    gap: 8
  },
  controlButton: {
    minWidth: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1"
  },
  controlText: {
    color: "#0f172a",
    fontWeight: "700"
  }
});
