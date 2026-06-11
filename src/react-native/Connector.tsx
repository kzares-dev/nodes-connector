import type { ConnectionData } from "../core";

export type ConnectorProps<TMeta = unknown> = ConnectionData<TMeta>;

export function Connector(_props: ConnectorProps) {
  return null;
}
