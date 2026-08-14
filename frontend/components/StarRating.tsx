'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

import styles from './StarRating.module.css';

interface StarRatingProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  label?: string;
  disabled?: boolean;
}

export default function StarRating({
  value,
  onChange,
  label = 'Nota',
  disabled = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const selectedValue = value ?? null;
  const displayValue = hoverValue ?? selectedValue ?? 0;

  return (
    <fieldset className={styles.fieldset} disabled={disabled} onMouseLeave={() => setHoverValue(null)}>
      <legend>{label}</legend>
      <div className={styles.control}>
        <div className={styles.stars} aria-label={`${displayValue.toFixed(1)} de 5 estrelas`}>
          {Array.from({ length: 5 }, (_, index) => {
            const starStart = index;
            const fill = Math.max(0, Math.min(1, displayValue - starStart));
            return (
              <span className={styles.star} key={index}>
                <Star className={styles.starBase} aria-hidden="true" />
                <span className={styles.starFill} style={{ width: `${fill * 100}%` }} aria-hidden="true">
                  <Star />
                </span>
                {[0.5, 1].map((step) => {
                  const nextValue = starStart + step;
                  return (
                    <button
                      key={step}
                      type="button"
                      className={step === 0.5 ? styles.halfLeft : styles.halfRight}
                      onMouseEnter={() => setHoverValue(nextValue)}
                      onFocus={() => setHoverValue(nextValue)}
                      onBlur={() => setHoverValue(null)}
                      onClick={() => onChange(nextValue)}
                      aria-label={`${nextValue.toFixed(1)} de 5 estrelas`}
                      aria-pressed={selectedValue === nextValue}
                    />
                  );
                })}
              </span>
            );
          })}
        </div>
        <output className={styles.value}>{selectedValue == null ? 'Sem nota' : `${selectedValue.toFixed(1)} / 5`}</output>
        <button type="button" className={styles.zeroButton} onClick={() => onChange(0)} aria-pressed={selectedValue === 0}>
          0
        </button>
        <button type="button" className={styles.clearButton} onClick={() => onChange(null)} disabled={selectedValue == null}>
          Limpar
        </button>
      </div>
    </fieldset>
  );
}
