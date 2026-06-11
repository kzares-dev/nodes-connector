import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";
import {
  applyGridLayout,
  createHistory,
  deserializeSnapshot,
  pushHistory,
  redoHistory,
  serializeSnapshot,
  undoHistory,
  type ConnectionData
} from "../core";
import {
  Board,
  Connector,
  Element,
  Node,
  useBoard,
  type BoardValidator,
  type ContextAction,
  type ElementRenderItem,
  type NodeRenderItem,
  type ShapeDefinition
} from "../react";

const meta = {
  title: "nodes-connector/Customization",
  component: Board,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Customization recipes for adapting nodes-connector to products, design systems, and custom workflows."
      }
    }
  }
} satisfies Meta<typeof Board>;

export default meta;

type Story = StoryObj<typeof meta>;

const nodes: NodeRenderItem[] = [
  { id: "lead", label: "Lead", x: 120, y: 120, width: 140, height: 70 },
  { id: "quote", label: "Quote", x: 380, y: 180, width: 140, height: 70 }
];

const connections: ConnectionData[] = [{ from: "lead", to: "quote", label: "qualify" }];

function ExternalToolbar() {
  const board = useBoard();

  return (
    <div className="story-toolbar">
      <button type="button" onClick={board.zoomIn}>
        Zoom +
      </button>
      <button type="button" onClick={board.zoomOut}>
        Zoom -
      </button>
      <button type="button" onClick={board.addNode}>
        Add
      </button>
      <span>{Math.round(board.viewport.zoom * 100)}%</span>
    </div>
  );
}

export const ThemeTokens: Story = {
  name: "Theme with CSS variables",
  parameters: {
    docs: {
      source: {
        code: `<Board
  className="my-dark-board"
  nodes={nodes}
  connections={connections}
/>

.my-dark-board {
  --nodes-connector-bg: #111827;
  --nodes-connector-grid: #1f2937;
  --nodes-connector-text: #f9fafb;
  --nodes-connector-node-bg: #0f172a;
  --nodes-connector-node-stroke: #22c55e;
  --nodes-connector-connection: #38bdf8;
}`
      }
    }
  },
  render: () => <Board editable className="story-dark-board" nodes={nodes} connections={connections} />
};

export const RenderNode: Story = {
  name: "renderNode for custom UI",
  parameters: {
    docs: {
      source: {
        code: `<Board
  editable
  nodes={nodes}
  connections={connections}
  renderNode={({ node }) => (
    <div className="my-node">
      <strong>{node.label}</strong>
      <span>{node.id}</span>
    </div>
  )}
/>`
      }
    }
  },
  render: () => (
    <Board
      editable
      nodes={nodes}
      connections={connections}
      renderNode={({ node }) => (
        <div className="story-render-node">
          <strong>{node.label}</strong>
          <span>{node.id}</span>
        </div>
      )}
    />
  )
};

export const CustomNodeSurface: Story = {
  name: "Customizable custom nodes",
  parameters: {
    docs: {
      source: {
        code: `<Board editable>
  <Node
    id="card-a"
    x={120}
    y={120}
    width={190}
    height={92}
    className="custom-wrapper"
    contentClassName="custom-content"
  >
    <div>
      <strong>Custom card</strong>
      <span>className + contentClassName</span>
    </div>
  </Node>

  <Node id="card-b" x={420} y={190} width={180} height={86} className="custom-wrapper alt">
    <div>
      <strong>Resizable</strong>
      <span>double click</span>
    </div>
  </Node>

  <Connector from="card-a" to="card-b" />
</Board>`
      }
    }
  },
  render: () => (
    <Board editable>
      <Node id="card-a" x={120} y={120} width={190} height={92} className="story-custom-wrapper" contentClassName="story-custom-content">
        <div>
          <strong>Custom card</strong>
          <span>className + contentClassName</span>
        </div>
      </Node>
      <Node id="card-b" x={420} y={190} width={180} height={86} className="story-custom-wrapper alt">
        <div>
          <strong>Resizable</strong>
          <span>double click</span>
        </div>
      </Node>
      <Connector from="card-a" to="card-b" />
    </Board>
  )
};

