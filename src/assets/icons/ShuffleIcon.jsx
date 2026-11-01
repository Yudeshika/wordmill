export default function ShuffleIcon({ size = 20, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 7h4l8 10h4" />
      <path d="M4 17h4l3-4" />
      <path d="M15 7h5" />
      <path d="M18 4l3 3-3 3" />
      <path d="M18 14l3 3-3 3" />
    </svg>
  );
}
