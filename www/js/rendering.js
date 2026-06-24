const vegetableSpriteCache = new Map();

function corruptionStep(progress) {
  const value = Number(progress);
  if (!Number.isFinite(value)) return 0;
  return clamp(Math.floor(clamp(value, 0, 1) * 10), 0, 10);
}

function darkenSpritePixels(targetCtx, targetWidth, targetHeight, step) {
  if (step <= 0) return;

  const corruption = step / 10;
  const startY = Math.floor(targetHeight * (1 - corruption));
  const darkness = 0.24 + corruption * 0.58;
  try {
    const imageData = targetCtx.getImageData(0, startY, targetWidth, targetHeight - startY);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      data[i] = Math.round(data[i] * (1 - darkness));
      data[i + 1] = Math.round(data[i + 1] * (1 - darkness));
      data[i + 2] = Math.round(data[i + 2] * (1 - darkness));
    }
    targetCtx.putImageData(imageData, 0, startY);
  } catch (error) {
    console.warn('腐化遮罩繪製失敗', error);
  }
}

function getVegetableSprite(level, radius, corruptionProgress = 0) {
  const veg = VEGETABLES[level];
  const image = vegetableImages[level];
  const step = corruptionStep(corruptionProgress);
  const imageReady = image && image.complete && image.naturalWidth > 0;
  const pixelRatio = render.options.pixelRatio || 1;
  const cacheKey = `${level}:${Math.round(radius * 10)}:${step}:${imageReady ? 1 : 0}:${pixelRatio}`;
  const cached = vegetableSpriteCache.get(cacheKey);
  if (cached) return cached;

  const bufferSize = Math.ceil(radius * 2.7);
  const scaledBufferSize = Math.ceil(bufferSize * pixelRatio);
  const bufferRadius = bufferSize / 2;
  const buffer = document.createElement('canvas');
  buffer.width = scaledBufferSize;
  buffer.height = scaledBufferSize;
  const bufferCtx = buffer.getContext('2d');
  bufferCtx.imageSmoothingEnabled = true;
  bufferCtx.imageSmoothingQuality = 'high';
  bufferCtx.scale(pixelRatio, pixelRatio);

  if (imageReady) {
    const maxSize = radius * 2.45;
    const scale = Math.min(maxSize / image.naturalWidth, maxSize / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const imageX = bufferRadius - width / 2;
    const imageY = bufferRadius - height / 2;
    const sprite = document.createElement('canvas');
    sprite.width = Math.ceil(width * pixelRatio);
    sprite.height = Math.ceil(height * pixelRatio);
    const spriteCtx = sprite.getContext('2d');
    spriteCtx.imageSmoothingEnabled = true;
    spriteCtx.imageSmoothingQuality = 'high';
    spriteCtx.drawImage(image, 0, 0, sprite.width, sprite.height);
    darkenSpritePixels(spriteCtx, sprite.width, sprite.height, step);
    bufferCtx.drawImage(sprite, imageX, imageY, width, height);
  } else {
    bufferCtx.translate(bufferRadius, bufferRadius);
    bufferCtx.fillStyle = veg.color;
    bufferCtx.strokeStyle = 'rgba(35, 55, 28, 0.28)';
    bufferCtx.lineWidth = 2;
    bufferCtx.beginPath();
    bufferCtx.arc(0, 0, radius, 0, Math.PI * 2);
    bufferCtx.fill();
    bufferCtx.stroke();
    bufferCtx.setTransform(1, 0, 0, 1, 0, 0);
    darkenSpritePixels(bufferCtx, scaledBufferSize, scaledBufferSize, step);
  }

  const sprite = {
    canvas: buffer,
    radius: bufferRadius,
    size: bufferSize
  };
  vegetableSpriteCache.set(cacheKey, sprite);
  if (vegetableSpriteCache.size > 160) {
    vegetableSpriteCache.delete(vegetableSpriteCache.keys().next().value);
  }

  return sprite;
}

function drawVegetableSprite(ctx, level, x, y, radius, alpha = 1, angle = 0, corruptionProgress = 0) {
  const sprite = getVegetableSprite(level, radius, corruptionProgress);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(sprite.canvas, -sprite.radius, -sprite.radius, sprite.size, sprite.size);
  ctx.restore();
}

function drawPreviewVegetableSprite(ctx, level, x, y, radius, alpha = 1) {
  const veg = VEGETABLES[level];
  const image = vegetableImages[level];

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);

  if (image && image.complete && image.naturalWidth > 0) {
    const maxSize = radius * 2.45;
    const scale = Math.min(maxSize / image.naturalWidth, maxSize / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
  } else {
    ctx.fillStyle = veg.color;
    ctx.strokeStyle = 'rgba(35, 55, 28, 0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function isPreviewBlockedByVegetable(x, y, radius) {
  return Composite.allBodies(world).some((body) => {
    if (body.label !== 'vegetable' || body.isBlasting) return false;
    if (body.position.y > state.dangerY) return false;

    const bodyRadius = VEGETABLES[body.vegLevel]?.radius || radius;
    const distance = Math.hypot(body.position.x - x, body.position.y - y);
    return distance < bodyRadius + radius + 8;
  });
}

function drawFertilizerSprite(ctx, x, y, radius = 18, alpha = 1, angle = 0) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);

  if (fertilizerImage.complete && fertilizerImage.naturalWidth > 0) {
    const size = radius * 2.7;
    ctx.drawImage(fertilizerImage, -size / 2, -size / 2, size, size);
  } else {
    ctx.fillStyle = '#ffd447';
    ctx.strokeStyle = 'rgba(85, 57, 17, 0.32)';
    ctx.lineWidth = 2;
    roundedRect(ctx, -radius, -radius, radius * 2, radius * 2, 8);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function comboProgressFor(now) {
  if (state.combo <= 0 || state.comboDuration <= 0) return 0;

  const frozen = isComboFrozen(now);
  return frozen
    ? clamp((state.comboExpiresAt - state.comboFreezeLastAt) / state.comboDuration, 0, 1)
    : clamp((state.comboExpiresAt - now) / state.comboDuration, 0, 1);
}

function drawTopUiOverlay(now) {
  dangerLineEl.style.top = `${state.dangerY}px`;
  dangerLabelEl.style.top = `${state.dangerY - 27}px`;
  dangerLabelEl.style.right = '10px';

  const dangerTimes = Composite.allBodies(world)
    .filter((body) => body.label === 'vegetable' && body.dangerEnteredAt)
    .map((body) => body.dangerEnteredAt);
  if (dangerTimes.length && !state.gameOver) {
    const oldestDangerAt = Math.min(...dangerTimes);
    const remaining = Math.max(0, 2 - (now - oldestDangerAt) / 1000);
    dangerCountdownEl.hidden = false;
    dangerCountdownEl.textContent = `${remaining.toFixed(1)} 秒`;
    dangerCountdownEl.style.top = `${state.dangerY - 27}px`;
  } else {
    dangerCountdownEl.hidden = true;
  }

  const comboProgress = comboProgressFor(now);
  if (comboProgress > 0) {
    const frozen = isComboFrozen(now);
    const pulse = Math.max(0, 1 - (now - state.comboPulseStartedAt) / COMBO_IMPACT_DURATION);
    const accent = comboColor(state.combo);
    comboBarEl.hidden = false;
    comboBarEl.style.width = `${Math.min(116, state.width * 0.32)}px`;
    comboBarEl.style.setProperty('--combo-color', comboProgress > 0.32 ? accent : '#ff634f');
    comboBarEl.style.setProperty('--combo-glow', pulse > 0 ? accent : 'transparent');
    comboTextEl.textContent = frozen ? `COMBO ${state.combo} 凍結` : `COMBO ${state.combo}`;
    comboTextEl.style.fontSize = `${12 + pulse * 3}px`;
    comboFillEl.style.width = `${comboProgress * 100}%`;
  } else {
    comboBarEl.hidden = true;
  }

  const eventLabels = activeEnvironmentEventLabels(now);
  const statusLabels = [
    ...(state.corruptionActive ? ['腐化'] : []),
    ...eventLabels
  ];
  corruptionStatusEl.hidden = statusLabels.length === 0;
  corruptionStatusEl.textContent = statusLabels.length
    ? `環境狀態：${statusLabels.join(' / ')}`
    : '';
}

function drawComboImpact(ctx, now) {
  const pulse = Math.max(0, 1 - (now - state.comboPulseStartedAt) / COMBO_IMPACT_DURATION);
  if (pulse > 0 && state.combo > 0) {
    ctx.save();
    ctx.globalAlpha = 0.16 * pulse;
    ctx.fillStyle = state.comboPulseColor;
    ctx.fillRect(0, 0, state.width, state.height);
    ctx.globalAlpha = 0.75 * pulse;
    ctx.strokeStyle = state.comboPulseColor;
    ctx.lineWidth = 7 * pulse + 2;
    ctx.strokeRect(4, 4, state.width - 8, state.height - 8);
    ctx.restore();
  }

  for (let i = comboBursts.length - 1; i >= 0; i--) {
    const burst = comboBursts[i];
    const age = now - burst.startedAt;
    const t = age / COMBO_IMPACT_DURATION;
    if (t >= 1) {
      comboBursts.splice(i, 1);
      continue;
    }

    const ease = 1 - Math.pow(1 - t, 3);
    const alpha = 1 - t;
    const ringRadius = 20 + 58 * ease + Math.min(burst.combo, 18) * 1.4;
    const textY = burst.y - 22 - 34 * ease;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = burst.color;
    ctx.lineWidth = 8 * (1 - ease) + 2;
    ctx.beginPath();
    ctx.arc(burst.x, burst.y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = `900 ${22 + Math.min(burst.combo, 18) * 0.8}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fillStyle = burst.color;
    ctx.shadowColor = burst.color;
    ctx.shadowBlur = 8;
    ctx.strokeText(`COMBO ${burst.combo}`, burst.x, textY);
    ctx.fillText(`COMBO ${burst.combo}`, burst.x, textY);
    ctx.restore();
  }
}

function drawBlastEffects(ctx, now) {
  for (let i = blastEffects.length - 1; i >= 0; i--) {
    const effect = blastEffects[i];
    const age = now - effect.startedAt;
    if (age < 0) continue;

    const t = age / BLAST_ANIMATION_DURATION;
    if (t >= 1) {
      blastEffects.splice(i, 1);
      continue;
    }

    const ease = 1 - Math.pow(1 - t, 3);
    const alpha = 1 - t;
    const ringRadius = 18 + effect.radius * ease;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ffbf45';
    ctx.lineWidth = 8 * (1 - ease) + 2;
    ctx.shadowColor = '#ffbf45';
    ctx.shadowBlur = 22 * alpha;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = alpha * 0.75;
    ctx.fillStyle = 'rgba(255, 248, 202, 0.62)';
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, 16 + 18 * (1 - ease), 0, Math.PI * 2);
    ctx.fill();

    for (let spark = 0; spark < 10; spark++) {
      const angle = (Math.PI * 2 * spark) / 10 + effect.startedAt * 0.003;
      const distance = 12 + effect.radius * 0.72 * ease;
      const sx = effect.x + Math.cos(angle) * distance;
      const sy = effect.y + Math.sin(angle) * distance;
      ctx.fillStyle = spark % 2 ? '#68d84d' : '#ffd447';
      ctx.beginPath();
      ctx.arc(sx, sy, 2.8 * alpha + 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawFertilizerEffects(ctx, now) {
  for (let i = fertilizerEffects.length - 1; i >= 0; i--) {
    const effect = fertilizerEffects[i];
    const age = now - effect.startedAt;
    const t = age / FERTILIZER_ANIMATION_DURATION;
    if (t >= 1) {
      fertilizerEffects.splice(i, 1);
      continue;
    }

    const alpha = 1 - t;
    const ease = 1 - Math.pow(1 - t, 3);
    const lift = 34 * ease;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#68d84d';
    ctx.lineWidth = 5 * alpha + 1;
    ctx.shadowColor = '#68d84d';
    ctx.shadowBlur = 18 * alpha;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, 24 + 42 * ease, 0, Math.PI * 2);
    ctx.stroke();

    if (fertilizerImage.complete && fertilizerImage.naturalWidth > 0) {
      const size = 38 + 10 * (1 - ease);
      ctx.drawImage(fertilizerImage, effect.x - size / 2, effect.y - lift - size / 2, size, size);
    }

    ctx.fillStyle = '#ffd447';
    for (let spark = 0; spark < 8; spark++) {
      const angle = (Math.PI * 2 * spark) / 8 + now * 0.004;
      const distance = 14 + 34 * ease;
      ctx.beginPath();
      ctx.arc(
        effect.x + Math.cos(angle) * distance,
        effect.y - lift * 0.4 + Math.sin(angle) * distance,
        2.4 * alpha + 1,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawPumpkinAuras(ctx, bodies, now) {
  if (!state.corruptionActive) return;

  bodies
    .filter((body) => body.label === 'vegetable' && body.vegLevel === PUMPKIN_LEVEL && !body.isBlasting)
    .forEach((pumpkin) => {
      const pulse = 0.5 + Math.sin(now * 0.003) * 0.12;
      const radius = PUMPKIN_AURA_RADIUS + pulse * 8;
      const gradient = ctx.createRadialGradient(
        pumpkin.position.x,
        pumpkin.position.y,
        VEGETABLES[PUMPKIN_LEVEL].radius * 0.8,
        pumpkin.position.x,
        pumpkin.position.y,
        radius
      );
      gradient.addColorStop(0, 'rgba(255, 216, 77, 0.18)');
      gradient.addColorStop(0.58, 'rgba(124, 255, 93, 0.1)');
      gradient.addColorStop(1, 'rgba(124, 255, 93, 0)');

      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pumpkin.position.x, pumpkin.position.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.32 + pulse * 0.18;
      ctx.strokeStyle = 'rgba(255, 216, 77, 0.65)';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 10]);
      ctx.lineDashOffset = -now * 0.02;
      ctx.beginPath();
      ctx.arc(pumpkin.position.x, pumpkin.position.y, PUMPKIN_AURA_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });
}

function drawEnvironmentEventEffects(ctx, now) {
  const classes = environmentEventClassList(now);
  if (!classes.length) return;

  ctx.save();
  if (classes.includes('event-harvest')) {
    const sweepX = ((now * 0.18) % (state.width + 180)) - 90;
    const glow = ctx.createRadialGradient(
      state.width * 0.5,
      state.height * 0.42,
      state.width * 0.12,
      state.width * 0.5,
      state.height * 0.42,
      state.width * 0.68
    );
    glow.addColorStop(0, 'rgba(255, 246, 160, 0.3)');
    glow.addColorStop(0.42, 'rgba(255, 216, 77, 0.18)');
    glow.addColorStop(1, 'rgba(255, 216, 77, 0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.globalAlpha = 0.34;
    ctx.fillStyle = 'rgba(255, 210, 48, 0.58)';
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.globalAlpha = 0.36;
    ctx.strokeStyle = 'rgba(255, 255, 210, 0.9)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(sweepX - 72, 0);
    ctx.lineTo(sweepX + 88, state.height);
    ctx.stroke();

    ctx.globalAlpha = 0.78;
    ctx.fillStyle = '#fff4a8';
    for (let i = 0; i < 26; i++) {
      const x = (i * 47 + now * 0.055) % (state.width + 34) - 17;
      const y = (i * 83 + Math.sin(now * 0.002 + i) * 18) % state.height;
      const size = 2.2 + (i % 4) * 0.8;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (classes.includes('event-pest')) {
    const sickGlow = ctx.createLinearGradient(0, 0, 0, state.height);
    sickGlow.addColorStop(0, 'rgba(18, 16, 14, 0.36)');
    sickGlow.addColorStop(0.55, 'rgba(44, 29, 16, 0.34)');
    sickGlow.addColorStop(1, 'rgba(9, 18, 10, 0.42)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = sickGlow;
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.globalAlpha = 0.22;
    ctx.fillStyle = 'rgba(45, 18, 10, 0.84)';
    for (let i = 0; i < 34; i++) {
      const drift = Math.sin(now * 0.0018 + i * 1.7) * 9;
      const x = (i * 61 + drift) % (state.width + 28) - 14;
      const y = (i * 37 + now * 0.012) % state.height;
      const radius = 3 + (i % 5) * 1.6;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = 'rgba(20, 12, 7, 0.78)';
    ctx.lineWidth = 2;
    for (let y = state.dangerY + 20; y < state.height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y + Math.sin(now * 0.002 + y) * 8);
      ctx.lineTo(state.width, y + Math.cos(now * 0.002 + y) * 8);
      ctx.stroke();
    }
  }

  if (classes.includes('event-rain')) {
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = 'rgba(25, 74, 106, 0.34)';
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.globalAlpha = 0.72;
    ctx.strokeStyle = 'rgba(167, 235, 255, 0.72)';
    ctx.lineWidth = 2.2;
    for (let x = -state.height; x < state.width + state.height * 0.35; x += 16) {
      const offset = (now * 0.58) % 16;
      ctx.beginPath();
      ctx.moveTo(x + offset, 0);
      ctx.lineTo(x + offset + state.height * 0.28, state.height);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.36;
    ctx.strokeStyle = 'rgba(230, 250, 255, 0.7)';
    ctx.lineWidth = 1;
    for (let x = -state.height; x < state.width + state.height * 0.4; x += 34) {
      const offset = (now * 0.86) % 34;
      ctx.beginPath();
      ctx.moveTo(x + offset, -20);
      ctx.lineTo(x + offset + state.height * 0.34, state.height + 20);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.26;
    ctx.fillStyle = 'rgba(198, 239, 255, 0.64)';
    for (let i = 0; i < 16; i++) {
      const x = (i * 53 + now * 0.09) % state.width;
      const y = state.height - 18 - (i % 4) * 13;
      ctx.beginPath();
      ctx.ellipse(x, y, 12 + (i % 3) * 7, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (classes.includes('event-wind')) {
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = 'rgba(210, 248, 255, 0.5)';
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.globalAlpha = 0.72;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let y = state.dangerY + 14; y < state.height; y += 34) {
      const offset = (now * 0.34 + y * 2.7) % (state.width + 190);
      ctx.beginPath();
      ctx.moveTo(offset - 190, y);
      ctx.quadraticCurveTo(offset - 116, y - 20, offset - 28, y - 3);
      ctx.quadraticCurveTo(offset + 26, y + 8, offset + 72, y - 8);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = 'rgba(116, 211, 230, 0.9)';
    ctx.lineWidth = 1.6;
    for (let y = state.dangerY + 28; y < state.height; y += 22) {
      const offset = (now * 0.52 + y * 1.9) % (state.width + 130);
      ctx.beginPath();
      ctx.moveTo(offset - 130, y);
      ctx.lineTo(offset - 38, y - 5);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function updateFpsMeter(now) {
  if (!state.fpsLastAt) {
    state.fpsLastAt = now;
    state.fpsFrames = 0;
    return;
  }

  state.fpsFrames += 1;
  const elapsed = now - state.fpsLastAt;
  if (elapsed < 500) return;

  state.fpsValue = Math.round((state.fpsFrames * 1000) / elapsed);
  state.fpsFrames = 0;
  state.fpsLastAt = now;
  if (debugFpsValue) {
    debugFpsValue.textContent = String(state.fpsValue);
  }
}

function drawGameOverlay() {
  const ctx = render.context;
  const now = performance.now();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  updateFpsMeter(now);
  const shakeProgress = Math.max(0, 1 - (now - state.comboPulseStartedAt) / COMBO_SHAKE_DURATION);
  const shakeStrength = Math.min(16, 4 + state.combo * 0.55) * shakeProgress * shakeProgress;

  ctx.save();
  if (shakeStrength > 0) {
    ctx.translate(
      Math.sin(now * 0.075) * shakeStrength,
      Math.cos(now * 0.091) * shakeStrength * 0.65
    );
  }

  const safeGlow = ctx.createLinearGradient(0, 0, 0, state.height);
  safeGlow.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
  safeGlow.addColorStop(0.42, 'rgba(255, 255, 255, 0)');
  safeGlow.addColorStop(1, 'rgba(75, 143, 61, 0.08)');
  ctx.fillStyle = safeGlow;
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  for (let y = state.dangerY + 36; y < state.height; y += 56) {
    ctx.beginPath();
    ctx.moveTo(16, y);
    ctx.lineTo(state.width - 16, y);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#315d29';
  ctx.beginPath();
  ctx.ellipse(state.width / 2, state.height - 34, state.width * 0.34, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const preview = VEGETABLES[state.nextLevel];
  const previewRadius = state.fertilizerCharges > 0 ? 18 : preview.radius;
  const x = clamp(state.aimX || state.width / 2, previewRadius + 8, state.width - previewRadius - 8);
  const y = 70;
  const previewPulse = state.aiming ? 1 : 0.65 + Math.sin(now * 0.004) * 0.08;
  const previewBlocked = isPreviewBlockedByVegetable(x, y, previewRadius);
  if (!previewBlocked) {
    ctx.save();
    ctx.globalAlpha = previewPulse;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.66)';
    ctx.strokeStyle = 'rgba(75, 143, 61, 0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, previewRadius + 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    if (state.fertilizerCharges > 0) {
      drawFertilizerSprite(ctx, x, y, previewRadius, state.aiming ? 0.96 : 0.78, Math.sin(now * 0.004) * 0.08);
    } else {
      drawPreviewVegetableSprite(ctx, state.nextLevel, x, y, preview.radius, state.aiming ? 0.92 : 0.72);
    }
  }

  if (state.aiming) {
    ctx.strokeStyle = 'rgba(45, 70, 35, 0.5)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.75)';
    ctx.shadowBlur = 8;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(x, y + previewRadius + 12);
    ctx.lineTo(x, state.height - 12);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
  }

  const bodies = Composite.allBodies(world);
  drawEnvironmentEventEffects(ctx, now);
  drawPumpkinAuras(ctx, bodies, now);

  for (const body of bodies) {
    if (body.label === 'fertilizer') {
      drawFertilizerSprite(ctx, body.position.x, body.position.y, 18, body.isConsumed ? 0.4 : 1, body.angle);
      continue;
    }
    if (body.label !== 'vegetable') continue;
    const veg = VEGETABLES[body.vegLevel];
    if (body.isBlasting) {
      const age = now - body.blastStartedAt;
      const t = clamp(age / BLAST_ANIMATION_DURATION, 0, 1);
      const alpha = 1 - t;
      const scale = 1 + t * 0.28;
      ctx.save();
      ctx.shadowColor = '#ffbf45';
      ctx.shadowBlur = 24 * alpha;
      drawVegetableSprite(ctx, body.vegLevel, body.position.x, body.position.y, veg.radius * scale, alpha, body.angle, body.corruptionProgress);
      ctx.restore();
      continue;
    }
    drawVegetableSprite(ctx, body.vegLevel, body.position.x, body.position.y, veg.radius, 1, body.angle, body.corruptionProgress);
  }

  ctx.restore();
  drawBlastEffects(ctx, now);
  drawFertilizerEffects(ctx, now);
  drawComboImpact(ctx, now);
  drawTopUiOverlay(now);
}
