import type { AiDifficulty } from '@shared/types/GameState';
import { buildOnlineRouteActions } from './LobbyOnlineRouteActions';

export interface LobbyCreateViewOptions {
  minPlayers: number;
  maxPlayers: number;
  playerCount: number;
  botCount: number;
  botDifficulty: AiDifficulty;
  visibility: 'public' | 'private';
  busy: boolean;
  nameColor: HTMLElement;
  garage: HTMLElement;
  advancedFields: readonly HTMLElement[];
  status: HTMLElement;
  onPlayerCountChange: (count: number) => void;
  onBotCountChange: (count: number) => void;
  onBotDifficultyChange: (difficulty: AiDifficulty) => void;
  onVisibilityChange: (visibility: 'public' | 'private') => void;
  onCreate: () => void;
  onJoin: () => void;
  onBrowse: () => void;
}

export function buildLobbyCreateView(options: LobbyCreateViewOptions): HTMLElement {
  const root = document.createElement('div');

  const sub = document.createElement('p');
  sub.className = 'lobby-sub';
  sub.textContent = 'Create a new online room and invite friends.';
  root.append(sub, options.nameColor, options.garage);

  const playerField = document.createElement('div');
  playerField.className = 'lobby-field';
  const playerLabel = document.createElement('label');
  playerLabel.textContent = 'Players';
  const playerSelect = document.createElement('select');
  for (let count = options.minPlayers; count <= options.maxPlayers; count += 1) {
    const option = document.createElement('option');
    option.value = String(count);
    option.textContent = String(count);
    if (count === options.playerCount) option.selected = true;
    playerSelect.append(option);
  }
  playerSelect.addEventListener('change', () => {
    options.onPlayerCountChange(Number(playerSelect.value));
  });
  playerField.append(playerLabel, playerSelect);
  root.append(playerField);

  const botField = document.createElement('div');
  botField.className = 'lobby-field';
  const botLabel = document.createElement('label');
  botLabel.textContent = 'CPU opponents';
  const botSelect = document.createElement('select');
  for (let count = 0; count <= options.playerCount - 1; count += 1) {
    const option = document.createElement('option');
    option.value = String(count);
    option.textContent = String(count);
    if (count === options.botCount) option.selected = true;
    botSelect.append(option);
  }
  botSelect.addEventListener('change', () => {
    options.onBotCountChange(Number(botSelect.value));
  });
  botField.append(botLabel, botSelect);
  if (options.botCount > 0) {
    const difficultySelect = document.createElement('select');
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const option = document.createElement('option');
      option.value = difficulty;
      option.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
      if (difficulty === options.botDifficulty) option.selected = true;
      difficultySelect.append(option);
    }
    difficultySelect.addEventListener('change', () => {
      options.onBotDifficultyChange(difficultySelect.value as AiDifficulty);
    });
    botField.append(difficultySelect);
  }
  root.append(botField);

  const visibilityField = document.createElement('div');
  visibilityField.className = 'lobby-field';
  const visibilityLabel = document.createElement('label');
  visibilityLabel.textContent = 'Visibility';
  const visibilitySelect = document.createElement('select');
  for (const visibility of ['public', 'private'] as const) {
    const option = document.createElement('option');
    option.value = visibility;
    option.textContent = visibility === 'public' ? 'Public' : 'Private';
    if (visibility === options.visibility) option.selected = true;
    visibilitySelect.append(option);
  }
  visibilitySelect.addEventListener('change', () => {
    options.onVisibilityChange(visibilitySelect.value as 'public' | 'private');
  });
  visibilityField.append(visibilityLabel, visibilitySelect);
  root.append(visibilityField);

  const advanced = document.createElement('details');
  advanced.className = 'lobby-advanced';
  const summary = document.createElement('summary');
  summary.textContent = 'Advanced settings';
  advanced.append(summary, ...options.advancedFields);
  root.append(advanced, options.status);

  const createButton = document.createElement('button');
  createButton.type = 'button';
  createButton.className = 'lobby-btn';
  createButton.textContent = options.busy ? 'Creating...' : 'Create Room';
  createButton.disabled = options.busy;
  createButton.addEventListener('click', options.onCreate);

  root.append(buildOnlineRouteActions(createButton, [
    { id: 'join-code', label: 'Join with a code', onClick: options.onJoin },
    { id: 'browse', label: 'Browse public rooms', onClick: options.onBrowse },
  ]));
  return root;
}
