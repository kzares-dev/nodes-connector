import {
  Activity,
  ChevronRight,
  Gauge,
  GitBranch,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Target
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ConnectionData } from "nodes-connector/core";
import { Board, type NodeRenderItem, type RenderConnectionProps, type RenderNodeProps } from "nodes-connector/react";

type Algorithm = "bfs" | "dfs" | "dijkstra";
type NodeStatus = "idle" | "frontier" | "current" | "visited" | "path" | "target";
type EdgeStatus = "idle" | "active" | "visited" | "path";

type WeightedConnection = ConnectionData<{ weight: number }>;

type Step = {
  title: string;
  detail: string;
  current?: string;
  frontier: string[];
  visited: string[];
  path: string[];
  activeEdge?: string;
  visitedEdges: string[];
  distances: Record<string, number>;
};

const nodes: NodeRenderItem[] = [
  { id: "A", label: "A", x: 70, y: 120 },
  { id: "B", label: "B", x: 310, y: 70 },
  { id: "C", label: "C", x: 310, y: 220 },
  { id: "D", label: "D", x: 560, y: 70 },
  { id: "E", label: "E", x: 560, y: 230 },
  { id: "F", label: "F", x: 810, y: 145 }
];

const connections: WeightedConnection[] = [
  { from: "A", to: "B", label: "4", meta: { weight: 4 } },
  { from: "A", to: "C", label: "2", meta: { weight: 2 } },
  { from: "B", to: "D", label: "5", meta: { weight: 5 } },
  { from: "B", to: "E", label: "10", meta: { weight: 10 } },
  { from: "C", to: "E", label: "3", meta: { weight: 3 } },
  { from: "C", to: "B", label: "1", meta: { weight: 1 } },
  { from: "D", to: "F", label: "6", meta: { weight: 6 } },
  { from: "E", to: "D", label: "2", meta: { weight: 2 } },
  { from: "E", to: "F", label: "4", meta: { weight: 4 } }
];

const speedOptions = [
  { label: "Slow", value: 1200 },
  { label: "Normal", value: 750 },
  { label: "Fast", value: 350 }
];

function edgeId(from: string, to: string) {
  return `${from}->${to}`;
}

function buildAdjacency() {
  const adjacency = new Map<string, Array<{ to: string; edge: WeightedConnection; weight: number }>>();

  for (const node of nodes) {
    adjacency.set(node.id, []);
  }

  for (const connection of connections) {
    adjacency.get(connection.from)?.push({
      to: connection.to,
      edge: connection,
      weight: connection.meta?.weight ?? Number(connection.label ?? 1)
    });
  }

  return adjacency;
}

function reconstructPath(parent: Record<string, string | undefined>, start: string, target: string) {
  const path: string[] = [];
  let cursor: string | undefined = target;

  while (cursor) {
    path.unshift(cursor);
    if (cursor === start) {
      return path;
    }
    cursor = parent[cursor];
  }

  return [];
}

function makeStep(
  base: Omit<Step, "frontier" | "visited" | "path" | "visitedEdges" | "distances"> & {
    frontier?: string[];
    visited?: string[];
    path?: string[];
    visitedEdges?: string[];
    distances?: Record<string, number>;
  }
): Step {
  return {
    frontier: [],
    visited: [],
    path: [],
    visitedEdges: [],
    distances: {},
    ...base
  };
}

