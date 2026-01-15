// TileMoveController.js
// Attach this script to your Player object.

export default class PlayerController extends TulioBehaviour {
  // Optional: expose inspector properties (Tulio resolves `default.properties`)
  static properties = {
    tileSize: { type: 'number', default: 32 },
    offsetX: { type: 'number', default: 0 },
    offsetY: { type: 'number', default: 0 },
    speed: { type: 'number', default: 6 }, // tiles per second
    walls: { type: 'physicsGroup', default: 'Walls' }, // reference by name or id
    allowDiagonal: { type: 'boolean', default: false },
    snapToGridOnStart: { type: 'boolean', default: true }
  };

  create(ctx, props) {
    this._keys = ctx.scene.input?.keyboard?.addKeys?.({
      up: 'W',
      down: 'S',
      left: 'A',
      right: 'D',
      up2: 'UP',
      down2: 'DOWN',
      left2: 'LEFT',
      right2: 'RIGHT'
    }) || null;

    this._moving = false;
    this._targetX = this.x;
    this._targetY = this.y;

    if (props.snapToGridOnStart) {
      const tileSize = Math.max(1, Number(props.tileSize) || 32);
      const offsetX = Number(props.offsetX) || 0;
      const offsetY = Number(props.offsetY) || 0;
      const { x, y } = this._snapToGrid(this.x, this.y, tileSize, offsetX, offsetY);
      this.x = x;
      this.y = y;
      this._targetX = x;
      this._targetY = y;
    }
  }

  // Called every frame
  update(dt, ctx, props) {
    const tileSize = Number(props.tileSize) || 32;
    const offsetX = Number(props.offsetX) || 0;
    const offsetY = Number(props.offsetY) || 0;
    const tilesPerSec = Math.max(0, Number(props.speed) || 0);

    // Consume movement distance; we may cross multiple tiles in a single frame.
    let remaining = (tilesPerSec * tileSize) * Math.max(0, dt);

    // Direction is read once per update; holding a key keeps chaining.
    const heldDir = this._readDirection(props.allowDiagonal === true);

    while (remaining > 0) {
      // 1) If moving, advance toward current target.
      if (this._moving) {
        remaining = this._advanceTowardTarget(remaining);
        if (this._moving) break; // still moving, no more chaining this frame
        continue; // reached target: try to start next tile immediately
      }

      // 2) If not moving, try to start the next tile step.
      if (!heldDir) break;
      const next = this._computeNextTileTarget(heldDir, tileSize, offsetX, offsetY);
      if (!next) break;

      if (this._isBlocked(next.x, next.y, tileSize, offsetX, offsetY, props, ctx)) break;

      this._applyFacing(heldDir);
      this._targetX = next.x;
      this._targetY = next.y;
      this._moving = true;
    }
  }

  _applyFacing(dir) {
    if (!dir) return;
    const go = this.gameObject;
    if (!go) return;

    const dirDeg = this.gml.point_direction(this.x, this.y, this.x + dir.dx, this.y + dir.dy);
    this.setRotationFromGmlDirection(dirDeg);
  }

  _advanceTowardTarget(remainingPx) {
    // distance to target
    const dist = this.gml.point_distance(this.x, this.y, this._targetX, this._targetY);
    const snapDistance = 0.5;

    // snap if close enough
    if (dist <= snapDistance) {
      this.x = this._targetX;
      this.y = this._targetY;
      this._moving = false;
      return remainingPx;
    }

    // move toward the target
    if (remainingPx < dist) {
      const dirDeg = this.gml.point_direction(this.x, this.y, this._targetX, this._targetY);
      this.x += this.gml.lengthdir_x(remainingPx, dirDeg);
      this.y += this.gml.lengthdir_y(remainingPx, dirDeg);
      return 0;
    }

    // Consume the rest of the distance to the target this frame.
    this.x = this._targetX;
    this.y = this._targetY;
    this._moving = false;
    return remainingPx - dist;
  }

  _computeNextTileTarget(dir, tileSize, offsetX, offsetY) {
    const snapped = this._snapToGrid(this.x, this.y, tileSize, offsetX, offsetY);
    return {
      x: snapped.x + dir.dx * tileSize,
      y: snapped.y + dir.dy * tileSize
    };
  }

