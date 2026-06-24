Events.on(engine, 'collisionStart', (event) => {
  for (const pair of event.pairs) {
    const a = pair.bodyA;
    const b = pair.bodyB;
    if (a.label === 'fertilizer' || b.label === 'fertilizer') {
      const fertilizer = a.label === 'fertilizer' ? a : b;
      const other = fertilizer === a ? b : a;
      if (other.label === 'vegetable') {
        applyFertilizerToVegetable(other, fertilizer);
      } else if (other.label === 'wall') {
        consumeFertilizer(fertilizer);
      }
      continue;
    }
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
render.canvas.addEventListener('contextmenu', showDebugPanel);
skillPanel.addEventListener('pointerdown', stopSkillPanelBackdropEvent);
skillPanel.addEventListener('pointerup', stopSkillPanelBackdropEvent);
skillPanel.addEventListener('click', stopSkillPanelBackdropEvent);
refreshSkillButton.addEventListener('click', (event) => {
  event.stopPropagation();
  refreshSkillCards();
});
debugPanel.addEventListener('pointerdown', (event) => event.stopPropagation());
debugPanel.addEventListener('pointerup', (event) => event.stopPropagation());
debugPanel.addEventListener('click', (event) => event.stopPropagation());
closeDebugButton.addEventListener('click', closeDebugPanel);
debugLevelButton.addEventListener('click', () => {
  debugAddLevels(10);
  playClickSound();
});
debugCorruptionButton.addEventListener('click', () => {
  debugUnlockCorruption();
  playClickSound();
});
startButton.addEventListener('click', startGame);
startScene.addEventListener('click', startGame);
startDailyButton.addEventListener('click', (event) => {
  event.stopPropagation();
  openDailyMissions();
});
startTalentButton.addEventListener('click', (event) => {
  event.stopPropagation();
  openTalentShop();
});
startEncyclopediaButton.addEventListener('click', (event) => {
  event.stopPropagation();
  openEncyclopedia();
});
startLeaderboardButton.addEventListener('click', (event) => {
  event.stopPropagation();
  openLeaderboard('score');
});
gameOverLeaderboardButton.addEventListener('click', () => openLeaderboard('score'));
closeLeaderboardButton.addEventListener('click', closeLeaderboard);
dailyScene.addEventListener('click', (event) => event.stopPropagation());
closeDailyButton.addEventListener('click', closeDailyMissions);
talentScene.addEventListener('click', (event) => event.stopPropagation());
closeTalentButton.addEventListener('click', closeTalentShop);
encyclopediaScene.addEventListener('click', (event) => event.stopPropagation());
closeEncyclopediaButton.addEventListener('click', closeEncyclopedia);
leaderboardHomeButton.addEventListener('click', returnToStartScene);
scoreTabButton.addEventListener('click', () => openLeaderboard('score'));
comboTabButton.addEventListener('click', () => openLeaderboard('combo'));
googleSignInButton.closest('.account-row')?.addEventListener('click', (event) => {
  event.stopPropagation();
});
googleSignInButton.addEventListener('click', (event) => {
  event.stopPropagation();
  signInWithGoogle();
});
pauseButton.addEventListener('click', togglePause);
resumeButton.addEventListener('click', () => setPaused(false));
endGameButton.addEventListener('click', endCurrentGame);
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
musicVolumeSlider.addEventListener('input', () => {
  ensureAudio();
  audioState.musicVolume = Number(musicVolumeSlider.value) / 100;
  if (audioState.musicVolume > 0) {
    audioState.enabled = true;
  }
  updateAudioVolume();
  startMusic();
});
sfxVolumeSlider.addEventListener('input', () => {
  ensureAudio();
  audioState.sfxVolume = Number(sfxVolumeSlider.value) / 100;
  if (audioState.sfxVolume > 0) {
    audioState.enabled = true;
  }
  updateAudioVolume();
  playClickSound();
});
vibrationToggle.addEventListener('click', () => {
  hapticsState.enabled = !hapticsState.enabled;
  updateHapticsUi();
  playClickSound();
  vibrate(28);
});
playAgainButton.addEventListener('click', resetGame);
window.addEventListener('resize', resizeGame);
window.addEventListener('orientationchange', () => setTimeout(resizeGame, 250));
document.addEventListener('visibilitychange', updatePageAudioState);
window.addEventListener('pagehide', () => {
  state.pageActive = false;
  stopMusic();
});
window.addEventListener('pageshow', updatePageAudioState);

setupSupabase();
setupDailyMissions();
setupAudioUi();
resizeGame();
setNextLevel();
updateHud();
Render.run(render);
Runner.run(runner, engine);
