'use client';

import { motion } from 'framer-motion';
import { MatrixDisplay } from './MatrixDisplay';
import { VectorDisplay } from './VectorDisplay';
import { EXTENDED_PARITY_CHECK_MATRIX, PARITY_CHECK_MATRIX } from '@/lib/hamming';
import { HighlightState, ErrorType } from '@/types/hamming';
import { AlertCircle, CheckCircle, ArrowRight, AlertTriangle } from 'lucide-react';

interface DecodingPhaseProps {
    receivedBits: number[];
    syndrome: number[];
    errorPosition: number;
    errorType?: ErrorType;
    canCorrect?: boolean;
    correctedBits?: number[];
    highlight?: HighlightState;
    showSyndrome?: boolean;
    showErrorPosition?: boolean;
    showCorrection?: boolean;
    extended?: boolean;
}

export function DecodingPhase({
    receivedBits,
    syndrome,
    errorPosition,
    errorType = 'none',
    canCorrect = true,
    correctedBits,
    highlight,
    showSyndrome = false,
    showErrorPosition = false,
    showCorrection = false,
    extended = true,
}: DecodingPhaseProps) {
    const hasError = errorType !== 'none';
    const isSingleError = errorType === 'single';
    const isDoubleError = errorType === 'double';

    // For Extended Hamming syndrome: [s1, s2, s4, p0], for Normal: [s1, s2, s4]
    const syndromeLabels = extended ? ['s1', 's2', 's4', 'p0'] : ['s1', 's2', 's4'];
    const parityBits = extended ? syndrome.slice(0, 3) : syndrome;
    const overallParity = extended ? syndrome[3] : null;
    const syndromeValue = parityBits[0] * 1 + parityBits[1] * 2 + parityBits[2] * 4;

    return (
        <div className="w-full space-y-8">
            {/* Title */}
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-cyber-cyan">
                    Decoding Phase {extended ? '- Extended Hamming' : '- Hamming(7,4)'}
                </h2>
                <p className="text-cyber-cyan/60 text-sm">
                    {extended ? (
                        <>Calculate 4-bit syndrome <span className="font-mono text-cyber-purple">[s₁, s₂, s₄, p₀]</span> for SECDED error detection</>
                    ) : (
                        <>Calculate 3-bit syndrome <span className="font-mono text-cyber-purple">[s₁, s₂, s₄]</span> for error detection</>
                    )}
                </p>
            </div>

            {/* Equation Visualization */}
            <motion.div
                className="flex items-center justify-center gap-6 flex-wrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Received Vector */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                >
                    <VectorDisplay
                        bits={receivedBits}
                        label="Received Vector (r)"
                        highlightIndex={highlight?.col}
                        errorIndex={isSingleError && errorPosition > 0 ? (extended ? errorPosition : errorPosition - 1) : undefined}
                        showLabels={true}
                        extended={extended}
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
                {/* Parity Check Matrix */}

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <MatrixDisplay
                        matrix={extended ? EXTENDED_PARITY_CHECK_MATRIX : PARITY_CHECK_MATRIX}
                        label={extended ? "Extended Parity Check Matrix (H)" : "Parity Check Matrix (H)"}
                        highlight={highlight}
                    />
                </motion.div>


                {/* Equals Symbol */}
                {showSyndrome && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.8, duration: 0.3 }}
                            className="text-3xl text-cyber-cyan/60 font-bold"
                        >
                            =
                        </motion.div>

                        {/* Syndrome Vector */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1, duration: 0.5 }}
                            className="flex flex-col items-center gap-2"
                        >
                            <h3 className="text-sm font-semibold text-cyber-purple">Syndrome (s)</h3>
                            <div className="flex flex-col gap-1">
                                {syndrome.map((bit, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 1.1 + idx * 0.1, duration: 0.3 }}
                                        className="flex items-center gap-2"
                                    >
                                        <span className={`text-xs w-6 ${extended && idx === 3 ? 'text-cyber-amber/70' : 'text-cyber-purple/70'}`}>
                                            {syndromeLabels[idx]}:
                                        </span>
                                        <div
                                            className={`w-12 h-12 flex items-center justify-center rounded-lg font-mono text-lg font-bold border-2 ${bit === 1
                                                ? extended && idx === 3
                                                    ? 'bg-cyber-amber/30 text-cyber-amber border-cyber-amber'
                                                    : 'bg-cyber-purple/30 text-cyber-purple border-cyber-purple'
                                                : 'bg-cyber-surface text-cyber-cyan/50 border-cyber-border'
                                                }`}
                                        >
                                            {bit}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="text-xs text-cyber-purple/70 font-mono mt-2 text-center">
                                <div>Position: {[...parityBits].reverse().join('')}₂ = {syndromeValue}</div>
                                {extended && <div className="text-cyber-amber/70">Overall Parity: p₀ = {overallParity}</div>}
                            </div>
                        </motion.div>
                    </>
                )}
            </motion.div>

            {/* Error Position Display */}
            {showErrorPosition && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5, duration: 0.5 }}
                    className={`max-w-2xl mx-auto rounded-lg p-6 border-2 ${isDoubleError
                        ? 'bg-cyber-red/10 border-cyber-red'
                        : isSingleError
                            ? extended ? 'bg-cyber-amber/10 border-cyber-amber' : 'bg-cyber-red/10 border-cyber-red'
                            : 'bg-cyber-green/10 border-cyber-green'
                        }`}
                >
                    <div className="flex items-center gap-4">
                        {isDoubleError ? (
                            <motion.div
                                initial={{ rotate: 0 }}
                                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                                transition={{ duration: 0.5, delay: 1.6 }}
                            >
                                <AlertTriangle className="w-8 h-8 text-cyber-red flex-shrink-0" />
                            </motion.div>
                        ) : isSingleError ? (
                            <motion.div
                                initial={{ rotate: 0 }}
                                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                                transition={{ duration: 0.5, delay: 1.6 }}
                            >
                                <AlertCircle className={`w-8 h-8 flex-shrink-0 ${extended ? 'text-cyber-amber' : 'text-cyber-red'}`} />
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: [0, 1.2, 1] }}
                                transition={{ duration: 0.5, delay: 1.6 }}
                            >
                                <CheckCircle className="w-8 h-8 text-cyber-green flex-shrink-0" />
                            </motion.div>
                        )}

                        <div className="flex-1">
                            <h3 className={`font-bold text-lg ${isDoubleError ? 'text-cyber-red' : isSingleError ? (extended ? 'text-cyber-amber' : 'text-cyber-red') : 'text-cyber-green'
                                }`}>
                                {isDoubleError
                                    ? 'Double Error Detected - Cannot Correct!'
                                    : isSingleError
                                        ? 'Single Error Detected - Correctable!'
                                        : 'No Error Detected'}
                            </h3>

                            <p className="text-sm text-cyber-cyan/80 mt-1">
                                {isDoubleError ? (
                                    <>
                                        Syndrome ≠ 0 but Overall Parity = 0
                                        {' '}<ArrowRight className="inline w-4 h-4" />{' '}
                                        <span className="text-cyber-red font-bold">Double bit error - data corrupted</span>
                                    </>
                                ) : isSingleError ? (
                                    extended ? (
                                        <>
                                            Position: <span className="font-mono text-cyber-purple">{[...parityBits].reverse().join('')}₂</span> = {syndromeValue}
                                            {', '}Overall Parity = 1
                                            {' '}<ArrowRight className="inline w-4 h-4" />{' '}
                                            Error at index <span className="font-mono text-cyber-amber font-bold">{errorPosition}</span>
                                        </>
                                    ) : (
                                        <>
                                            Syndrome: <span className="font-mono text-cyber-purple">{[...parityBits].reverse().join('')}₂</span> = {syndromeValue}
                                            {' '}<ArrowRight className="inline w-4 h-4" />{' '}
                                            Error at position <span className="font-mono text-cyber-red font-bold">c{errorPosition}</span>
                                        </>
                                    )
                                ) : (
                                    <>
                                        Syndrome = <span className="font-mono text-cyber-green">[{syndrome.map(() => '0').join(', ')}]</span>
                                        {' '}<ArrowRight className="inline w-4 h-4" />{' '}
                                        All parity checks passed ✓
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Correction Step - Only for single errors */}
            {showCorrection && isSingleError && canCorrect && correctedBits && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2, duration: 0.5 }}
                    className="bg-cyber-surface border border-cyber-border rounded-xl p-6 max-w-3xl mx-auto"
                >
                    <h3 className="text-lg font-bold text-cyber-green mb-4 text-center">
                        Error Correction: Flip bit at {extended ? `index ${errorPosition}` : `position c${errorPosition}`}
                    </h3>
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-sm text-cyber-red">Corrupted</span>
                            <div className="flex gap-1">
                                {receivedBits.map((bit, idx) => {
                                    const isErrorBit = extended ? idx === errorPosition : idx === errorPosition - 1;
                                    return (
                                        <div
                                            key={idx}
                                            className={`w-10 h-10 flex items-center justify-center rounded font-mono font-bold ${isErrorBit
                                                ? 'bg-cyber-red/30 text-cyber-red border-2 border-cyber-red'
                                                : 'bg-cyber-surface text-cyber-cyan/70 border border-cyber-border'
                                                }`}
                                        >
                                            {bit}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 2.3, duration: 0.3 }}
                        >
                            <ArrowRight className="w-8 h-8 text-cyber-cyan" />
                        </motion.div>

                        <div className="flex flex-col items-center gap-2">
                            <span className="text-sm text-cyber-green">Corrected</span>
                            <div className="flex gap-1">
                                {correctedBits.map((bit, idx) => {
                                    const isErrorBit = extended ? idx === errorPosition : idx === errorPosition - 1;
                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={isErrorBit ? { rotateY: 0 } : {}}
                                            animate={isErrorBit ? { rotateY: 180 } : {}}
                                            transition={{ delay: 2.5, duration: 0.5 }}
                                            className={`w-10 h-10 flex items-center justify-center rounded font-mono font-bold ${isErrorBit
                                                ? 'bg-cyber-green/30 text-cyber-green border-2 border-cyber-green'
                                                : 'bg-cyber-surface text-cyber-cyan/70 border border-cyber-border'
                                                }`}
                                        >
                                            {bit}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Double Error Warning */}
            {showCorrection && isDoubleError && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2, duration: 0.5 }}
                    className="bg-cyber-red/10 border-2 border-cyber-red rounded-xl p-6 max-w-3xl mx-auto"
                >
                    <div className="flex items-center gap-4 justify-center">
                        <AlertTriangle className="w-8 h-8 text-cyber-red" />
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-cyber-red">Cannot Correct Double Error</h3>
                            <p className="text-sm text-cyber-cyan/80 mt-1">
                                Extended Hamming can detect but not correct 2-bit errors.
                                Request retransmission of this block.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Explanation */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: showCorrection ? 3 : 2 }}
                className="bg-cyber-surface/50 border border-cyber-border rounded-lg p-4 max-w-2xl mx-auto"
            >
                <p className="text-sm text-cyber-cyan/80 text-center">
                    {extended ? (
                        <>
                            <span className="font-bold text-cyber-cyan">SECDED</span>: Single Error Correction, Double Error Detection.
                            {' '}<span className="font-mono text-cyber-purple">s = [s₁, s₂, s₄]</span> gives position,
                            {' '}<span className="font-mono text-cyber-amber">p₀</span> (overall parity) determines error type.
                            <br />
                            <span className="text-cyber-green">p₀=1, syndrome≠0</span> → single error (correctable),
                            {' '}<span className="text-cyber-red">p₀=0, syndrome≠0</span> → double error (detected only)
                        </>
                    ) : (
                        <>
                            <span className="font-bold text-cyber-cyan">SEC</span>: Single Error Correction.
                            {' '}<span className="font-mono text-cyber-purple">s = [s₁, s₂, s₄]</span> directly gives error position.
                            <br />
                            <span className="font-mono">error_pos = s₁×1 + s₂×2 + s₄×4</span>
                        </>
                    )}
                </p>
            </motion.div>
        </div>
    );
}
