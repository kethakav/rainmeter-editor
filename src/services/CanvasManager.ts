// src/services/CanvasManager.ts
import { Canvas, FabricText } from 'fabric';

class CanvasManager {
  private static instance: CanvasManager | null = null;
  public canvas: Canvas | null = null;

  private constructor() {}

  public static getInstance(): CanvasManager {
    if (!CanvasManager.instance) {
      CanvasManager.instance = new CanvasManager();
    }
    return CanvasManager.instance;
  }

  public setCanvas(canvas: Canvas) {
    this.canvas = canvas;
  }

  public getCanvas() {
    return this.canvas;
  }

  public addText(text: string, x: number, y: number) {
    if (this.canvas) {
      const newText = new FabricText(text, {
        left: x,
        top: y,
      });
      this.canvas.add(newText);
      this.canvas.renderAll();
    }
  }
}

export const canvasManager = CanvasManager.getInstance();
