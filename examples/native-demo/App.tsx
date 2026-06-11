import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Board, Element, type NativeElementRenderItem, type NativeNodeRenderItem } from "nodes-connector/react-native";
import type { ConnectionData } from "nodes-connector/core";

const initialNodes: NativeNodeRenderItem[] = [
  { id: "app", label: "Mobile App", x: 80, y: 120, width: 150, height: 76 },
  { id: "api", label: "API", x: 340, y: 190, width: 130, height: 70 },
  { id: "db", label: "Database", x: 600, y: 130, width: 150, height: 76 }
];

const initialElements: NativeElementRenderItem[] = [
  { id: "start", type: "pill", label: "Start", x: 100, y: 300, width: 130, height: 62, fill: "#ecfdf5", stroke: "#059669" },
  { id: "decision", type: "diamond", label: "OK?", x: 380, y: 310, width: 110, height: 90, fill: "#fffbeb", stroke: "#d97706" }
];

const initialConnections: ConnectionData[] = [
  { from: "app", to: "api", label: "request" },
  { from: "api", to: "db", label: "write" },
  { from: "start", to: "decision" },
  { from: "decision", to: "api" }
];

export default function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [elements, setElements] = useState(initialElements);
  const [connections, setConnections] = useState(initialConnections);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>nodes-connector/react-native</Text>
        <Text style={styles.subtitle}>
          Long press a node to start a connection. Tap another node to connect. Long press the background to add a node.
        </Text>
      </View>

      <Board
        editable
        nodes={nodes}
        elements={elements}
        connections={connections}
        onNodesChange={setNodes}
        onElementsChange={setElements}
        onConnectionsChange={setConnections}
        style={styles.board}
      >
        <Element id="manual" type="hexagon" label="JSX" x={650} y={320} width={112} height={80} fill="#eef2ff" stroke="#4f46e5" />
      </Board>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{nodes.length} nodes</Text>
        <Text style={styles.footerText}>{elements.length} elements</Text>
        <Text style={styles.footerText}>{connections.length} connections</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f8fafc"
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 4,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0"
  },
  title: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "700"
  },
  subtitle: {
    color: "#475569",
    fontSize: 12,
    lineHeight: 17
  },
  board: {
    flex: 1
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0"
  },
  footerText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600"
  }
});
