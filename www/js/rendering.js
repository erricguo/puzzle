function drawVegetableSprite(ctx, level, x, y, radius, alpha = 1, angle = 0) {
  const veg = VEGETABLES[level];
  const image = vegetableImages[level];
  if (image && image.complete && image.naturalWidth > 0) {
    const maxSize = radius * 2.45;
    const scale = Math.min(maxSize / image.naturalWidth, maxSize / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = veg.color;
  ctx.strokeStyle = 'rgba(35, 55, 28, 0.28)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawComboBar(ctx, now) {
  if (state.combo <= 0 || state.comboDuration <= 0) return;

  const progress = clamp((state.comboExpiresAt - now) / state.comboDuration, 0, 1);
  if (progress <= 0) return;

  const width = Math.min(116, state.width * 0.32);
  const height = 9;
  const x = state.width - width - 12;
  const y = 88;
  const radius = 5;
  const pulse = Math.max(0, 1 - (now - state.comboPulseStartedAt) / COMBO_IMPACT_DURATION);
  const accent = comboColor(state.combo);

  ctx.save();
  ctx.font = `${800 + Math.round(pulse) * 100} ${12 + pulse * 3}px system-ui, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = pulse > 0 ? accent : 'rgba(40, 59, 31, 0.88)';
  ctx.shadowColor = accent;
  ctx.shadowBlur = 12 * pulse;
  ctx.fillText(`COMBO ${state.combo}`, x + width, y - 4);

  ctx.beginPath();
  roundedRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(48, 78, 35, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  roundedRect(ctx, x, y, width * progress, height, radius);
  ctx.fillStyle = progress > 0.32 ? accent : '#ff634f';
  ctx.fill();
  ctx.restore();
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
    ctx.shadowBlur = 18;
    ctx.strokeText(`COMBO ${burst.combo}`, burst.x, textY);
    ctx.fillText(`COMBO ${burst.combo}`, burst.x, textY);
    ctx.restore();
  }
}

function drawGameOverlay() {
  const ctx = render.context;
  const now = performance.now();
  const shakeProgress = Math.max(0, 1 - (now - state.comboPulseStartedAt) / COMBO_SHAKE_DURATION);
  const shakeStrength = Math.min(16, 4 + state.combo * 0.55) * shakeProgress * shakeProgress;

  ctx.save();
  if (shakeStrength > 0) {
    ctx.translate(
      Math.sin(now * 0.075) * shakeStrength,
      Math.cos(now * 0.091) * shakeStrength * 0.65
    );
  }
  ctx.strokeStyle = 'rgba(203, 93, 67, 0.85)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(0, state.dangerY);
  ctx.lineTo(state.width, state.dangerY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(203, 93, 67, 0.92)';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('危險線', state.width - 12, state.dangerY - 8);

  const dangerTimes = Composite.allBodies(world)
    .filter((body) => body.label === 'vegetable' && body.dangerEnteredAt)
    .map((body) => body.dangerEnteredAt);
  if (dangerTimes.length && !state.gameOver) {
    const oldestDangerAt = Math.min(...dangerTimes);
    const remaining = Math.max(0, 2 - (now - oldestDangerAt) / 1000);
    ctx.textAlign = 'left';
    ctx.fillText(`${remaining.toFixed(1)} 秒`, 12, state.dangerY - 8);
  }

  const preview = VEGETABLES[state.nextLevel];
  const x = clamp(state.aimX || state.width / 2, preview.radius + 8, state.width - preview.radius - 8);
  const y = 70;
  drawVegetableSprite(ctx, state.nextLevel, x, y, preview.radius, state.aiming ? 0.92 : 0.72);

  if (state.aiming) {
    ctx.strokeStyle = 'rgba(45, 70, 35, 0.45)';
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(x, y + preview.radius + 12);
    ctx.lineTo(x, state.height - 12);
    ctx.stroke();
  }

  for (const body of Composite.allBodies(world)) {
    if (body.label !== 'vegetable') continue;
    const veg = VEGETABLES[body.vegLevel];
    drawVegetableSprite(ctx, body.vegLevel, body.position.x, body.position.y, veg.radius, 1, body.angle);
  }

  ctx.restore();
  drawComboImpact(ctx, now);
  drawComboBar(ctx, now);
}
