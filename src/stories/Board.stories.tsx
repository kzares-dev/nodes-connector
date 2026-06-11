import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { type ConnectionData, type ElementData, type NodeData } from "../core";
import { Board, Connector, Element, Node, type ElementRenderItem, type NodeRenderItem } from "../react";

const meta = {
  title: "nodes-connector/Board",
  component: Board,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Board is the main nodes-connector canvas. It supports controlled prop data, declarative children, and editable mode with per-node context menus."
      }
    }
  },
  argTypes: {
    editable: {
      control: "boolean",
      description: "Enables node drag and right-click context menus for connecting, removing connections, or deleting nodes."
    },
    nodes: {
      control: false,
      description: "Controlled node list. Use it when you want to save or restore the board from a database."
    },
    connections: {
      control: false,
      description: "Controlled list of connections between nodes."
    },
    defaultNodes: {
      control: false,
      description: "Initial uncontrolled node list."
    },
    defaultConnections: {
      control: false,
      description: "Initial uncontrolled connection list."
    },
    defaultViewport: {
      control: "object",
      description: "Initial map position and zoom: { x, y, zoom }."
    },
    pannable: {
      control: "boolean",
      description: "Allows moving the map by dragging the background."
    },
    zoomable: {
      control: "boolean",
      description: "Allows zooming with the mouse wheel."
    },
    minZoom: {
      control: "number",
      description: "Minimum allowed zoom."
    },
    maxZoom: {
      control: "number",
      description: "Maximum allowed zoom."
    },
    showNavigationControls: {
      control: "boolean",
      description: "Shows compact navigation controls in the bottom-right corner when pan or zoom are enabled."
    },
    elements: {
      control: false,
      description: "Controlled list of SVG geometric nodes."
    },
    defaultElements: {
      control: false,
      description: "Initial uncontrolled geometric nodes."
    }
  }
} satisfies Meta<typeof Board>;

export default meta;

type Story = StoryObj<typeof meta>;

const staticNodes: NodeData[] = [
  { id: "ingest", label: "Ingest API", x: 80, y: 96 },
  { id: "queue", label: "Event Queue", x: 360, y: 96 },
  { id: "worker", label: "Worker", x: 640, y: 220 },
  { id: "db", label: "Database", x: 360, y: 340 }
];

const staticConnections: ConnectionData[] = [
  { from: "ingest", to: "queue", label: "events" },
  { from: "queue", to: "worker" },
  { from: "worker", to: "db", label: "writes" },
  { from: "ingest", to: "db", label: "audit" }
];

export const StaticProps: Story = {
  name: "Static usage with props",
  parameters: {
    docs: {
      description: {
        story:
          "Use `nodes` and `connections` when your application already owns the state. This is ideal for rendering a flow saved in an API or database."
      },
      source: {
        code: `const nodes = [
  { id: "ingest", label: "Ingest API", x: 80, y: 96 },
  { id: "queue", label: "Event Queue", x: 360, y: 96 },
  { id: "worker", label: "Worker", x: 640, y: 220 },
  { id: "db", label: "Database", x: 360, y: 340 }
];

const connections = [
  { from: "ingest", to: "queue", label: "events" },
  { from: "queue", to: "worker" },
  { from: "worker", to: "db", label: "writes" },
  { from: "ingest", to: "db", label: "audit" }
];

<Board nodes={nodes} connections={connections} />`
      }
    }
  },
  args: {
    nodes: staticNodes,
    connections: staticConnections
  }
};

export const ChildrenApi: Story = {
  name: "Declarative children API",
  parameters: {
    docs: {
      description: {
        story:
          "Use `<Node />` and `<Connector />` as children when you want to declare the diagram directly in JSX. You can also render custom content inside each node."
      },
      source: {
        code: `<Board>
  <Node id="source" label="Source" x={96} y={96} />
  <Node id="transform" x={376} y={220}>
    <strong>Transform</strong>
  </Node>
  <Node id="target" label="Target" x={656} y={96} />
  <Connector from="source" to="transform" />
  <Connector from="transform" to="target" label="normalized" />
</Board>`
      }
    }
  },
  render: () => (
    <Board>
      <Node id="source" label="Source" x={96} y={96} />
      <Node id="transform" x={376} y={220}>
        <strong>Transform</strong>
      </Node>
      <Node id="target" label="Target" x={656} y={96} />
      <Connector from="source" to="transform" />
      <Connector from="transform" to="target" label="normalized" />
    </Board>
  )
};

