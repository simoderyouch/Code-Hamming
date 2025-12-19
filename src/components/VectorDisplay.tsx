'use client';

import { motion } from 'framer-motion';
import { Vector } from '@/types/hamming';
import { cn } from '@/lib/utils';
import { getBitType, getExtendedBitType } from '@/lib/hamming';

interface VectorDisplayProps {
    bits: Vector;
    label: string;
    highlightIndex?: number;
    orientation?: 'horizontal' | 'vertical';
    onBitClick?: (index: number) => void;
    showLabels?: boolean;
    errorIndex?: number;
    errorIndices?: number[];
    extended?: boolean;
    className?: string;
}

export function VectorDisplay({
    bits,
    label,
    highlightIndex,
    orientation = 'horizontal',
    onBitClick,
    showLabels = true,
    errorIndex,
    errorIndices = [],
    extended = false,
    className,
}: VectorDisplayProps) {
    const isErrorBit = (index: number): boolean => {
        if (errorIndices.length > 0) {
            return errorIndices.includes(index);
        }
        return errorIndex !== undefined && errorIndex === index;
    };

    const getBitColor = (index: number, bit: number): string => {
        // Error bit takes priority
        if (isErrorBit(index)) {
            return 'bg-cyber-red text-white shadow-lg shadow-cyber-red/50';
        }

        // Highlighted bit
        if (highlightIndex === index) {
            return 'bg-cyber-cyan text-cyber-bg shadow-lg shadow-cyber-cyan/50 scale-110';
        }

        // Extended Hamming (8-bit codewords)
        if (extended || bits.length === 8) {
            const bitType = getExtendedBitType(index);
            if (bitType === 'overall-parity') {
                return 'bg-cyber-purple/20 text-cyber-purple border-cyber-purple/40';
            } else if (bitType === 'parity') {
                return 'bg-cyber-amber/20 text-cyber-amber border-cyber-amber/40';
            } else {
                return 'bg-cyber-green/20 text-cyber-green border-cyber-green/40';
            }
        }

        // Normal bits - color by type (for 7-bit codewords)
        if (bits.length === 7) {
            const bitType = getBitType(index + 1); // Convert to 1-indexed
            if (bitType === 'parity') {
                return 'bg-cyber-amber/20 text-cyber-amber border-cyber-amber/40';
            } else {
                return 'bg-cyber-green/20 text-cyber-green border-cyber-green/40';
            }
        }

        // Default for data bits (4-bit)
        return 'bg-cyber-green/20 text-cyber-green border-cyber-green/40';
    };

    const getBitLabel = (index: number): string => {
        if (extended || bits.length === 8) {
            // Extended Hamming: p0, p1, p2, d1, p4, d2, d3, d4
            const labels = ['p0', 'p1', 'p2', 'd1', 'p4', 'd2', 'd3', 'd4'];
            return labels[index] || `b${index}`;
        }
        return bits.length === 7 ? `c${index + 1}` : `d${index + 1}`;
    };

    return (
        <div className={cn('flex flex-col items-center gap-3', className)}>
            <h3 className="text-sm font-semibold text-cyber-cyan/80">{label}</h3>

            <div
                className={cn(
                    'flex gap-2',
                    orientation === 'vertical' ? 'flex-col' : 'flex-row'
                )}
            >
                {bits.map((bit, index) => (
                    <div key={index} className="flex flex-col items-center gap-1">
                        <motion.button
                            className={cn(
                                'w-12 h-12 flex items-center justify-center rounded-lg font-mono text-lg font-bold transition-all duration-300 border-2',
                                getBitColor(index, bit),
                                onBitClick && 'cursor-pointer hover:scale-105 active:scale-95'
                            )}
                            onClick={() => onBitClick?.(index)}
                            disabled={!onBitClick}
                            animate={
                                highlightIndex === index
                                    ? {
                                        scale: [1, 1.15, 1.15],
                                    }
                                    : isErrorBit(index)
                                        ? {
                                            rotate: [0, -5, 5, -5, 5, 0],
                                        }
                                        : {}
                            }
                            transition={{ duration: 0.3 }}
                            whileHover={onBitClick ? { scale: 1.05 } : {}}
                            whileTap={onBitClick ? { scale: 0.95 } : {}}
                        >
                            {bit}
                        </motion.button>

                        {showLabels && (
                            <span className="text-xs text-cyber-cyan/50 font-mono">
                                {getBitLabel(index)}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