export const RenderCustomNode: Story = {
  name: "renderNode also applies to custom nodes",
  parameters: {
    docs: {
      source: {
        code: `<Board
  editable
  nodes={[
    { id: "job", label: "Job", x: 120, y: 120, width: 180, height: 88 },
    { id: "deploy", label: "Deploy", x: 420, y: 180, width: 180, height: 88 }
  ]}
  connections={[{ from: "job", to: "deploy" }]}
  renderNode={({ node, editing }) => (
    <div className={editing ? "custom-node editing" : "custom-node"}>
      <strong>{node.label}</strong>
      <span>{node.id}</span>
    </div>
  )}
/>`
      }
    }
  },
  render: () => (
    <Board
      editable
      nodes={[
        { id: "job", label: "Job", x: 120, y: 120, width: 180, height: 88 },
        { id: "deploy", label: "Deploy", x: 420, y: 180, width: 180, height: 88 }
      ]}
      connections={[{ from: "job", to: "deploy" }]}
      renderNode={({ node, editing }) => (
        <div className={["story-render-node story-render-node-rich", editing ? "editing" : ""].filter(Boolean).join(" ")}>
          <strong>{node.label}</strong>
          <span>{node.id}</span>
        </div>
      )}
    />
  )
};

const cloudShape: ShapeDefinition = {
  type: "cloud",
  render: ({ element, width, height }) => (
    <path
      className="nodes-connector-element-shape"
      d={`M ${width * 0.28} ${height * 0.72}
        H ${width * 0.78}
        C ${width * 0.95} ${height * 0.72}, ${width * 0.95} ${height * 0.42}, ${width * 0.75} ${height * 0.42}
        C ${width * 0.7} ${height * 0.16}, ${width * 0.32} ${height * 0.18}, ${width * 0.3} ${height * 0.42}
        C ${width * 0.1} ${height * 0.38}, ${width * 0.08} ${height * 0.72}, ${width * 0.28} ${height * 0.72}
        Z`}
      fill={element.fill ?? "#eff6ff"}
      stroke={element.stroke ?? "#2563eb"}
    />
  ),
  renderIcon: () => <path d="M4 12h8c2 0 2-4 0-4-.5-3-5-3-6-1-3-.5-4 5-2 5Z" fill="#eff6ff" stroke="#2563eb" />
};

export const CustomShape: Story = {
  name: "Custom shape plugin",
  parameters: {
    docs: {
      source: {
        code: `const cloudShape = {
  type: "cloud",
  render: ({ element, width, height }) => (
    <path
      d="..."
      fill={element.fill ?? "#eff6ff"}
      stroke={element.stroke ?? "#2563eb"}
    />
  ),
  renderIcon: () => <path d="M4 12h8c2 0 2-4 0-4-.5-3-5-3-6-1-3-.5-4 5-2 5Z" />
};

<Board editable shapes={[cloudShape]}>
  <Element id="cloud-api" type="cloud" x={130} y={130} width={150} height={90} label="Cloud API" />
  <Element id="decision" type="diamond" x={430} y={140} width={110} height={90} label="Route" />
  <Connector from="cloud-api" to="decision" />
</Board>`
      }
    }
  },
  render: () => (
    <Board editable shapes={[cloudShape]}>
      <Element id="cloud-api" type="cloud" x={130} y={130} width={150} height={90} label="Cloud API" />
      <Element id="decision" type="diamond" x={430} y={140} width={110} height={90} label="Route" />
      <Connector from="cloud-api" to="decision" />
    </Board>
  )
};

export const RenderConnection: Story = {
  name: "Custom renderConnection",
  parameters: {
    docs: {
      source: {
        code: `<Board
  editable
  nodes={nodes}
  connections={connections}
  renderConnection={({ connection, path, remove }) => (
    <>
      <path className="connection-shadow" d={path} />
      <path className="connection" d={path} onClick={remove} />
      <text className="connection-label" x="260" y="135">
        {connection.label}
      </text>
    </>
  )}
/>`
      }
    }
  },
  render: () => (
    <Board
      editable
      nodes={nodes}
      connections={connections}
      renderConnection={({ connection, path, remove }) => (
        <>
          <path className="story-connection-shadow" d={path} />
          <path className="story-connection" d={path} onClick={remove} />
          <text className="story-connection-label" x="260" y="135">
            {connection.label}
          </text>
        </>
      )}
    />
  )
};

