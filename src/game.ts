import { Grid } from './grid';
import { Player, createPlayer, movePlayer } from './player';
import { InputHandler, Direction } from './input';
import { Renderer } from './renderer';

const GRID_SIZE = 100;
const MOVE_INTERVAL_TRAVERSE = 50; // ms between moves in traverse mode
const MOVE_INTERVAL_DRAW = 30; // ms between moves while drawing
const TARGET_COVERAGE = 75;

export class Game {
  private grid: Grid;
  private player: Player;
  private inputHandler: InputHandler;
  private renderer: Renderer;
  private level: number = 1;
  private lastMoveTime: number = 0;
  private gameOver: boolean = false;
  private animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.grid = new Grid(GRID_SIZE, GRID_SIZE);
    this.player = createPlayer(this.grid);
    this.inputHandler = new InputHandler();
    this.renderer = new Renderer(canvas, this.grid);

    this.renderer.updateUI(this.grid.getCoverage(), this.level);
  }

  start(): void {
    this.gameLoop();
  }

  private gameLoop = (timestamp: number = 0): void => {
    if (this.gameOver) {
      return;
    }

    this.update(timestamp);
    this.renderer.render(this.grid, this.player);

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  update(timestamp: number): void {
    const interval = this.player.mode === 'draw' ? MOVE_INTERVAL_DRAW : MOVE_INTERVAL_TRAVERSE;

    if (timestamp - this.lastMoveTime < interval) {
      return;
    }

    this.lastMoveTime = timestamp;

    // Get input direction
    const direction = this.inputHandler.getContinuousDirection();
    if (direction === null) {
      return;
    }

    // Move player
    const result = movePlayer(this.player, this.grid, direction);

    if (result.gameOver) {
      this.handleGameOver();
      return;
    }

    // Handle shape completion
    if (result.completedShape && result.capturedPath) {
      this.handleShapeCompletion(result.capturedPath);
    }

    // Update UI
    this.renderer.updateUI(this.grid.getCoverage(), this.level);

    // Check for level complete
    if (this.grid.getCoverage() >= TARGET_COVERAGE) {
      this.nextLevel();
    }
  }

  private handleShapeCompletion(capturedPath: Array<{ x: number; y: number }>): void {
    // Capture the territory using flood fill
    this.grid.captureTerritory(capturedPath);
  }

  private nextLevel(): void {
    this.level++;

    // Reset grid
    this.grid = new Grid(GRID_SIZE, GRID_SIZE);
    this.player = createPlayer(this.grid);

    // Flash effect or delay could go here
    this.renderer.updateUI(this.grid.getCoverage(), this.level);
  }

  private handleGameOver(): void {
    this.gameOver = true;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    // Show game over message
    const canvas = this.renderer['canvas'];
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#e94560';
      ctx.font = '48px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);

      ctx.fillStyle = '#fff';
      ctx.font = '24px Courier New';
      ctx.fillText('Refresh to restart', canvas.width / 2, canvas.height / 2 + 50);
    }
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  // Test helpers
  getGrid(): Grid {
    return this.grid;
  }

  getPlayer(): Player {
    return this.player;
  }

  getLevel(): number {
    return this.level;
  }

  getCoverage(): number {
    return this.grid.getCoverage();
  }

  isGameOver(): boolean {
    return this.gameOver;
  }

  // Test helper: simulate keyboard input
  simulateKeyPress(key: string, pressed: boolean): void {
    this.inputHandler['simulateKeyPress'](key, pressed);
  }
}
