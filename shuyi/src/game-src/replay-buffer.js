// Slots own their pose arrays. Playback receives copies so ring reuse cannot change a clip.
export class ReplayBuffer {
  constructor(capacity = 100) { this.capacity = capacity; this.reset(); }
  reset() { this.slots = []; this.next = 0; this.length = 0; }
  record(time, actors) {
    const frame = this.slots[this.next] ??= {time: 0, actors: new Map()};
    frame.time = time;
    for (const actor of actors) {
      const soldier = actor.soldier, root = soldier.root;
      let pose = frame.actors.get(actor.id);
      if (!pose) {
        pose = {pos: new Float64Array(3), q: new Float64Array(4), bones: {}};
        frame.actors.set(actor.id, pose);
      }
      root.position.toArray(pose.pos); root.quaternion.toArray(pose.q);
      for (const bone of soldier.bones) {
        const values = pose.bones[bone.name] ??= new Float64Array(7);
        bone.position.toArray(values); bone.quaternion.toArray(values, 3);
      }
    }
    if (frame.actors.size !== actors.length || actors.some(a => !frame.actors.has(a.id))) {
      const ids = new Set(actors.map(a => a.id));
      for (const id of frame.actors.keys()) if (!ids.has(id)) frame.actors.delete(id);
    }
    this.next = (this.next + 1) % this.capacity;
    this.length = Math.min(this.length + 1, this.capacity);
    return frame;
  }
  snapshot() {
    const frames = [];
    const start = (this.next - this.length + this.capacity) % this.capacity;
    for (let i = 0; i < this.length; i++) frames.push(structuredClone(this.slots[(start + i) % this.capacity]));
    return frames;
  }
}
