// TypeScript types for Hamming Code visualization

export type BitValue = 0 | 1;

export enum Step {
    INPUT = 'input',
    ENCODING = 'encoding',
    NOISE = 'noise',
    DECODING = 'decoding',
    CORRECTION = 'correction',
    OUTPUT = 'output',
}

export type ErrorType = 'none' | 'single' | 'double';

export interface Block {
    index: number;
    char: string;
    charIndex?: number;
    isHighNibble?: boolean;
    fullBinary?: string;
    dataBits: number[];
    encodedBits: number[];
    receivedBits: number[];
    errorPosition: number | null;
    errorPositions?: number[]; // For tracking multiple errors
    errorType?: ErrorType;
    canCorrect?: boolean;
    syndrome: number[];
    correctedBits: number[];
}

export interface HighlightState {
    row?: number;
    col?: number;
    cells?: [number, number][];
}

export interface AnimationState {
    isPlaying: boolean;
    speed: number; // milliseconds per step
    currentStep: Step;
    currentBlock: number;
    highlightMatrix?: HighlightState;
    highlightVector?: number;
}

export type Matrix = number[][];
export type Vector = number[];
