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

  create() {
    // Instance variables (like GML)
    this.moving = false;
    this.target_x = this.x;
    this.target_y = this.y;
    
    // Snap to grid on start (with offset)
    this.x = this.gml.snap_to_grid(this.x, this.tileSize, this.offsetX);
    this.y = this.gml.snap_to_grid(this.y, this.tileSize, this.offsetY);
    this.target_x = this.x;
    this.target_y = this.y;
  }

  update(dt) {
    var tileSize = this.tileSize;
    var offsetX = this.offsetX;
    var offsetY = this.offsetY;
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
