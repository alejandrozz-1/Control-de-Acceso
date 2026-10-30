export function normalizePublicUrl() {
  if (window.location.pathname !== '/') {
    window.history.replaceState(window.history.state, '', '/');
  }
}
