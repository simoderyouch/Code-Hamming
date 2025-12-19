'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ControlPanelProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    onStepForward: () => void;
    onStepBackward: () => void;
    onReset: () => void;
    currentBlock: number;
    totalBlocks: number;
    onBlockChange: (block: number) => void;
    speed: number;
    onSpeedChange: (speed: number) => void;
    canStepForward: boolean;
    canStepBackward: boolean;
}

export function ControlPanel({
    isPlaying,
    onPlayPause,
    onStepForward,
    onStepBackward,
    onReset,
    currentBlock,
    totalBlocks,
    onBlockChange,
    speed,
    onSpeedChange,
    canStepForward,
    canStepBackward,
}: ControlPanelProps) {
    const speedOptions = [
        { label: '0.5x', value: 2000 },
        { label: '1x', value: 1000 },
        { label: '1.5x', value: 666 },
        { label: '2x', value: 500 },
    ];

    return (
        <div className="w-full bg-cyber-surface border border-cyber-border rounded-xl p-6 space-y-6">
            {/* Main Controls */}
            <div className="flex items-center justify-center gap-3">
                <ControlButton
                    onClick={onStepBackward}
                    disabled={!canStepBackward}
                    icon={<SkipBack className="w-5 h-5" />}
                    label="Step Back"
                />

                <ControlButton
                    onClick={onPlayPause}
                    icon={isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    label={isPlaying ? 'Pause' : 'Play'}
                    primary
                />

                <ControlButton
                    onClick={onStepForward}
                    disabled={!canStepForward}
                    icon={<SkipForward className="w-5 h-5" />}
                    label="Step Forward"
                />

                <ControlButton
                    onClick={onReset}
                    icon={<RotateCcw className="w-5 h-5" />}
                    label="Reset"
                    variant="outline"
                />
            </div>

            {/* Block Scrubber */}
            {totalBlocks > 1 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-cyber-cyan/70">Block</span>
                        <span className="text-cyber-cyan font-mono">
                            {currentBlock + 1} / {totalBlocks}
                        </span>
                    </div>

                    <input
                        type="range"
                        min="0"
                        max={totalBlocks - 1}
                        value={currentBlock}
                        onChange={(e) => onBlockChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-cyber-border rounded-lg appearance-none cursor-pointer slider"
                    />

                    <div className="flex justify-between gap-1">
                        {Array.from({ length: totalBlocks }).map((_, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    'h-1 flex-1 rounded-full transition-colors',
                                    idx <= currentBlock ? 'bg-cyber-cyan' : 'bg-cyber-border'
                                )}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Speed Control */}
            <div className="space-y-2">
                <span className="text-sm text-cyber-cyan/70">Animation Speed</span>
                <div className="flex gap-2">
                    {speedOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => onSpeedChange(option.value)}
                            className={cn(
                                'flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all',
                                speed === option.value
                                    ? 'bg-cyber-cyan text-cyber-bg'
                                    : 'bg-cyber-border text-cyber-cyan/70 hover:bg-cyber-border/70'
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

interface ControlButtonProps {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    disabled?: boolean;
    primary?: boolean;
    variant?: 'default' | 'outline';
}

function ControlButton({
    onClick,
    icon,
    label,
    disabled = false,
    primary = false,
    variant = 'default',
}: ControlButtonProps) {
    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all',
                primary && 'w-24 h-24 flex-col',
                variant === 'outline' && 'border-2',
                disabled
                    ? 'opacity-40 cursor-not-allowed bg-cyber-border text-cyber-cyan/40'
                    : primary
                        ? 'bg-cyber-cyan text-cyber-bg hover:shadow-lg hover:shadow-cyber-cyan/50'
                        : variant === 'outline'
                            ? 'border-cyber-cyan/40 text-cyber-cyan hover:bg-cyber-cyan/10'
                            : 'bg-cyber-surface border border-cyber-border text-cyber-cyan hover:bg-cyber-border'
            )}
            whileHover={!disabled ? { scale: 1.05 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
        >
            {icon}
            {primary && <span className="text-xs">{label}</span>}
        </motion.button>
    );
}
