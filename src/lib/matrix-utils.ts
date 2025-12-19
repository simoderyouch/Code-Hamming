// Matrix utility functions for Hamming Code

import { Matrix, Vector, BitValue } from '@/types/hamming';

/**
 * Perform modulo-2 arithmetic (XOR)
 */
export function mod2(value: number): BitValue {
    return (value % 2) as BitValue;
}

/**
 * Multiply a matrix by a vector using mod-2 arithmetic
 * @param matrix - m x n matrix
 * @param vector - n-element vector
 * @returns m-element result vector
 */
export function matrixMultiply(matrix: Matrix, vector: Vector): Vector {
    const result: Vector = [];

    for (let i = 0; i < matrix.length; i++) {
        let sum = 0;
        for (let j = 0; j < vector.length; j++) {
            sum += matrix[i][j] * vector[j];
        }
        result.push(mod2(sum));
    }

    return result;
}

/**
 * Convert binary array to decimal number
 */
export function binaryToDecimal(bits: number[]): number {
    return bits.reduce((acc, bit, idx) => acc + bit * Math.pow(2, bits.length - 1 - idx), 0);
}

/**
 * Convert decimal to binary array of specified length
 */
export function decimalToBinary(num: number, length: number): number[] {
    return num.toString(2).padStart(length, '0').split('').map(Number);
}

/**
 * Convert text to array of 4-bit chunks (nibbles)
 * Each character is split into high nibble and low nibble
 * Example: 'H' (01001000) → [0100, 1000]
 */
export function textToBinaryChunks(text: string): number[][] {
    const chunks: number[][] = [];

    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        const binary = charCode.toString(2).padStart(8, '0');
        // Extract high nibble (upper 4 bits)
        const highNibble = binary.substring(0, 4).split('').map(Number);
        // Extract low nibble (lower 4 bits)
        const lowNibble = binary.substring(4, 8).split('').map(Number);
        chunks.push(highNibble);
        chunks.push(lowNibble);
    }

    return chunks;
}

/**
 * Get the full 8-bit binary representation of a character
 */
export function charToBinary(char: string): string {
    return char.charCodeAt(0).toString(2).padStart(8, '0');
}

/**
 * Convert two nibbles back to a character
 */
export function nibblesToChar(highNibble: number[], lowNibble: number[]): string {
    const high = binaryToDecimal(highNibble);
    const low = binaryToDecimal(lowNibble);
    const charCode = (high << 4) | low;
    return String.fromCharCode(charCode);
}

/**
 * Convert 4-bit data back to character
 */
export function nibbleToChar(nibble: number[]): string {
    const decimal = binaryToDecimal(nibble);
    return decimal.toString(16).toUpperCase();
}

/**
 * Transpose a matrix
 */
export function transpose(matrix: Matrix): Matrix {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}
