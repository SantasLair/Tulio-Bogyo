// Behaviour script (recommended)
// Extends TulioBehaviour (available globally at play-time)

export default class Scoretracker extends TulioBehaviour {

  static properties = {
    signalName: { type: 'string', default: 'dotConsumed' },
    format: { type: 'string', default: '{score}' },
    startScore: { type: 'number', default: 0 }
  };

  create(ctx, props) {
    this.score = Number.isFinite(Number(props?.startScore)) ? Number(props.startScore) : 0;

    this._textObj = this._resolveTextTarget();
    if (!this._textObj) {
      this.log('[ScoreTracker] No Text object found on this instance.');
    }

    this._renderText(props);

    const signalName = String(props?.signalName || 'dotConsumed').trim() || 'dotConsumed';
    try { this._unsubscribe?.(); } catch { /* ignore */ }
    this._unsubscribe = this.onSignal(signalName, (payload) => {
      const delta = Number.isFinite(Number(payload?.delta)) ? Number(payload.delta) : 10;
      this.score += delta;
      this._renderText(props);
    });
  }

  update(dt, ctx, props) {
    // Called every frame
    // dt is delta time in seconds
  }

  destroy(ctx, props) {
    try { this._unsubscribe?.(); } catch { /* ignore */ }
    this._unsubscribe = null;
  }

  _resolveTextTarget() {
    const go = this.gameObject;
    if (!go) return null;

    // If this instance renders as a Phaser Text, the GameObject itself supports setText().
    if (typeof go.setText === 'function') return go;

    // Otherwise (common when the instance has children), the visual text is a child of a Container.
    const list = Array.isArray(go.list) ? go.list : [];
    const child = list.find((c) => c && typeof c.setText === 'function');
    return child || null;
  }

  _renderText(props) {
    const t = this._textObj;
    if (!t || typeof t.setText !== 'function') return;

    const fmt = String(props?.format || 'SCORE: {score}');
    const value = fmt.replace('{score}', String(this.score));
    try { t.setText(value); } catch { /* ignore */ }
  }
}
