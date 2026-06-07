export function pushState(state, url) {
    window.history.pushState(state, "", url);
}
