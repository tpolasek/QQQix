import { Game } from './game';

// Wait for DOM to be ready
function main() {
  console.log('Main function called');

  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  console.log('Canvas found, creating game...');
  const game = new Game(canvas);
  console.log('Game created, starting...');
  game.start();
  console.log('Game started!');
}

// Start when DOM is loaded
console.log('Script loaded');
if (document.readyState === 'loading') {
  console.log('Waiting for DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', main);
} else {
  console.log('DOM already ready');
  main();
}
