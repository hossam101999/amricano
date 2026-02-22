import { useMemo } from 'react';

function Confetti() {
  const pieces = useMemo(
    () =>
      [...Array(50)].map(() => ({
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 3}s`,
        duration: `${3 + Math.random() * 2}s`,
        color: ['#ff0', '#f0f', '#0ff', '#f00', '#0f0', '#00f'][Math.floor(Math.random() * 6)],
      })),
    []
  );
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {pieces.map((piece, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: piece.left,
            top: '-10px',
            animationDelay: piece.delay,
            animationDuration: piece.duration,
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: piece.color,
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default Confetti;
