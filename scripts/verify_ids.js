const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const appJs = fs.readFileSync('js/app.js', 'utf8');

const regex = /getElementById\(['"]([^'"]+)['"]\)/g;
let match;
const ids = [];
while ((match = regex.exec(appJs)) !== null) {
  ids.push(match[1]);
}

const uniqueIds = [...new Set(ids)];
console.log('Total unique IDs in app.js:', uniqueIds.length);

const missing = uniqueIds.filter(id => {
  // Ignore dynamically generated IDs like pawn-player-X, map-pawn-player-X, board-cell-X, etc.
  if (id.startsWith('pawn-player-') || id.startsWith('map-pawn-player-') || id.startsWith('board-cell-') || id.startsWith('cell-owner-') || id.startsWith('local-nick-')) {
    return false;
  }
  return !html.includes(`id="${id}"`) && !html.includes(`id='${id}'`);
});

console.log('Missing static IDs in index.html:', missing);
