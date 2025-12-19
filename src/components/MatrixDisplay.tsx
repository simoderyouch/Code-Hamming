'use client';

import { motion } from 'framer-motion';
import { Matrix, HighlightState } from '@/types/hamming';
import { cn } from '@/lib/utils';

interface MatrixDisplayProps {
    matrix: Matrix;
    label: string;
    highlight?: HighlightState;
    className?: string;
}

export function MatrixDisplay({ matrix, label, highlight, className }: MatrixDisplayProps) {
    const rows = matrix.length;
    const cols = matrix[0]?.length || 0;

    const isCellHighlighted = (rowIdx: number, colIdx: number): boolean => {
        if (!highlight) return false;

        if (highlight.cells) {
            return highlight.cells.some(([r, c]) => r === rowIdx && c === colIdx);
        }

        if (highlight.row !== undefined && highlight.row === rowIdx) return true;
        if (highlight.col !== undefined && highlight.col === colIdx) return true;

        return false;
    };

    return (
        <div className={cn('flex flex-col items-center gap-4', className)}>
            <h3 className="text-lg font-semibold text-cyber-cyan">{label}</h3>

            <div className="relative">
                {/* Left bracket */}
                <div className="absolute left-0 top-0 bottom-0 w-2 border-l-2 border-t-2 border-b-2 border-cyber-cyan/60" />

                {/* Right bracket */}
                <div className="absolute right-0 top-0 bottom-0 w-2 border-r-2 border-t-2 border-b-2 border-cyber-cyan/60" />

                {/* Matrix content */}
                <div className="px-6 py-4">
                    <div className="grid gap-2" style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
                        {matrix.map((row, rowIdx) => (
                            <div
                                key={rowIdx}
                                className="grid gap-2"
                                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                            >
                                {row.map((cell, colIdx) => {
                                    const isHighlighted = isCellHighlighted(rowIdx, colIdx);

                                    return (
                                        <motion.div
                                            key={`${rowIdx}-${colIdx}`}
                                            className={cn(
                                                'w-10 h-10 flex items-center justify-center rounded font-mono text-sm font-semibold transition-all duration-300',
                                                isHighlighted
                                                    ? 'bg-cyber-cyan text-cyber-bg scale-110 shadow-lg shadow-cyber-cyan/50'
                                                    : 'bg-cyber-surface text-cyber-cyan/80 border border-cyber-border'
                                            )}
                                            animate={
                                                isHighlighted
                                                    ? {
                                                        scale: [1, 1.1, 1.1],
                                                        boxShadow: [
                                                            '0 0 0px rgba(0, 240, 255, 0)',
                                                            '0 0 20px rgba(0, 240, 255, 0.5)',
                                                            '0 0 20px rgba(0, 240, 255, 0.5)',
                                                        ],
                                                    }
                                                    : {}
                                            }
                                            transition={{ duration: 0.3 }}
                                        >
                                            {cell}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Dimension label */}
            <p className="text-xs text-cyber-cyan/60 font-mono">
                {rows} × {cols}
            </p>
        </div>
    );
}
