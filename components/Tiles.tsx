export default function Tiles() {
  return (
    <div className="tiles" aria-hidden="true">
      <svg preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="girih" width="30" height="30" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="7" y="7" width="16" height="16" />
              <rect x="7" y="7" width="16" height="16" transform="rotate(45 15 15)" />
              <circle cx="15" cy="15" r="2.6" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#girih)" />
      </svg>
    </div>
  );
}
