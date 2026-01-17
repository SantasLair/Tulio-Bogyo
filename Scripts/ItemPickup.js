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

  _handlePickup(item, ctx, props) {
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
      // Pass ctx/props so game logic can emit signals, update score, etc.
      if (typeof this.onPickup === 'function') this.onPickup(item, ctx, props);
      else if (typeof this.onCollisionDot === 'function') this.onCollisionDot(item, ctx, props);
    } catch (err) {
      try { console.error('[ItemPickup] pickup handler failed:', err); } catch { /* ignore */ }
    }

    // First-class signals: emit from the pickup system (source of truth).
    // These are scene-scoped by default in Tulio.

    console.log('Sending item pickup signals');

    // Note: `props.items` is a `physicsGroup` inspector property, which Tulio resolves
    // to the actual Phaser group instance (not the string name). To detect the classic
    // "Dots" group robustly, prefer the item's recorded group name or compare the
    // resolved group instance against ctx.getPhysicsGroup('Dots').
    const groupName = item?.__tulioPhysicsGroupName ?? null;
    const groupId = item?.__tulioPhysicsGroupId ?? null;
    let isDots = groupName === 'Dots';
    if (!isDots) {
      try {
        const dotsGroup = this.getPhysicsGroup?.('Dots');
        if (dotsGroup && props?.items && dotsGroup === props.items) isDots = true;
      } catch {
        // ignore
      }
    }
    
    try {
      this.emitSignal('itemPickedUp', {
        group: props?.items,
        groupName,
        groupId,
        item,
        itemId: item?.__tulioInstanceId ?? item?.name ?? null,
        itemName: item?.__tulioInstanceName ?? item?.name ?? null,
        player: this.gameObject,
        playerId: this.selfId ?? null,
        playerName: this.selfName ?? null,
        ctx,
      });

      // Common shorthand event for classic dot-collect games.
      if (isDots) {
        this.emitSignal('dotConsumed', {
          item,
          group: props?.items,
          groupName,
          groupId,
          itemId: item?.__tulioInstanceId ?? item?.name ?? null,
          itemName: item?.__tulioInstanceName ?? item?.name ?? null,
          player: this.gameObject,
          playerId: this.selfId ?? null,
          playerName: this.selfName ?? null,
          ctx,
        });
      }
    } catch {
      // ignore
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