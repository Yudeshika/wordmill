export default function VibrateIcon({
  size = 24,
  className = '',
  title = 'Vibrate',
  ...props
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label={title}
      role="img"
      {...props}
    >
      <title>{title}</title>
      <rect x="8" y="3" width="8" height="18" rx="2" />
      <path d="M4 8v2" />
      <path d="M4 14v2" />
      <path d="M20 8v2" />
      <path d="M20 14v2" />
    </svg>
  );
}
