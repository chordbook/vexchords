/*
 * Vex Chords v2
 * Mohit Muthanna Cheppudira -- http://0xfe.blogspot.com
 */

import { SVG } from '@svgdotjs/svg.js';
import type { Svg } from '@svgdotjs/svg.js';

const defaults = {
  numStrings: 6,
  numFrets: 5,
  x: 0,
  y: 0,
  width: 100,
  height: 120,
  strokeWidth: 1,
  showTuning: true,
  defaultColor: '#666',
  bgColor: '#fff',
  labelColor: '#fff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
  fontStyle: 'light',
  fontWeight: '100',
  labelWeight: '100',
}

export type ChordBoxParams = typeof defaults & {
  fontSize?: number,
  circleRadius?: number,
  bridgeColor: string,
  stringColor: string,
  fretColor: string,
  strokeColor: string,
  textColor: string,
  stringWidth: number,
  fretWidth: number,
};

type Fret = number | 'x'
export type Chord = [number, Fret, string?][]

export type Barre = {
  fromString: number,
  toString: number,
  fret: number,
}

type Tuning = string[]

// ChordBox implements the rendering logic for the chord
// diagrams.
class ChordBox {
  sel: HTMLElement | string
  params: ChordBoxParams
  canvas: Svg
  width: number
  height: number
  numStrings: number
  numFrets: number
  spacing: number
  fretSpacing: number
  metrics: {
    circleRadius: number,
    barreRadius: number,
    fontSize: number,
    barShiftX: number,
    bridgeStrokeWidth: number,
  }
  position: number
  positionText: number
  chord: Chord
  tuning: Tuning
  barres: Barre[]
  x: number
  y: number

  // sel can be a selector or an element.
  constructor(sel: HTMLElement | string, params: Partial<ChordBoxParams>) {
    this.sel = sel;

    const defaultColor = params.defaultColor ?? defaults.defaultColor;
    const strokeWidth = params.strokeWidth ?? defaults.strokeWidth;

    this.params = {
      ...defaults,

      // Setup defaults if not specifically overridden
      bridgeColor: defaultColor,
      stringColor: defaultColor,
      fretColor: defaultColor,
      strokeColor: defaultColor,
      textColor: defaultColor,
      stringWidth: strokeWidth,
      fretWidth: strokeWidth,

      ...params
    };


    // Create canvas and add it to the DOM
    this.canvas = SVG()
      .addTo(sel)
      .size(this.params.width, this.params.height);

    // Size and shift board
    this.width = this.params.width * 0.75;
    this.height = this.params.height * 0.75;

    // Initialize scaled-spacing
    this.numStrings = this.params.numStrings;
    this.numFrets = this.params.numFrets;
    this.spacing = this.width / this.numStrings;
    this.fretSpacing = this.height / (this.numFrets + 2);

    // Add room on sides for finger positions on 1. and 6. string
    this.x = this.params.x + this.params.width * 0.15 + this.spacing / 2;
    this.y = this.params.y + this.params.height * 0.15 + this.fretSpacing;

    this.metrics = {
      circleRadius: this.width / 20,
      barreRadius: this.width / 25,
      fontSize: this.params.fontSize || Math.ceil(this.width / 8),
      barShiftX: this.width / 28,
      bridgeStrokeWidth: Math.ceil(this.height / 36),
    };

    // Content
    this.position = 0;
    this.positionText = 0;
    this.chord = [];
    this.barres = [];
    this.tuning = ['E', 'A', 'D', 'G', 'B', 'E'];
  }

  drawText(x: number, y: number, msg: string, attrs: object = {}) {
    const textAttrs = {
      family: this.params.fontFamily,
      size: this.metrics.fontSize,
      style: this.params.fontStyle,
      weight: this.params.fontWeight,
      ...attrs
    };

    const text = this.canvas
      .text(`${msg}`)
      .stroke(this.params.textColor!)
      .fill(this.params.textColor!)
      .font(textAttrs);

    return text.center(x, y);
  }

  drawLine(x: number, y: number, newX: number, newY: number) {
    return this.canvas.line(0, 0, newX - x, newY - y).move(x, y);
  }