  _readDirection(allowDiagonal) {
    if (!this._keys) return null;

    const up = !!(this._keys.up?.isDown || this._keys.up2?.isDown);
    const down = !!(this._keys.down?.isDown || this._keys.down2?.isDown);
    const left = !!(this._keys.left?.isDown || this._keys.left2?.isDown);
    const right = !!(this._keys.right?.isDown || this._keys.right2?.isDown);

    let dx = 0;
    let dy = 0;

    if (left && !right) dx = -1;
    else if (right && !left) dx = 1;

    if (up && !down) dy = -1;
    else if (down && !up) dy = 1;

    if (!allowDiagonal) {
      // Prefer horizontal if both pressed (you can flip this preference)
      if (dx !== 0) dy = 0;
      else if (dy !== 0) dx = 0;
    }

    if (dx === 0 && dy === 0) return null;
    return { dx, dy };
  }

  _snapToGrid(x, y, tileSize, offsetX = 0, offsetY = 0) {
    // Snap positions to the nearest grid cell given a configurable grid origin.
    // Example: if tiles are centered on (offsetX, offsetY), snapping respects that.
    const sx = Math.round((x - offsetX) / tileSize) * tileSize + offsetX;
    const sy = Math.round((y - offsetY) / tileSize) * tileSize + offsetY;
    return { x: sx, y: sy };
  }

  _isBlocked(nextX, nextY, tileSize, offsetX, offsetY, props, ctx) {
    const walls = props.walls || null;

    // No walls configured -> no blocking
    if (!walls) return false;

    // Preferred: Phaser Arcade Physics overlap query at the *next tile* location.
    const scene = ctx?.scene;
    const physics = scene?.physics;
    if (physics && typeof physics.overlapRect === 'function') {
      const body = this.gameObject?.body;

      // Use the player's current body size if available; otherwise approximate a tile-sized body.
      // IMPORTANT: when doing grid movement, a full sprite/body size can overlap adjacent tiles
      // and make every move look blocked. Clamp probe size to the tile size by default.
      const fallback = tileSize * 0.9;
      const bw = Number(body?.width);
      const bh = Number(body?.height);
      const w = Math.max(1, Math.min(fallback, (Number.isFinite(bw) && bw > 0 ? bw : fallback)));
      const h = Math.max(1, Math.min(fallback, (Number.isFinite(bh) && bh > 0 ? bh : fallback)));

      // overlapRect expects top-left.
      const rx = nextX - (w / 2);
      const ry = nextY - (h / 2);

      const bodies = physics.overlapRect(rx, ry, w, h, true, true) || [];
      for (const b of bodies) {
        const other = b?.gameObject;
        if (!other || other === this.gameObject) continue;

        // If walls is a Phaser Group / PhysicsGroup, it should support contains().
        if (typeof walls.contains === 'function') {
          if (walls.contains(other)) return true;
          continue;
        }

        // Fallback membership check for groups that expose children arrays.
        const list = typeof walls.getChildren === 'function'
          ? walls.getChildren()
          : (walls.children && typeof walls.children.getArray === 'function' ? walls.children.getArray() : []);
        if (Array.isArray(list) && list.includes(other)) return true;
      }
      return false;
    }

    // Fallback (non-physics): treat wall objects as grid-aligned occupancy.
    const getChildren = (maybeGroup) => {
      if (!maybeGroup) return [];
      if (Array.isArray(maybeGroup)) return maybeGroup;
      if (typeof maybeGroup.getChildren === 'function') return maybeGroup.getChildren();
      if (typeof maybeGroup.getMatching === 'function') return maybeGroup.getMatching('active', true);
      if (maybeGroup.children && typeof maybeGroup.children.getArray === 'function') return maybeGroup.children.getArray();
      return [];
    };

    for (const obj of getChildren(walls)) {
      if (!obj) continue;
      const ox = Number(obj.x) || 0;
      const oy = Number(obj.y) || 0;
      const snapped = this._snapToGrid(ox, oy, tileSize, offsetX, offsetY);
      if (snapped.x === nextX && snapped.y === nextY) return true;
    }

    return false;
  }
}