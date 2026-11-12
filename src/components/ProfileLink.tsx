import { useId } from 'react';
import { Link, useLocation, type LinkProps } from 'react-router-dom';
import type { Artist } from '../hooks/useArtists';
import { profilePath } from '../lib/profilePresentation';
export function ProfileLink({ artist, children, ...props }: Omit<LinkProps, 'to'> & {
    artist: Artist;
}) {
    const location = useLocation();
    const openerId = useId();
    return <Link {...props} id={openerId} to={profilePath(artist)} state={{ backgroundLocation: location, profileOpener: openerId }} data-profile-id={artist.id}>{children}</Link>;
}
