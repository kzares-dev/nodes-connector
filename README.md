# nodes-connector

`nodes-connector` is an npm package for building node boards, geometric nodes, and many-to-many connectors.

![nodes-connector geometric nodes](https://raw.githubusercontent.com/kzares-dev/nodes-connector/main/docs/images/geometric-nodes.png)

The package is split into two layers:

- `nodes-connector/core`: framework-agnostic reusable logic.
- `nodes-connector/react`: React components and bindings.

The main goal is to let you save and restore a graph from an API or database, render it in React, edit it visually, and customize the UI without rewriting the graph logic.

## Links

- Repository: https://github.com/kzares-dev/nodes-connector
- Interactive documentation: https://kzares-dev.github.io/nodes-connector/
- Issues: https://github.com/kzares-dev/nodes-connector/issues
- npm package: https://www.npmjs.com/package/nodes-connector

## Screenshots

### Controlled Board

![Controlled board example](https://raw.githubusercontent.com/kzares-dev/nodes-connector/main/docs/images/static-board.png)

### Custom Nodes

![Custom nodes example](https://raw.githubusercontent.com/kzares-dev/nodes-connector/main/docs/images/custom-nodes.png)

### Geometric Nodes

![Geometric nodes example](https://raw.githubusercontent.com/kzares-dev/nodes-connector/main/docs/images/geometric-nodes.png)

### Theme Customization

![Theme customization example](https://raw.githubusercontent.com/kzares-dev/nodes-connector/main/docs/images/theme-customization.png)

## Installation

```bash
npm install nodes-connector
```

In React, import the components and base CSS:

```tsx
import { Board, Connector, Element, Node } from "nodes-connector/react";
import "nodes-connector/react/styles.css";
```

## Concepts

### Board

`Board` is the main canvas. It handles:

- node and connector rendering
- background drag panning
- wheel zoom
- compact navigation controls
- context menus
- node and element creation
- text editing
- resize
- controlled and uncontrolled state

### Node

`Node` represents a normal graph node.

By default, it renders as a rectangular geometry. If it receives `children`, it is treated as a custom node and does not apply the default visual chrome; you control its UI through `className`, `contentClassName`, `style`, or `renderNode`.

### Element

`Element` represents an SVG geometric node. It is not decorative: it behaves like a graph node.

It can:

- connect with `Connector`
- be used as `from` or `to`
- move with drag
- open a context menu
- edit text on double click
- resize
- be deleted together with its connections

Built-in types:

```ts
"rectangle" | "circle" | "diamond" | "triangle" | "hexagon" | "pill" | "parallelogram"
```

You can also register custom shapes with `shapes`.

### Connector

`Connector` defines a relationship between two ids. Those ids can belong to either `Node` or `Element`.

```tsx
<Connector from="input" to="decision" />
```

## Controlled Data Usage

This is the recommended approach when the board state will be persisted in an API or database.

```tsx
import { useState } from "react";
import { Board } from "nodes-connector/react";
import "nodes-connector/react/styles.css";

const initialNodes = [
  { id: "api", label: "API", x: 80, y: 80 },
  { id: "db", label: "Database", x: 360, y: 180 }
];

const initialConnections = [{ id: "api-db", from: "api", to: "db" }];

export function FlowEditor() {
  const [nodes, setNodes] = useState(initialNodes);
  const [connections, setConnections] = useState(initialConnections);

  return (
    <Board
      editable
      nodes={nodes}
      connections={connections}
      onNodesChange={setNodes}
      onConnectionsChange={setConnections}
    />
  );
}
```

## Declarative JSX Usage

You can also declare the board with JSX components:

```tsx
<Board editable>
  <Node id="source" label="Source" x={96} y={96} />
  <Node id="transform" x={376} y={220}>
    <strong>Transform</strong>
  </Node>
  <Element id="decision" type="diamond" x={640} y={180} width={110} height={90} label="OK?" />

  <Connector from="source" to="transform" />
  <Connector from="transform" to="decision" />
</Board>
```

## React Native Usage

`nodes-connector` also exposes a React Native entrypoint:

```tsx
import { Board, Connector, Element, Node } from "nodes-connector/react-native";
```

Install the native peer dependencies in your app:

```bash
npm install react-native-svg
```

For Expo projects:

```bash
npx expo install react-native-svg
```

Basic usage:

```tsx
import { useState } from "react";
import { Board } from "nodes-connector/react-native";

const initialNodes = [
  { id: "app", label: "App", x: 80, y: 100 },
  { id: "api", label: "API", x: 320, y: 180 }
];

const initialConnections = [{ from: "app", to: "api" }];

export function NativeFlow() {
  const [nodes, setNodes] = useState(initialNodes);
  const [connections, setConnections] = useState(initialConnections);

  return (
    <Board
      editable
      nodes={nodes}
      connections={connections}
      onNodesChange={setNodes}
      onConnectionsChange={setConnections}
      style={{ flex: 1 }}
    />
  );
}
```

Declarative usage works too:

```tsx
<Board editable>
  <Node id="start" label="Start" x={80} y={120} />
  <Element id="decision" type="diamond" label="OK?" x={300} y={110} />
  <Connector from="start" to="decision" />
</Board>
```

React Native behavior differs from web where the platform differs:

- long press a node to start a connection
- tap another node to finish the connection
- long press the board background to add a node
- drag the board background to pan
- use the exposed `useBoard()` hook to build native controls

## Editing Interactions

When `editable` is enabled:

- drag a node to move it
- drag the background to pan the board
- use the wheel to zoom
- right click a node to open its context menu
- right click an empty board area to create nodes or geometric elements
- double click a default or geometric node to enter edit mode
- edit text and resize the container while in edit mode
- press `Escape` to cancel a connection draft

To create connections:

1. Right click the source node.
2. Select `Add connection`.
3. Move the mouse toward another node.
4. Left click the target node.

## Custom Nodes

If you pass children to `Node`, the container does not apply the default visual styles. This lets you use regular CSS, Tailwind, or your design system.

```tsx
<Board editable>
  <Node
    id="checkout"
    x={90}
    y={110}
    width={220}
    height={96}
    className="rounded-md border border-green-300 bg-white p-3"
    contentClassName="grid gap-1"
  >
    <CheckoutCard />
  </Node>

  <Node id="ledger" x={420} y={180} className="my-ledger-node">
    <LedgerCard />
  </Node>

  <Connector from="checkout" to="ledger" />
</Board>
```

Custom nodes still support:

- drag
- context menu
- connections
- deletion
- double-click resize

## Geometric Nodes

```tsx
<Board editable>
  <Element id="input" type="parallelogram" x={110} y={120} width={128} height={64} label="Input" />
  <Element id="process" type="rectangle" x={330} y={120} width={128} height={64} label="Process" />
  <Element id="decision" type="diamond" x={550} y={110} width={104} height={88} label="OK?" />

  <Connector from="input" to="process" />
  <Connector from="process" to="decision" />
</Board>
```

`Element` is stored separately in `elements`, but participates in the graph just like `Node`.

```tsx
const [elements, setElements] = useState([
  { id: "start", type: "pill", label: "Start", x: 100, y: 120, width: 120, height: 56 }
]);

<Board editable elements={elements} onElementsChange={setElements} />;
```

## Visual Customization

### CSS Variables

You can change the theme without replacing components:

```css
.my-board {
  --nodes-connector-bg: #111827;
  --nodes-connector-grid: #1f2937;
  --nodes-connector-text: #f9fafb;
  --nodes-connector-node-bg: #0f172a;
  --nodes-connector-node-stroke: #22c55e;
  --nodes-connector-connection: #38bdf8;
  --nodes-connector-menu-bg: #111827;
  --nodes-connector-menu-border: #334155;
  --nodes-connector-focus: #22c55e;
}
```

```tsx
<Board className="my-board" nodes={nodes} connections={connections} />
```

### renderNode

Replace the visual content of default and custom nodes:

```tsx
<Board
  nodes={nodes}
  renderNode={({ node, editing }) => (
    <div className={editing ? "node editing" : "node"}>
      <strong>{node.label}</strong>
      <small>{node.id}</small>
    </div>
  )}
/>
```

### renderElement

Customize the SVG of an element:

```tsx
<Board
  elements={elements}
  renderElement={({ element, width, height }) => (
    <rect
      width={width}
      height={height}
      rx={12}
      fill={element.fill ?? "#eef2ff"}
      stroke={element.stroke ?? "#4f46e5"}
    />
  )}
/>
```

### renderConnection

Customize how connections are drawn:

```tsx
<Board
  connections={connections}
  renderConnection={({ path, remove }) => (
    <>
      <path d={path} stroke="rgba(15, 23, 42, .15)" strokeWidth={8} fill="none" />
      <path d={path} stroke="#0f766e" strokeWidth={3} fill="none" onClick={remove} />
    </>
  )}
/>
```

## Custom Shapes

Register new geometries with `shapes`.

```tsx
const cloudShape = {
  type: "cloud",
  render: ({ element, width, height }) => (
    <path
      d={`M ${width * 0.28} ${height * 0.72}
        H ${width * 0.78}
        C ${width * 0.95} ${height * 0.72}, ${width * 0.95} ${height * 0.42}, ${width * 0.75} ${height * 0.42}
        C ${width * 0.7} ${height * 0.16}, ${width * 0.32} ${height * 0.18}, ${width * 0.3} ${height * 0.42}
        C ${width * 0.1} ${height * 0.38}, ${width * 0.08} ${height * 0.72}, ${width * 0.28} ${height * 0.72}
        Z`}
      fill={element.fill ?? "#eff6ff"}
      stroke={element.stroke ?? "#2563eb"}
    />
  )
};

<Board editable shapes={[cloudShape]}>
  <Element id="cloud-api" type="cloud" x={130} y={130} width={150} height={90} label="Cloud API" />
</Board>;
```

## Context Menu

### Custom Actions

Add actions without replacing the entire menu:

```tsx
const duplicateAction = {
  id: "duplicate",
  label: "Duplicate",
  scope: "item",
  onSelect: ({ itemId }) => {
    // duplicate the item in your controlled state
  }
};

<Board editable contextActions={[duplicateAction]} />;
```

### Fully Custom Menu

```tsx
<Board
  editable
  renderContextMenu={({ context, actions }) => (
    <div className="my-menu">
      {actions.map((action) => (
        <button
          key={action.id}
          disabled={action.disabledValue}
          onClick={() => action.onSelect(context)}
        >
          {action.label}
        </button>
      ))}
    </div>
  )}
/>
```

## External Toolbar With useBoard

`useBoard()` lets you create custom controls inside `Board`.

```tsx
function Toolbar() {
  const board = useBoard();

  return (
    <div className="toolbar">
      <button onClick={board.zoomIn}>Zoom +</button>
      <button onClick={board.zoomOut}>Zoom -</button>
      <button onClick={board.addNode}>Add node</button>
      <span>{Math.round(board.viewport.zoom * 100)}%</span>
    </div>
  );
}

<Board editable showNavigationControls={false}>
  <Toolbar />
</Board>;
```

## Validators

Add business rules with `validators`.

```tsx
const noDbAsSource = ({ connections }) =>
  connections.some((connection) => connection.from === "db")
    ? ["Database cannot start connections."]
    : [];

<Board
  editable
  validators={[noDbAsSource]}
  onSnapshotError={(errors) => console.log(errors)}
/>;
```

## Events

`Board` exposes callbacks for integrations:

```tsx
<Board
  onNodeClick={(node) => console.log("node", node)}
  onElementClick={(element) => console.log("element", element)}
  onConnect={(connection) => console.log("connect", connection)}
  onDelete={(id, type) => console.log("delete", id, type)}
/>;
```

## Core Utilities

`nodes-connector/core` exports pure functions for usage outside React:

```ts
import {
  applyGridLayout,
  connectSnapshot,
  createHistory,
  deserializeSnapshot,
  pushHistory,
  redoHistory,
  serializeSnapshot,
  undoHistory
} from "nodes-connector/core";

const snapshot = {
  nodes: [{ id: "a", label: "A", x: 0, y: 0 }],
  elements: [],
  connections: []
};

const laidOut = applyGridLayout(snapshot);
const json = serializeSnapshot(laidOut);
const restored = deserializeSnapshot(json);
const history = pushHistory(createHistory(snapshot), restored);
```

## Main Props

| Prop | Type | Description |
| --- | --- | --- |
| `nodes` | `NodeRenderItem[]` | Controlled node state. |
| `connections` | `ConnectionData[]` | Controlled connection state. |
| `elements` | `ElementRenderItem[]` | Controlled geometric node state. |
| `defaultNodes` | `NodeRenderItem[]` | Initial uncontrolled nodes. |
| `defaultConnections` | `ConnectionData[]` | Initial uncontrolled connections. |
| `defaultElements` | `ElementRenderItem[]` | Initial uncontrolled geometric nodes. |
| `editable` | `boolean` | Enables drag, resize, and context menus. |
| `pannable` | `boolean` | Allows background drag panning. |
| `zoomable` | `boolean` | Allows wheel zoom. |
| `defaultViewport` | `{ x, y, zoom }` | Initial viewport. |
| `showNavigationControls` | `boolean` | Shows compact controls in the bottom-right corner. |
| `renderNode` | `(props) => ReactNode` | Custom node renderer. |
| `renderElement` | `(props) => ReactNode` | Custom geometry renderer. |
| `renderConnection` | `(props) => ReactNode` | Custom connection renderer. |
| `renderContextMenu` | `(props) => ReactNode` | Custom context menu renderer. |
| `shapes` | `ShapeDefinition[]` | Custom shape registry. |
| `contextActions` | `ContextAction[]` | Extra context menu actions. |
| `validators` | `BoardValidator[]` | Validation rules. |
| `onNodesChange` | `(nodes) => void` | Node change callback. |
| `onElementsChange` | `(elements) => void` | Geometric node change callback. |
| `onConnectionsChange` | `(connections) => void` | Connection change callback. |

## Storybook

The project includes detailed examples:

```bash
npm run storybook
```

Open:

```txt
http://localhost:6006/
```

Interactive Storybook is published with GitHub Pages:

```txt
https://kzares-dev.github.io/nodes-connector/
```

Recommended sections:

- `nodes-connector/Introduction`
- `nodes-connector/Board`
- `nodes-connector/Customization`

## Deploy Storybook To GitHub Pages

This repository includes a GitHub Actions workflow at `.github/workflows/storybook-pages.yml`.

The workflow runs on every push to `main` and:

- installs dependencies with `npm ci`
- runs `npm run test`
- builds Storybook with `npm run build:storybook`
- uploads `storybook-static` as a GitHub Pages artifact
- deploys it to GitHub Pages

The production documentation URL is:

```txt
https://kzares-dev.github.io/nodes-connector/
```

To publish the code to GitHub for the first time:

```bash
git init -b main
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/kzares-dev/nodes-connector.git
git push -u origin main
```

Then configure GitHub Pages:

1. Open the repository on GitHub.
2. Go to `Settings` -> `Pages`.
3. Under `Build and deployment`, set `Source` to `GitHub Actions`.
4. Push to `main` or run `Deploy Storybook to GitHub Pages` manually from the `Actions` tab.

After the workflow finishes, the Storybook URL will be shown in the deployment summary.

## Development

```bash
npm install
npm run typecheck
npm run build
npm run build:storybook
npx playwright install chromium
npm run screenshots:docs
npm run test
```

`npm run test` runs the library typecheck and build.

`npm run screenshots:docs` regenerates the README/npm screenshots from the latest `storybook-static` build. Run `npx playwright install chromium` once before capturing screenshots on a new machine.
