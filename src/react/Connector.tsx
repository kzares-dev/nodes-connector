import type { ConnectionData } from "../core";

export type ConnectorProps<TMeta = unknown> = ConnectionData<TMeta> & {
  className?: string;
};

export function Connector<TMeta = unknown>(_props: ConnectorProps<TMeta>) {
  return null;
}

Connector.displayName = "NodesConnectorConnector";
