export enum CellType {
  EMPTY = 0,
  FILLED = 1,
  BORDER = 2,
  LINE = 3
}

export interface Point {
  x: number;
  y: number;
}

export class Grid {
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
    this.cells = [];
    for (let y = 0; y < this.height; y++) {
      const row: CellType[] = [];
      for (let x = 0; x < this.width; x++) {
        // Border cells
        if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
          row.push(CellType.BORDER);
        } else {
          row.push(CellType.EMPTY);
        }
      }
      this.cells.push(row);
    }
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  getCell(x: number, y: number): CellType {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return CellType.BORDER; // Treat out of bounds as border
    }
    return this.cells[y][x];
  }

  setCell(x: number, y: number, type: CellType): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.cells[y][x] = type;
    }
  }

  isEmpty(x: number, y: number): boolean {
    return this.getCell(x, y) === CellType.EMPTY;
  }

  isTraversable(x: number, y: number): boolean {
    const cell = this.getCell(x, y);
    return cell === CellType.FILLED || cell === CellType.BORDER;
  }

  setLine(x: number, y: number): void {
    this.setCell(x, y, CellType.LINE);
  }

  // Clear all temporary lines
  clearLines(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.cells[y][x] === CellType.LINE) {
          this.cells[y][x] = CellType.EMPTY;
        }
      }
    }
  }

  // Convert all lines to filled
  convertLinesToFilled(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.cells[y][x] === CellType.LINE) {
          this.cells[y][x] = CellType.FILLED;
        }
      }
    }
  }

  // Calculate coverage percentage
  getCoverage(): number {
    let filledCount = 0;
    let totalCount = 0;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.cells[y][x];
        if (cell === CellType.FILLED || cell === CellType.BORDER) {
          filledCount++;
        }
        totalCount++;
      }
    }

    return (filledCount / totalCount) * 100;
  }

  // Flood fill algorithm to capture territory
  // Captures enclosed regions by filling all but the largest empty region
  captureTerritory(linePath: Point[]): void {
    if (linePath.length === 0) {
      return;
    }

    // Create a copy of the grid for simulation
    const gridCopy = this.cells.map(row => [...row]);

    // Mark lines as FILLED in the copy
    for (const p of linePath) {
      gridCopy[p.y][p.x] = CellType.FILLED;
    }

    // Find all empty regions using flood fill
    const visited = new Set<string>();
    const regions: Point[][] = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const key = `${x},${y}`;
        if (gridCopy[y][x] === CellType.EMPTY && !visited.has(key)) {
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

    // Convert the line to filled
    this.convertLinesToFilled();
  }

  private floodFill(grid: CellType[][], startX: number, startY: number, visited: Set<string>): Point[] {
    const region: Point[] = [];
    const stack: Point[] = [{ x: startX, y: startY }];

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;
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
    return linePath.some(p => p.x === x && p.y === y);
  }
}
