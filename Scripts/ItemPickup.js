// Uses Phaser Arcade Physics overlap via TulioBehaviour.addOverlap(), so the
// Player MUST have an Arcade body.

export default class ItemPickup extends TulioBehaviour {
  
  create(ctx, props) {
    // Re-register if create() runs again.
    try { this._overlap?.destroy?.(); } catch { /* ignore */ }
    this._overlap = null;

    // Require a physics body on the player.
    const body = this.gameObject?.body;
    if (!body) {
      throw new Error('[ItemPickup] Player has no Arcade body. Enable Arcade Body on the Player to use ItemPickup.');
    }

    const overlap = this.addOverlap(
      'Dots',
      (_self, item) => this._handleCollideDot(item),
      null
    );

    if (!overlap) {
      throw new Error('[ItemPickup] Failed to register Arcade overlap. Ensure items have bodies and `items` points to a physics group (e.g. "Dots").');
    }

    this._overlap = overlap;
  }

  _handleCollideDot(dot) {
    this.emitSignal('dotConsumed');
    dot.destroy();
  }
}