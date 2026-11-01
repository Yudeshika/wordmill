export default function CloseIcon({
  size = 24,
  className = '',
  title = 'Close',
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
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label={title}
      role="img"
      {...props}
    >
      <title>{title}</title>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}
