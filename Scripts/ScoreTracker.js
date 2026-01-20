// Behaviour script (recommended)
// Extends TulioBehaviour (available globally at play-time)

export default class Scoretracker extends TulioBehaviour {

  create(ctx, props) {
    this.score = 0;

    this._textObj = this.getComponent('text');
    if (!this._textObj) {
      this.log('[ScoreTracker] No Text object found on this instance.');
    }

    this._textObj.setText(String(this.score));

    const signalName = 'dotConsumed';
    try { this._unsubscribe?.(); } catch { /* ignore */ }
    this._unsubscribe = this.onSignal(signalName, (payload) => {
      const delta = Number.isFinite(Number(payload?.delta)) ? Number(payload.delta) : 10;
      this.score += delta;
      this._textObj.setText(String(this.score));
    });
  }

  destroy(ctx, props) {
    try { this._unsubscribe?.(); } catch { /* ignore */ }
    this._unsubscribe = null;
  }

}
