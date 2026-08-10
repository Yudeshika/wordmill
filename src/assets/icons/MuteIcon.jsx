export default function MuteIcon({
  size = 24,
  className = '',
  title = 'Mute',
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
      <path d="M11 5.5L7.7 8H4.5v8h3.2l3.3 2.5c.7.53 1.7.03 1.7-.85V6.35c0-.88-1-.38-1.7-.85Z" />
      <path d="M16.5 9.5l4 4" />
      <path d="M20.5 9.5l-4 4" />
    </svg>
  );
}
