import clsx from 'clsx'

const ICONS = {
  dashboard:    { rects: [[3,3,7,7,1],[14,3,7,7,1],[3,14,7,7,1],[14,14,7,7,1]] },
  tasks:        { paths: ['M9 12l2 2 4-4','M5 7h14M5 12h7M5 17h10'] },
  calendar:     { paths: ['M16 2v4M8 2v4M3 10h18'], rect: [3,4,18,18,2] },
  clock:        { circle: [12,12,8], paths: ['M12 8v4l2 2'] },
  star:         { paths: ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'] },
  chart:        { paths: ['M3 3v18h18','M7 16l4-4 4 4 4-6'] },
  bell:         { paths: ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 0 1-3.46 0'] },
  download:     { paths: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M7 10l5 5 5-5','M12 15V3'] },
  user:         { paths: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'], circle: [12,7,4] },
  logout:       { paths: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4','M16 17l5-5-5-5','M21 12H9'] },
  edit:         { paths: ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7','M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'] },
  trash:        { paths: ['M3 6h18','M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2'] },
  plus:         { paths: ['M12 5v14','M5 12h14'] },
  close:        { paths: ['M18 6L6 18','M6 6l12 12'] },
  check:        { paths: ['M20 6L9 17l-5-5'] },
  chevDown:     { paths: ['M6 9l6 6 6-6'] },
  chevLeft:     { paths: ['M15 18l-6-6 6-6'] },
  chevRight:    { paths: ['M9 18l6-6-6-6'] },
  search:       { paths: ['M21 21l-4.35-4.35'], circle: [11,11,8] },
  filter:       { paths: ['M22 3H2l8 9.46V19l4 2v-8.54L22 3z'] },
  settings:     { paths: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z','M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'] },
  refresh:      { paths: ['M1 4v6h6','M3.51 15a9 9 0 1 0 .49-3.56'] },
  play:         { polygon: '5 3 19 12 5 21 5 3' },
  pause:        { paths: ['M6 4h4v16H6z','M14 4h4v16h-4z'] },
  eye:          { paths: ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'], circle: [12,12,3] },
  mail:         { paths: ['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z','M22 6l-10 7L2 6'] },
  warning:      { paths: ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z','M12 9v4','M12 17h.01'] },
  dots:         { circles: [[5,12,1],[12,12,1],[19,12,1]] },
  lock:         { paths: ['M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z','M8 11V7a4 4 0 0 1 8 0v4'] },
}

export default function Icon({ name, size = 17, color = 'currentColor', className = '', strokeWidth = 1.8 }) {
  const def = ICONS[name]
  if (!def) return null

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={clsx('shrink-0', className)}
    >
      {def.paths?.map((d, i)     => <path key={i} d={d} />)}
      {def.circle && <circle cx={def.circle[0]} cy={def.circle[1]} r={def.circle[2]} />}
      {def.circles?.map(([cx,cy,r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill={color} stroke="none" />)}
      {def.rect    && <rect x={def.rect[0]} y={def.rect[1]} width={def.rect[2]} height={def.rect[3]} rx={def.rect[4]} />}
      {def.rects?.map(([x,y,w,h,rx], i) => <rect key={i} x={x} y={y} width={w} height={h} rx={rx} />)}
      {def.polygon && <polygon points={def.polygon} fill={color} stroke="none" />}
    </svg>
  )
}
