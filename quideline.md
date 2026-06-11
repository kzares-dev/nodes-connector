# NODES CONNECTOR GUIDELINE

## Definitions

STACK: `nodes-connector` is an npm package designed to be compatible with any UI framework. The reusable foundation must be implemented with JavaScript/TypeScript only.

## PHASE 1 - MVP

BASE: The project is an installable npm package for rendering flow charts with two main concepts: nodes and connectors. Connectors describe relationships between nodes and support many-to-many relationships.

IMPLEMENTATION: The first implementation is based on React, while the reusable logic lives in `/core` and the React integration lives in `/react`.

- The parent component `<Board>...</Board>` is the main canvas. It renders nodes and connectors, ideally from data or declarative children such as `<Node {...props} />` and `<Connector {...props} />`.
- Node and connector props define connection behavior, position, and metadata.

The component must support two usage styles:

1. Static or controlled data:

```ts
nodes: [
  {
    id: "node-1",
    ...rest
  },
  {
    id: "node-2",
    ...rest
  }
];

connections: [
  {
    from: "node-1",
    to: "node-2"
  }
];
```

2. Editable mode:

Users can manually create and remove connections, drag nodes to update their position, and persist the resulting nodes and connections in a database so the board can be restored later.

## PHASE 2

This phase introduces UI component variation for nodes. Consumers can place any component inside a node with:

```tsx
<Node>
  <CustomElement />
</Node>
```

The custom element is rendered as a node. Consumers can also style `<Node />` with `className`, regular CSS, or Tailwind.

This phase also adds map navigation: zoom in, zoom out, and horizontal/vertical panning.

`<Controls />` provides configurable controls that can be placed on the side, top, right, or bottom, and can be used to add elements or configure connections.

## PHASE 3

UI refinement:

- When a custom component is passed to `Node`, default node visual styles are removed.
- The sidebar is removed.
- Default navigation buttons are kept in the bottom-right corner when navigation is enabled.

Connection creation flow:

1. Right click a source node.
2. A context menu opens with several options.
3. Select `Add connection`.
4. A temporary connection line follows the cursor from the source node.
5. Left click another node to create the connection.

Context menu options:

- `Add connection`
- `Remove connections`
- `Delete node`

Deleting a node also removes its connections.

## PHASE 4

Node creation happens from the board context menu:

- Right click the board background.
- A menu opens with an `Add node` option.
- The new node is created at that board position.

Double-click behavior:

- Double click a node to edit its text.
- While focused, the node container can be resized.
- Clicking outside exits focus mode.
- Resize changes the container size, not the text scale.

## PHASE 5

Geometric element support:

- The package supports at least seven basic geometric elements.
- When adding an element from the board context menu, the shape picker shows small 16px previews.
- Consumers can define geometric structures inside `<Board>` using the declarative `<Element />` API.
- Geometric elements should use a standard rendering strategy, preferably SVG.

## Current Implementation Status

### Package

The project is configured as an npm package with:

- `nodes-connector/core`: pure reusable logic without React.
- `nodes-connector/react`: React components.
- ESM/CJS builds with Vite.
- TypeScript declarations.
- Storybook for testing and documenting the library.

### React Components

#### `<Board />`

Main graph canvas. Supports:

- controlled nodes through `nodes`
- controlled connections through `connections`
- controlled geometric nodes through `elements`
- editable mode with `editable`
- background drag panning
- wheel zoom
- compact default controls in the bottom-right corner
- node context menu
- board background context menu
- node creation from the background
- geometric element creation from the background
- manual connection creation
- node, element, and connection deletion
- inline text editing with double click
- resize for default, custom, and geometric nodes

#### `<Node />`

Normal graph node.

- Renders as a rectangle geometry by default.
- If it receives `children`, it is treated as a custom node and does not apply default visual chrome.
- Can be customized with `className`, `contentClassName`, `style`, and `renderNode`.
- Keeps drag, context menu, connection, and resize behavior.

#### `<Element />`

SVG geometric node. It is not decorative: it participates in the graph.

Built-in types:

- `rectangle`
- `circle`
- `diamond`
- `triangle`
- `hexagon`
- `pill`
- `parallelogram`

Custom shapes can also be registered with `shapes`.

#### `<Connector />`

Connection between two ids. `from` and `to` can point to either `Node` or `Element`.

### Customization

The package exposes extension points:

- `renderNode`
- `renderElement`
- `renderConnection`
- `renderContextMenu`
- `contextActions`
- `shapes`
- `validators`
- `useBoard`
- CSS variables for theming

### Core Utilities

`nodes-connector/core` exports pure functions for usage outside React:

- `validateSnapshot`
- `serializeSnapshot`
- `deserializeSnapshot`
- `applyGridLayout`
- `connectSnapshot`
- `addNodeToSnapshot`
- `updateNodeInSnapshot`
- `resizeNodeInSnapshot`
- `deleteItemFromSnapshot`
- `createHistory`
- `pushHistory`
- `undoHistory`
- `redoHistory`

### Storybook

Storybook includes examples for:

- static data usage through props
- declarative API with children
- editable mode
- custom nodes
- geometric nodes
- creation from context menus
- theming with CSS variables
- render props
- shape plugins
- custom context menu
- external toolbar with `useBoard`
- validators
- controlled persistence
- core utilities
