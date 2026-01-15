// PickupConsumer
// TulioBehaviour script (recommended)
export default class ItemPickupBehaviour extends TulioBehaviour {

  static properties = {
    dots: { type: 'physicsGroup', default: 'Dots' },
  };

  create(ctx) {

    //tileSize used in place of having a bounds on the object/sprite for now
    this.watchOverlap('Dots', (dot) => this.onCollisionDot(dot), {tileSize: 40});

  }

  onCollisionDot(dot) {
    dot?.destroy();
  }

}
