import type { ReactNode } from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import type { BuiltinElementKind, ConnectionData, ElementData, ElementKind, NodeData, NodeId, Point, Viewport } from "../core";

export type NativeNodeRenderItem<TMeta = unknown> = NodeData<TMeta> & {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

export type NativeElementRenderItem<TMeta = unknown> = ElementData<TMeta> & {
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

export type NativeShapeRenderProps = {
  element: NativeElementRenderItem;
  width: number;
  height: number;
};

export type NativeShapeDefinition = {
  type: ElementKind;
  render: (props: NativeShapeRenderProps) => ReactNode;
};

export type NativeRenderNodeProps = {
  node: NativeNodeRenderItem;
  selected: boolean;
  editing: boolean;
};

export type NativeRenderElementProps = {
  element: NativeElementRenderItem;
  selected: boolean;
  editing: boolean;
  width: number;
  height: number;
};

export type NativeRenderConnectionProps = {
  connection: ConnectionData;
  path: string;
  selected: boolean;
};

export type NativeBoardContextValue = {
  viewport: Viewport;
  selectedId: NodeId | null;
  zoomIn: () => void;
  zoomOut: () => void;
  resetViewport: () => void;
  addNode: (position?: Point) => void;
};

export type NativeElementKind = BuiltinElementKind;
