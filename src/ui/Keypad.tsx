/** On-screen keypad so the phone keyboard is not needed. Extra keys appear for ratios and formulas. */
export type KeypadMode = 'number' | 'ratio' | 'expression';

export function Keypad({ onKey, onDelete, allowFraction = true, allowPercent = true, mode = 'number', letters = ['n'] }: {
  onKey: (k: string) => void;
  onDelete: () => void;
  allowFraction?: boolean;
  allowPercent?: boolean;
  mode?: KeypadMode;
  letters?: string[];
}) {
  type Key = { k: string; label?: string; cls?: string; aria?: string } | null;
  const special: Key[] =
    mode === 'ratio' ? [{ k: ':', cls: 'alt', aria: 'Ratio colon' }, null, null, null]
    : mode === 'expression' ? [...letters.slice(0, 2).map((l) => ({ k: l, cls: 'alt' })), { k: '+', cls: 'alt', aria: 'Plus' }, ...(letters.length > 1 ? [] : [{ k: '×', cls: 'alt', aria: 'Times' }]), { k: '(', label: '( )', cls: 'alt', aria: 'Brackets' }]
    : [];
  const keys: Key[] = [
    ...special,
    { k: '7' }, { k: '8' }, { k: '9' }, { k: 'del', label: '⌫', cls: 'del', aria: 'Delete' },
    { k: '4' }, { k: '5' }, { k: '6' }, allowFraction ? { k: '/', label: '⁄', cls: 'alt', aria: 'Fraction bar' } : null,
    { k: '1' }, { k: '2' }, { k: '3' }, allowPercent ? { k: '%', cls: 'alt' } : null,
    { k: '-', label: '−', cls: 'alt', aria: 'Minus' }, { k: '0' }, { k: '.', label: '•', aria: 'Decimal point' }, mode === 'expression' ? { k: ')', cls: 'alt', aria: 'Close bracket' } : null,
  ];
  return (
    <div className="keypad" role="group" aria-label="Keypad">
      {keys.map((key, i) =>
        key ? (
          <button
            key={i}
            type="button"
            className={`key ${key.cls ?? ''}`}
            aria-label={key.aria ?? key.k}
            onClick={() => (key.k === 'del' ? onDelete() : onKey(key.k))}
          >
            {key.label ?? key.k}
          </button>
        ) : (
          <span key={i} />
        ),
      )}
    </div>
  );
}
