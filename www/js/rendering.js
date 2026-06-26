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

function drawQueuedPreview(ctx, level, x, y, now) {
  if (!Number.isInteger(level) || level < 0 || level >= VEGETABLES.length) return;

  const radius = clamp(VEGETABLES[level].radius * 0.58, 15, 28);
  const alpha = 0.64 + Math.sin(now * 0.004 + 1.2) * 0.06;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.strokeStyle = 'rgba(75, 143, 61, 0.24)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius + 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  drawPreviewVegetableSprite(ctx, level, x, y, radius, alpha + 0.12);

  ctx.save();
  ctx.font = '900 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.fillStyle = '#315d29';
  ctx.strokeText('再下一顆', x, y + radius + 14);
  ctx.fillText('再下一顆', x, y + radius + 14);
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
  bombButton.style.top = `${Math.max(10, state.dangerY - 62)}px`;
  bombButton.style.right = '10px';

  const dangerTimes = Composite.allBodies(world)
    .filter((body) => body.label === 'vegetable' && body.dangerEnteredAt)
    .map((body) => body.dangerEnteredAt);
  if (dangerTimes.length && !state.gameOver) {
    const oldestDangerAt = Math.min(...dangerTimes);
    const remaining = Math.max(0, 2 - (now - oldestDangerAt) / 1000);
    dangerCountdownEl.hidden = false;
    dangerCountdownEl.textContent = `${remaining.toFixed(1)} 秒`;
    dangerCountdownEl.style.top = `${state.dangerY}px`;
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
    const insuranceText = state.comboInsuranceCharges > 0 ? ` 保險x${state.comboInsuranceCharges}` : '';
    comboTextEl.textContent = frozen ? `COMBO ${state.combo} 凍結${insuranceText}` : `COMBO ${state.combo}${insuranceText}`;
    comboTextEl.style.fontSize = `${12 + pulse * 3}px`;
    comboFillEl.style.width = `${comboProgress * 100}%`;
  } else {
    comboBarEl.hidden = true;
  }

  if (isFeverTimeActive(now)) {
    const remaining = Math.ceil((state.feverTimeExpiresAt - now) / 1000);
    comboBarEl.hidden = false;
    comboBarEl.style.width = `${Math.min(172, state.width * 0.48)}px`;
    comboBarEl.style.setProperty('--combo-color', '#ff5bbd');
    comboBarEl.style.setProperty('--combo-glow', '#ff5bbd');
    comboTextEl.textContent = `FEVER TIME ${remaining}s`;
    comboTextEl.style.fontSize = '15px';
    comboFillEl.style.width = `${clamp((state.feverTimeExpiresAt - now) / FEVER_TIME_DURATION, 0, 1) * 100}%`;
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

function drawComboInsuranceEffects(ctx, now) {
  for (let i = comboInsuranceEffects.length - 1; i >= 0; i--) {
    const effect = comboInsuranceEffects[i];
    const age = now - effect.startedAt;
    const duration = effect.kind === 'triggered' ? 900 : 720;
    const t = age / duration;
    if (t >= 1) {
      comboInsuranceEffects.splice(i, 1);
      continue;
    }

    const ease = 1 - Math.pow(1 - t, 3);
    const alpha = 1 - t;
    const triggered = effect.kind === 'triggered';
    const x = state.width / 2;
    const y = Math.max(92, state.dangerY + 34);
    const radius = (triggered ? 52 : 38) + ease * (triggered ? 110 : 78);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = (triggered ? 0.24 : 0.16) * alpha;
    ctx.fillStyle = triggered ? '#35d7ff' : '#ffd447';
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.globalAlpha = (triggered ? 0.95 : 0.78) * alpha;
    ctx.strokeStyle = triggered ? '#35d7ff' : '#ffd447';
    ctx.lineWidth = triggered ? 9 : 6;
    ctx.shadowColor = triggered ? '#35d7ff' : '#ffd447';
    ctx.shadowBlur = triggered ? 34 : 24;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = (triggered ? 1 : 0.86) * alpha;
    ctx.font = `900 ${triggered ? 24 : 20}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fillStyle = triggered ? '#126fcf' : '#8a5a00';
    const text = triggered ? 'COMBO 保險觸發' : `COMBO 保險 x${state.comboInsuranceCharges}`;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();
  }
}

function drawFeverTimeEffects(ctx, bodies, now) {
  if (!isFeverTimeActive(now)) return;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const pulse = 0.65 + Math.sin(now * 0.01) * 0.25;
  ctx.globalAlpha = 0.12 + pulse * 0.08;
  ctx.fillStyle = '#ff5bbd';
  ctx.fillRect(0, 0, state.width, state.height);

  bodies
    .filter((body) => body.label === 'vegetable' && body.isFeverDrop && !body.isMerging && !body.isBlasting)
    .forEach((body, index) => {
      const target = bodies.find((item) => item.id === body.feverTargetId);
      const color = VEGETABLES[body.vegLevel]?.color || '#ff5bbd';
      ctx.globalAlpha = 0.82;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 7;
      ctx.shadowColor = '#ff5bbd';
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(body.position.x, body.position.y, VEGETABLES[body.vegLevel].radius + 12 + pulse * 7, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.lineDashOffset = -now * 0.07;
      ctx.beginPath();
      ctx.arc(body.position.x, body.position.y, VEGETABLES[body.vegLevel].radius + 18 + pulse * 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      if (target) {
        const flow = (now * 0.004 + index * 0.31) % 1;
        const sx = body.position.x + (target.position.x - body.position.x) * flow;
        const sy = body.position.y + (target.position.y - body.position.y) * flow;
        ctx.globalAlpha = 0.76;
        ctx.strokeStyle = '#ff5bbd';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ff5bbd';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(body.position.x, body.position.y);
        ctx.lineTo(target.position.x, target.position.y);
        ctx.stroke();

        ctx.globalAlpha = 0.92;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  ctx.restore();
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

function drawSkillAssistEffects(ctx, now) {
  if (magnetMergeLinks.length) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.globalCompositeOperation = 'screen';
    magnetMergeLinks.forEach((link, index) => {
      const pulse = 0.72 + Math.sin(now * 0.01 + index) * 0.28;
      const glow = clamp(0.45 + link.strength * 0.7, 0.45, 1);
      const flow = (now * 0.004 + index * 0.37) % 1;
      const sparkX = link.ax + (link.bx - link.ax) * flow;
      const sparkY = link.ay + (link.by - link.ay) * flow;
      const ringPulse = 1 + pulse * 0.16;

      ctx.globalAlpha = 0.42 * glow;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8 + link.strength * 7;
      ctx.shadowColor = '#35d7ff';
      ctx.shadowBlur = 26;
      ctx.beginPath();
      ctx.moveTo(link.ax, link.ay);
      ctx.lineTo(link.bx, link.by);
      ctx.stroke();

      ctx.globalAlpha = 0.9 * glow;
      ctx.strokeStyle = '#35d7ff';
      ctx.lineWidth = 3 + link.strength * 4;
      ctx.shadowBlur = 18;
      ctx.setLineDash([12, 9]);
      ctx.lineDashOffset = -now * 0.06;
      ctx.beginPath();
      ctx.moveTo(link.ax, link.ay);
      ctx.lineTo(link.bx, link.by);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.globalAlpha = 0.82 * pulse;
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, 4 + link.strength * 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.58 * glow;
      ctx.strokeStyle = '#35d7ff';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(link.ax, link.ay, (link.ar || 22) * ringPulse + 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(link.bx, link.by, (link.br || 22) * ringPulse + 9, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();
  }

  if (mergeSenseTargets.length) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    mergeSenseTargets.forEach((target, index) => {
      const pulse = 0.62 + Math.sin(now * 0.012 + index * 1.7) * 0.28;
      const radius = target.radius + pulse * 16;
      const alpha = target.triggered ? 0.95 : 0.72;

      ctx.globalAlpha = 0.34 * alpha;
      ctx.fillStyle = '#ffd447';
      ctx.shadowColor = '#ffd447';
      ctx.shadowBlur = 32;
      ctx.beginPath();
      ctx.arc(target.x, target.y, radius * 0.92, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.92 * alpha;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = target.triggered ? 8 : 5;
      ctx.shadowBlur = 26;
      ctx.beginPath();
      ctx.arc(target.x, target.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = 0.9 * alpha;
      ctx.strokeStyle = '#ffd447';
      ctx.lineWidth = target.triggered ? 4 : 3;
      ctx.setLineDash([10, 7]);
      ctx.lineDashOffset = -now * 0.06;
      ctx.beginPath();
      ctx.arc(target.x, target.y, radius + 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.globalAlpha = 0.82 * alpha;
      ctx.strokeStyle = '#ff5bbd';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ff5bbd';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(target.ax, target.ay);
      ctx.lineTo(target.bx, target.by);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = target.triggered ? 0.9 : 0.62;
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.triggered ? 8 : 5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
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
    sickGlow.addColorStop(0, 'rgba(13, 27, 9, 0.42)');
    sickGlow.addColorStop(0.55, 'rgba(56, 45, 12, 0.4)');
    sickGlow.addColorStop(1, 'rgba(8, 24, 8, 0.48)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = sickGlow;
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.globalAlpha = 0.34;
    ctx.fillStyle = 'rgba(74, 95, 18, 0.86)';
    for (let i = 0; i < 58; i++) {
      const drift = Math.sin(now * 0.0018 + i * 1.7) * 9;
      const x = (i * 43 + drift) % (state.width + 28) - 14;
      const y = (i * 31 + now * 0.018) % state.height;
      const radius = 3 + (i % 5) * 1.6;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = 'rgba(21, 45, 9, 0.82)';
    ctx.lineWidth = 2;
    for (let y = state.dangerY + 20; y < state.height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y + Math.sin(now * 0.002 + y) * 8);
      ctx.lineTo(state.width, y + Math.cos(now * 0.002 + y) * 8);
      ctx.stroke();
    }
  }

  if (classes.includes('event-rain')) {
    const rainSeed = (index, salt) => {
      const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
      return value - Math.floor(value);
    };
    const rainTravelHeight = state.height + 180;

    ctx.globalAlpha = 0.28;
    ctx.fillStyle = 'rgba(7, 32, 74, 0.52)';
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.strokeStyle = 'rgba(12, 66, 150, 0.84)';
    ctx.lineWidth = 2.2;
    for (let i = 0; i < Math.ceil(state.width / 5); i++) {
      const length = 38 + rainSeed(i, 2) * 34;
      const x = rainSeed(i, 1) * (state.width + state.height * 0.48) - state.height * 0.24;
      const y = (rainSeed(i, 3) * rainTravelHeight + now * (0.54 + rainSeed(i, 4) * 0.2)) % rainTravelHeight - 100;
      const slant = length * (0.18 + rainSeed(i, 5) * 0.1);
      ctx.globalAlpha = 0.58 + rainSeed(i, 6) * 0.22;
      ctx.setLineDash([7 + rainSeed(i, 7) * 4, 5 + rainSeed(i, 8) * 4]);
      ctx.lineDashOffset = -now * (0.035 + rainSeed(i, 9) * 0.02);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + slant, y + length);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.strokeStyle = 'rgba(24, 89, 178, 0.82)';
    ctx.lineWidth = 1;
    for (let i = 0; i < Math.ceil(state.width / 8); i++) {
      const length = 24 + rainSeed(i, 12) * 26;
      const x = rainSeed(i, 11) * (state.width + state.height * 0.5) - state.height * 0.25;
      const y = (rainSeed(i, 13) * rainTravelHeight + now * (0.72 + rainSeed(i, 14) * 0.24)) % rainTravelHeight - 100;
      const slant = length * (0.18 + rainSeed(i, 15) * 0.12);
      ctx.globalAlpha = 0.32 + rainSeed(i, 16) * 0.2;
      ctx.setLineDash([4 + rainSeed(i, 17) * 3, 4 + rainSeed(i, 18) * 4]);
      ctx.lineDashOffset = -now * (0.024 + rainSeed(i, 19) * 0.018);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + slant, y + length);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.globalAlpha = 0.3;
    ctx.fillStyle = 'rgba(17, 72, 148, 0.68)';
    for (let i = 0; i < 16; i++) {
      const x = (i * 53 + now * 0.09) % state.width;
      const y = state.height - 18 - (i % 4) * 13;
      ctx.beginPath();
      ctx.ellipse(x, y, 12 + (i % 3) * 7, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (classes.includes('event-wind')) {
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = 'rgba(185, 244, 255, 0.58)';
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.globalAlpha = 0.86;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (let y = state.dangerY + 10; y < state.height; y += 24) {
      const offset = (now * 0.58 + y * 2.7) % (state.width + 220);
      ctx.beginPath();
      ctx.moveTo(offset - 220, y);
      ctx.quadraticCurveTo(offset - 142, y - 24, offset - 48, y - 4);
      ctx.quadraticCurveTo(offset + 18, y + 10, offset + 92, y - 10);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.58;
    ctx.strokeStyle = 'rgba(116, 211, 230, 0.9)';
    ctx.lineWidth = 2.2;
    for (let y = state.dangerY + 18; y < state.height; y += 16) {
      const offset = (now * 0.82 + y * 1.9) % (state.width + 160);
      ctx.beginPath();
      ctx.moveTo(offset - 160, y);
      ctx.lineTo(offset - 42, y - 7);
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

  if (talentHasStablePreview() && state.fertilizerCharges <= 0) {
    const queuedPreviewRadius = clamp(VEGETABLES[state.previewLevel]?.radius * 0.58 || 18, 15, 28);
    const side = x < state.width / 2 ? 1 : -1;
    const queuedX = clamp(x + side * (previewRadius + queuedPreviewRadius + 22), queuedPreviewRadius + 12, state.width - queuedPreviewRadius - 12);
    const queuedY = y + 2;
    if (!isPreviewBlockedByVegetable(queuedX, queuedY, queuedPreviewRadius)) {
      drawQueuedPreview(ctx, state.previewLevel, queuedX, queuedY, now);
    }
  }

  if (state.aiming || isPrecisionAimActive(now)) {
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
  drawFeverTimeEffects(ctx, bodies, now);

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

  drawSkillAssistEffects(ctx, now);

  ctx.restore();
  drawBlastEffects(ctx, now);
  drawFertilizerEffects(ctx, now);
  drawComboImpact(ctx, now);
  drawComboInsuranceEffects(ctx, now);
  drawTopUiOverlay(now);
}
