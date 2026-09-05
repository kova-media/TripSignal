type BrandProps = {
  compact?: boolean;
  showWordmark?: boolean;
};

export default function Brand({ compact = false, showWordmark = true }: BrandProps) {
  return (
    <span className={compact ? 'brand brand-compact' : 'brand'}>
      <svg className="brand-symbol" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <g className="brand-signal" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
          <path d="M28 25C16 33 11 44 11 56" />
          <path d="M21 17C7 27 2 41 2 56" />
          <path d="M72 25C84 33 89 44 89 56" />
          <path d="M79 17C93 27 98 41 98 56" />
        </g>
        <path className="brand-plane" fill="currentColor" d="M50 7c3.4 0 5.5 3 5.5 7.1v19.1l28.2 12.1c2.8 1.2 2.1 4.2-.8 4.2H55.5v19.1l9.2 9.4v5.1L50 77.8 35.3 84v-5.1l9.2-9.4V49.5H17.1c-2.9 0-3.6-3-.8-4.2l28.2-12.1V14.1C44.5 10 46.6 7 50 7Z" />
      </svg>
      {showWordmark && <span className="brand-wordmark"><strong>Trip</strong><span>Signal</span></span>}
    </span>
  );
}
