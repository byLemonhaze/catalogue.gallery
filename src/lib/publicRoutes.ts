/** Preserve old published links while giving every public surface one canonical name. */
export function publicPath(path: string) {
    return path.replace(/^\/blog(?=\/|[?#]|$)/, '/stories').replace(/^\/info(?=\/|[?#]|$)/, '/about');
}
