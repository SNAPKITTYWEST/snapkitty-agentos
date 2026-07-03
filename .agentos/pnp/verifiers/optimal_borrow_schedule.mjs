export function verify(problem, witness) {
  const graph = witness?.borrowGraph || problem.borrowGraph || {
    nodes: ["A", "B", "C"],
    edges: [["A", "B"], ["B", "C"]]
  };
  const schedule = witness?.schedule || [];
  if (schedule.length !== graph.nodes.length) return false;
  const seen = new Set(schedule);
  if (seen.size !== graph.nodes.length) return false;
  for (const node of graph.nodes) if (!seen.has(node)) return false;
  const pos = new Map(schedule.map((node, index) => [node, index]));
  for (const [from, to] of graph.edges || []) {
    if ((pos.get(from) ?? Infinity) >= (pos.get(to) ?? -1)) return false;
  }
  return true;
}
