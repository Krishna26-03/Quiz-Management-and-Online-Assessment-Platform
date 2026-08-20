const RADIUS = 68;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TimerRing({ secondsLeft, totalSeconds }) {
  const ratio = totalSeconds > 0 ? Math.max(0, Math.min(1, secondsLeft / totalSeconds)) : 0;
  const offset = CIRCUMFERENCE * (1 - ratio);
  const urgent = secondsLeft <= 60;
  const warn = !urgent && secondsLeft <= totalSeconds * 0.2;

  const mins = Math.floor(Math.max(0, secondsLeft) / 60);
  const secs = Math.max(0, secondsLeft) % 60;

  return (
    <div className="timer-ring">
      <svg viewBox="0 0 160 160">
        <circle className="timer-ring-track" cx="80" cy="80" r={RADIUS} />
        <circle
          className="timer-ring-progress"
          cx="80" cy="80" r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ stroke: urgent ? 'var(--danger)' : warn ? '#facc15' : 'var(--accent)' }}
        />
      </svg>
      <div className="timer-ring-label">
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        <span>time left</span>
      </div>
    </div>
  );
}
