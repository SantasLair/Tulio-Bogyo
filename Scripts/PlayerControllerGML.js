// PlayerControllerGML.js
// GameMaker-style (GML) grid-based movement controller
// Looks and feels like GML code that beginners would recognize

export default class PlayerControllerGML extends TulioBehaviour {
  static properties = {
    tileSize: { type: 'number', default: 32 },
    speed: { type: 'number', default: 6 },
    offsetX: { type: 'number', default: 0 },
    offsetY: { type: 'number', default: 0 }
  };

  _resolveGridOffsets(tileSize) {
    const ts = Number(tileSize) || 0;
    const rawX = Number(this.offsetX);
    const rawY = Number(this.offsetY);

    let ox = Number.isFinite(rawX) ? rawX : 0;
    let oy = Number.isFinite(rawY) ? rawY : 0;

    // Heuristic: if offsets are unset/default (0), try to infer whether the object
    // is meant to sit on tile centers.
    try {
      if (ox === 0 && ts > 0) {
        const x = Number(this.x) || 0;
        const r = ((x % ts) + ts) % ts;
        const half = ts / 2;
        if (Math.abs(r - half) < 1e-6) ox = half;
      }
      if (oy === 0 && ts > 0) {
        const y = Number(this.y) || 0;
        const r = ((y % ts) + ts) % ts;
        const half = ts / 2;
        if (Math.abs(r - half) < 1e-6) oy = half;
      }

      // Additional hint: in Tulio runtime the script is bound to a Phaser Container,
      // so originX/originY may live on the visual child (image/sprite).
      if (ox === 0 && oy === 0 && ts > 0) {
        const go = this.gameObject;
        let visual = null;
        if (go && Array.isArray(go.list) && go.list.length > 0) visual = go.list[0];
        if (!visual && go && typeof go.getAt === 'function') visual = go.getAt(0);

        const originX = Number(visual?.originX);
        const originY = Number(visual?.originY);
        const centerOrigin = originX === 0.5 && originY === 0.5;
        if (centerOrigin) {
          ox = ts / 2;
          oy = ts / 2;
        }
      }
    } catch {
      // ignore
    }

    return { offsetX: ox, offsetY: oy };
  }

  create() {
    // Instance variables (like GML)
    this.moving = false;
    this.target_x = this.x;
    this.target_y = this.y;
    
    // Snap to grid on start (with offset)
    const tileSize = Number(this.tileSize) || 32;
    const { offsetX, offsetY } = this._resolveGridOffsets(tileSize);
    this.x = this.gml.snap_to_grid(this.x, tileSize, offsetX);
    this.y = this.gml.snap_to_grid(this.y, tileSize, offsetY);
    this.target_x = this.x;
    this.target_y = this.y;
  }

  update(dt) {
    var tileSize = Number(this.tileSize) || 32;
    const resolved = this._resolveGridOffsets(tileSize);
    var offsetX = resolved.offsetX;
    var offsetY = resolved.offsetY;
    var move_speed = this.speed * tileSize * dt; // pixels this frame
    
    // If moving, move toward target
    if (this.moving) {
      this.gml.move_towards_point(this, this.target_x, this.target_y, move_speed);
      
      // Check if we reached target
      if (this.gml.point_distance(this.x, this.y, this.target_x, this.target_y) < 1) {
        this.x = this.target_x;
        this.y = this.target_y;
        this.moving = false;
      }
    }
    
    // If not moving, check for input
    if (!this.moving) {
      var next_x = this.x;
      var next_y = this.y;
      
      // Check keyboard (just like GML keyboard_check)
      if (this.gml.keyboard_check(vk_left) || this.gml.keyboard_check(ord("A"))) {
        next_x = this.x - tileSize;
        this.image_angle = 180; // face left
      }
      else if (this.gml.keyboard_check(vk_right) || this.gml.keyboard_check(ord("D"))) {
        next_x = this.x + tileSize;
        this.image_angle = 0; // face right
      }
      else if (this.gml.keyboard_check(vk_up) || this.gml.keyboard_check(ord("W"))) {
        next_y = this.y - tileSize;
        this.image_angle = 90; // face up
      }
      else if (this.gml.keyboard_check(vk_down) || this.gml.keyboard_check(ord("S"))) {
        next_y = this.y + tileSize;
        this.image_angle = 270; // face down
      }
      
      // If we want to move, check collision
      if (next_x != this.x || next_y != this.y) {
        if (!this.gml.place_meeting(next_x, next_y, "Walls", { tileSize: tileSize, offsetX: offsetX, offsetY: offsetY })) {
          this.target_x = next_x;
          this.target_y = next_y;
          this.moving = true;
        }
      }
    }
  }
}
