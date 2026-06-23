Events.on(engine, 'collisionStart', (event) => {
  for (const pair of event.pairs) {
    const a = pair.bodyA;
    const b = pair.bodyB;
    if (a.label === 'vegetable' && b.label === 'vegetable') {
      mergeVegetables(a, b);
    }
  }
});

Events.on(engine, 'afterUpdate', checkDangerLine);
Events.on(render, 'afterRender', drawGameOverlay);

render.canvas.addEventListener('pointerdown', startAim);
render.canvas.addEventListener('pointermove', moveAim);
render.canvas.addEventListener('pointerup', endAim);
render.canvas.addEventListener('pointercancel', endAim);
startButton.addEventListener('click', startGame);
startScene.addEventListener('click', startGame);
startLeaderboardButton.addEventListener('click', (event) => {
  event.stopPropagation();
  openLeaderboard('score');
});
gameOverLeaderboardButton.addEventListener('click', () => openLeaderboard('score'));
closeLeaderboardButton.addEventListener('click', closeLeaderboard);
scoreTabButton.addEventListener('click', () => openLeaderboard('score'));
comboTabButton.addEventListener('click', () => openLeaderboard('combo'));
googleSignInButton.addEventListener('click', signInWithGoogle);
pauseButton.addEventListener('click', togglePause);
resumeButton.addEventListener('click', () => setPaused(false));
soundButton.addEventListener('click', () => {
  ensureAudio();
  audioState.enabled = !audioState.enabled;
  updateAudioVolume();
  if (audioState.enabled) {
    playClickSound();
    startMusic();
  } else {
    stopMusic();
  }
});
volumeSlider.addEventListener('input', () => {
  ensureAudio();
  audioState.volume = Number(volumeSlider.value) / 100;
  if (audioState.volume > 0) {
    audioState.enabled = true;
  }
  updateAudioVolume();
  startMusic();
});
restartButton.addEventListener('click', resetGame);
playAgainButton.addEventListener('click', resetGame);
window.addEventListener('resize', resizeGame);
window.addEventListener('orientationchange', () => setTimeout(resizeGame, 250));

setupSupabase();
setupAudioUi();
resizeGame();
setNextLevel();
updateHud();
Render.run(render);
Runner.run(runner, engine);
