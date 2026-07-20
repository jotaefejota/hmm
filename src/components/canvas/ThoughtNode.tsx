import type { PropsWithChildren } from "react";

type ThoughtNodeProps = PropsWithChildren<{
  className: string;
  label: string;
  x: number;
  y: number;
  shape: number;
  interactive?: boolean;
}>;

export function ThoughtNode({ className, label, x, y, shape, interactive, children }: ThoughtNodeProps) {
  const style = { "--node-x": `${x}%`, "--node-y": `${y}%` } as React.CSSProperties;
  const content = (
    <>
      <span className="node-label">{label}</span>
      <span className="node-copy">{children}</span>
    </>
  );

  if (interactive) {
    return (
      <button className={`thought-node ${className} shape-${shape}`} style={style} type="button">
        {content}
      </button>
    );
  }

  return (
    <article className={`thought-node ${className} shape-${shape}`} style={style}>
      {content}
    </article>
  );
}

