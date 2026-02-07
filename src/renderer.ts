import { Grid } from './grid';
import { Player } from './player';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize: number;

  constructor(canvas: HTMLCanvasElement, grid: Grid) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;

    // Calculate cell size based on canvas size
    const size = Math.min(800, window.innerWidth - 40);
    this.canvas.width = size;
    this.canvas.height = size;
    this.cellSize = size / grid.getWidth();
  }

  render(grid: Grid, player: Player): void {
    const ctx = this.ctx;
    const cs = this.cellSize;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw all cells
    for (let y = 0; y < grid.getHeight(); y++) {
      for (let x = 0; x < grid.getWidth(); x++) {
        const cell = grid.getCell(x, y);

        switch (cell) {
          case 0: // CellType.EMPTY
            // Nothing to draw, shows background
            break;
          case 1: // CellType.FILLED
          case 2: // CellType.BORDER
            ctx.fillStyle = cell === 2 ? '#0f3460' : '#16213e';
            ctx.fillRect(x * cs, y * cs, cs, cs);
            break;
          case 3: // CellType.LINE
            ctx.fillStyle = '#e94560';
            ctx.fillRect(x * cs, y * cs, cs, cs);
            break;
        }
      }
    }

    // Draw player
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(
      (player.x + 0.5) * cs,
      (player.y + 0.5) * cs,
      cs * 0.6,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Add glow effect to player
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  updateUI(coverage: number, level: number): void {
    const percentEl = document.getElementById('percent');
    const levelEl = document.getElementById('level');

    if (percentEl) {
      percentEl.textContent = `${coverage.toFixed(1)}%`;
    }
    if (levelEl) {
      levelEl.textContent = level.toString();
    }
  }
}
