import React, { useState, useEffect, useRef } from 'react';
import { FastForward } from 'lucide-react';

interface TypewriterTextProps {
  text: string;
  isDark?: boolean;
  enabled?: boolean;
  speedMs?: number;
  onFinish?: () => void;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  isDark = false,
  enabled = true,
  speedMs = 15,
  onFinish,
}) => {
  const [displayedLength, setDisplayedLength] = useState<number>(() => (enabled ? 0 : text.length));
  const [isTyping, setIsTyping] = useState<boolean>(enabled);
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    if (!enabled) {
      setDisplayedLength(text.length);
      setIsTyping(false);
      return;
    }

    setDisplayedLength(0);
    setIsTyping(true);

    // Split into words & spaces to stream smoothly by words
    const words = text.split(/(\s+)/);
    let currentWordIndex = 0;

    // Adapt speed so even 800-word posts complete smoothly in ~2.5s
    const wordsPerTick = Math.max(1, Math.ceil(words.length / 90));

    const interval = setInterval(() => {
      currentWordIndex += wordsPerTick;
      if (currentWordIndex >= words.length) {
        setDisplayedLength(textRef.current.length);
        setIsTyping(false);
        clearInterval(interval);
        onFinish?.();
      } else {
        const partial = words.slice(0, currentWordIndex).join('');
        setDisplayedLength(partial.length);
      }
    }, speedMs);

    return () => clearInterval(interval);
  }, [text, enabled, speedMs]);

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDisplayedLength(text.length);
    setIsTyping(false);
    onFinish?.();
  };

  const currentText = isTyping ? text.slice(0, displayedLength) : text;

  return (
    <div className="relative group">
      {isTyping && (
        <div className="flex items-center justify-end mb-1">
          <button
            type="button"
            onClick={handleSkip}
            title="Bấm để hiển thị toàn bộ bài viết ngay lập tức"
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-indigo-400 border-slate-700 hover:border-indigo-500'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 hover:border-indigo-300'
            }`}
          >
            <FastForward className="w-3 h-3 text-indigo-500 animate-pulse" />
            <span>Hiện toàn bộ ngay</span>
          </button>
        </div>
      )}

      <p
        className={`text-xs leading-relaxed whitespace-pre-line font-sans select-all ${
          isDark ? 'text-slate-200' : 'text-slate-800'
        }`}
      >
        {currentText}
        {isTyping && (
          <span
            className="inline-block w-1.5 h-3.5 bg-indigo-500 ml-0.5 align-middle rounded-full animate-pulse shadow-xs"
            aria-hidden="true"
          />
        )}
      </p>
    </div>
  );
};
