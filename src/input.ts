export enum Direction {
  UP = 0,
  RIGHT = 1,
  DOWN = 2,
  LEFT = 3
}

export class InputHandler {
  private keyState: Map<string, boolean> = new Map();
  private lastDirection: Direction = Direction.UP;
  private directionQueue: Direction[] = [];

  constructor() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  private onKeyDown(e: KeyboardEvent): void {
    // Prevent default for arrow keys to stop page scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }

    this.keyState.set(e.key, true);

    // Add direction to queue for precise control
    switch (e.key) {
      case 'ArrowUp':
        this.directionQueue.push(Direction.UP);
        break;
      case 'ArrowRight':
        this.directionQueue.push(Direction.RIGHT);
        break;
      case 'ArrowDown':
        this.directionQueue.push(Direction.DOWN);
        break;
      case 'ArrowLeft':
        this.directionQueue.push(Direction.LEFT);
        break;
    }

    // Keep queue manageable
    if (this.directionQueue.length > 5) {
      this.directionQueue.shift();
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keyState.set(e.key, false);
  }

  // Get the next direction from queue, or current direction if no new input
  getNextDirection(currentDirection: Direction): Direction {
    if (this.directionQueue.length > 0) {
      const next = this.directionQueue.shift()!;
      this.lastDirection = next;
      return next;
    }
    return this.lastDirection;
  }

  // Check if any key is pressed
  hasInput(): boolean {
    return this.keyState.get('ArrowUp') === true ||
           this.keyState.get('ArrowDown') === true ||
           this.keyState.get('ArrowLeft') === true ||
           this.keyState.get('ArrowRight') === true;
  }

  // Get direction for continuous movement (e.g., while drawing)
  getContinuousDirection(): Direction | null {
    if (this.keyState.get('ArrowUp')) return Direction.UP;
    if (this.keyState.get('ArrowRight')) return Direction.RIGHT;
    if (this.keyState.get('ArrowDown')) return Direction.DOWN;
    if (this.keyState.get('ArrowLeft')) return Direction.LEFT;
    return null;
  }

  // Check if SPACE is pressed (required to enter DRAW mode)
  isSpacePressed(): boolean {
    return this.keyState.get(' ') === true;
  }

  // Test helper: simulate a key press (for testing without actual DOM events)
  simulateKeyPress(key: string, pressed: boolean): void {
    this.keyState.set(key, pressed);
    if (pressed) {
      switch (key) {
        case 'ArrowUp':
          this.directionQueue.push(Direction.UP);
          break;
        case 'ArrowRight':
          this.directionQueue.push(Direction.RIGHT);
          break;
        case 'ArrowDown':
          this.directionQueue.push(Direction.DOWN);
          break;
        case 'ArrowLeft':
          this.directionQueue.push(Direction.LEFT);
          break;
      }
      // Keep queue manageable
      if (this.directionQueue.length > 5) {
        this.directionQueue.shift();
      }
    }
  }
}
