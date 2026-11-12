// Pointer users get the caret/hover treatment; keyboard users retain a clear focus cue.
export function initInputModality() {
    document.documentElement.dataset.input = 'pointer';
    document.addEventListener('pointerdown', () => { document.documentElement.dataset.input = 'pointer'; }, { capture: true, passive: true });
    document.addEventListener('keydown', event => {
        if (event.key === 'Tab' || event.key.startsWith('Arrow')) document.documentElement.dataset.input = 'keyboard';
    }, true);
}
