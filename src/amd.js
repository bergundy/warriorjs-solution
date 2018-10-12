
window = {};
window.require = () => {};
window.exports = window;

function define(m, arr, f) {
  const exports = {}
  f(...arr.map(m => m === 'exports' ? exports : window[m]));
  window[m] = exports;
  if (window.player) {
    Player = window.player.Player;
  }
}
