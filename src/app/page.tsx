'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Zap, AlertTriangle, CheckCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { Pipeline } from '@/components/Pipeline';
import { ControlPanel } from '@/components/ControlPanel';
import { EncodingPhase } from '@/components/EncodingPhase';
import { DecodingPhase } from '@/components/DecodingPhase';
import { VectorDisplay } from '@/components/VectorDisplay';
import { Step, Block, HighlightState, ErrorType } from '@/types/hamming';
import {
  encode,
  encodeExtended,
  calculateSyndrome,
  calculateExtendedSyndrome,
  findErrorPosition,
  analyzeExtendedError,
  correctError,
  correctExtendedError,
  extractData,
  extractExtendedData,
  injectError,
  injectExtendedError,
} from '@/lib/hamming';
import { textToBinaryChunks, nibblesToChar, charToBinary } from '@/lib/matrix-utils';

export default function Home() {
  const [inputText, setInputText] = useState('OK');
  const [inputBinary, setInputBinary] = useState('0100');
  const [inputMode, setInputMode] = useState<'text' | 'binary'>('text');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<Step>(Step.INPUT);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [highlight, setHighlight] = useState<HighlightState | undefined>();
  const [outputText, setOutputText] = useState('');
  const [decodedNibbles, setDecodedNibbles] = useState<number[][]>([]);
  const [errorCount, setErrorCount] = useState<1 | 2>(1); // Number of errors to inject
  const [useExtended, setUseExtended] = useState(false); // Toggle between Extended and Normal Hamming

  // Parse binary string into 4-bit chunks
  const parseBinaryInput = (binary: string): number[][] => {
    // Remove spaces and validate
    const cleanBinary = binary.replace(/\s/g, '');
    if (!/^[01]+$/.test(cleanBinary)) return [];

    // Pad to multiple of 4
    const padded = cleanBinary.padEnd(Math.ceil(cleanBinary.length / 4) * 4, '0');

    const chunks: number[][] = [];
    for (let i = 0; i < padded.length; i += 4) {
      chunks.push(padded.slice(i, i + 4).split('').map(Number));
    }
    return chunks;
  };

  // Initialize blocks from input text or binary
  useEffect(() => {
    let chunks: number[][];

    if (inputMode === 'binary') {
      chunks = parseBinaryInput(inputBinary);
      if (chunks.length === 0) return;
    } else {
      if (inputText.length === 0) return;
      chunks = textToBinaryChunks(inputText);
    }

    const newBlocks: Block[] = chunks.map((dataBits, index) => {
      const encodedBits = useExtended ? encodeExtended(dataBits) : encode(dataBits);

      if (inputMode === 'binary') {
        return {
          index,
          char: `B${index + 1}`,
          charIndex: index,
          isHighNibble: true,
          fullBinary: dataBits.join(''),
          dataBits,
          encodedBits,
          receivedBits: [...encodedBits],
          errorPosition: null,
          errorPositions: [],
          errorType: 'none' as ErrorType,
          canCorrect: true,
          syndrome: useExtended ? [0, 0, 0, 0] : [0, 0, 0],
          correctedBits: [...encodedBits],
        };
      }

      const charIndex = Math.floor(index / 2);
      const isHighNibble = index % 2 === 0;
      return {
        index,
        char: inputText[charIndex],
        charIndex,
        isHighNibble,
        fullBinary: charToBinary(inputText[charIndex]),
        dataBits,
        encodedBits,
        receivedBits: [...encodedBits],
        errorPosition: null,
        errorPositions: [],
        errorType: 'none' as ErrorType,
        canCorrect: true,
        syndrome: useExtended ? [0, 0, 0, 0] : [0, 0, 0],
        correctedBits: [...encodedBits],
      };
    });

    setBlocks(newBlocks);
    setCurrentBlockIndex(0);
    setCurrentStep(Step.INPUT);
    setOutputText('');
    setDecodedNibbles([]);
  }, [inputText, inputBinary, inputMode, useExtended]);

  const currentBlock = blocks[currentBlockIndex];

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      stepForward();
    }, speed);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, currentBlockIndex, speed]);

  const stepForward = () => {
    if (!currentBlock) return;

    switch (currentStep) {
      case Step.INPUT:
        setCurrentStep(Step.ENCODING);
        break;

      case Step.ENCODING:
        setCurrentStep(Step.NOISE);
        break;

      case Step.NOISE:
        // Only inject random error(s) if user hasn't manually flipped any bits
        const hasManualErrors = currentBlock.errorPositions && currentBlock.errorPositions.length > 0;

        if (hasManualErrors) {
          // User has manually flipped bits - just move to DECODING with existing state
          setCurrentStep(Step.DECODING);
        } else if (useExtended) {
          // No manual errors - inject random error(s)
          const { corrupted, positions: injectedPositions } = injectExtendedError(currentBlock.encodedBits, errorCount);
          const syndromeBits = calculateExtendedSyndrome(corrupted);
          const errorAnalysis = analyzeExtendedError(syndromeBits);
          const updatedBlocks = [...blocks];
          updatedBlocks[currentBlockIndex] = {
            ...currentBlock,
            receivedBits: corrupted,
            errorPosition: errorAnalysis.errorPosition,
            errorPositions: injectedPositions,
            errorType: errorAnalysis.errorType,
            canCorrect: errorAnalysis.canCorrect,
            syndrome: syndromeBits,
          };
          setBlocks(updatedBlocks);
          setCurrentStep(Step.DECODING);
        } else {
          // Normal Hamming(7,4) - only single bit error
          const { corrupted, position: injectedPos } = injectError(currentBlock.encodedBits);
          const syndromeBits = calculateSyndrome(corrupted);
          const detectedErrorPos = findErrorPosition(syndromeBits);
          const updatedBlocks = [...blocks];
          updatedBlocks[currentBlockIndex] = {
            ...currentBlock,
            receivedBits: corrupted,
            errorPosition: detectedErrorPos,
            errorPositions: injectedPos > 0 ? [injectedPos - 1] : [],
            errorType: detectedErrorPos > 0 ? 'single' : 'none',
            canCorrect: true,
            syndrome: syndromeBits,
          };
          setBlocks(updatedBlocks);
          setCurrentStep(Step.DECODING);
        }
        break;

      case Step.DECODING:
        // Just move to correction step - syndrome was already calculated
        setCurrentStep(Step.CORRECTION);
        break;

      case Step.CORRECTION:
        // Correct error if possible (single bit error)
        let corrected: number[];
        let data: number[];

        if (useExtended) {
          if (currentBlock.canCorrect && currentBlock.errorPosition !== null && currentBlock.errorPosition > 0) {
            corrected = correctExtendedError(
              currentBlock.receivedBits,
              currentBlock.errorPosition
            );
          } else {
            // Cannot correct (no error or double error detected)
            corrected = [...currentBlock.receivedBits];
          }
          data = extractExtendedData(corrected);
        } else {
          // Normal Hamming(7,4)
          corrected = correctError(
            currentBlock.receivedBits,
            currentBlock.errorPosition || 0
          );
          data = extractData(corrected);
        }

        const updatedBlocks3 = [...blocks];
        updatedBlocks3[currentBlockIndex] = {
          ...currentBlock,
          correctedBits: corrected,
        };
        setBlocks(updatedBlocks3);

        // Store the decoded nibble
        const newDecodedNibbles = [...decodedNibbles, data];
        setDecodedNibbles(newDecodedNibbles);

        if (inputMode === 'binary') {
          // Binary mode: just concatenate the nibbles
          setOutputText((prev) => prev + data.join(''));
        } else {
          // Text mode: Check if we have a complete character (2 nibbles)
          if (newDecodedNibbles.length % 2 === 0) {
            const highNibble = newDecodedNibbles[newDecodedNibbles.length - 2];
            const lowNibble = newDecodedNibbles[newDecodedNibbles.length - 1];
            const char = nibblesToChar(highNibble, lowNibble);
            setOutputText((prev) => prev + char);
          }
        }

        setCurrentStep(Step.OUTPUT);
        break;

      case Step.OUTPUT:
        // Move to next block or stop
        if (currentBlockIndex < blocks.length - 1) {
          setCurrentBlockIndex(currentBlockIndex + 1);
          setCurrentStep(Step.INPUT);
        } else {
          setIsPlaying(false);
        }
        break;
    }
  };

  const stepBackward = () => {
    switch (currentStep) {
      case Step.ENCODING:
        setCurrentStep(Step.INPUT);
        break;
      case Step.NOISE:
        setCurrentStep(Step.ENCODING);
        break;
      case Step.DECODING:
        setCurrentStep(Step.NOISE);
        break;
      case Step.CORRECTION:
        setCurrentStep(Step.DECODING);
        break;
      case Step.OUTPUT:
        setCurrentStep(Step.CORRECTION);
        // Remove the last decoded nibble
        if (decodedNibbles.length > 0) {
          const newNibbles = decodedNibbles.slice(0, -1);
          setDecodedNibbles(newNibbles);

          if (inputMode === 'binary') {
            // Binary mode: remove last 4 bits
            setOutputText((prev) => prev.slice(0, -4));
          } else {
            // Text mode: If we removed a low nibble (even number of nibbles now), remove a character
            if (decodedNibbles.length % 2 === 0) {
              setOutputText((prev) => prev.slice(0, -1));
            }
          }
        }
        break;
      case Step.INPUT:
        if (currentBlockIndex > 0) {
          setCurrentBlockIndex(currentBlockIndex - 1);
          setCurrentStep(Step.OUTPUT);
        }
        break;
    }
  };

  const reset = () => {
    setIsPlaying(false);
    setCurrentBlockIndex(0);
    setCurrentStep(Step.INPUT);
    setOutputText('');
    setDecodedNibbles([]);

    // Reset all blocks
    const chunks = textToBinaryChunks(inputText);
    const newBlocks: Block[] = chunks.map((dataBits, index) => {
      const encodedBits = useExtended ? encodeExtended(dataBits) : encode(dataBits);
      const charIndex = Math.floor(index / 2);
      const isHighNibble = index % 2 === 0;
      return {
        index,
        char: inputText[charIndex],
        charIndex,
        isHighNibble,
        fullBinary: charToBinary(inputText[charIndex]),
        dataBits,
        encodedBits,
        receivedBits: [...encodedBits],
        errorPosition: null,
        errorPositions: [],
        errorType: 'none' as ErrorType,
        canCorrect: true,
        syndrome: useExtended ? [0, 0, 0, 0] : [0, 0, 0],
        correctedBits: [...encodedBits],
      };
    });
    setBlocks(newBlocks);
  };

  const handleBitFlip = (index: number) => {
    if (currentStep !== Step.NOISE) return;

    const flipped = [...currentBlock.receivedBits];

    // Count current errors (bits that differ from original)
    const currentErrorCount = flipped.filter(
      (bit, idx) => bit !== currentBlock.encodedBits[idx]
    ).length;

    // Check if this bit is already flipped (error)
    const isAlreadyFlipped = flipped[index] !== currentBlock.encodedBits[index];

    // Determine max allowed errors based on mode
    const maxErrors = useExtended ? 2 : 1;

    // If we're trying to add a new error and we've hit the limit, don't allow
    if (!isAlreadyFlipped && currentErrorCount >= maxErrors) {
      return; // Can't flip more bits
    }

    // Toggle the clicked bit
    flipped[index] = flipped[index] === 0 ? 1 : 0;

    // Track all error positions (compare with original encoded bits)
    const errorPositions: number[] = [];
    flipped.forEach((bit, idx) => {
      if (bit !== currentBlock.encodedBits[idx]) {
        errorPositions.push(idx);
      }
    });

    const updatedBlocks = [...blocks];

    if (useExtended) {
      // Calculate extended syndrome for the flipped bits
      const syndromeBits = calculateExtendedSyndrome(flipped);
      const errorAnalysis = analyzeExtendedError(syndromeBits);

      updatedBlocks[currentBlockIndex] = {
        ...currentBlock,
        receivedBits: flipped,
        errorPosition: errorAnalysis.errorPosition,
        errorPositions: errorPositions,
        errorType: errorAnalysis.errorType,
        canCorrect: errorAnalysis.canCorrect,
        syndrome: syndromeBits,
      };
    } else {
      // Normal Hamming(7,4)
      const syndromeBits = calculateSyndrome(flipped);
      const detectedPos = findErrorPosition(syndromeBits);

      updatedBlocks[currentBlockIndex] = {
        ...currentBlock,
        receivedBits: flipped,
        errorPosition: detectedPos,
        errorPositions: errorPositions,
        errorType: detectedPos > 0 ? 'single' : 'none',
        canCorrect: true,
        syndrome: syndromeBits,
      };
    }
    setBlocks(updatedBlocks);
  };

  return (
    <div className="min-h-screen bg-cyber-bg grid-bg">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="text-center space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-cyber-cyan"
          >
            {useExtended ? 'Extended Hamming(8,4) SECDED' : 'Hamming(7,4) SEC'}
          </motion.h1>
          <p className="text-cyber-cyan/60 text-lg">
            {useExtended
              ? 'Single Error Correction, Double Error Detection'
              : 'Single Error Correction'}
          </p>
        </header>
        <div className='flex gap-6'>


          {/* *
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center"
          >
            <button
              onClick={() => {
                setUseExtended(!useExtended);
                setErrorCount(1); // Reset to 1 error when switching modes
              }}
              className="flex items-center gap-3 bg-cyber-surface border border-cyber-border rounded-xl px-6 py-3 hover:border-cyber-cyan transition-all"
            >
              <span className={`font-mono ${!useExtended ? 'text-cyber-cyan' : 'text-cyber-cyan/50'}`}>
                Hamming(7,4)
              </span>
              {useExtended ? (
                <ToggleRight className="w-10 h-10 text-cyber-green" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-cyber-cyan/50" />
              )}
              <span className={`font-mono ${useExtended ? 'text-cyber-green' : 'text-cyber-cyan/50'}`}>
                Extended(8,4)
              </span>
            </button>
          </motion.div>  
          */}

          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-cyber-surface border border-cyber-border rounded-xl p-6 w-full"
          >
            {/* Input Mode Toggle */}
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-semibold text-cyber-cyan/70">Input Mode:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setInputMode('text')}
                  className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${inputMode === 'text'
                    ? 'bg-cyber-cyan text-cyber-bg'
                    : 'bg-cyber-surface border border-cyber-border text-cyber-cyan/50 hover:border-cyber-cyan'
                    }`}
                >
                  Text
                </button>
                <button
                  onClick={() => setInputMode('binary')}
                  className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${inputMode === 'binary'
                    ? 'bg-cyber-green text-cyber-bg'
                    : 'bg-cyber-surface border border-cyber-border text-cyber-cyan/50 hover:border-cyber-green'
                    }`}
                >
                  Binary
                </button>
              </div>
            </div>

            <label className="block text-sm font-semibold text-cyber-cyan/70 mb-2">
              {inputMode === 'text' ? 'Enter Message' : 'Enter Binary (4-bit nibbles)'}
            </label>
            <div className="flex gap-3">
              {inputMode === 'text' ? (
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value.toUpperCase())}
                  maxLength={20}
                  className="flex-1 bg-cyber-bg border-2 border-cyber-border rounded-lg px-4 py-3 text-cyber-cyan font-mono text-lg focus:border-cyber-cyan focus:outline-none transition-colors"
                  placeholder="Type a message..."
                />
              ) : (
                <input
                  type="text"
                  value={inputBinary}
                  onChange={(e) => setInputBinary(e.target.value.replace(/[^01]/g, ''))}
                  maxLength={32}
                  className="flex-1 bg-cyber-bg border-2 border-cyber-border rounded-lg px-4 py-3 text-cyber-green font-mono text-lg focus:border-cyber-green focus:outline-none transition-colors tracking-wider"
                  placeholder="Enter binary (e.g., 10110100)..."
                />
              )}
              <button
                onClick={reset}
                className="px-6 py-3 bg-cyber-cyan text-cyber-bg rounded-lg font-semibold hover:shadow-lg hover:shadow-cyber-cyan/50 transition-all flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                Process
              </button>
            </div>
            <p className="text-xs text-cyber-cyan/50 mt-2">
              {inputMode === 'text'
                ? `${inputText.length} / 20 characters • ${blocks.length} blocks`
                : `${inputBinary.length} bits • ${blocks.length} blocks (${Math.ceil(inputBinary.length / 4)} nibbles)`
              }
            </p>
          </motion.div>
        </div>
        {/* Pipeline */}
        <Pipeline currentStep={currentStep} />

        {/* Main Visualization Area */}
        <div className="bg-cyber-surface/50 border border-cyber-border rounded-xl p-8 min-h-[500px]">
          <AnimatePresence mode="wait">
            {currentStep === Step.INPUT && currentBlock && (
              <motion.div
                key="input"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col items-center justify-center h-full gap-6"
              >
                <h2 className="text-3xl font-bold text-cyber-cyan">Ready to Process</h2>

                {inputMode === 'text' ? (
                  <>
                    {/* Full Text Display */}
                    <div className="flex flex-col items-center gap-2 w-full">
                      <div className="text-sm font-semibold text-cyber-cyan/70">Full Input Text:</div>
                      <div className="text-4xl font-mono text-cyber-green px-6 py-3 bg-cyber-bg border border-cyber-border rounded-lg">
                        &quot;{inputText}&quot;
                      </div>
                    </div>

                    {/* Complete Binary Representation */}
                    <div className="flex flex-col items-center gap-2 w-full">
                      <div className="text-sm font-semibold text-cyber-cyan/70">Complete Binary Representation:</div>
                      <div className="font-mono text-cyber-amber px-4 py-2 bg-cyber-bg border border-cyber-border rounded-lg max-w-full overflow-x-auto">
                        {inputText.split('').map((char, idx) => (
                          <span key={idx} className="inline-block mr-3">
                            {charToBinary(char)}
                            {idx < inputText.length - 1 && <span className="text-cyber-cyan/30 ml-1">|</span>}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* All 4-bit Blocks */}
                    <div className="flex flex-col items-center gap-3 w-full">
                      <div className="text-sm font-semibold text-cyber-cyan/70">4-bit Blocks to Process:</div>
                      <div className="flex flex-wrap gap-2 justify-center max-w-full">
                        {blocks.map((block, idx) => (
                          <div
                            key={idx}
                            className={`px-3 py-2 rounded-lg border-2 transition-all ${idx === currentBlockIndex
                              ? 'border-cyber-green bg-cyber-green/20   scale-110'
                              : 'border-cyber-border bg-cyber-surface/50'
                              }`}
                          >
                            <div className="text-xs text-cyber-cyan/60 text-center mb-1">
                              Block {idx + 1}
                            </div>
                            <div className={`font-mono text-sm ${idx === currentBlockIndex ? 'text-cyber-green font-bold' : 'text-cyber-cyan/70'}`}>
                              {block.dataBits.join('')}
                            </div>
                            <div className="text-xs text-cyber-cyan/50 text-center mt-1">
                              {block.char}&apos;s {block.isHighNibble ? 'High' : 'Low'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* First Block Highlight */}
                    <div className="flex flex-col items-center gap-3 bg-cyber-green/10 border-2 border-cyber-green rounded-xl p-4">
                      <div className="text-sm font-semibold text-cyber-green flex items-center gap-2">
                        First Block to Process
                      </div>


                      <VectorDisplay
                        bits={currentBlock.dataBits}
                        label={``}
                        showLabels={true}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Full Binary Input Display */}
                    <div className="flex flex-col items-center gap-2 w-full">
                      <div className="text-sm font-semibold text-cyber-cyan/70">Full Binary Input:</div>
                      <div className="text-3xl font-mono text-cyber-green px-6 py-3 bg-cyber-bg border border-cyber-border rounded-lg tracking-wider">
                        {inputBinary}
                      </div>
                    </div>

                    {/* All 4-bit Blocks */}
                    <div className="flex flex-col items-center gap-3 w-full">
                      <div className="text-sm font-semibold text-cyber-cyan/70">4-bit Blocks to Process:</div>
                      <div className="flex flex-wrap gap-2 justify-center max-w-full">
                        {blocks.map((block, idx) => (
                          <div
                            key={idx}
                            className={`px-3 py-2 rounded-lg border-2 transition-all ${idx === currentBlockIndex
                              ? 'border-cyber-green bg-cyber-green/20 shadow-lg shadow-cyber-green/50 scale-110'
                              : 'border-cyber-border bg-cyber-surface/50'
                              }`}
                          >
                            <div className="text-xs text-cyber-cyan/60 text-center mb-1">
                              Block {idx + 1}
                            </div>
                            <div className={`font-mono text-sm ${idx === currentBlockIndex ? 'text-cyber-green font-bold' : 'text-cyber-cyan/70'}`}>
                              {block.dataBits.join('')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* First Block Highlight */}
                    <div className="flex flex-col items-center gap-3 bg-cyber-green/10 border-2 border-cyber-green rounded-xl p-4">
                      <div className="text-sm font-semibold text-cyber-green flex items-center gap-2">
                        First Block to Process
                      </div>
                      <div className="text-4xl font-mono text-cyber-green tracking-wider">
                        {currentBlock.dataBits.join('')}
                      </div>
                      <VectorDisplay
                        bits={currentBlock.dataBits}
                        label="4-bit Data Block"
                        showLabels={true}
                      />
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {currentStep === Step.ENCODING && currentBlock && (
              <EncodingPhase
                key="encoding"
                dataBits={currentBlock.dataBits}
                encodedBits={currentBlock.encodedBits}
                highlight={highlight}
                showResult={true}
                extended={useExtended}
              />
            )}

            {currentStep === Step.NOISE && currentBlock && (
              <motion.div
                key="noise"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full gap-8"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-8 h-8 text-cyber-red animate-pulse" />
                  <h2 className="text-3xl font-bold text-cyber-red">Network Noise</h2>
                  <Zap className="w-8 h-8 text-cyber-red animate-pulse" />
                </div>

                {/* Error Count Selector - Only show 2-bit option for Extended mode */}
                <div className="flex items-center gap-4 bg-cyber-surface border border-cyber-border rounded-lg p-4">
                  <span className="text-cyber-cyan/70">Auto-inject errors:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setErrorCount(1)}
                      className={`px-4 py-2 rounded-lg font-mono transition-all ${errorCount === 1
                        ? 'bg-cyber-green text-cyber-bg'
                        : 'bg-cyber-surface border border-cyber-border text-cyber-cyan hover:border-cyber-green'
                        }`}
                    >
                      1 bit (correctable)
                    </button>
                    {useExtended && (
                      <button
                        onClick={() => setErrorCount(2)}
                        className={`px-4 py-2 rounded-lg font-mono transition-all ${errorCount === 2
                          ? 'bg-cyber-red text-cyber-bg'
                          : 'bg-cyber-surface border border-cyber-border text-cyber-cyan hover:border-cyber-red'
                          }`}
                      >
                        2 bits (detected only)
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-cyber-cyan/70">
                  Click bits to flip manually (max {useExtended ? '2 bits' : '1 bit'}), or step forward for random error{useExtended && errorCount === 2 ? 's' : ''}
                </p>
                <VectorDisplay
                  bits={currentBlock.receivedBits}
                  label={useExtended
                    ? `8-bit Extended Codeword - Click to Corrupt (${currentBlock.errorPositions?.length || 0}/2 errors)`
                    : `7-bit Codeword - Click to Corrupt (${currentBlock.errorPositions?.length || 0}/1 error)`}
                  onBitClick={handleBitFlip}
                  errorIndices={
                    // Find all bits that differ from original encoded bits
                    currentBlock.receivedBits
                      .map((bit, idx) => bit !== currentBlock.encodedBits[idx] ? idx : -1)
                      .filter(idx => idx !== -1)
                  }
                  showLabels={true}
                  extended={useExtended}
                />

                {/* Error Status Display */}
                {currentBlock.errorPositions && currentBlock.errorPositions.length > 0 && (
                  <div className={`flex items-center gap-2 font-mono px-4 py-2 rounded-lg ${currentBlock.errorType === 'single'
                    ? 'bg-cyber-green/20 border border-cyber-green text-cyber-green'
                    : 'bg-cyber-red/20 border border-cyber-red text-cyber-red'
                    }`}>
                    {currentBlock.errorType === 'single' ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Single error at position {currentBlock.errorPosition} - Correctable!</span>
                      </>
                    ) : currentBlock.errorType === 'double' ? (
                      <>
                        <AlertTriangle className="w-5 h-5" />
                        <span>Double error detected - Cannot correct!</span>
                      </>
                    ) : null}
                  </div>
                )}
              </motion.div>
            )}

            {(currentStep === Step.DECODING || currentStep === Step.CORRECTION) && currentBlock && (
              <DecodingPhase
                key="decoding"
                receivedBits={currentBlock.receivedBits}
                syndrome={currentBlock.syndrome}
                errorPosition={currentBlock.errorPosition || 0}
                errorType={currentBlock.errorType}
                canCorrect={currentBlock.canCorrect}
                correctedBits={currentBlock.correctedBits}
                highlight={highlight}
                showSyndrome={true}
                showErrorPosition={currentStep === Step.CORRECTION}
                showCorrection={currentStep === Step.CORRECTION}
                extended={useExtended}
              />
            )}

            {currentStep === Step.OUTPUT && currentBlock && (
              <motion.div
                key="output"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center justify-center h-full gap-8"
              >
                {currentBlock.errorType === 'double' ? (
                  <>
                    <h2 className="text-3xl font-bold text-cyber-red">✗ Double Error - Uncorrectable!</h2>
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="w-16 h-16 text-cyber-red" />
                      {inputMode === 'text' && (
                        <span className="text-cyber-cyan/60 text-sm">
                          {currentBlock.isHighNibble ? 'High Nibble' : 'Low Nibble'} of &apos;{currentBlock.char}&apos;
                        </span>
                      )}
                      <div className="text-4xl font-mono text-cyber-red">
                        [{(currentBlock.correctedBits.length === 8 ? extractExtendedData(currentBlock.correctedBits) : extractData(currentBlock.correctedBits)).join('')}] (corrupted)
                      </div>
                    </div>
                    <div className="bg-cyber-red/10 border-2 border-cyber-red rounded-lg p-6 text-center">
                      <p className="text-cyber-red font-mono text-lg">
                        Two-bit errors detected but cannot be corrected.
                      </p>
                      <p className="text-cyber-cyan/70 text-sm mt-2">
                        In real systems, this would trigger a retransmission request.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold text-cyber-green">✓ Block {currentBlock.errorType === 'single' ? 'Corrected' : 'Verified'}!</h2>
                    <div className="flex flex-col items-center gap-2">
                      {inputMode === 'text' && (
                        <span className="text-cyber-cyan/60 text-sm">
                          {currentBlock.isHighNibble ? 'High Nibble' : 'Low Nibble'} of &apos;{currentBlock.char}&apos;
                        </span>
                      )}
                      <div className="text-4xl font-mono text-cyber-green">
                        [{(currentBlock.correctedBits.length === 8 ? extractExtendedData(currentBlock.correctedBits) : extractData(currentBlock.correctedBits)).join('')}]
                      </div>
                    </div>
                  </>
                )}
                {outputText && (
                  <div className={`${currentBlock.errorType === 'double' ? 'bg-cyber-amber/10 border-cyber-amber' : 'bg-cyber-green/10 border-cyber-green'} border-2 rounded-lg p-6`}>
                    <p className={`${currentBlock.errorType === 'double' ? 'text-cyber-amber' : 'text-cyber-green'} font-mono text-xl`}>
                      {inputMode === 'text' ? 'Decoded Text' : 'Decoded Binary'}: {outputText}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <ControlPanel
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onStepForward={stepForward}
          onStepBackward={stepBackward}
          onReset={reset}
          currentBlock={currentBlockIndex}
          totalBlocks={blocks.length}
          onBlockChange={setCurrentBlockIndex}
          speed={speed}
          onSpeedChange={setSpeed}
          canStepForward={currentStep !== Step.OUTPUT || currentBlockIndex < blocks.length - 1}
          canStepBackward={currentStep !== Step.INPUT || currentBlockIndex > 0}
        />
      </div>
    </div>
  );
}
