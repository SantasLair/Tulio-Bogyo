// ItemPickup.js
// Attach this script to your Player object.
//
// Uses Phaser Arcade Physics overlap via TulioBehaviour.addOverlap(), so the
// Player MUST have an Arcade body.

export default class ItemPickup extends TulioBehaviour {
  static properties = {
    items: { type: 'physicsGroup', default: 'Dots' },
    tileSize: { type: 'number', default: 32 },
    width: { type: 'number', default: 0 },
    height: { type: 'number', default: 0 },
    destroyOnPickup: { type: 'boolean', default: true },
    log: { type: 'boolean', default: false }
  };

  create(ctx, props) {
    // Re-register if create() runs again.
    try { this._overlap?.destroy?.(); } catch { /* ignore */ }
    this._overlap = null;

    // Require a physics body on the player.
    const body = this.gameObject?.body;
    if (!body) {
      throw new Error('[ItemPickup] Player has no Arcade body. Enable Arcade Body on the Player to use ItemPickup.');
    }

    // Overlap callbacks fire every frame while overlapping; guard so we treat it like "onEnter".
    this._picked = (typeof WeakSet !== 'undefined') ? new WeakSet() : new Set();

    const overlap = this.addOverlap(
      props.items,
      (_self, item) => this._handlePickup(item, ctx, props),
      null
    );

    if (!overlap) {
      throw new Error('[ItemPickup] Failed to register Arcade overlap. Ensure items have bodies and `items` points to a physics group (e.g. "Dots").');
    }

    this._overlap = overlap;
  }

  _handlePickup(item, _ctx, props) {
    if (!item) return;

    // Treat overlap as onEnter (only once per item instance).
    try {
      if (this._picked && typeof this._picked.has === 'function' && this._picked.has(item)) return;
      if (this._picked && typeof this._picked.add === 'function') this._picked.add(item);
    } catch {
      // ignore
    }

    // User hook: implement either method name.
    try {
      if (typeof this.onPickup === 'function') this.onPickup(item);
      else if (typeof this.onCollisionDot === 'function') this.onCollisionDot(item);
    } catch (err) {
      try { console.error('[ItemPickup] pickup handler failed:', err); } catch { /* ignore */ }
    }

    if (props.destroyOnPickup !== false) {
      try {
        if (typeof item.destroy === 'function') item.destroy();
      } catch {
        // ignore
      }
    }

    if (props.log === true) {
      try { this.log('Picked up:', item?.name || item); } catch { /* ignore */ }
    }
  }
}