import { useState } from 'react';

/** Classify the navigation before the profile mounts, including browser Back. */
export function useProfileReturn(pathname: string) {
    const [visit, setVisit] = useState({ pathname, returning: false });
    if (visit.pathname !== pathname) {
        const returning = /^\/(artist|gallery)\/[^/]+\/world\/?$/.test(visit.pathname)
            && visit.pathname.replace(/\/world\/?$/, '') === pathname.replace(/\/$/, '');
        // A conditional render update avoids mounting a fresh vortex for one frame.
        setVisit({ pathname, returning });
        return returning;
    }
    return visit.returning;
}
