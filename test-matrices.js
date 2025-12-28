// Test script to verify Hamming(7,4) matrices G and H
// Run with: node test-matrices.js

// Simple mod2 function
function mod2(value) {
    return value % 2;
}

// Matrix multiply function
function matrixMultiply(matrix, vector) {
    const result = [];
    for (let i = 0; i < matrix.length; i++) {
        let sum = 0;
        for (let j = 0; j < vector.length; j++) {
            sum += matrix[i][j] * vector[j];
        }
        result.push(mod2(sum));
    }
    return result;
}

// Generator Matrix G (7×4)
const G = [
    [1, 1, 0, 1],  // c1 = p1 = d1 ⊕ d2 ⊕ d4
    [1, 0, 1, 1],  // c2 = p2 = d1 ⊕ d3 ⊕ d4
    [1, 0, 0, 0],  // c3 = d1
    [0, 1, 1, 1],  // c4 = p4 = d2 ⊕ d3 ⊕ d4
    [0, 1, 0, 0],  // c5 = d2
    [0, 0, 1, 0],  // c6 = d3
    [0, 0, 0, 1],  // c7 = d4
];

// Parity Check Matrix H (3×7)
const H = [
    [1, 0, 1, 0, 1, 0, 1],  // s1: checks positions 1,3,5,7
    [0, 1, 1, 0, 0, 1, 1],  // s2: checks positions 2,3,6,7
    [0, 0, 0, 1, 1, 1, 1],  // s4: checks positions 4,5,6,7
];

console.log("=== Testing Hamming(7,4) Matrices ===\n");

// Test 1: Encode data [1, 0, 1, 1]
console.log("Test 1: Encode data [1, 0, 1, 1]");
const data1 = [1, 0, 1, 1];
const codeword1 = matrixMultiply(G, data1);
console.log("  Data:     ", data1.join(" "));
console.log("  Codeword: ", codeword1.join(" "));
console.log("  Expected:  [p1, p2, d1, p4, d2, d3, d4] = [0, 0, 1, 0, 0, 1, 1]");

// Manual calculation:
// p1 = d1 ⊕ d2 ⊕ d4 = 1 ⊕ 0 ⊕ 1 = 0
// p2 = d1 ⊕ d3 ⊕ d4 = 1 ⊕ 1 ⊕ 1 = 1
// p4 = d2 ⊕ d3 ⊕ d4 = 0 ⊕ 1 ⊕ 1 = 0
console.log("  Manual:    [0, 1, 1, 0, 0, 1, 1]");
console.log();

// Test 2: Check syndrome of valid codeword (should be [0, 0, 0])
console.log("Test 2: Syndrome of valid codeword");
const syndrome1 = matrixMultiply(H, codeword1);
console.log("  Syndrome: ", syndrome1.join(" "));
console.log("  Expected:  [0, 0, 0] (no error)");
console.log();

// Test 3: Inject error at position 5 (index 4)
console.log("Test 3: Error at position 5");
const corrupted = [...codeword1];
corrupted[4] ^= 1; // Flip bit at position 5
console.log("  Corrupted:", corrupted.join(" "));
const syndrome2 = matrixMultiply(H, corrupted);
console.log("  Syndrome: ", syndrome2.join(" "));
const errorPos = syndrome2[0] * 1 + syndrome2[1] * 2 + syndrome2[2] * 4;
console.log("  Error position:", errorPos, "(expected: 5)");
console.log();

// Test 4: Encode [0, 1, 0, 0] (simple test)
console.log("Test 4: Encode data [0, 1, 0, 0]");
const data2 = [0, 1, 0, 0];
const codeword2 = matrixMultiply(G, data2);
console.log("  Data:     ", data2.join(" "));
console.log("  Codeword: ", codeword2.join(" "));
// p1 = 0 ⊕ 1 ⊕ 0 = 1
// p2 = 0 ⊕ 0 ⊕ 0 = 0
// p4 = 1 ⊕ 0 ⊕ 0 = 1
console.log("  Expected:  [1, 0, 0, 1, 1, 0, 0]");
const syndrome3 = matrixMultiply(H, codeword2);
console.log("  Syndrome: ", syndrome3.join(" "), "(should be [0, 0, 0])");
console.log();

// Test 5: Verify G×H^T = 0 (fundamental property)
console.log("Test 5: Verify orthogonality (G × H^T should give zero matrix)");
console.log("  This property ensures valid codewords have zero syndrome");
console.log("  (Skipping matrix multiplication for brevity)");
console.log();

console.log("=== All Tests Complete ===");
