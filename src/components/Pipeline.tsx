'use client';

import { motion } from 'framer-motion';
import { Step } from '@/types/hamming';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface PipelineProps {
    currentStep: Step;
}

const steps = [
    { id: Step.INPUT, label: 'Input', color: 'cyan' },
    { id: Step.ENCODING, label: 'Encode', color: 'green' },
    { id: Step.NOISE, label: 'Noise', color: 'red' },
    { id: Step.DECODING, label: 'Decode', color: 'amber' },
    { id: Step.CORRECTION, label: 'Correct', color: 'purple' },
    { id: Step.OUTPUT, label: 'Output', color: 'cyan' },
];

export function Pipeline({ currentStep }: PipelineProps) {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);

    return (
        <div className="w-full bg-cyber-surface border border-cyber-border rounded-xl p-6">
            <h3 className="text-sm font-semibold text-cyber-cyan/70 mb-4 text-center">
                Processing Pipeline
            </h3>

            <div className="flex items-center justify-center gap-2">
                {steps.map((step, index) => {
                    const isActive = index === currentIndex;
                    const isComplete = index < currentIndex;
                    const colorClass = `cyber-${step.color}`;

                    return (
                        <div key={step.id} className="flex items-center gap-2">
                            {/* Step Circle */}
                            <motion.div
                                className={cn(
                                    'relative flex items-center justify-center w-16 h-16 rounded-full border-2 transition-all duration-300',
                                    isActive && `border-${colorClass} bg-${colorClass}/20`,
                                    isComplete && `border-${colorClass}/60 bg-${colorClass}/10`,
                                    !isActive && !isComplete && 'border-cyber-border bg-cyber-bg'
                                )}
                                animate={
                                    isActive
                                        ? {
                                            scale: [1, 1.05, 1],
                                        }
                                        : {}
                                }
                                transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
                            >
                                <span
                                    className={cn(
                                        'text-xs font-bold text-center',
                                        isActive && `text-${colorClass}`,
                                        isComplete && `text-${colorClass}/80`,
                                        !isActive && !isComplete && 'text-cyber-cyan/40'
                                    )}
                                >
                                    {step.label}
                                </span>

                                {/* Active Indicator */}
                                {isActive && (
                                    <motion.div
                                        className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-${colorClass}`}
                                        animate={{
                                            scale: [1, 1.5, 1],
                                            opacity: [1, 0.5, 1],
                                        }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    />
                                )}
                            </motion.div>

                            {/* Arrow */}
                            {index < steps.length - 1 && (
                                <ArrowRight
                                    className={cn(
                                        'w-4 h-4 transition-colors',
                                        isComplete ? 'text-cyber-cyan/60' : 'text-cyber-border'
                                    )}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
