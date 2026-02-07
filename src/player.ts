import { Grid } from './grid';
import { Direction, InputHandler } from './input';

export type { Direction };

export enum PlayerMode {
  TRAVERSE = 'traverse',
  DRAW = 'draw'
}

export interface Player {
  x: number;
  y: number;
  mode: PlayerMode;
  direction: Direction;
  linePath: Array<{ x: number; y: number }>;
}

export function createPlayer(grid: Grid): Player {
  // Start at bottom-center
  const startX = Math.floor(grid.getWidth() / 2);
  const startY = grid.getHeight() - 1;

  return {
    x: startX,
    y: startY,
    mode: PlayerMode.TRAVERSE,
    direction: Direction.UP,
    linePath: []
  };
}

export interface MoveResult {
  moved: boolean;
  completedShape: boolean;
  gameOver: boolean;
  died: boolean;
  capturedPath?: Array<{ x: number; y: number }>;
}

export function movePlayer(
  player: Player,
  grid: Grid,
  direction: Direction,
  inputHandler: InputHandler
): MoveResult {
  const newX = player.x + getDX(direction);
  const newY = player.y + getDY(direction);

  // Check bounds
  if (newX < 0 || newX >= grid.getWidth() || newY < 0 || newY >= grid.getHeight()) {
    return { moved: false, completedShape: false, gameOver: false, died: false };
  }

  const targetCell = grid.getCell(newX, newY);

  // Can't reverse direction while drawing
  if (player.mode === PlayerMode.DRAW && isOppositeDirection(player.direction, direction)) {
    return { moved: false, completedShape: false, gameOver: false, died: false };
  }

  player.direction = direction;

  // Check if hitting own line (lose a life)
  if (player.mode === PlayerMode.DRAW && grid.isOnLine(newX, newY, player.linePath)) {
    return { moved: false, completedShape: false, gameOver: false, died: true };
  }

  if (player.mode === PlayerMode.TRAVERSE) {
    // In traverse mode, can only move on traversable cells
    if (grid.isTraversable(newX, newY)) {
      player.x = newX;
      player.y = newY;
      return { moved: true, completedShape: false, gameOver: false, died: false };
    }
    // Try to enter DRAW mode - requires SPACE to be held
    else if (grid.isEmpty(newX, newY)) {
      if (!inputHandler.isSpacePressed()) {
        // SPACE not held - cannot enter DRAW mode
        return { moved: false, completedShape: false, gameOver: false, died: false };
      }
      player.mode = PlayerMode.DRAW;
      player.x = newX;
      player.y = newY;
      player.linePath = [{ x: newX, y: newY }];
      grid.setLine(newX, newY);
      return { moved: true, completedShape: false, gameOver: false, died: false };
    }
  } else if (player.mode === PlayerMode.DRAW) {
    // In draw mode, can move through empty space
    if (grid.isEmpty(newX, newY)) {
      player.x = newX;
      player.y = newY;
      player.linePath.push({ x: newX, y: newY });
      grid.setLine(newX, newY);
      return { moved: true, completedShape: false, gameOver: false, died: false };
    }
    // Complete shape when reaching a FILLED or BORDER cell
    else if (grid.canCompleteShape(newX, newY)) {
      player.x = newX;
      player.y = newY;
      player.mode = PlayerMode.TRAVERSE;
      const completed = player.linePath.length > 0;
      // Capture the path before clearing it for territory capture
      const capturedPath = [...player.linePath];
      player.linePath = [];
      return { moved: true, completedShape: completed, gameOver: false, died: false, capturedPath };
    }
  }

  return { moved: false, completedShape: false, gameOver: false, died: false };
}

function getDX(direction: Direction): number {
  switch (direction) {
    case Direction.RIGHT: return 1;
    case Direction.LEFT: return -1;
    default: return 0;
  }
}

function getDY(direction: Direction): number {
  switch (direction) {
    case Direction.DOWN: return 1;
    case Direction.UP: return -1;
    default: return 0;
  }
}

function isOppositeDirection(dir1: Direction, dir2: Direction): boolean {
  return (dir1 === Direction.UP && dir2 === Direction.DOWN) ||
         (dir1 === Direction.DOWN && dir2 === Direction.UP) ||
         (dir1 === Direction.LEFT && dir2 === Direction.RIGHT) ||
         (dir1 === Direction.RIGHT && dir2 === Direction.LEFT);
}
