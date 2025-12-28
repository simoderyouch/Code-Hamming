// Test script to verify Hamming(7,4) matrices G and H
// G is 4×7, H is 7×3
// Run with: node test-matrices-corrected.js

// Simple mod2 function
function mod2(value) {
    return value % 2;
}

// Vector × Matrix multiplication (for encoding: d × G)
// vector is 1×m, matrix is m×n, result is 1×n
function vectorMatrixMultiply(vector, matrix) {
    const result = [];
    const numCols = matrix[0].length;

    for (let j = 0; j < numCols; j++) {
        let sum = 0;
        for (let i = 0; i < vector.length; i++) {
            sum += vector[i] * matrix[i][j];
        }
        result.push(mod2(sum));
    }
    return result;
}

// Generator Matrix G (4×7)
// Each row shows how one data bit contributes to the codeword
const G = [
    //  c1  c2  c3  c4  c5  c6  c7
    //  p1  p2  d1  p4  d2  d3  d4
    [1, 1, 1, 0, 0, 0, 0],  // d1 contributes to p1, p2, d1
    [1, 0, 0, 1, 1, 0, 0],  // d2 contributes to p1, p4, d2
    [0, 1, 0, 1, 0, 1, 0],  // d3 contributes to p2, p4, d3
    [1, 1, 0, 1, 0, 0, 1],  // d4 contributes to p1, p2, p4, d4
];

// Parity Check Matrix H (7×3)
// Each row is the binary representation of the bit position
const H = [
    //  s1  s2  s4
    [1, 0, 0],  // c1 (position 1 = 001)
    [0, 1, 0],  // c2 (position 2 = 010)
    [1, 1, 0],  // c3 (position 3 = 011)
    [0, 0, 1],  // c4 (position 4 = 100)
    [1, 0, 1],  // c5 (position 5 = 101)
    [0, 1, 1],  // c6 (position 6 = 110)
    [1, 1, 1],  // c7 (position 7 = 111)
];

console.log("=== Testing Hamming(7,4) Matrices (Corrected) ===");
console.log("G is 4×7, H is 7×3\n");

// Test 1: Encode data [1, 0, 1, 1]
console.log("Test 1: Encode data [1, 0, 1, 1]");
const data1 = [1, 0, 1, 1];
const codeword1 = vectorMatrixMultiply(data1, G);
console.log("  Data:     ", data1.join(" "));
console.log("  Codeword: ", codeword1.join(" "));

// Manual calculation:
// c1 (p1) = d1⊕d2⊕d4 = 1⊕0⊕1 = 0
// c2 (p2) = d1⊕d3⊕d4 = 1⊕1⊕1 = 1
// c3 (d1) = 1
// c4 (p4) = d2⊕d3⊕d4 = 0⊕1⊕1 = 0
// c5 (d2) = 0
// c6 (d3) = 1
// c7 (d4) = 1
console.log("  Expected:  [0, 1, 1, 0, 0, 1, 1]");
console.log();

// Test 2: Check syndrome of valid codeword (should be [0, 0, 0])
console.log("Test 2: Syndrome of valid codeword");
// For H × r, we use vector-matrix multiply: r × H
const syndrome1 = vectorMatrixMultiply(codeword1, H);
console.log("  Syndrome: ", syndrome1.join(" "));
console.log("  Expected:  [0, 0, 0] (no error)");
console.log();

// Test 3: Inject error at position 5 (index 4)
console.log("Test 3: Error at position 5");
const corrupted = [...codeword1];
corrupted[4] ^= 1; // Flip bit at position 5 (c5)
console.log("  Original: ", codeword1.join(" "));
console.log("  Corrupted:", corrupted.join(" "), "(bit 5 flipped)");
const syndrome2 = vectorMatrixMultiply(corrupted, H);
console.log("  Syndrome: ", syndrome2.join(" "));
const errorPos = syndrome2[0] * 1 + syndrome2[1] * 2 + syndrome2[2] * 4;
console.log("  Error position:", errorPos, "(expected: 5)");
console.log();

// Test 4: Encode [0, 1, 0, 0]
console.log("Test 4: Encode data [0, 1, 0, 0]");
const data2 = [0, 1, 0, 0];
const codeword2 = vectorMatrixMultiply(data2, G);
console.log("  Data:     ", data2.join(" "));
console.log("  Codeword: ", codeword2.join(" "));
// c1 (p1) = 0⊕1⊕0 = 1
// c2 (p2) = 0⊕0⊕0 = 0
// c3 (d1) = 0
// c4 (p4) = 1⊕0⊕0 = 1
// c5 (d2) = 1
// c6 (d3) = 0
// c7 (d4) = 0
console.log("  Expected:  [1, 0, 0, 1, 1, 0, 0]");
const syndrome3 = vectorMatrixMultiply(codeword2, H);
console.log("  Syndrome: ", syndrome3.join(" "), "(should be [0, 0, 0])");
console.log();

// Test 5: Encode [1, 1, 1, 1]
console.log("Test 5: Encode data [1, 1, 1, 1]");
const data3 = [1, 1, 1, 1];
const codeword3 = vectorMatrixMultiply(data3, G);
console.log("  Data:     ", data3.join(" "));
console.log("  Codeword: ", codeword3.join(" "));
// c1 (p1) = 1⊕1⊕1 = 1
// c2 (p2) = 1⊕1⊕1 = 1
// c3 (d1) = 1
// c4 (p4) = 1⊕1⊕1 = 1
// c5 (d2) = 1
// c6 (d3) = 1
// c7 (d4) = 1
console.log("  Expected:  [1, 1, 1, 1, 1, 1, 1]");
const syndrome4 = vectorMatrixMultiply(codeword3, H);
console.log("  Syndrome: ", syndrome4.join(" "), "(should be [0, 0, 0])");
console.log();

console.log("=== Matrix Dimensions ===");
console.log("G: 4 rows × 7 columns (4×7)");
console.log("H: 7 rows × 3 columns (7×3)");
console.log("Encoding: c = d × G (1×4 × 4×7 = 1×7)");
console.log("Syndrome: s = r × H (1×7 × 7×3 = 1×3)");
console.log();

console.log("=== All Tests Complete ===");
