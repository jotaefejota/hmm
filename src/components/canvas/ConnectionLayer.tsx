import { motion, useReducedMotion } from "motion/react";
import { edgePath } from "../../layout/curves";
import { FIELD_HEIGHT, FIELD_WIDTH } from "../../layout/cell-field";
import type { CellPositionMap } from "../../layout/pressure-layout";
import type { CanvasEdge } from "../../layout/projectCanvas";

export function ConnectionLayer({ edges, positions }: { edges: CanvasEdge[]; positions: CellPositionMap }) {
  const reducedMotion = useReducedMotion();
  return (
    <svg className="connection-layer" viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
      {edges.map((edge) => {
        const path = edgePath(edge, positions);
        return (
          <motion.path
            key={edge.id}
            className={`connection connection-${edge.status}`}
            d={path}
            animate={{ d: path }}
            initial={false}
            transition={{ duration: reducedMotion ? 0.01 : 0.64, ease: [0.22, 1, 0.36, 1] }}
            pathLength="1"
          />
        );
      })}
    </svg>
  );
}
