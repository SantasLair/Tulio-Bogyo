export default class Titlebehaviour extends TulioBehaviour {
  update(dt, ctx, props) {
    if (this.gml.keyboardCheckPressed(vk_space)) {
          sceneGoto("Main");
    }
  }
}
