import type { CSSProperties, ReactNode } from "react";
import type { NodeData } from "../core";

export type NodeProps<TMeta = unknown> = NodeData<TMeta> & {
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
};

export function Node<TMeta = unknown>(_props: NodeProps<TMeta>) {
  return null;
}

Node.displayName = "NodesConnectorNode";
