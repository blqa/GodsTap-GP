export default function NfcArcs({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="9.5" cy="14" r="1.9" fill="white" />
      <g stroke="white" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12.56 11.43A4 4 0 0 1 12.56 16.57" />
        <path d="M15.25 9.18A7.5 7.5 0 0 1 15.25 18.82" strokeOpacity="0.8" />
        <path d="M17.93 6.93A11 11 0 0 1 17.93 21.07" strokeOpacity="0.55" />
      </g>
    </svg>
  );
}