  draw({ chord, position, barres, positionText, tuning }: { chord: Chord, position?: number, barres?: Barre[], positionText?: number, tuning?: Tuning }) {
    this.chord = chord;
    this.position = position ?? 0;
    this.positionText = positionText ?? 0;
    this.barres = barres ?? [];
    this.tuning = tuning ?? ['E', 'A', 'D', 'G', 'B', 'E'];
    if (this.tuning.length === 0) {
      this.fretSpacing = this.height / (this.numFrets + 1);
    }

    const { spacing } = this;
    const { fretSpacing } = this;

    // Draw guitar bridge
    if (this.position <= 1) {
      const fromX = this.x - (this.params.strokeWidth / 2);
      const fromY = this.y - this.metrics.bridgeStrokeWidth;
      this.canvas
        .rect(this.x + spacing * (this.numStrings - 1) - fromX + (this.params.strokeWidth / 2), this.y - fromY)
        .move(fromX, fromY)
        .stroke({ width: 0 })
        .fill(this.params.bridgeColor!);
    } else {
      // Draw position number
      this.drawText(this.x - this.spacing / 3 - this.metrics.fontSize / 2, this.y + this.fretSpacing * this.positionText + this.fretSpacing / 2, this.position.toString());
    }

    // Draw strings
    for (let i = 0; i < this.numStrings; i += 1) {
      this.drawLine(this.x + spacing * i, this.y, this.x + spacing * i, this.y + fretSpacing * this.numFrets).stroke({
        width: this.params.stringWidth!,
        color: this.params.stringColor!,
      });
    }

    // Draw frets
    for (let i = 0; i < this.numFrets + 1; i += 1) {
      this.drawLine(this.x, this.y + fretSpacing * i, this.x + spacing * (this.numStrings - 1), this.y + fretSpacing * i).stroke({
        width: this.params.fretWidth!,
        color: this.params.fretColor!,
      });
    }

    // Draw tuning keys
    if (this.params.showTuning && this.tuning.length !== 0) {
      for (let i = 0; i < Math.min(this.numStrings, this.tuning.length); i += 1) {
        this.drawText(this.x + this.spacing * i, this.y + this.numFrets * this.fretSpacing + this.metrics.fontSize * .66, this.tuning[i]);
      }
    }

    // Draw chord
    for (let i = 0; i < this.chord.length; i += 1) {
      // Light up string, fret, and optional label.
      this.lightUp({
        string: this.chord[i][0],
        fret: this.chord[i][1],
        label: this.chord.length > 2 ? this.chord[i][2] : undefined,
      });
    }

    // Draw barres
    for (let i = 0; i < this.barres.length; i += 1) {
      this.lightBar(this.barres[i]);
    }
  }

  lightUp({ string, fret, label }: { string: number, fret: Fret, label?: string }) {
    const stringNum = this.numStrings - string;
    const shiftPosition = this.position === 1 && this.positionText === 1 ? this.positionText : 0;

    const mute = fret === 'x';
    const fretNum = fret === 'x' ? 0 : fret - shiftPosition;

    const x = this.x + this.spacing * stringNum;
    let y = this.y + this.fretSpacing * fretNum;

    if (fretNum === 0) {
      y -= this.metrics.bridgeStrokeWidth;
    }

    if (!mute) {
      this.canvas
        .circle()
        .move(x, y - this.fretSpacing / 2)
        .radius(this.params.circleRadius || this.metrics.circleRadius)
        .stroke({ color: this.params.strokeColor, width: this.params.strokeWidth })
        .fill(fretNum > 0 ? this.params.strokeColor! : this.params.bgColor);
    } else {
      const origin = {
        x: x,
        y: y - this.fretSpacing / 2,
      }
      const yOffset = this.params.circleRadius || this.metrics.circleRadius;
      const xOffset = yOffset * 0.8;

      this.canvas.line(origin.x - xOffset, origin.y - yOffset, x + xOffset, origin.y + yOffset).stroke({
        width: this.params.strokeWidth,
        color: this.params.strokeColor,
      })
      this.canvas.line(x + xOffset, origin.y - yOffset, x - xOffset, origin.y + yOffset).stroke({
        width: this.params.strokeWidth,
        color: this.params.strokeColor,
      })
    }

    if (label) {
      const fontSize = this.metrics.fontSize * 0.55;
      this.drawText(x, y - this.fretSpacing / 2, label, {
        weight: this.params.labelWeight,
        size: fontSize,
      })
        .stroke({
          width: 0.7,
          color: fretNum !== 0 ? this.params.labelColor : this.params.strokeColor,
        })
        .fill(fretNum !== 0 ? this.params.labelColor! : this.params.strokeColor!);
    }

    return this;
  }

  lightBar({ fromString, toString, fret }: Barre) {
    let fretNum = fret;
    if (this.position === 1 && this.positionText === 1) {
      fretNum -= this.positionText;
    }

    const fromStringNum = this.numStrings - fromString;
    const toStringNum = this.numStrings - toString;

    const x = this.x + this.spacing * fromStringNum - this.metrics.barShiftX;
    const xTo = this.x + this.spacing * toStringNum + this.metrics.barShiftX;

    const y = this.y + this.fretSpacing * (fretNum - 1) + this.fretSpacing / 4;
    const yTo = this.y + this.fretSpacing * (fretNum - 1) + (this.fretSpacing / 4) * 3;

    this.canvas
      .rect(xTo - x, yTo - y)
      .move(x, y)
      .radius(this.metrics.barreRadius)
      .fill(this.params.strokeColor!);

    return this;
  }
}

export default ChordBox;
