let colorIndex = 0;
const PALETTE = [
  '#18453B', '#FF6B35', '#4CAF50', '#2196F3', '#9C27B0', '#1E3A5F', '#E65100',
  '#2E7D32', '#00695C', '#1565C0', '#6A1B9A', '#C62828', '#00897B', '#455A64',
  '#AD1457', '#37474F', '#0277BD', '#5D4037', '#F57C00', '#4527A0',
];

function source(partial) {
  colorIndex += 1;
  return {
    filterMode: 'all',
    priority: 50,
    headless: false,
    options: {},
    color: PALETTE[colorIndex % PALETTE.length],
    ...partial,
  };
}

module.exports = { source };
