const checkAndAwardBadges = async (supabase, userId, profileStats) => {
  if (!userId || String(userId).startsWith('ai_')) return [];

  try {
    const [{ data: badges }, { data: userBadges }] = await Promise.all([
      supabase.from('arena_badges').select('*'),
      supabase.from('user_arena_badges').select('badge_id').eq('user_id', userId)
    ]);

    const earnedBadgeIds = new Set((userBadges || []).map(b => b.badge_id));
    const newAwards = [];
    const unlockedBadges = [];

    for (const badge of (badges || [])) {
      if (earnedBadgeIds.has(badge.id)) continue;

      let earned = false;
      if (badge.criteria_type === 'wins' && profileStats.wins >= badge.criteria_value) {
        earned = true;
      } else if (badge.criteria_type === 'streak' && profileStats.currentStreak >= badge.criteria_value) {
        earned = true;
      }

      if (earned) {
        newAwards.push({
          user_id: userId,
          badge_id: badge.id
        });
        unlockedBadges.push(badge);
      }
    }

    if (newAwards.length > 0) {
      const { error } = await supabase.from('user_arena_badges').insert(newAwards);
      if (error) console.error('Error saving badges:', error);
    }

    return unlockedBadges;
  } catch (err) {
    console.error('Error checking badges:', err);
    return [];
  }
};

module.exports = { checkAndAwardBadges };
