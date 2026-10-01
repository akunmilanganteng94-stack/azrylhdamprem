export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export function formatDate(timestamp: any): string {
  if (!timestamp) return '-';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return '-';
  }
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return 'Pagi';
  if (hour >= 11 && hour < 15) return 'Siang';
  if (hour >= 15 && hour < 18) return 'Sore';
  return 'Malam';
}

export interface UserRank {
  rankName: string;
  name: string;
  level: number;
  badgeColor: string;
  nextThreshold: number;
  currentProgressPercent: number;
  perk: string;
}

export function calculateUserRank(totalSpent: number = 0): UserRank {
  if (totalSpent >= 1000000) {
    return {
      rankName: 'SULTAN VIP',
      name: 'SULTAN VIP',
      level: 4,
      badgeColor: 'from-amber-400 via-yellow-300 to-amber-600 text-slate-950',
      nextThreshold: 1000000,
      currentProgressPercent: 100,
      perk: 'Prioritas Antrean #1 & Cashback Khusus'
    };
  } else if (totalSpent >= 250000) {
    return {
      rankName: 'GOLD MEMBER',
      name: 'GOLD MEMBER',
      level: 3,
      badgeColor: 'from-amber-300 to-yellow-500 text-amber-950',
      nextThreshold: 1000000,
      currentProgressPercent: Math.min(100, Math.round(((totalSpent - 250000) / 750000) * 100)),
      perk: 'Dukungan Prioritas CS'
    };
  } else if (totalSpent >= 50000) {
    return {
      rankName: 'SILVER MEMBER',
      name: 'SILVER MEMBER',
      level: 2,
      badgeColor: 'from-slate-200 to-slate-400 text-slate-900',
      nextThreshold: 250000,
      currentProgressPercent: Math.min(100, Math.round(((totalSpent - 50000) / 200000) * 100)),
      perk: 'Akses Promo Spesial'
    };
  } else {
    return {
      rankName: 'BRONZE MEMBER',
      name: 'BRONZE MEMBER',
      level: 1,
      badgeColor: 'from-emerald-500 to-green-600 text-white',
      nextThreshold: 50000,
      currentProgressPercent: Math.min(100, Math.round((totalSpent / 50000) * 100)),
      perk: 'Member Baru AZRYLPREM'
    };
  }
}
