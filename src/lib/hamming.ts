// Extended Hamming(8,4) SECDED Code Implementation
// Single Error Correction, Double Error Detection

import { BitValue, Vector, Matrix } from '@/types/hamming';
import { matrixMultiply, mod2 } from './matrix-utils';

/**
 * Generator Matrix G for Hamming(7,4)
 * 
 * Codeword positions: [c1, c2, c3, c4, c5, c6, c7]
 * - c1 = p1 (parity bit 1)
 * - c2 = p2 (parity bit 2)
 * - c3 = d1 (data bit 1)
 * - c4 = p4 (parity bit 4)
 * - c5 = d2 (data bit 2)
 * - c6 = d3 (data bit 3)
 * - c7 = d4 (data bit 4)
 * 
 * This is G^T (transposed) for c = G^T × d computation
 * Each column shows what data bits contribute to each codeword position
 */
export const GENERATOR_MATRIX: Matrix = [
    [1, 1, 0, 1],  // c1 = d1 ⊕ d2 ⊕ d4 (p1)
    [1, 0, 1, 1],  // c2 = d1 ⊕ d3 ⊕ d4 (p2)
    [1, 0, 0, 0],  // c3 = d1
    [0, 1, 1, 1],  // c4 = d2 ⊕ d3 ⊕ d4 (p4)
    [0, 1, 0, 0],  // c5 = d2
    [0, 0, 1, 0],  // c6 = d3
    [0, 0, 0, 1],  // c7 = d4
];

/**
 * Parity Check Matrix H for Hamming(7,4)
 * H × codeword = 0 (if no error)
 * H × receivedWord = syndrome (error position in binary)
 * 
 * Structure (each row checks specific positions):
 *     c1 c2 c3 c4 c5 c6 c7
 * s1 [ 1  0  1  0  1  0  1 ]  checks positions 1,3,5,7 (binary: xxx1)
 * s2 [ 0  1  1  0  0  1  1 ]  checks positions 2,3,6,7 (binary: xx1x)
 * s4 [ 0  0  0  1  1  1  1 ]  checks positions 4,5,6,7 (binary: x1xx)
 */
export const PARITY_CHECK_MATRIX: Matrix = [
    [1, 0, 1, 0, 1, 0, 1],  // s1: checks positions 1,3,5,7
    [0, 1, 1, 0, 0, 1, 1],  // s2: checks positions 2,3,6,7
    [0, 0, 0, 1, 1, 1, 1],  // s4: checks positions 4,5,6,7
];

/**
 * Extended Parity Check Matrix H for Extended Hamming(8,4) SECDED
 * Adds overall parity bit p0 at position 0
 *     p0 c1 c2 c3 c4 c5 c6 c7
 * s1 [ 0  1  0  1  0  1  0  1 ]  checks positions 1,3,5,7
 * s2 [ 0  0  1  1  0  0  1  1 ]  checks positions 2,3,6,7
 * s4 [ 0  0  0  0  1  1  1  1 ]  checks positions 4,5,6,7
 * p0 [ 1  1  1  1  1  1  1  1 ]  overall parity (all bits)
 */
export const EXTENDED_PARITY_CHECK_MATRIX: Matrix = [
    [0, 1, 0, 1, 0, 1, 0, 1],  // s1: checks positions 1,3,5,7
    [0, 0, 1, 1, 0, 0, 1, 1],  // s2: checks positions 2,3,6,7
    [0, 0, 0, 0, 1, 1, 1, 1],  // s4: checks positions 4,5,6,7
    [1, 1, 1, 1, 1, 1, 1, 1],  // p0: overall parity
];

/**
 * Extended Generator Matrix G for Extended Hamming(8,4) SECDED
 * Produces 8-bit codeword: [p0, p1, p2, d1, p4, d2, d3, d4]
 * This is used for visualization purposes
 */
export const EXTENDED_GENERATOR_MATRIX: Matrix = [
    [1, 1, 0, 1],  // p0 = overall parity (will be recalculated)
    [1, 1, 0, 1],  // p1 = d1 ⊕ d2 ⊕ d4
    [1, 0, 1, 1],  // p2 = d1 ⊕ d3 ⊕ d4
    [1, 0, 0, 0],  // d1
    [0, 1, 1, 1],  // p4 = d2 ⊕ d3 ⊕ d4
    [0, 1, 0, 0],  // d2
    [0, 0, 1, 0],  // d3
    [0, 0, 0, 1],  // d4
];

/**
 * Encode 4 data bits into 7-bit Hamming codeword
 * @param dataBits - Array of 4 bits [d1, d2, d3, d4]
 * @returns Array of 7 bits [c1, c2, c3, c4, c5, c6, c7]
 * where c1=p1, c2=p2, c3=d1, c4=p4, c5=d2, c6=d3, c7=d4
 */
