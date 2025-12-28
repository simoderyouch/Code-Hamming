'use client';

import { motion } from 'framer-motion';
import { MatrixDisplay } from './MatrixDisplay';
import { VectorDisplay } from './VectorDisplay';
import { EXTENDED_GENERATOR_MATRIX, GENERATOR_MATRIX, getExtendedBitType, getBitType } from '@/lib/hamming';
import { HighlightState } from '@/types/hamming';

interface EncodingPhaseProps {
    dataBits: number[];
    encodedBits: number[];
    highlight?: HighlightState;
    showResult?: boolean;
    extended?: boolean;
}

export function EncodingPhase({
    dataBits,
    encodedBits,
    highlight,
    showResult = false,
    extended = true,
}: EncodingPhaseProps) {
    return (
        <div className="w-full space-y-8">
            {/* Title */}
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-cyber-cyan">
                    Encoding Phase {extended ? '- Extended Hamming(8,4)' : '- Hamming(7,4)'}
                </h2>
                <p className="text-cyber-cyan/60 text-sm">
                    Multiply data vector <span className="font-mono text-cyber-green">d</span> by {extended ? 'Extended ' : ''}Generator Matrix{' '}
                    <span className="font-mono text-cyber-amber">G</span> to create {extended ? '8' : '7'}-bit codeword{' '}
                    <span className="font-mono text-cyber-cyan">c</span>
                </p>
            </div>

            {/* Equation Visualization */}
            <div className="flex items-center justify-center gap-6 flex-wrap">
                {/* Data Vector */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <VectorDisplay
                        bits={dataBits}
                        label="Data Vector (d)"
                        highlightIndex={highlight?.row}
                        showLabels={true}
                    />
                </motion.div>

                {/* Multiplication Symbol */}
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="text-3xl text-cyber-cyan/60 font-bold"
                >
                    ×
                </motion.div>

                {/* Generator Matrix */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                >
                    <MatrixDisplay
                        matrix={extended ? EXTENDED_GENERATOR_MATRIX : GENERATOR_MATRIX}
                        label={extended ? "Extended Generator Matrix (G)" : "Generator Matrix (G)"}
                        highlight={highlight}
                    />
                </motion.div>

                {/* Equals Symbol */}
                {showResult && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.8, duration: 0.3 }}
                            className="text-3xl text-cyber-cyan/60 font-bold"
                        >
                            =
                        </motion.div>

                        {/* Result Codeword */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1, duration: 0.5 }}
                        >
                            <VectorDisplay
                                bits={encodedBits}
                                label={extended ? "8-bit Codeword (c)" : "7-bit Codeword (c)"}
                                showLabels={true}
                                extended={extended}
                            />
                        </motion.div>
                    </>
                )}
            </div>

            {/* Codeword Breakdown */}
            {false && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3, duration: 0.5 }}
                    className="bg-cyber-surface border border-cyber-border rounded-xl p-6 max-w-3xl mx-auto"
                >
                    <h3 className="text-lg font-bold text-cyber-cyan mb-4 text-center">
                        {extended ? 'Extended Codeword Structure' : 'Codeword Structure'}
                    </h3>
                    <div className="flex justify-center gap-2 flex-wrap">
                        {encodedBits.map((bit, idx) => {
                            const bitType = extended ? getExtendedBitType(idx) : getBitType(idx);
                            const isOverallParity = bitType === 'overall-parity';
                            const isParity = bitType === 'parity';

                            // Position labels for standard Hamming(7,4)
                            const standardLabels = ['p1', 'p2', 'd1', 'p4', 'd2', 'd3', 'd4'];
                            const extendedLabels = ['p0', 'p1', 'p2', 'd1', 'p4', 'd2', 'd3', 'd4'];
                            const labels = extended ? extendedLabels : standardLabels;

                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 1.4 + idx * 0.1, duration: 0.3 }}
                                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 ${isOverallParity
                                            ? 'bg-cyber-purple/20 border-cyber-purple'
                                            : isParity
                                                ? 'bg-cyber-amber/20 border-cyber-amber'
                                                : 'bg-cyber-green/20 border-cyber-green'
                                        }`}
                                >
                                    <span className={`text-xs font-mono ${isOverallParity ? 'text-cyber-purple' : isParity ? 'text-cyber-amber' : 'text-cyber-green'
                                        }`}>
                                        {labels[idx]}
                                    </span>
                                    <span className={`text-2xl font-bold font-mono ${isOverallParity ? 'text-cyber-purple' : isParity ? 'text-cyber-amber' : 'text-cyber-green'
                                        }`}>
                                        {bit}
                                    </span>
                                    <span className={`text-xs ${isOverallParity ? 'text-cyber-purple/70' : isParity ? 'text-cyber-amber/70' : 'text-cyber-green/70'
                                        }`}>
                                        {isOverallParity ? 'Overall' : isParity ? 'Parity' : 'Data'}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                    <div className="flex justify-center gap-4 mt-4 text-sm flex-wrap">
                        {extended && (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-cyber-purple/30 border border-cyber-purple"></div>
                                <span className="text-cyber-purple">Overall Parity (p0)</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-cyber-amber/30 border border-cyber-amber"></div>
                            <span className="text-cyber-amber">
                                {extended ? 'Parity Bits (p1, p2, p4)' : 'Parity Bits (p1, p2, p4)'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-cyber-green/30 border border-cyber-green"></div>
                            <span className="text-cyber-green">Data Bits (d1-d4)</span>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Explanation */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
                className="bg-cyber-surface/50 border border-cyber-border rounded-lg p-4 max-w-2xl mx-auto"
            >
                <p className="text-sm text-cyber-cyan/80 text-center">
                    {extended ? (
                        <>
                            <span className="font-mono text-cyber-purple">Position 0 (p0)</span> is the overall parity for SECDED.{' '}
                            <span className="font-mono text-cyber-amber">Positions 1, 2, 4</span> are Hamming parity bits.{' '}
                            <span className="font-mono text-cyber-green">Positions 3, 5, 6, 7</span> contain data bits.
                            This enables single error correction and double error detection.
                        </>
                    ) : (
                        <>
                            <span className="font-mono text-cyber-amber">Positions 1, 2, 4</span> are parity bits (powers of 2).{' '}
                            <span className="font-mono text-cyber-green">Positions 3, 5, 6, 7</span> contain data bits.
                            This Hamming(7,4) code can detect and correct single-bit errors.
                        </>
                    )}
                </p>
            </motion.div>
        </div>
    );
}
