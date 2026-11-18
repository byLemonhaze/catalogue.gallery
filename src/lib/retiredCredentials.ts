/** Remove credentials saved by the retired editor without reading their values. */
export function clearRetiredCredentials() {
    try { window.sessionStorage.removeItem('content-lab:xai-api-key'); } catch { /* Storage may be disabled. */ }
}
