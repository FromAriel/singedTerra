export type OnlineRouteId = 'create' | 'join-code' | 'browse';

export interface OnlineRouteAlternative {
  id: OnlineRouteId;
  label: string;
  onClick: () => void;
}

export function buildOnlineRouteActions(
  primary: HTMLButtonElement | null,
  alternatives: readonly OnlineRouteAlternative[],
): HTMLElement {
  const root = document.createElement('div');
  root.className = 'lobby-online-actions';

  if (primary) {
    primary.classList.add('lobby-online-primary');
    root.append(primary);
  }

  const navigation = document.createElement('nav');
  navigation.className = 'lobby-online-alternatives';
  navigation.setAttribute('aria-label', 'Other ways to play online');

  const label = document.createElement('p');
  label.className = 'lobby-online-alternatives-label';
  label.textContent = 'Other ways to play online';

  const buttons = document.createElement('div');
  buttons.className = 'lobby-online-alternatives-buttons';
  for (const alternative of alternatives) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lobby-btn secondary';
    button.dataset.onlineRoute = alternative.id;
    button.textContent = alternative.label;
    button.addEventListener('click', alternative.onClick);
    buttons.append(button);
  }

  navigation.append(label, buttons);
  root.append(navigation);
  return root;
}
