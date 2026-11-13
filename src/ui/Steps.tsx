/** A numbered list of worked steps; `shown` limits how many are visible (for step-by-step reveal). */
export function Steps({ steps, shown }: { steps: string[]; shown?: number }) {
  const n = shown ?? steps.length;
  return (
    <ol className="steps" aria-label="Worked steps">
      {steps.map((s, i) => (
        <li key={i} className={i < n ? '' : 'hidden'}>
          <span className="n">{i + 1}</span>
          <span>{s}</span>
        </li>
      ))}
    </ol>
  );
}
