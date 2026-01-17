// UIManager - This is used for score and remaining lives display

let score = 0;
let scoreText = null;
let _unsubscribeDot = null;

export function create(ctx, props) {
  console.log('[UIManager] create; typeof onSignal=', typeof onSignal, 'typeof ctx.onSignal=', typeof ctx?.onSignal);

  // Score Label
  ctx.scene.add.text(16, 12, 'SCORE', {
    fontFamily: 'Arial Black, Impact, Arial',
    fontSize: '18px',
    fontStyle: '',
    color: '#F5F504'
  }).setScrollFactor(0).setDepth(100000);

  // Score value
  scoreText = ctx.scene.add.text(90, 10, String(score), {
    fontFamily: 'Arial Black, Impact, Arial',
    fontSize: '20px',
    fontStyle: '',
    color: '#FFFFFF'
  }).setScrollFactor(0).setDepth(100000);

  // Subscribe to dot consumption.
  try { _unsubscribeDot?.(); } catch { /* ignore */ }
  _unsubscribeDot = onSignal('dotConsumed', () => {
    console.log('dotConsumed signal received');
    score += 1;
    try { scoreText?.setText?.(String(score)); } catch { /* ignore */ }
  });
}

export function update(ctx, props, deltaMs) {
  // Called every frame
  // Use ctx.dt for delta time in seconds
}

export function destroy(ctx, props) {
  // Called when the scene/object is destroyed
  try { _unsubscribeDot?.(); } catch { /* ignore */ }
  _unsubscribeDot = null;
}
