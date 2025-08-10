export function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    productivity: '📈',
    communication: '💬',
    developer: '👨‍💻',
    data: '📊',
    storage: '🗂️',
    finance: '💵',
    crm: '📇',
    ai: '🤖',
  };
  return map[category?.toLowerCase?.()] || '🔧';
}
