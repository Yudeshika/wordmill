// Word Hive icon pack — 31 icons on a 24 px grid.
// <Icon name="hint" />                      mono, follows CSS color
// <Icon name="hint" accent="#FFC93C" />     duotone (honey fill)
// <Icon name="coin" size={32} color="#3B2412" accent="#FFC93C" label="Coins" />

const ICONS = {
  "back": "<path d=\"M15 5l-7 7 7 7\" stroke=\"{S}\"/>",
  "close": "<path d=\"M6 6l12 12M18 6L6 18\" stroke=\"{S}\"/>",
  "home": "<path d=\"M4 11L12 4l8 7v8.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5z\" fill=\"{A}\" stroke=\"{S}\"/><path d=\"M10 21v-5.5h4V21\" stroke=\"{S}\"/>",
  "settings": "<polygon points=\"12.72,4.74 14.79,2.81 16.53,3.53 16.63,6.36 17.64,7.37 20.47,7.47 21.19,9.21 19.26,11.28 19.26,12.72 21.19,14.79 20.47,16.53 17.64,16.63 16.63,17.64 16.53,20.47 14.79,21.19 12.72,19.26 11.28,19.26 9.21,21.19 7.47,20.47 7.37,17.64 6.36,16.63 3.53,16.53 2.81,14.79 4.74,12.72 4.74,11.28 2.81,9.21 3.53,7.47 6.36,7.37 7.37,6.36 7.47,3.53 9.21,2.81 11.28,4.74\" fill=\"{A}\" stroke=\"{S}\"/><circle cx=\"12\" cy=\"12\" r=\"3\" stroke=\"{S}\"/>",
  "play": "<path d=\"M8 5.5v13l10.5-6.5z\" fill=\"{A}\" stroke=\"{S}\"/>",
  "info": "<circle cx=\"12\" cy=\"12\" r=\"9.5\" fill=\"{A}\" stroke=\"{S}\"/><path d=\"M12 11v5.5\" stroke=\"{S}\"/><circle cx=\"12\" cy=\"7.6\" r=\"1.3\" fill=\"{S}\" stroke=\"none\"/>",
  "share": "<path d=\"M12 3.5v11M8 7.5l4-4 4 4\" stroke=\"{S}\"/><path d=\"M7.5 10.5H6a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6.5a2 2 0 0 0-2-2h-1.5\" stroke=\"{S}\"/>",
  "hint": "<path d=\"M12 2.8a6.2 6.2 0 0 0-3.7 11.2c.7.5 1.2 1.3 1.2 2.2h5c0-.9.5-1.7 1.2-2.2A6.2 6.2 0 0 0 12 2.8z\" fill=\"{A}\" stroke=\"{S}\"/><path d=\"M9.5 19h5M10.5 21.5h3\" stroke=\"{S}\"/>",
  "shuffle": "<path d=\"M4 8h15m0 0l-3.5-3.5M19 8l-3.5 3.5M20 16H5m0 0l3.5-3.5M5 16l3.5 3.5\" stroke=\"{S}\"/>",
  "bonus-jar": "<rect x=\"8\" y=\"2.5\" width=\"8\" height=\"3.5\" rx=\"1.2\" fill=\"{S}\" stroke=\"none\"/><path d=\"M14 13.5h4v4.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-4.5h8z\" fill=\"{AF}\" stroke=\"none\"/><path d=\"M6 8h12v10.5a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z\" stroke=\"{S}\"/>",
  "coin": "<circle cx=\"12\" cy=\"12\" r=\"9.5\" fill=\"{A}\" stroke=\"{S}\"/><polygon points=\"12.00,7.40 15.98,9.70 15.98,14.30 12.00,16.60 8.02,14.30 8.02,9.70\" stroke=\"{S}\"/>",
  "letter-tile": "<polygon points=\"12.00,2.00 20.66,7.00 20.66,17.00 12.00,22.00 3.34,17.00 3.34,7.00\" fill=\"{A}\" stroke=\"{S}\"/><path d=\"M9.2 9l1.3 6 1.5-4 1.5 4 1.3-6\" stroke=\"{S}\" stroke-width=\"1.8\"/>",
  "check": "<circle cx=\"12\" cy=\"12\" r=\"9.5\" fill=\"{A}\" stroke=\"{S}\"/><path d=\"M7.5 12.3l3 3 6-6.3\" stroke=\"{S}\"/>",
  "star": "<path d=\"M12 3l2.7 5.6 6.1.8-4.5 4.2 1.2 6.1L12 16.8l-5.5 2.9 1.2-6.1-4.5-4.2 6.1-.8z\" fill=\"{A}\" stroke=\"{S}\"/>",
  "hive-map": "<polygon points=\"12.00,2.00 20.66,7.00 20.66,17.00 12.00,22.00 3.34,17.00 3.34,7.00\" stroke=\"{S}\"/><polygon points=\"12.00,7.60 15.81,9.80 15.81,14.20 12.00,16.40 8.19,14.20 8.19,9.80\" fill=\"{A}\" stroke=\"{S}\"/>",
  "word-book": "<path d=\"M3 5h5.5A3.5 3.5 0 0 1 12 8.5V21a2.5 2.5 0 0 0-2.5-2.5H3z\" fill=\"{A}\" stroke=\"{S}\"/><path d=\"M21 5h-5.5A3.5 3.5 0 0 0 12 8.5V21a2.5 2.5 0 0 1 2.5-2.5H21z\" fill=\"{A}\" stroke=\"{S}\"/>",
  "daily": "<path d=\"M3.5 9.5V8a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v1.5z\" fill=\"{AF}\" stroke=\"none\"/><rect x=\"3.5\" y=\"5\" width=\"17\" height=\"16\" rx=\"3\" stroke=\"{S}\"/><path d=\"M3.5 9.5h17M8 2.8v4.4M16 2.8v4.4\" stroke=\"{S}\"/><polygon points=\"12.00,12.60 14.25,13.90 14.25,16.50 12.00,17.80 9.75,16.50 9.75,13.90\" fill=\"{S}\" stroke=\"none\"/>",
  "streak": "<path d=\"M12 2.5c.9 3.6 6 5.2 6 10.6a6 6 0 0 1-12 0c0-3.1 1.9-4.6 2.2-7.3 1.3 1.2 1.9 2.4 1.9 3.6 1.2-1.7 2.1-4.1 1.9-6.9z\" fill=\"{A}\" stroke=\"{S}\"/><path d=\"M12 20.5a2.6 2.6 0 0 1-2.6-2.6c0-1.6 1.4-2.4 2.6-4.2 1.2 1.8 2.6 2.6 2.6 4.2a2.6 2.6 0 0 1-2.6 2.6z\" stroke=\"{S}\" stroke-width=\"1.6\"/>",
  "crown": "<path d=\"M4 17.5L3 7.5l5 4.2L12 4.5l4 7.2 5-4.2-1 10z\" fill=\"{A}\" stroke=\"{S}\"/><path d=\"M4.5 21h15\" stroke=\"{S}\"/>",
  "lock": "<rect x=\"5\" y=\"10.5\" width=\"14\" height=\"10.5\" rx=\"2.5\" fill=\"{A}\" stroke=\"{S}\"/><path d=\"M8 10.5V7.5a4 4 0 0 1 8 0v3\" stroke=\"{S}\"/><circle cx=\"12\" cy=\"15.6\" r=\"1.4\" fill=\"{S}\" stroke=\"none\"/>",
  "sound": "<path d=\"M4 9.5h3.5L12 5.5v13l-4.5-4H4z\" fill=\"{A}\" stroke=\"{S}\"/><path d=\"M15.5 9a4.2 4.2 0 0 1 0 6M18.5 6.3a8 8 0 0 1 0 11.4\" stroke=\"{S}\"/>",
  "sound-off": "<path d=\"M4 9.5h3.5L12 5.5v13l-4.5-4H4z\" fill=\"{A}\" stroke=\"{S}\"/><path d=\"M16 9.5l5 5m0-5l-5 5\" stroke=\"{S}\"/>",
  "music": "<path d=\"M9 18V5.8l10.5-2.6v12.3\" stroke=\"{S}\"/><circle cx=\"6.5\" cy=\"18\" r=\"2.5\" fill=\"{A}\" stroke=\"{S}\"/><circle cx=\"17\" cy=\"15.5\" r=\"2.5\" fill=\"{A}\" stroke=\"{S}\"/>",
  "vibration": "<rect x=\"8\" y=\"3.5\" width=\"8\" height=\"17\" rx=\"2.2\" fill=\"{A}\" stroke=\"{S}\"/><path d=\"M4.8 8.5v7M2 10.5v3M19.2 8.5v7M22 10.5v3\" stroke=\"{S}\"/>",
  "motion": "<circle cx=\"15\" cy=\"12\" r=\"5.5\" fill=\"{A}\" stroke=\"{S}\"/><path d=\"M3 8h4.5M2 12h5M3 16h4.5\" stroke=\"{S}\"/>",
  "theme": "<path d=\"M12 3.5a8.5 8.5 0 0 1 0 17z\" fill=\"{AF}\" stroke=\"none\"/><circle cx=\"12\" cy=\"12\" r=\"8.5\" stroke=\"{S}\"/><path d=\"M12 3.5v17\" stroke=\"{S}\"/>",
  "text-size": "<path d=\"M2.5 19L7.5 6l5 13M4.5 14.5h6M14 19l3.5-8.5L21 19M15.3 16.2h4.4\" stroke=\"{S}\"/>",
  "replay": "<path d=\"M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4 9.3\" stroke=\"{S}\"/><path d=\"M4 4.5v4.8h4.8\" stroke=\"{S}\"/><path d=\"M10.5 9.3v5.4l4.3-2.7z\" fill=\"{A}\" stroke=\"{S}\" stroke-width=\"1.6\"/>",
  "export": "<rect x=\"3.5\" y=\"2.5\" width=\"10\" height=\"19\" rx=\"2.5\" fill=\"{A}\" stroke=\"{S}\"/><path d=\"M9.5 12h11m-3.5-3.5L20.5 12 17 15.5\" stroke=\"{S}\"/>",
  "reset": "<path d=\"M6 6.5l1 12.8A1.8 1.8 0 0 0 8.8 21h6.4a1.8 1.8 0 0 0 1.8-1.7L18 6.5\" fill=\"{A}\" stroke=\"{S}\"/><path d=\"M3.8 6.5h16.4M9.5 6.5V4.3a.8.8 0 0 1 .8-.8h3.4a.8.8 0 0 1 .8.8v2.2M10 10.5v6.5M14 10.5v6.5\" stroke=\"{S}\"/>",
  "bee": "<ellipse cx=\"8.4\" cy=\"6.6\" rx=\"2.6\" ry=\"3.6\" transform=\"rotate(-20 8.4 6.6)\" stroke=\"{S}\" stroke-width=\"1.6\"/><ellipse cx=\"13\" cy=\"6.2\" rx=\"2.4\" ry=\"3.4\" transform=\"rotate(18 13 6.2)\" stroke=\"{S}\" stroke-width=\"1.6\"/><ellipse cx=\"11\" cy=\"14.5\" rx=\"7.5\" ry=\"5.8\" fill=\"{A}\" stroke=\"{S}\"/><path d=\"M8.8 9.4v10.2M12.6 9.2v10.6\" stroke=\"{S}\"/><path d=\"M3.5 14.5H1.8\" stroke=\"{S}\"/><circle cx=\"15.8\" cy=\"13.4\" r=\"1.1\" fill=\"{S}\" stroke=\"none\"/>"
};

export const ICON_NAMES = Object.keys(ICONS);

export function Icon({ name, size = 24, color = 'currentColor', accent = 'none', strokeWidth = 2, label, style, ...rest }) {
  const body = ICONS[name];
  if (!body) return null;
  const af = accent === 'none' ? `${color}" fill-opacity="0.35` : accent;
  const html = body.replaceAll('{AF}', af).replaceAll('{A}', accent).replaceAll('{S}', color);
  return (
    <svg
      viewBox="0 0 24 24" width={size} height={size} fill="none"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}
      style={{ flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: html }}
      {...rest}
    />
  );
}
