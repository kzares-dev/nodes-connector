import type { ReactNode } from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import type { NodeData } from "../core";

export type NodeProps<TMeta = unknown> = NodeData<TMeta> & {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

export function Node(_props: NodeProps) {
  return null;
}