export const ContextActions: Story = {
  name: "Custom menu actions",
  parameters: {
    docs: {
      source: {
        code: `const actions = [
  {
    id: "duplicate",
    label: "Duplicate",
    scope: "item",
    onSelect: ({ itemId }) => duplicateNode(itemId)
  },
  {
    id: "add-review",
    label: "Add review",
    scope: "board",
    onSelect: ({ world }) => addNodeAt(world)
  }
];

<Board editable nodes={nodes} connections={connections} contextActions={actions} />`
      }
    }
  },
  render: () => {
    const [localNodes, setLocalNodes] = useState(nodes);
    const actions = useMemo<ContextAction[]>(
      () => [
        {
          id: "duplicate",
          label: "Duplicate",
          scope: "item",
          onSelect: ({ itemId }) => {
            const source = localNodes.find((node) => node.id === itemId);
            if (!source) {
              return;
            }
            setLocalNodes([...localNodes, { ...source, id: `${source.id}-copy`, label: `${source.label} copy`, x: source.x + 40, y: source.y + 40 }]);
          }
        },
        {
          id: "add-review",
          label: "Add review",
          scope: "board",
          onSelect: ({ world }) => {
            setLocalNodes([...localNodes, { id: `review-${Date.now()}`, label: "Review", x: world.x, y: world.y, width: 140, height: 70 }]);
          }
        }
      ],
      [localNodes]
    );

    return <Board editable nodes={localNodes} connections={connections} onNodesChange={setLocalNodes} contextActions={actions} />;
  }
};

export const RenderContextMenu: Story = {
  name: "Custom context menu",
  parameters: {
    docs: {
      source: {
        code: `<Board
  editable
  nodes={nodes}
  connections={connections}
  renderContextMenu={({ actions, context }) => (
    <div className="my-menu">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          disabled={action.disabledValue}
          onClick={() => action.onSelect(context)}
        >
          {action.label}
        </button>
      ))}
    </div>
  )}
/>`
      }
    }
  },
  render: () => (
    <Board
      editable
      nodes={nodes}
      connections={connections}
      renderContextMenu={({ actions, context }) => (
        <div className="story-menu">
          {actions.map((action) => (
            <button key={action.id} type="button" disabled={action.disabledValue} onClick={() => action.onSelect(context)}>
              {action.label}
            </button>
          ))}
        </div>
      )}
    />
  )
};

export const ExternalToolbarWithHook: Story = {
  name: "External toolbar with useBoard",
  parameters: {
    docs: {
      source: {
        code: `function ExternalToolbar() {
  const board = useBoard();

  return (
    <div className="toolbar">
      <button type="button" onClick={board.zoomIn}>Zoom +</button>
      <button type="button" onClick={board.zoomOut}>Zoom -</button>
      <button type="button" onClick={board.addNode}>Add</button>
      <span>{Math.round(board.viewport.zoom * 100)}%</span>
    </div>
  );
}

<Board editable nodes={nodes} connections={connections} showNavigationControls={false}>
  <ExternalToolbar />
</Board>`
      }
    }
  },
  render: () => (
    <Board editable nodes={nodes} connections={connections} showNavigationControls={false}>
      <ExternalToolbar />
    </Board>
  )
};

export const Validators: Story = {
  name: "Custom validators",
  parameters: {
    docs: {
      source: {
        code: `const validators = [
  ({ connections }) =>
    connections.some((connection) => connection.from === "db")
      ? ["The database cannot start connections in this example."]
      : []
];

<Board
  editable
  nodes={nodes}
  connections={connections}
  validators={validators}
  onSnapshotError={setErrors}
/>`
      }
    }
  },
  render: () => {
    const [errors, setErrors] = useState<string[]>([]);
    const [validatorNodes] = useState<NodeRenderItem[]>([
      { id: "app", label: "App", x: 120, y: 120 },
      { id: "db", label: "DB", x: 420, y: 160 }
    ]);
    const [validatorConnections] = useState<ConnectionData[]>([{ from: "db", to: "app" }]);
    const noDbSource = useMemo<BoardValidator[]>(
      () => [
        ({ connections }) =>
          connections.some((connection) => connection.from === "db")
            ? ["The database cannot start connections in this example."]
            : []
      ],
      []
    );

    return (
      <div className="story-shell">
        <Board
          editable
          nodes={validatorNodes}
          connections={validatorConnections}
          validators={noDbSource}
          onSnapshotError={setErrors}
        />
        <div className="story-errors">{errors.map((error) => error)}</div>
      </div>
    );
  }
};

