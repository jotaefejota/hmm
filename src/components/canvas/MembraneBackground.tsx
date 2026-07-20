const cells = [
  [7, 18, 13, 0], [19, 10, 10, 2], [35, 17, 14, 1], [51, 10, 10, 3], [67, 13, 13, 0], [87, 12, 15, 2],
  [8, 50, 18, 2], [21, 39, 11, 1], [37, 38, 9, 3], [66, 39, 11, 2], [93, 43, 16, 1],
  [8, 83, 15, 3], [19, 91, 10, 0], [42, 87, 14, 2], [59, 91, 12, 1], [91, 82, 17, 3],
] as const;

export function MembraneBackground() {
  return (
    <div className="membrane" aria-hidden="true">
      {cells.map(([x, y, size, shape], index) => (
        <span
          key={`${x}-${y}`}
          className={`membrane-cell shape-${shape}`}
          style={{ left: `${x}%`, top: `${y}%`, width: `${size}rem`, height: `${size}rem`, opacity: index % 3 === 0 ? 0.45 : 0.26 }}
        />
      ))}
    </div>
  );
}