export const Editable: Story = {
  name: "Context menu and persistence",
  parameters: {
    docs: {
      description: {
        story:
          "Right click a node to open actions for adding a connection, removing connections, or deleting the node. In controlled mode, `onNodesChange` and `onConnectionsChange` receive the updated snapshot."
      },
      source: {
        code: `function EditableFlow() {
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
}`
      }
    }
  },
  render: () => {
    const [nodes, setNodes] = useState(staticNodes);
    const [connections, setConnections] = useState(staticConnections);

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
};

export const CustomNodes: Story = {
  name: "Nodes with custom components",
  parameters: {
    docs: {
      description: {
        story:
          "When `<Node>` receives custom children, the container does not apply default visual chrome. `className` and `style` are controlled by the consumer."
      },
      source: {
        code: `<Board editable defaultViewport={{ x: 40, y: 20, zoom: 1 }}>
  <Node id="checkout" x={90} y={110} className="border border-green-300 bg-white p-3">
    <CheckoutCard />
  </Node>
  <Node id="risk" x={360} y={250} style={{ borderColor: "#fbbf24" }}>
    <RiskCard />
  </Node>
  <Connector from="checkout" to="risk" />
</Board>`
      }
    }
  },
  render: () => (
    <Board editable defaultViewport={{ x: 40, y: 20, zoom: 1 }}>
      <Node id="checkout" x={90} y={110} className="story-node story-node-green">
        <div className="story-card-content">
          <span>Checkout</span>
          <small>Public endpoint</small>
        </div>
      </Node>
      <Node id="risk" x={360} y={250} className="story-node story-node-amber">
        <div className="story-card-content">
          <span>Risk Engine</span>
          <small>Score payment</small>
        </div>
      </Node>
      <Node id="ledger" x={650} y={120} className="story-node story-node-blue">
        <div className="story-card-content">
          <span>Ledger</span>
          <small>Persist balance</small>
        </div>
      </Node>
      <Connector from="checkout" to="risk" />
      <Connector from="risk" to="ledger" />
    </Board>
  )
};

export const PhaseThreeNavigation: Story = {
  name: "Navigation and editing",
  parameters: {
    docs: {
      description: {
        story:
          "Navigation controls appear in the bottom-right corner by default. To connect: right click a node, select `Add connection`, move the mouse, and left click the target node."
      },
      source: {
        code: `<Board
  editable
  nodes={nodes}
  connections={connections}
  onNodesChange={setNodes}
  onConnectionsChange={setConnections}
  defaultViewport={{ x: 80, y: 40, zoom: 1 }}
  minZoom={0.25}
  maxZoom={2}
/>`
      }
    }
  },
  render: () => {
    const [nodes, setNodes] = useState<NodeRenderItem[]>([
      { id: "app", label: "App Shell", x: 160, y: 120 },
      { id: "auth", label: "Auth Service", x: 460, y: 90 },
      { id: "billing", label: "Billing", x: 460, y: 300 }
    ]);
    const [connections, setConnections] = useState<ConnectionData[]>([
      { from: "app", to: "auth" },
      { from: "app", to: "billing" }
    ]);

    return (
      <Board
        editable
        nodes={nodes}
        connections={connections}
        onNodesChange={setNodes}
        onConnectionsChange={setConnections}
        defaultViewport={{ x: 80, y: 40, zoom: 1 }}
      />
    );
  }
};

export const PhaseFourNodeCreationAndEditing: Story = {
  name: "Create nodes, edit text, and resize",
  parameters: {
    docs: {
      description: {
        story:
          "Right click the background to open the board menu. Use `Add node` to create one at that position. Double click a node to edit its text and resize the container from the bottom-right corner."
      },
      source: {
        code: `function PhaseFour() {
  const [nodes, setNodes] = useState<NodeRenderItem[]>([
    { id: "idea", label: "Idea", x: 180, y: 120, width: 150, height: 72 }
  ]);

  return <Board editable nodes={nodes} onNodesChange={setNodes} />;
}`
      }
    }
  },
  render: () => {
    const [nodes, setNodes] = useState<NodeRenderItem[]>([
      { id: "idea", label: "Idea", x: 180, y: 120, width: 150, height: 72 },
      { id: "review", label: "Review", x: 430, y: 230, width: 170, height: 72 }
    ]);
    const [connections, setConnections] = useState<ConnectionData[]>([{ from: "idea", to: "review" }]);

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
};

const geometricElements: ElementData[] = [
  { id: "rect", type: "rectangle", x: 90, y: 110, width: 96, height: 64, label: "Rect" },
  { id: "circle", type: "circle", x: 230, y: 110, width: 72, height: 72, label: "Circle" },
  { id: "diamond", type: "diamond", x: 360, y: 110, width: 88, height: 72, label: "Decision" },
  { id: "triangle", type: "triangle", x: 500, y: 110, width: 88, height: 72 },
  { id: "hex", type: "hexagon", x: 90, y: 260, width: 104, height: 72 },
  { id: "pill", type: "pill", x: 250, y: 260, width: 116, height: 56, label: "Start" },
  { id: "para", type: "parallelogram", x: 430, y: 260, width: 116, height: 64 }
];

export const PhaseFiveElements: Story = {
  name: "Geometric nodes",
  parameters: {
    docs: {
      description: {
        story:
          "The package includes seven basic shapes and the declarative `<Element />` API. Geometric elements are graph nodes: they can be dragged, connected, deleted, and used as the source or target of a `Connector`."
      },
      source: {
        code: `<Board editable>
  <Element id="input" type="parallelogram" x={90} y={110} width={116} height={64} label="Input" />
  <Element id="decision" type="diamond" x={330} y={110} width={96} height={80} label="OK?" />
  <Node id="owner" label="Owner" x={560} y={120} />
  <Connector from="input" to="decision" />
  <Connector from="decision" to="owner" />
</Board>`
      }
    }
  },
  render: () => {
    const [elements, setElements] = useState<ElementRenderItem[]>(geometricElements);
    const [nodes, setNodes] = useState<NodeRenderItem[]>([{ id: "owner", label: "Owner", x: 650, y: 260 }]);
    const [connections, setConnections] = useState<ConnectionData[]>([
      { from: "rect", to: "diamond" },
      { from: "diamond", to: "owner" },
      { from: "pill", to: "owner" }
    ]);

    return (
      <Board
        editable
        nodes={nodes}
        connections={connections}
        elements={elements}
        onNodesChange={setNodes}
        onConnectionsChange={setConnections}
        onElementsChange={setElements}
        defaultViewport={{ x: 40, y: 20, zoom: 1 }}
      />
    );
  }
};

export const DeclarativeElements: Story = {
  name: "Declarative Element",
  parameters: {
    docs: {
      source: {
        code: `<Board editable>
  <Element id="input" type="parallelogram" x={110} y={120} width={128} height={64} label="Input" fill="#eff6ff" stroke="#2563eb" />
  <Element id="process" type="rectangle" x={330} y={120} width={128} height={64} label="Process" fill="#f8fafc" stroke="#64748b" />
  <Element id="decision" type="diamond" x={550} y={110} width={104} height={88} label="OK?" fill="#fffbeb" stroke="#f59e0b" />
  <Node id="owner" label="Owner" x={330} y={280} />
  <Connector from="input" to="process" />
  <Connector from="process" to="decision" />
  <Connector from="decision" to="owner" />
</Board>`
      }
    }
  },
  render: () => (
    <Board editable>
      <Element id="input" type="parallelogram" x={110} y={120} width={128} height={64} label="Input" fill="#eff6ff" stroke="#2563eb" />
      <Element id="process" type="rectangle" x={330} y={120} width={128} height={64} label="Process" fill="#f8fafc" stroke="#64748b" />
      <Element id="decision" type="diamond" x={550} y={110} width={104} height={88} label="OK?" fill="#fffbeb" stroke="#f59e0b" />
      <Node id="owner" label="Owner" x={330} y={280} />
      <Connector from="input" to="process" />
      <Connector from="process" to="decision" />
      <Connector from="decision" to="owner" />
    </Board>
  )
};