export const ControlledPersistence: Story = {
  name: "Controlled persistence",
  parameters: {
    docs: {
      source: {
        code: `const [nodes, setNodes] = useState(initialNodes);
const [elements, setElements] = useState(initialElements);
const [connections, setConnections] = useState(initialConnections);

<Board
  editable
  nodes={nodes}
  elements={elements}
  connections={connections}
  onNodesChange={setNodes}
  onElementsChange={setElements}
  onConnectionsChange={setConnections}
/>`
      }
    }
  },
  render: () => {
    const [localNodes, setLocalNodes] = useState<NodeRenderItem[]>(nodes);
    const [localElements, setLocalElements] = useState<ElementRenderItem[]>([
      { id: "start", type: "pill", label: "Start", x: 110, y: 260, width: 120, height: 58 }
    ]);
    const [localConnections, setLocalConnections] = useState<ConnectionData[]>([
      { from: "start", to: "lead" },
      ...connections
    ]);

    return (
      <div className="story-shell">
        <Board
          editable
          nodes={localNodes}
          elements={localElements}
          connections={localConnections}
          onNodesChange={setLocalNodes}
          onElementsChange={setLocalElements}
          onConnectionsChange={setLocalConnections}
        />
        <pre className="story-json">{JSON.stringify({ nodes: localNodes, elements: localElements, connections: localConnections }, null, 2)}</pre>
      </div>
    );
  }
};

export const CoreUtilities: Story = {
  name: "Core utilities: layout and serialization",
  parameters: {
    docs: {
      source: {
        code: `import {
  applyGridLayout,
  createHistory,
  deserializeSnapshot,
  pushHistory,
  redoHistory,
  serializeSnapshot,
  undoHistory
} from "nodes-connector/core";

const [history, setHistory] = useState(() => createHistory(applyGridLayout(initial)));
const snapshot = history.present;
const serialized = serializeSnapshot(snapshot);

const commitSnapshot = (nextSnapshot) => {
  setHistory((current) => pushHistory(current, nextSnapshot));
};`
      }
    }
  },
  render: () => {
    const initial = {
      nodes: [
        { id: "a", label: "A", x: 0, y: 0 },
        { id: "b", label: "B", x: 0, y: 0 },
        { id: "c", label: "C", x: 0, y: 0 }
      ],
      elements: [{ id: "gate", type: "diamond" as const, label: "Gate", x: 0, y: 0, width: 96, height: 80 }],
      connections: [
        { from: "a", to: "gate" },
        { from: "gate", to: "b" },
        { from: "gate", to: "c" }
      ]
    };
    const [history, setHistory] = useState(() => createHistory(applyGridLayout(initial)));
    const snapshot = history.present;
    const serialized = serializeSnapshot(snapshot);
    const commitSnapshot = (nextSnapshot: typeof snapshot) => setHistory((current) => pushHistory(current, nextSnapshot));

    return (
      <div className="story-shell">
        <Board
          editable
          nodes={snapshot.nodes}
          elements={snapshot.elements}
          connections={snapshot.connections}
          onNodesChange={(nextNodes) => commitSnapshot({ ...snapshot, nodes: nextNodes })}
          onElementsChange={(nextElements) => commitSnapshot({ ...snapshot, elements: nextElements })}
          onConnectionsChange={(nextConnections) => commitSnapshot({ ...snapshot, connections: nextConnections })}
        />
        <div className="story-side-panel">
          <button type="button" onClick={() => commitSnapshot(applyGridLayout(snapshot))}>
            Apply grid layout
          </button>
          <button type="button" onClick={() => commitSnapshot(deserializeSnapshot(serialized))}>
            Deserialize
          </button>
          <button type="button" onClick={() => setHistory((current) => undoHistory(current))}>
            Undo
          </button>
          <button type="button" onClick={() => setHistory((current) => redoHistory(current))}>
            Redo
          </button>
          <pre>{serialized}</pre>
        </div>
      </div>
    );
  }
};
