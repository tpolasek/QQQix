import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Game } from './game';
import { Direction } from './input';
import { PlayerMode } from './player';

describe('Game Integration Test - No Mocking', () => {
  let game: Game;

  beforeEach(() => {
    // Clear any existing canvas elements
    const existingCanvas = document.getElementById('gameCanvas');
    if (existingCanvas) {
      existingCanvas.remove();
    }

    // Create a canvas element and add it to the DOM
    const canvas = document.createElement('canvas');
    canvas.id = 'gameCanvas';
    document.body.appendChild(canvas);

    // Create game instance
    game = new Game(canvas);
  });

  afterEach(() => {
    // Stop the game loop
    game.stop();
  });

  it('should reach ~50% coverage when player goes up from center', () => {
    const startTime = 0;
    const timeStep = 30;

    // Simulate pressing ArrowUp
    game.simulateKeyPress('ArrowUp', true);

    // Player starts at bottom center (x=50, y=99 in a 100x100 grid)
    // Going straight up will reach the top border at y=0-1
    // This should capture ~50% of the board (the left or right side)

    let currentTime = startTime;
    let shapeCompleted = false;
    let iterations = 0;
    const maxIterations = 300;

    while (!shapeCompleted && iterations < maxIterations && currentTime < 15000) {
      game.update(currentTime);
      currentTime += timeStep;
      iterations++;

      const player = game.getPlayer();
      const coverage = game.getCoverage();

      // Shape is completed when player is back in traverse mode with significant coverage
      if (player.mode === PlayerMode.TRAVERSE && coverage > 5 && iterations > 10) {
        shapeCompleted = true;
        break;
      }
    }

    // Release ArrowUp
    game.simulateKeyPress('ArrowUp', false);

    expect(shapeCompleted, 'Shape should be completed').toBe(true);

    const finalCoverage = game.getCoverage();
    const finalLevel = game.getLevel();

    // Going straight up from center should create a vertical line that divides the board
    // into two halves. One of these should be captured, giving us ~50% coverage.
    expect(
      finalCoverage,
      `Coverage should be around 50%, got ${finalCoverage}%`
    ).toBeGreaterThan(40);
    expect(
      finalCoverage,
      `Coverage should be around 50%, got ${finalCoverage}%`
    ).toBeLessThan(60);

    // Level should NOT be incremented (target is 75%)
    expect(finalLevel, 'Level should still be 1').toBe(1);
  });

  it('should increment level when coverage exceeds 75%', () => {
    const startTime = 0;
    const timeStep = 30;

    // Phase 1: First capture - go up from center to get ~50%
    game.simulateKeyPress('ArrowUp', true);

    let currentTime = startTime;
    let firstCaptureDone = false;
    let iterations = 0;
    const maxIterations = 300;

    while (!firstCaptureDone && iterations < maxIterations && currentTime < 15000) {
      game.update(currentTime);
      currentTime += timeStep;
      iterations++;

      const coverage = game.getCoverage();
      const player = game.getPlayer();

      if (player.mode === PlayerMode.TRAVERSE && coverage > 40 && iterations > 10) {
        firstCaptureDone = true;
        break;
      }
    }

    expect(firstCaptureDone, 'First capture should complete').toBe(true);

    // Release ArrowUp
    game.simulateKeyPress('ArrowUp', false);

    const afterFirstCoverage = game.getCoverage();
    expect(afterFirstCoverage).toBeGreaterThan(40);

    // Player should now be at the top border at x=50, y=0 or y=1
    // Phase 2: Go to a corner, then do a diagonal capture to get more territory
    // Strategy: Go to top-left corner, then draw a diagonal line down-right
    game.simulateKeyPress('ArrowLeft', true);

    // Move all the way to left border
    let reachedLeft = false;
    while (!reachedLeft && iterations < maxIterations && currentTime < 20000) {
      game.update(currentTime);
      currentTime += timeStep;
      iterations++;
      if (game.getPlayer().x <= 1) {
        reachedLeft = true;
        break;
      }
    }

    // Release ArrowLeft
    game.simulateKeyPress('ArrowLeft', false);

    // Phase 3: Now go DOWN to enter empty space (if left half was filled, this won't work)
    // Let's try a different approach: go back right a bit, then down
    game.simulateKeyPress('ArrowRight', true);

    let movedRightSome = false;
    const startX = game.getPlayer().x;
    while (!movedRightSome && iterations < maxIterations && currentTime < 22000) {
      game.update(currentTime);
      currentTime += timeStep;
      iterations++;
      // Move right 30 cells
      if (game.getPlayer().x >= startX + 30) {
        movedRightSome = true;
        break;
      }
    }

    game.simulateKeyPress('ArrowRight', false);

    // Phase 4: Go DOWN from this position - should enter DRAW mode and capture territory
    game.simulateKeyPress('ArrowDown', true);

    let secondCaptureDone = false;
    while (!secondCaptureDone && iterations < maxIterations && currentTime < 28000) {
      game.update(currentTime);
      currentTime += timeStep;
      iterations++;

      const coverage = game.getCoverage();
      const player = game.getPlayer();

      // Check if shape completed
      if (player.mode === PlayerMode.TRAVERSE && iterations > 200) {
        secondCaptureDone = true;
        break;
      }
    }

    game.simulateKeyPress('ArrowDown', false);

    const finalCoverage = game.getCoverage();
    const finalLevel = game.getLevel();

    // After two captures, we should have significant coverage
    // The exact amount depends on which regions were captured, but should be > 50%
    expect(
      finalCoverage,
      `Coverage should have increased beyond 50%, got ${finalCoverage}%`
    ).toBeGreaterThan(50);

    // If we're at 75%+, level should be incremented
    if (finalCoverage >= 75) {
      expect(finalLevel, 'Level should be 2 after reaching 75%').toBe(2);
    }
  });

  it('should NOT increment level when coverage stays below 75%', () => {
    const startTime = 0;
    const timeStep = 30;

    // Simulate pressing ArrowUp
    game.simulateKeyPress('ArrowUp', true);

    let currentTime = startTime;
    let shapeCompleted = false;
    let iterations = 0;
    const maxIterations = 300;

    // Run until we get some coverage but stop before 75%
    while (!shapeCompleted && iterations < maxIterations && currentTime < 15000) {
      game.update(currentTime);
      currentTime += timeStep;
      iterations++;

      const player = game.getPlayer();
      const coverage = game.getCoverage();
      const level = game.getLevel();

      // Once shape completes, check our assertions
      if (player.mode === PlayerMode.TRAVERSE && coverage > 5 && iterations > 10) {
        shapeCompleted = true;

        // At this point, coverage should be ~50%, level should still be 1
        expect(level, 'Level should be 1 after single capture').toBe(1);
        expect(coverage, 'Coverage should be less than 75%').toBeLessThan(75);
        break;
      }
    }

    // Release ArrowUp
    game.simulateKeyPress('ArrowUp', false);

    const finalCoverage = game.getCoverage();
    const finalLevel = game.getLevel();

    // Final verification - coverage around 50%, level still 1
    expect(finalCoverage, 'Final coverage should be around 50%').toBeGreaterThan(40);
    expect(finalCoverage, 'Final coverage should be below 75%').toBeLessThan(75);
    expect(finalLevel, 'Level should still be 1').toBe(1);
  });

  // This is the key failing test case that captures the bug:
  // When the player goes from bottom to top (completing a shape),
  // the coverage should increase to ~50%, but currently it stays at ~4%
  // because the line path is cleared before captureTerritory is called.
  it('BUG: coverage should increase when player completes a shape by going up', () => {
    const startTime = 0;
    const timeStep = 30;

    // Initial state - just border cells, ~4% coverage
    const initialCoverage = game.getCoverage();
    const initialLevel = game.getLevel();
    expect(initialCoverage).toBeGreaterThan(0);
    expect(initialCoverage).toBeLessThan(10);
    expect(initialLevel).toBe(1);

    // Simulate pressing ArrowUp - player goes from bottom to top
    game.simulateKeyPress('ArrowUp', true);

    let currentTime = startTime;
    let iterations = 0;
    const maxIterations = 300;
    let playerAtTop = false;
    let shapeCompleted = false;

    // Run until player reaches top border and shape completes
    while (!shapeCompleted && iterations < maxIterations && currentTime < 15000) {
      game.update(currentTime);
      currentTime += timeStep;
      iterations++;

      const player = game.getPlayer();
      const coverage = game.getCoverage();
      const level = game.getLevel();

      // Check if player reached the top (y <= 1)
      if (player.y <= 1) {
        playerAtTop = true;
      }

      // Check if shape was completed (player back in TRAVERSE mode)
      if (player.mode === PlayerMode.TRAVERSE && iterations > 10) {
        shapeCompleted = true;

        // BUG: Coverage should be ~50% now, but it's still ~4%
        // Level should still be 1 (since coverage < 75%)
        expect(
          coverage,
          `Coverage should be around 50% after shape completion, got ${coverage}%`
        ).toBeGreaterThan(40);
        expect(
          coverage,
          `Coverage should be around 50% after shape completion, got ${coverage}%`
        ).toBeLessThan(60);
        expect(level, 'Level should still be 1 with < 75% coverage').toBe(1);
        break;
      }
    }

    expect(playerAtTop, 'Player should reach top border').toBe(true);
    expect(shapeCompleted, 'Shape should be completed').toBe(true);

    // Final verification
    game.simulateKeyPress('ArrowUp', false);

    const finalCoverage = game.getCoverage();
    const finalLevel = game.getLevel();

    expect(finalCoverage, 'Final coverage should be ~50%').toBeGreaterThan(40);
    expect(finalLevel, 'Final level should still be 1').toBe(1);
  });
});
