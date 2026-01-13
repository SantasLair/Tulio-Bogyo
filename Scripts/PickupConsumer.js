// PickupConsumer
// TulioBehaviour script (recommended)
export default class PickupConsumerBehaviour extends TulioBehaviour {

  static properties = {
    dots: { type: 'physicsGroup', default: 'Dots' },
    // Optional: explicit grid config (if you don't want auto-detect from PlayerControllerGML)
    tileSize: { type: 'number', default: 0 },
    offsetX: { type: 'number', default: 0 },
    offsetY: { type: 'number', default: 0 },
    consumeEpsilon: { type: 'number', default: 0.5 }
  };

  create(ctx) {
    // Prefer physicsGroup lookup via inspector props, fallback to name.
    const dotsGroup = this.props?.dots || this.getPhysicsGroup('Dots');
    if (!dotsGroup) {
      console.warn('[PickupConsumer] could not find dots group');
      this._dotsGroup = null;
      return;
    }

    this._dotsGroup = dotsGroup;
    this._dotsByCell = new Map();

    // Try to reuse the grid settings from PlayerControllerGML (same instance, other script).
    const controller = (Array.isArray(this.selfData?.scripts) ? this.selfData.scripts : []).find(s => {
      const p = String(s?.scriptPath || '');
      return p.endsWith('/PlayerControllerGML.js') || p.endsWith('\\PlayerControllerGML.js') || p.endsWith('PlayerControllerGML.js');
    });

    const pv = controller?.propertyValues && typeof controller.propertyValues === 'object' ? controller.propertyValues : null;
    const tileSize = Number(this.tileSize) || Number(pv?.tileSize) || 0;
    const offsetX = Number(this.offsetX) || Number(pv?.offsetX) || 0;
    const offsetY = Number(this.offsetY) || Number(pv?.offsetY) || 0;

    this._grid = {
      tileSize: tileSize,
      offsetX: offsetX,
      offsetY: offsetY
    };

    // Pre-index dots by grid cell for O(1) lookup.
    this._rebuildDotIndex();
  }

  _rebuildDotIndex() {
    const dotsGroup = this._dotsGroup;
    if (!dotsGroup || typeof dotsGroup.getChildren !== 'function') return;
    if (!this._dotsByCell) this._dotsByCell = new Map();
    this._dotsByCell.clear();

    const tileSize = Number(this._grid?.tileSize) || 0;
    const offsetX = Number(this._grid?.offsetX) || 0;
    const offsetY = Number(this._grid?.offsetY) || 0;

    const dots = dotsGroup.getChildren() || [];
    for (const dot of dots) {
      if (!dot || dot.active === false) continue;

      // If tileSize is unknown, fall back to raw position key.
      const key = tileSize > 0
        ? `${Math.round(((Number(dot.x) || 0) - offsetX) / tileSize)},${Math.round(((Number(dot.y) || 0) - offsetY) / tileSize)}`
        : `${Math.round(Number(dot.x) || 0)},${Math.round(Number(dot.y) || 0)}`;

      // If multiple dots end up in same cell, keep the first active one.
      if (!this._dotsByCell.has(key)) this._dotsByCell.set(key, dot);
    }
  }

  update(_dt, _ctx) {
    const map = this._dotsByCell;
    if (!map || map.size === 0) return;

    const tileSize = Number(this._grid?.tileSize) || 0;
    const offsetX = Number(this._grid?.offsetX) || 0;
    const offsetY = Number(this._grid?.offsetY) || 0;

    const px = Number(this.x) || 0;
    const py = Number(this.y) || 0;

    // Primary: grid-cell lookup.
    if (tileSize > 0) {
      const cellKey = `${Math.round((px - offsetX) / tileSize)},${Math.round((py - offsetY) / tileSize)}`;
      const dot = map.get(cellKey);
      if (dot && dot.active !== false) {
        this.onCollisionDot(dot);
        map.delete(cellKey);
        return;
      }
      return;
    }

    // Fallback: position epsilon against the mapped values.
    const eps = Math.max(0, Number(this.consumeEpsilon) || 0.5);
    for (const [key, dot] of map.entries()) {
      if (!dot || dot.active === false) {
        map.delete(key);
        continue;
      }
      const dx = Math.abs((Number(dot.x) || 0) - px);
      const dy = Math.abs((Number(dot.y) || 0) - py);
      if (dx <= eps && dy <= eps) {
        this.onCollisionDot(dot);
        map.delete(key);
        return;
      }
    }
  }

  onCollisionDot(dot) {
    try {
      console.log('[PickupConsumer] Collided with dot');
    } catch {
      // ignore
    }
    try {
      dot?.destroy?.();
    } catch {
      // ignore
    }
  }
}
