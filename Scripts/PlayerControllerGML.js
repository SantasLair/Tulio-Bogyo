// PlayerControllerGML.js
// A more GameMaker-style (GML-ish) controller:
// - Uses GML-like variable names
// - Uses Tulio's GameMaker helpers via `this.gml`
// - Keeps logic mostly inside create/update (no deep helper stack)


export default class PlayerControllerGML extends TulioBehaviour {
  static properties = {
    tileSize: { type: 'number', default: 32 },
    offsetX: { type: 'number', default: 0 },
    offsetY: { type: 'number', default: 0 },
    speed: { type: 'number', default: 6 }, // tiles per second (converted to px/sec via tileSize)
    walls: { type: 'physicsGroup', default: 'Walls' },
    allowDiagonal: { type: 'boolean', default: false },
    snapToGridOnStart: { type: 'boolean', default: true }
  };

  create(ctx, props) {
    this.keys = ctx.scene.input?.keyboard?.addKeys?.({
      up: 'W',
      down: 'S',
      left: 'A',
      right: 'D',
      up2: 'UP',
      down2: 'DOWN',
      left2: 'LEFT',
      right2: 'RIGHT'
    }) || null;

    // GML-ish instance variables
    this.moving = false;
    this.target_x = this.x;
    this.target_y = this.y;

    if (props.snapToGridOnStart) {
      const tile = Math.max(1, Number(props.tileSize) || 32);
      const ox = Number(props.offsetX) || 0;
      const oy = Number(props.offsetY) || 0;
      const snapped = this._snap_to_grid(this.x, this.y, tile, ox, oy);
      this.x = snapped.x;
      this.y = snapped.y;
      this.target_x = snapped.x;
      this.target_y = snapped.y;
    }
  }

  update(dt, ctx, props) {
    const tile = Math.max(1, Number(props.tileSize) || 32);
    const ox = Number(props.offsetX) || 0;
    const oy = Number(props.offsetY) || 0;
    const tiles_per_sec = Math.max(0, Number(props.speed) || 0);
    const px_per_sec = tiles_per_sec * tile;

    // pixels we can move this frame
    let move_rem = px_per_sec * Math.max(0, dt);

    // Read direction once per frame (holding a key chains steps)
    const dir = this._read_dir(props.allowDiagonal === true);

    while (move_rem > 0) {
      // 1) If moving, move toward current target.
      if (this.moving) {
        // Use Tulio's built-in move_towards_point (returns remaining distance)
        const prevX = this.x;
        const prevY = this.y;
        this.gml.move_towards_point(this, this.target_x, this.target_y, move_rem);
        
        // Calculate how much we actually moved
        const movedDist = this.gml.point_distance(prevX, prevY, this.x, this.y);
        move_rem -= movedDist;
        
        // Check if we reached the target (within snap tolerance)
        const dist = this.gml.point_distance(this.x, this.y, this.target_x, this.target_y);
        if (dist <= 0.5) {
          this.x = this.target_x;
          this.y = this.target_y;
          this.moving = false;
          continue; // reached target: try to start a new tile
        }
        
        break; // still moving: stop chaining
      }

      // 2) Not moving: start a new tile step.
      if (!dir) break;

      const snapped = this._snap_to_grid(this.x, this.y, tile, ox, oy);
      const next_x = snapped.x + dir.dx * tile;
      const next_y = snapped.y + dir.dy * tile;

      if (this.place_meeting(next_x, next_y, props.walls, { tileSize: tile, offsetX: ox, offsetY: oy })) break;

      // Face in the direction of movement (GML degrees -> Phaser rotation handled by base class helper)
      const dirDeg = this.gml.point_direction(this.x, this.y, this.x + dir.dx, this.y + dir.dy);
      this.setRotationFromGmlDirection(dirDeg);

      this.target_x = next_x;
      this.target_y = next_y;
      this.moving = true;
    }
  }

  _read_dir(allowDiagonal) {
    if (!this.keys) return null;

    const up = !!(this.keys.up?.isDown || this.keys.up2?.isDown);
    const down = !!(this.keys.down?.isDown || this.keys.down2?.isDown);
    const left = !!(this.keys.left?.isDown || this.keys.left2?.isDown);
    const right = !!(this.keys.right?.isDown || this.keys.right2?.isDown);

    let dx = 0;
    let dy = 0;

    if (left && !right) dx = -1;
    else if (right && !left) dx = 1;

    if (up && !down) dy = -1;
    else if (down && !up) dy = 1;

    if (!allowDiagonal) {
      if (dx !== 0) dy = 0;
      else if (dy !== 0) dx = 0;
    }

    if (dx === 0 && dy === 0) return null;
    return { dx, dy };
  }

  _snap_to_grid(x, y, tile, ox = 0, oy = 0) {
    const tmp = { x, y };
    // Use Tulio's GML helper (GameMaker-style move_snap).
    // We pass an origin so the grid can be offset.
    this.gml.move_snap(tmp, tile, tile, ox, oy);
    return { x: tmp.x, y: tmp.y };
  }
}