export function encode(dataBits: number[]): number[] {
    if (dataBits.length !== 4) {
        throw new Error('Data must be exactly 4 bits');
    }

    // c = G^T × d (using the transposed generator matrix)
    return matrixMultiply(GENERATOR_MATRIX, dataBits);
}

/**
 * Encode 4 data bits into 8-bit Extended Hamming codeword (SECDED)
 * @param dataBits - Array of 4 bits [d1, d2, d3, d4]
 * @returns Array of 8 bits [p0, c1, c2, c3, c4, c5, c6, c7]
 * where p0=overall parity, c1=p1, c2=p2, c3=d1, c4=p4, c5=d2, c6=d3, c7=d4
 */
export function encodeExtended(dataBits: number[]): number[] {
    if (dataBits.length !== 4) {
        throw new Error('Data must be exactly 4 bits');
    }

    // First get the standard Hamming(7,4) codeword
    const hamming7 = matrixMultiply(GENERATOR_MATRIX, dataBits);
    
    // Calculate overall parity (XOR of all 7 bits)
    const p0 = mod2(hamming7.reduce((a, b) => a + b, 0));
    
    // Return [p0, c1, c2, c3, c4, c5, c6, c7]
    return [p0, ...hamming7];
}

/**
 * Calculate syndrome from received codeword (standard Hamming)
 * @param receivedBits - Array of 7 bits (potentially corrupted)
 * @returns Syndrome vector [s1, s2, s4] (3 bits)
 */
export function calculateSyndrome(receivedBits: number[]): number[] {
    if (receivedBits.length !== 7) {
        throw new Error('Received bits must be exactly 7 bits');
    }

    return matrixMultiply(PARITY_CHECK_MATRIX, receivedBits);
}

/**
 * Calculate syndrome from received Extended Hamming codeword
 * @param receivedBits - Array of 8 bits (potentially corrupted)
 * @returns Syndrome vector [s1, s2, s4, p0] (4 bits)
 */
export function calculateExtendedSyndrome(receivedBits: number[]): number[] {
    if (receivedBits.length !== 8) {
        throw new Error('Received bits must be exactly 8 bits');
    }

    return matrixMultiply(EXTENDED_PARITY_CHECK_MATRIX, receivedBits);
}

/**
 * Find error position from syndrome (standard Hamming)
 * @param syndrome - 3-bit syndrome vector [s1, s2, s4]
 * @returns Error position (1-7), or 0 if no error
 */
export function findErrorPosition(syndrome: number[]): number {
    if (syndrome.length !== 3) {
        throw new Error('Syndrome must be exactly 3 bits');
    }

    // Syndrome is [s1, s2, s4] where s1 is LSB, s4 is MSB
    // Error position = s1*1 + s2*2 + s4*4
    const [s1, s2, s4] = syndrome;
    return s1 * 1 + s2 * 2 + s4 * 4;
}

/**
 * Error detection result for Extended Hamming
 */
export interface ExtendedErrorResult {
    errorType: 'none' | 'single' | 'double';
    errorPosition: number; // 0-7 for Extended (0 = p0 bit), 0 if no single error
    canCorrect: boolean;
}

/**
 * Analyze error from Extended Hamming syndrome
 * @param syndrome - 4-bit syndrome vector [s1, s2, s4, p0]
 * @returns Error analysis result
 */
export function analyzeExtendedError(syndrome: number[]): ExtendedErrorResult {
    if (syndrome.length !== 4) {
        throw new Error('Extended syndrome must be exactly 4 bits');
    }

    const [s1, s2, s4, p0] = syndrome;
    const syndromeValue = s1 * 1 + s2 * 2 + s4 * 4; // Position from syndrome bits
    
    // Decision table for SECDED:
    // p0=0, syndrome=0: No error
    // p0=1, syndrome=0: Error in p0 bit (position 0)
    // p0=1, syndrome≠0: Single bit error (correctable)
    // p0=0, syndrome≠0: Double bit error (detectable but not correctable)
    
    if (p0 === 0 && syndromeValue === 0) {
        return { errorType: 'none', errorPosition: 0, canCorrect: true };
    } else if (p0 === 1 && syndromeValue === 0) {
        return { errorType: 'single', errorPosition: 0, canCorrect: true }; // Error in p0
    } else if (p0 === 1 && syndromeValue !== 0) {
        return { errorType: 'single', errorPosition: syndromeValue, canCorrect: true };
    } else {
        // p0 === 0 && syndromeValue !== 0
        return { errorType: 'double', errorPosition: 0, canCorrect: false };
    }
}