function buildBfsSteps(start: string, target: string): Step[] {
  const adjacency = buildAdjacency();
  const queue = [start];
  const seen = new Set([start]);
  const visited = new Set<string>();
  const parent: Record<string, string | undefined> = {};
  const visitedEdges: string[] = [];
  const steps: Step[] = [
    makeStep({
      title: "Initialize BFS",
      detail: `Queue starts with ${start}. BFS explores by layers.`,
      frontier: [...queue],
      visited: [...visited]
    })
  ];

  while (queue.length) {
    const current = queue.shift()!;
    visited.add(current);
    steps.push(makeStep({
      title: `Visit ${current}`,
      detail: `Remove ${current} from the queue and inspect its outgoing edges.`,
      current,
      frontier: [...queue],
      visited: [...visited],
      visitedEdges: [...visitedEdges]
    }));

    if (current === target) {
      break;
    }

    for (const next of adjacency.get(current) ?? []) {
      const id = edgeId(current, next.to);
      visitedEdges.push(id);

      if (!seen.has(next.to)) {
        seen.add(next.to);
        parent[next.to] = current;
        queue.push(next.to);
        steps.push(makeStep({
          title: `Discover ${next.to}`,
          detail: `${next.to} was not visited, so it is added to the queue.`,
          current,
          frontier: [...queue],
          visited: [...visited],
          activeEdge: id,
          visitedEdges: [...visitedEdges]
        }));
      }
    }
  }

  const path = reconstructPath(parent, start, target);
  steps.push(makeStep({
    title: path.length ? "Shortest unweighted path found" : "No path found",
    detail: path.length ? path.join(" -> ") : `${target} is not reachable from ${start}.`,
    frontier: [],
    visited: [...visited],
    path,
    visitedEdges
  }));

  return steps;
}

function buildDfsSteps(start: string, target: string): Step[] {
  const adjacency = buildAdjacency();
  const stack = [start];
  const seen = new Set<string>();
  const visited = new Set<string>();
  const parent: Record<string, string | undefined> = {};
  const visitedEdges: string[] = [];
  const steps: Step[] = [
    makeStep({
      title: "Initialize DFS",
      detail: `Stack starts with ${start}. DFS follows one branch before backtracking.`,
      frontier: [...stack]
    })
  ];

  while (stack.length) {
    const current = stack.pop()!;

    if (seen.has(current)) {
      continue;
    }

    seen.add(current);
    visited.add(current);
    steps.push(makeStep({
      title: `Visit ${current}`,
      detail: `Pop ${current} from the stack.`,
      current,
      frontier: [...stack],
      visited: [...visited],
      visitedEdges: [...visitedEdges]
    }));

    if (current === target) {
      break;
    }

    const neighbors = [...(adjacency.get(current) ?? [])].reverse();

    for (const next of neighbors) {
      const id = edgeId(current, next.to);
      visitedEdges.push(id);

      if (!seen.has(next.to)) {
        parent[next.to] ??= current;
        stack.push(next.to);
        steps.push(makeStep({
          title: `Push ${next.to}`,
          detail: `${next.to} is placed on top of the stack.`,
          current,
          frontier: [...stack],
          visited: [...visited],
          activeEdge: id,
          visitedEdges: [...visitedEdges]
        }));
      }
    }
  }

  const path = reconstructPath(parent, start, target);
  steps.push(makeStep({
    title: path.length ? "DFS reached the target" : "No path found",
    detail: path.length ? path.join(" -> ") : `${target} is not reachable from ${start}.`,
    frontier: [],
    visited: [...visited],
    path,
    visitedEdges
  }));

  return steps;
}

