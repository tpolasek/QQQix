import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Game } from './game';
import { PlayerMode } from './player';

describe('Game Integration Test - No Mocking', () => {
  let game: Game;
  let now: number;
  const TIME_STEP = 30;
  const MAX_TICKS = 700;

  const press = (key: string): void => game.simulateKeyPress(key, true);
  const release = (key: string): void => game.simulateKeyPress(key, false);
  const hold = (...keys: string[]): void => keys.forEach(press);
  const releaseAll = (...keys: string[]): void => keys.forEach(release);

  const tick = (count = 1): void => {
    for (let i = 0; i < count; i++) {
      now += TIME_STEP;
      game.update(now);
    }
  };

  const runUntil = (condition: () => boolean, maxTicks = MAX_TICKS): boolean => {
    for (let i = 0; i < maxTicks; i++) {
      tick();
      if (condition()) {
        return true;
      }
    }
    return false;
  };

  const captureUpFromCenter = (): boolean => {
    hold('ArrowUp', ' ');
    const completed = runUntil(() => game.getPlayer().mode === PlayerMode.TRAVERSE && game.getCoverage() > 5, 500);
    releaseAll('ArrowUp', ' ');
    return completed;
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.id = 'gameCanvas';
    document.body.appendChild(canvas);
    game = new Game(canvas);
    now = 0;
  });

  afterEach(() => {
    game.stop();
  });

  it('should reach ~50% coverage when player goes up from center', () => {
    const shapeCompleted = captureUpFromCenter();

    expect(shapeCompleted, 'Shape should be completed').toBe(true);

    const finalCoverage = game.getCoverage();
    const finalLevel = game.getLevel();

    expect(finalCoverage, `Coverage should be around 50%, got ${finalCoverage}%`).toBeGreaterThan(40);
    expect(finalCoverage, `Coverage should be around 50%, got ${finalCoverage}%`).toBeLessThan(60);

    // Level should NOT be incremented (target is 75%)
    expect(finalLevel, 'Level should still be 1').toBe(1);
  });

  it('should increment level when coverage exceeds targetCoverage%', () => {
    game.stop();
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    game = new Game(canvas, { targetCoverage: 45 });
    now = 0;

    hold('ArrowUp', ' ');
    const leveledUp = runUntil(() => game.getLevel() === 2, 500);
    releaseAll('ArrowUp', ' ');

    expect(leveledUp, 'Level should advance after ~50% capture with 45% target').toBe(true);
    expect(game.getLevel(), 'Level should be 2').toBe(2);
    expect(game.getCoverage(), 'Coverage should reset on next level').toBeLessThan(10);
  });

  it('should lose a life when colliding with own line during DRAW mode', () => {
    const initialLives = game.getLives();
    expect(initialLives).toBe(3);

    hold(' ', 'ArrowUp');
    tick(3);

    expect(game.getPlayer().mode, 'Player should be in DRAW mode').toBe(PlayerMode.DRAW);

    release('ArrowUp');
    press('ArrowLeft');
    tick();

    release('ArrowLeft');
    press('ArrowDown');
    tick();

    const livesBeforeCollision = game.getLives();

    release('ArrowDown');
    press('ArrowRight');
    tick();

    releaseAll('ArrowRight', ' ');

    expect(game.getLives(), 'Player should lose exactly one life').toBe(livesBeforeCollision - 1);
    expect(game.getLives(), 'Total lives should now be 2').toBe(initialLives - 1);

    const player = game.getPlayer();
    expect(player.mode, 'Player should reset to TRAVERSE mode after death').toBe(PlayerMode.TRAVERSE);
    expect(player.x, 'Player should reset to bottom-center X').toBe(50);
    expect(player.y, 'Player should reset to bottom-center Y').toBe(99);
  });
});