/**
 * Correct a single-bit error in the received codeword (standard Hamming)
 * @param receivedBits - 7-bit received codeword
 * @param errorPosition - Position of error (1-7), 0 means no error
 * @returns Corrected 7-bit codeword
 */
export function correctError(receivedBits: number[], errorPosition: number): number[] {
    if (errorPosition === 0) {
        return [...receivedBits]; // No error
    }

    const corrected = [...receivedBits];
    // Flip the bit at error position (convert 1-indexed to 0-indexed)
    corrected[errorPosition - 1] ^= 1;

    return corrected;
}

/**
 * Correct a single-bit error in the received Extended Hamming codeword
 * @param receivedBits - 8-bit received codeword
 * @param errorPosition - Position of error (0-7), -1 means no error or uncorrectable
 * @returns Corrected 8-bit codeword
 */
export function correctExtendedError(receivedBits: number[], errorPosition: number): number[] {
    if (errorPosition < 0) {
        return [...receivedBits]; // No error or uncorrectable
    }

    const corrected = [...receivedBits];
    // Flip the bit at error position (0-indexed in extended)
    corrected[errorPosition] ^= 1;

    return corrected;
}

/**
 * Extract data bits from codeword (standard Hamming)
 * Positions 3, 5, 6, 7 contain the data (0-indexed: 2, 4, 5, 6)
 * @param codeword - 7-bit codeword
 * @returns 4 data bits
 */
export function extractData(codeword: number[]): number[] {
    if (codeword.length !== 7) {
        throw new Error('Codeword must be exactly 7 bits');
    }

    // Extract data from positions: c1=p1, c2=p2, c3=d1, c4=p4, c5=d2, c6=d3, c7=d4
    // So data is at indices: 2, 4, 5, 6
    return [codeword[2], codeword[4], codeword[5], codeword[6]];
}

/**
 * Extract data bits from Extended Hamming codeword
 * @param codeword - 8-bit codeword [p0, c1, c2, c3, c4, c5, c6, c7]
 * @returns 4 data bits
 */
export function extractExtendedData(codeword: number[]): number[] {
    if (codeword.length !== 8) {
        throw new Error('Extended codeword must be exactly 8 bits');
    }

    // Skip p0, then extract from standard positions (shifted by 1)
    // Data is at indices: 3, 5, 6, 7 (c3=d1, c5=d2, c6=d3, c7=d4)
    return [codeword[3], codeword[5], codeword[6], codeword[7]];
}

/**
 * Inject a random single-bit error into codeword
 * @param codeword - 7-bit codeword
 * @returns Object with corrupted codeword and error position
 */
export function injectError(codeword: number[]): { corrupted: number[], position: number } {
    const position = Math.floor(Math.random() * 7) + 1; // 1-7
    const corrupted = [...codeword];
    corrupted[position - 1] ^= 1; // Flip the bit

    return { corrupted, position };
}

/**
 * Inject error(s) into Extended Hamming codeword
 * @param codeword - 8-bit codeword
 * @param numErrors - Number of errors to inject (1 or 2)
 * @returns Object with corrupted codeword and error positions
 */
export function injectExtendedError(codeword: number[], numErrors: number = 1): { 
    corrupted: number[], 
    positions: number[] 
} {
    const corrupted = [...codeword];
    const positions: number[] = [];
    
    // Get random positions
    const availablePositions = [0, 1, 2, 3, 4, 5, 6, 7];
    
    for (let i = 0; i < numErrors && availablePositions.length > 0; i++) {
        const idx = Math.floor(Math.random() * availablePositions.length);
        const position = availablePositions.splice(idx, 1)[0];
        positions.push(position);
        corrupted[position] ^= 1; // Flip the bit
    }

    return { corrupted, positions };
}

/**
 * Get bit type for visualization (standard Hamming)
 * @param position - 1-indexed position (1-7)
 * @returns 'parity' or 'data'
 */
export function getBitType(position: number): 'parity' | 'data' {
    // Positions 1, 2, 4 are parity bits (powers of 2)
    return [1, 2, 4].includes(position) ? 'parity' : 'data';
}

/**
 * Get bit type for Extended Hamming visualization
 * @param position - 0-indexed position (0-7)
 * @returns 'overall-parity' | 'parity' | 'data'
 */
export function getExtendedBitType(position: number): 'overall-parity' | 'parity' | 'data' {
    if (position === 0) return 'overall-parity';
    // Positions 1, 2, 4 are parity bits (powers of 2)
    return [1, 2, 4].includes(position) ? 'parity' : 'data';
}