function buildDijkstraSteps(start: string, target: string): Step[] {
  const adjacency = buildAdjacency();
  const unvisited = new Set(nodes.map((node) => node.id));
  const distances = Object.fromEntries(nodes.map((node) => [node.id, Number.POSITIVE_INFINITY]));
  const parent: Record<string, string | undefined> = {};
  const visited = new Set<string>();
  const visitedEdges: string[] = [];
  distances[start] = 0;

  const steps: Step[] = [
    makeStep({
      title: "Initialize Dijkstra",
      detail: `Distance to ${start} is 0. All other distances are infinity.`,
      frontier: [start],
      distances: { ...distances }
    })
  ];

  while (unvisited.size) {
    const current = [...unvisited].sort((a, b) => distances[a] - distances[b])[0];

    if (!Number.isFinite(distances[current])) {
      break;
    }

    unvisited.delete(current);
    visited.add(current);
    steps.push(makeStep({
      title: `Settle ${current}`,
      detail: `${current} now has its final shortest distance: ${distances[current]}.`,
      current,
      frontier: [...unvisited].filter((id) => Number.isFinite(distances[id])),
      visited: [...visited],
      visitedEdges: [...visitedEdges],
      distances: { ...distances }
    }));

    if (current === target) {
      break;
    }

    for (const next of adjacency.get(current) ?? []) {
      if (!unvisited.has(next.to)) {
        continue;
      }

      const id = edgeId(current, next.to);
      visitedEdges.push(id);
      const candidate = distances[current] + next.weight;

      if (candidate < distances[next.to]) {
        distances[next.to] = candidate;
        parent[next.to] = current;
        steps.push(makeStep({
          title: `Relax ${current} -> ${next.to}`,
          detail: `New best distance for ${next.to}: ${candidate}.`,
          current,
          frontier: [...unvisited].filter((nodeId) => Number.isFinite(distances[nodeId])),
          visited: [...visited],
          activeEdge: id,
          visitedEdges: [...visitedEdges],
          distances: { ...distances }
        }));
      } else {
        steps.push(makeStep({
          title: `Skip ${current} -> ${next.to}`,
          detail: `Candidate distance ${candidate} is not better than ${distances[next.to]}.`,
          current,
          frontier: [...unvisited].filter((nodeId) => Number.isFinite(distances[nodeId])),
          visited: [...visited],
          activeEdge: id,
          visitedEdges: [...visitedEdges],
          distances: { ...distances }
        }));
      }
    }
  }

  const path = reconstructPath(parent, start, target);
  steps.push(makeStep({
    title: path.length ? "Shortest weighted path found" : "No path found",
    detail: path.length ? `${path.join(" -> ")} · cost ${distances[target]}` : `${target} is not reachable from ${start}.`,
    frontier: [],
    visited: [...visited],
    path,
    visitedEdges,
    distances: { ...distances }
  }));

  return steps;
}

function buildSteps(algorithm: Algorithm, start: string, target: string) {
  if (algorithm === "dfs") {
    return buildDfsSteps(start, target);
  }

  if (algorithm === "dijkstra") {
    return buildDijkstraSteps(start, target);
  }

  return buildBfsSteps(start, target);
}

function getNodeStatus(nodeId: string, step: Step, target: string): NodeStatus {
  if (step.path.includes(nodeId)) {
    return "path";
  }

  if (step.current === nodeId) {
    return "current";
  }

  if (nodeId === target) {
    return "target";
  }

  if (step.frontier.includes(nodeId)) {
    return "frontier";
  }

  if (step.visited.includes(nodeId)) {
    return "visited";
  }

  return "idle";
}

function getEdgeStatus(connection: ConnectionData, step: Step): EdgeStatus {
  const id = edgeId(connection.from, connection.to);
  const pathEdges = new Set(step.path.slice(0, -1).map((nodeId, index) => edgeId(nodeId, step.path[index + 1])));

  if (pathEdges.has(id)) {
    return "path";
  }

  if (step.activeEdge === id) {
    return "active";
  }

  if (step.visitedEdges.includes(id)) {
    return "visited";
  }

  return "idle";
}

function formatDistance(value: number | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return "∞";
  }

  return String(value);
}

function NodeView({ node, width, height, status, distance }: RenderNodeProps & { status: NodeStatus; distance?: number }) {
  return (
    <div className={`graph-node graph-node-${status}`} style={{ width, minHeight: height }}>
      <span className="graph-node-id">{node.label ?? node.id}</span>
      <span className="graph-node-distance">d: {formatDistance(distance)}</span>
    </div>
  );
}

function ConnectionView({ connection, from, to, path, status }: RenderConnectionProps & { status: EdgeStatus }) {
  const labelX = (from.x + from.width / 2 + to.x + to.width / 2) / 2;
  const labelY = (from.y + from.height / 2 + to.y + to.height / 2) / 2 - 10;

  return (
    <>
      <path className={`graph-edge graph-edge-shadow graph-edge-${status}`} d={path} fill="none" />
      <path className={`graph-edge graph-edge-${status}`} d={path} fill="none" />
      <text className={`graph-edge-label graph-edge-label-${status}`} x={labelX} y={labelY}>
        {connection.label}
      </text>
    </>
  );
}

