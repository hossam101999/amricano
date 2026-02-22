export function avatarColor(name) {
  const colors = [
    'bg-gradient-to-br from-pink-400 via-fuchsia-500 to-indigo-500',
    'bg-gradient-to-br from-green-400 via-teal-400 to-blue-500',
    'bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500',
    'bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400',
    'bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400',
    'bg-gradient-to-br from-red-400 via-rose-400 to-pink-400',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
