export class PlayerInput {
  readonly keys = new Set<string>();
  joystick = { x: 0, y: 0 };
  onInteract: () => void = () => {};
  private cleanup: (() => void)[] = [];
  constructor(canvas: HTMLCanvasElement) {
    const keydown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement || document.querySelector('dialog[open]')) return;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      this.keys.add(e.code);
      if (e.code === 'KeyE' && !e.repeat) this.onInteract();
    };
    const keyup = (e: KeyboardEvent) => this.keys.delete(e.code);
    const blur = () => { this.clear(); document.getElementById('joystick-knob')?.style.setProperty('transform', ''); };
    window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup); window.addEventListener('blur', blur);
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    this.cleanup.push(() => { window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup); window.removeEventListener('blur', blur); });
  }
  bindJoystick(base: HTMLElement, knob: HTMLElement): void {
    let active: number | null = null;
    const move = (e: PointerEvent) => {
      if (e.pointerId !== active) return;
      const box = base.getBoundingClientRect(), max = box.width * 0.32;
      let x = e.clientX - box.left - box.width / 2, y = e.clientY - box.top - box.height / 2;
      const length = Math.hypot(x, y); if (length > max) { x *= max / length; y *= max / length; }
      this.joystick = { x: x / max, y: -y / max }; knob.style.transform = `translate(${x}px, ${y}px)`;
    };
    const down = (e: PointerEvent) => { active = e.pointerId; base.setPointerCapture(active); move(e); };
    const up = () => { active = null; this.joystick = { x: 0, y: 0 }; knob.style.transform = ''; };
    base.addEventListener('pointerdown', down); base.addEventListener('pointermove', move); base.addEventListener('pointerup', up); base.addEventListener('pointercancel', up); base.addEventListener('lostpointercapture', up);
    this.cleanup.push(() => { base.removeEventListener('pointerdown', down); base.removeEventListener('pointermove', move); base.removeEventListener('pointerup', up); base.removeEventListener('pointercancel', up); base.removeEventListener('lostpointercapture', up); });
  }
  direction(): { x: number; y: number } {
    return {
      x: Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft')) + this.joystick.x,
      y: Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) - Number(this.keys.has('KeyS') || this.keys.has('ArrowDown')) + this.joystick.y,
    };
  }
  clear(): void { this.keys.clear(); this.joystick = { x: 0, y: 0 }; }
  dispose(): void { this.cleanup.forEach(fn => fn()); }
}
