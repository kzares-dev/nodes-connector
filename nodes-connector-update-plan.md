# nodes-connector Update Plan

This document describes recommended package changes based on the graph visualizer integration work.

## Goal

Make common controlled-editor use cases easier:

- create nodes with app-defined defaults
- customize context menu behavior without replacing native menu layout
- use nodes and elements together as one graph
- calculate connection metadata such as weights at creation time
- support graph algorithm integrations more directly

## 1. Add Node And Element Factories

The package currently creates nodes with internal defaults such as generated ids, labels, and dimensions. Apps that need custom naming or styling must intercept `onNodesChange` and normalize after the fact.

Add factory props:

```tsx
<Board
  nodeFactory={({ world, nodes, elements }) => ({
    id: getNextId([...nodes, ...elements]),
    label: getNextId([...nodes, ...elements]),
    x: world.x - 38,
    y: world.y - 38,
    width: 76,
    height: 76,
    meta: { source: "board-menu" }
  })}
/>
```

Suggested types:

```ts
type CreateNodeContext = {
  world: Point;
  board: Point;
  nodes: NodeRenderItem[];
  elements: ElementRenderItem[];
  graphNodes: GraphNode[];
};

type BoardProps = {
  nodeFactory?: (context: CreateNodeContext) => NodeRenderItem;
  elementFactory?: (context: CreateNodeContext & { type: ElementKind }) => ElementRenderItem;
};
```

Acceptance criteria:

- right-click `Add node` uses `nodeFactory` when provided
- toolbar/control `addNode` uses `nodeFactory` when possible
- generated node is emitted through `onNodesChange`
- uncontrolled and controlled modes both work

## 2. Clarify Context Menu Rendering

`renderContextMenu` currently renders inside a positioned `.nodes-connector-context-menu` wrapper. This is useful, but easy to misuse because consumers may return another menu container.

Recommended API:

```tsx
<Board
  renderContextMenuContent={({ context, actions }) => (
    <>
      {actions.map((action) => (
        <button key={action.id} onClick={() => action.onSelect(context)}>
          {action.label}
        </button>
      ))}
    </>
  )}
/>
```

Keep `renderContextMenu` for full-container replacement only, or document that it renders content only.

Acceptance criteria:

- docs explicitly show whether consumers should return a wrapper or only menu items
- examples include replacing only board creation actions
- no nested `.nodes-connector-context-menu` is needed for common customization

## 3. Add Native Action Overrides

Apps often need to keep native actions like connect/delete while overriding only creation behavior.

Suggested API:

```tsx
<Board
  actionOverrides={{
    "add-node": ({ context }) => createAppNode(context.world),
    "add-rectangle": ({ context }) => createAppElement("rectangle", context.world)
  }}
  hiddenActions={["add-diamond", "add-triangle"]}
/>
```

Suggested types:

```ts
type ActionOverride = (args: {
  context: ContextActionContext;
  defaultAction: ContextAction;
}) => void;

type BoardProps = {
  actionOverrides?: Record<string, ActionOverride>;
  hiddenActions?: string[];
};
```

Acceptance criteria:

- native action labels, disabled states, and menu positioning remain intact
- consumers can override `add-node` without replacing item actions
- consumers can hide built-in board element actions

## 4. Expose Unified Graph Nodes

Connections can target both nodes and elements, but consumers must manually merge `nodes` and `elements`.

Expose helper data:

```ts
type BoardGraphState = {
  nodes: NodeRenderItem[];
  elements: ElementRenderItem[];
  graphNodes: GraphNode[];
  connections: ConnectionData[];
};
```

Potential callbacks:

```tsx
<Board onGraphChange={(state) => saveGraph(state)} />
```

Acceptance criteria:

- `graphNodes` includes regular nodes, custom nodes, and elements
- each graph node includes `kind`, dimensions, label, and shape when applicable
- callback fires after node, element, or connection changes

## 5. Improve Connection Creation Metadata

For weighted graph apps, consumers need connection context at creation time.

Suggested callback:

```tsx
<Board
  onBeforeConnect={({ connection, fromNode, toNode, fromRect, toRect }) => ({
    ...connection,
    label: String(distance(fromRect, toRect)),
    meta: { weight: distance(fromRect, toRect) }
  })}
/>
```

Suggested types:

```ts
type BeforeConnectContext = {
  connection: ConnectionData;
  fromNode: GraphNode;
  toNode: GraphNode;
  fromRect: NodeRect;
  toRect: NodeRect;
};

type BoardProps = {
  onBeforeConnect?: (context: BeforeConnectContext) => ConnectionData | null;
};
```

Acceptance criteria:

- returning a connection customizes what is inserted
- returning `null` cancels creation
- `onConnect` receives the final inserted connection

## 6. Add Directed And Undirected Helpers

The visual editor can represent directed data, but many graph visualizations treat connections as undirected.

Add core utilities:

```ts
buildAdjacency(snapshot, { directed: false });
getNodeCenter(graphNode);
getConnectionWeight(connection, fallback);
```

Suggested API:

```ts
const adjacency = buildAdjacency(
  { nodes, elements, connections },
  {
    directed: false,
    weight: (connection) => connection.meta?.weight ?? Number(connection.label ?? 1)
  }
);
```

Acceptance criteria:

- supports `nodes` and `elements`
- supports directed and undirected adjacency
- supports custom weight extraction
- ignores or reports invalid connections consistently

## 7. Add Naming Strategy Hooks

Apps may need predictable ids like `A`, `B`, `C` instead of timestamp ids.

Suggested API:

```tsx
<Board
  createId={({ graphNodes }) => getNextLetterId(graphNodes)}
  createLabel={({ id }) => id}
/>
```

Acceptance criteria:

- all built-in creation paths use the naming strategy
- duplicate ids are prevented or reported
- label and id can be synced when desired

## Recommended Implementation Order

1. Add `nodeFactory` and `elementFactory`.
2. Add `renderContextMenuContent` or clarify `renderContextMenu`.
3. Add `actionOverrides` and `hiddenActions`.
4. Add `onBeforeConnect`.
5. Add core graph helpers such as `buildAdjacency`.
6. Add unified `onGraphChange`.
7. Add naming hooks.

## Example Final Usage

```tsx
<Board
  editable
  nodes={nodes}
  elements={elements}
  connections={connections}
  nodeFactory={({ world, graphNodes }) => {
    const id = getNextLetterId(graphNodes);
    return {
      id,
      label: id,
      x: world.x - 38,
      y: world.y - 38,
      width: 76,
      height: 76
    };
  }}
  onBeforeConnect={({ connection, fromRect, toRect }) => {
    const weight = Math.round(Math.hypot(toRect.x - fromRect.x, toRect.y - fromRect.y));
    return {
      ...connection,
      label: String(weight),
      meta: { weight }
    };
  }}
  hiddenActions={["add-diamond", "add-triangle", "add-hexagon"]}
  onGraphChange={({ graphNodes, connections }) => {
    const adjacency = buildAdjacency({ graphNodes, connections }, { directed: false });
    updateAlgorithmState(adjacency);
  }}
/>
```

