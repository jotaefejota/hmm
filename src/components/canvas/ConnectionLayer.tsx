import { edgePath } from "../../layout/curves";
import type { CanvasEdge } from "../../layout/projectCanvas";

export function ConnectionLayer({ edges }: { edges: CanvasEdge[] }) {
  return (
    <svg className="connection-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {edges.map((edge, index) => (
        <path
          key={edge.id}
          className={index === 0 ? "connection connection-origin" : "connection"}
          d={edgePath(edge)}
          pathLength="1"
        />
      ))}
    </svg>
  );
}

