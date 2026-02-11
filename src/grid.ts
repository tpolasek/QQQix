export enum CellType {
  EMPTY = 0,
  FILLED = 1,
  BORDER = 2,
  LINE = 3,
}

export interface Point {
  x: number;
  y: number;
}

export class Grid {
  private static readonly CARDINAL_DIRECTIONS: ReadonlyArray<Point> = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];

  private cells: CellType[][];
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cells = [];
    this.initialize();
  }

  private initialize(): void {
    this.cells = Array.from({ length: this.height }, (_, y) =>
      Array.from({ length: this.width }, (_, x) => (this.isBorderCell(x, y) ? CellType.BORDER : CellType.EMPTY)),
    );
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  getCell(x: number, y: number): CellType {
    if (!this.isInBounds(x, y)) {
      return CellType.BORDER; // Treat out of bounds as border
    }
    return this.cells[y][x];
  }

  setCell(x: number, y: number, type: CellType): void {
    if (this.isInBounds(x, y)) {
      this.cells[y][x] = type;
    }
  }

  isEmpty(x: number, y: number): boolean {
    return this.getCell(x, y) === CellType.EMPTY;
  }

  // Check if a cell can be used to complete a shape (from DRAW mode)
  // Any FILLED, BORDER, or LINE cell can complete a shape
  canCompleteShape(x: number, y: number): boolean {
    return this.getCell(x, y) !== CellType.EMPTY;
  }

  isTraversable(x: number, y: number): boolean {
    switch (this.getCell(x, y)) {
      case CellType.BORDER:
      case CellType.LINE:
        return true;
      case CellType.FILLED:
        // Filled cells are traversable only when on the frontier.
        return this.hasEmptyNeighbor(x, y);
      default:
        return false;
    }
  }

  // Check if a cell has at least one empty neighbor
  private hasEmptyNeighbor(x: number, y: number): boolean {
    for (const direction of Grid.CARDINAL_DIRECTIONS) {
      if (this.isEmpty(x + direction.x, y + direction.y)) {
        return true;
      }
    }
    return false;
  }

  setLine(x: number, y: number): void {
    this.setCell(x, y, CellType.LINE);
  }

  // Clear all temporary lines
  clearLines(): void {
    this.replaceCells(CellType.LINE, CellType.EMPTY);
  }

  // Convert all lines to filled
  convertLinesToFilled(): void {
    this.replaceCells(CellType.LINE, CellType.FILLED);
  }

  // Calculate coverage percentage
  getCoverage(): number {
    const totalCount = this.width * this.height;
    let filledCount = 0;

    this.forEachCell((cell) => {
      if (cell !== CellType.EMPTY) {
        filledCount++;
      }
    });

    return (filledCount / totalCount) * 100;
  }

  // Flood fill algorithm to capture territory
  // Captures enclosed regions by filling all but the largest empty region
  captureTerritory(linePath: Point[]): void {
    if (linePath.length === 0) {
      return;
    }

    // Create a copy of the grid for simulation
    const gridCopy = this.cells.map((row) => [...row]);

    // Mark lines as FILLED in the copy
    for (const p of linePath) {
      gridCopy[p.y][p.x] = CellType.FILLED;
    }

    // Find all empty regions using flood fill
    const visited = new Set<string>();
    const regions: Point[][] = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (gridCopy[y][x] === CellType.EMPTY && !visited.has(this.makeKey(x, y))) {
          const region = this.floodFill(gridCopy, x, y, visited);
          if (region.length > 0) {
            regions.push(region);
          }
        }
      }
    }

    if (regions.length === 0) {
      this.convertLinesToFilled();
      return;
    }

    // Sort regions by size (smallest first)
    regions.sort((a, b) => a.length - b.length);

    // Fill all regions except the largest one
    // The largest region is assumed to be the "outside" (unenclosed) area
    // All smaller regions are enclosed and should be captured
    for (let i = 0; i < regions.length - 1; i++) {
      for (const p of regions[i]) {
        this.setCell(p.x, p.y, CellType.FILLED);
      }
    }

    // Keep the line as LINE (don't convert to FILLED)
    // Lines remain as permanent traversable paths
    // this.convertLinesToFilled();
  }

  private floodFill(grid: CellType[][], startX: number, startY: number, visited: Set<string>): Point[] {
    const region: Point[] = [];
    const stack: Point[] = [{ x: startX, y: startY }];

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const key = this.makeKey(x, y);

      if (visited.has(key)) continue;
      if (!this.isInBounds(x, y)) continue;
      if (grid[y][x] !== CellType.EMPTY) continue;

      visited.add(key);
      region.push({ x, y });

      // Add neighbors
      stack.push({ x: x + 1, y });
      stack.push({ x: x - 1, y });
      stack.push({ x, y: y + 1 });
      stack.push({ x, y: y - 1 });
    }

    return region;
  }

  // Check if a point is on the current line being drawn
  isOnLine(x: number, y: number, linePath: Point[]): boolean {
    return linePath.some((p) => p.x === x && p.y === y);
  }

  private isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  private isBorderCell(x: number, y: number): boolean {
    return x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1;
  }

  private forEachCell(visitor: (cell: CellType, x: number, y: number) => void): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        visitor(this.cells[y][x], x, y);
      }
    }
  }

  private replaceCells(from: CellType, to: CellType): void {
    this.forEachCell((cell, x, y) => {
      if (cell === from) {
        this.cells[y][x] = to;
      }
    });
  }

  private makeKey(x: number, y: number): string {
    return `${x},${y}`;
  }
}