export function App() {
  const [algorithm, setAlgorithm] = useState<Algorithm>("bfs");
  const [start, setStart] = useState("A");
  const [target, setTarget] = useState("F");
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(750);

  const steps = useMemo(() => buildSteps(algorithm, start, target), [algorithm, start, target]);
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const nodeIds = nodes.map((node) => node.id);

  useEffect(() => {
    setStepIndex(0);
    setPlaying(false);
  }, [algorithm, start, target]);

  useEffect(() => {
    if (!playing) {
      return;
    }

    const timer = window.setTimeout(() => {
      setStepIndex((current) => {
        if (current >= steps.length - 1) {
          setPlaying(false);
          return current;
        }

        return current + 1;
      });
    }, speed);

    return () => window.clearTimeout(timer);
  }, [playing, speed, stepIndex, steps.length]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <GitBranch size={22} />
          <div>
            <h1>Graph Visualizer</h1>
            <p>Powered by nodes-connector</p>
          </div>
        </div>

        <section className="panel">
          <label>
            Algorithm
            <select value={algorithm} onChange={(event) => setAlgorithm(event.target.value as Algorithm)}>
              <option value="bfs">Breadth-first search</option>
              <option value="dfs">Depth-first search</option>
              <option value="dijkstra">Dijkstra</option>
            </select>
          </label>

          <div className="control-grid">
            <label>
              Start
              <select value={start} onChange={(event) => setStart(event.target.value)}>
                {nodeIds.map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </label>
            <label>
              Target
              <select value={target} onChange={(event) => setTarget(event.target.value)}>
                {nodeIds.map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Speed
            <div className="segmented">
              {speedOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={speed === option.value ? "is-active" : ""}
                  onClick={() => setSpeed(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </label>
        </section>

        <section className="panel">
          <div className="transport">
            <button type="button" className="primary" onClick={() => setPlaying((value) => !value)}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
              {playing ? "Pause" : "Run"}
            </button>
            <button type="button" onClick={() => setStepIndex((value) => Math.min(value + 1, steps.length - 1))}>
              <SkipForward size={16} />
              Step
            </button>
            <button type="button" onClick={() => { setStepIndex(0); setPlaying(false); }}>
              <RotateCcw size={16} />
              Reset
            </button>
          </div>

          <div className="progress">
            <span>Step {stepIndex + 1} of {steps.length}</span>
            <progress value={stepIndex + 1} max={steps.length} />
          </div>
        </section>

        <section className="panel step-panel">
          <div className="step-title">
            <Activity size={18} />
            <h2>{step.title}</h2>
          </div>
          <p>{step.detail}</p>
        </section>

        <section className="panel legend">
          <span><i className="legend-current" /> Current</span>
          <span><i className="legend-frontier" /> Frontier</span>
          <span><i className="legend-visited" /> Visited</span>
          <span><i className="legend-path" /> Final path</span>
        </section>
      </aside>

      <section className="workspace">
        <div className="toolbar">
          <div>
            <span className="eyebrow"><Target size={15} /> {start} to {target}</span>
            <h2>{algorithm === "dijkstra" ? "Weighted shortest path" : algorithm === "dfs" ? "Depth-first traversal" : "Layer-by-layer traversal"}</h2>
          </div>
          <div className="statbar">
            <span><Gauge size={15} /> {step.visited.length} visited</span>
            <span><ChevronRight size={15} /> {step.frontier.length} queued</span>
          </div>
        </div>

        <Board
          nodes={nodes}
          connections={connections}
          defaultViewport={{ x: 70, y: 70, zoom: 1 }}
          showNavigationControls
          pannable
          zoomable
          renderNode={(props) => (
            <NodeView
              {...props}
              status={getNodeStatus(props.node.id, step, target)}
              distance={step.distances[props.node.id]}
            />
          )}
          renderConnection={(props) => (
            <ConnectionView
              {...props}
              status={getEdgeStatus(props.connection, step)}
            />
          )}
        />
      </section>
    </main>
  );
}
