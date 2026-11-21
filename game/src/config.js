// Festival Lampion — shared constants for the spot-the-difference game.
var FL = window.FL || (window.FL = {});

FL.CONFIG = {
  levelCount: 5,
  differencesPerLevel: 7,
  levelTimeSeconds: 90,
  hintsPerLevel: 3,
  pointsPerFind: 100,
  timeBonusPerSecond: 10,
  wrongClickPenaltySeconds: 5,
  hintPulseMs: 2000,
  wrongMarkMs: 900,
  viewWidth: 640,
  viewHeight: 540,
  starThresholds: { three: 30, two: 15 },
  shots: ['start', 'play', 'play2', 'win'],
  colors: {
    background: '#14102b',
    panel: '#1d1740',
    panelBorder: '#3a2f6b',
    gold: '#f5b942',
    red: '#e5484d',
    green: '#3fce7c',
    ink: '#f3ead8',
    muted: '#a99fd0'
  }
};
