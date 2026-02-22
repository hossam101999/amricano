function AchievementBadge({ icon, title, description }) {
  return (
    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg p-3 text-white shadow-lg animate-scaleIn">
      <div className="text-3xl mb-1">{icon}</div>
      <div className="font-bold text-sm">{title}</div>
      <div className="text-xs opacity-90">{description}</div>
    </div>
  );
}

export default AchievementBadge;
