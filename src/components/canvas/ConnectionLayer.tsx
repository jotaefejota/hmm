import { edgePath } from "../../layout/curves";
import { FIELD_HEIGHT, FIELD_WIDTH } from "../../layout/cell-field";
import type { CellPositionMap } from "../../layout/pressure-layout";
import type { CanvasEdge } from "../../layout/projectCanvas";

export function ConnectionLayer({ edges, positions }: { edges: CanvasEdge[]; positions: CellPositionMap }) {
  return (
    <svg className="connection-layer" viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
      {edges.map((edge) => (
        <path
          key={edge.id}
          className={`connection connection-${edge.status}`}
          d={edgePath(edge, positions)}
          pathLength="1"
        />
      ))}
    </svg>
  );
}
