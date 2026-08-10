export default function SettingsIcon({
  size = 24,
  className = '',
  title = 'Settings',
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label={title}
      role="img"
      {...props}
    >
      <title>{title}</title>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.75l1.05 1.76a1.6 1.6 0 0 0 1.59.76l2-.32 1.1 1.9-1.34 1.52a1.6 1.6 0 0 0-.31 1.73l.8 1.86a1.6 1.6 0 0 0 1.41.98H21v2.2l-1.7.34a1.6 1.6 0 0 0-1.2 1.15l-.48 1.95-2.14.4-.98-1.64a1.6 1.6 0 0 0-1.55-.78l-2.03.16a1.6 1.6 0 0 0-1.39.98l-.77 1.88-2.14-.4-.49-1.95a1.6 1.6 0 0 0-1.2-1.15L3 16.75v-2.2h1.7a1.6 1.6 0 0 0 1.41-.98l.8-1.86a1.6 1.6 0 0 0-.31-1.73L5.26 8.46l1.1-1.9 2 .32a1.6 1.6 0 0 0 1.59-.76L11 4.75 12 2.75z" />
    </svg>
  );
}
