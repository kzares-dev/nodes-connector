import type { CSSProperties } from "react";
import type { ElementData } from "../core";

export type ElementProps<TMeta = unknown> = ElementData<TMeta> & {
  className?: string;
  style?: CSSProperties;
};

export function Element<TMeta = unknown>(_props: ElementProps<TMeta>) {
  return null;
}

Element.displayName = "NodesConnectorElement";
