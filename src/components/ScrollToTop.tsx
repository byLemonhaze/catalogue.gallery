import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType, type Location } from 'react-router-dom';

export function ScrollToTop() {
  const location = useLocation();
  const navType = useNavigationType();
  const previous = useRef(location);

  useEffect(() => {
    const background = (previous.current.state as { backgroundLocation?: Location } | null)?.backgroundLocation;
    previous.current = location;
    // Explicit profile dismissal restores the still-mounted page at its existing scroll position.
    if (background && background.pathname === location.pathname && background.search === location.search && background.hash === location.hash) return;
    // If the navigation action is PUSH (new link) or REPLACE, scroll to top.
    // If the action is POP (back button), do nothing (let browser restore scroll).
    if (navType !== 'POP' && !(location.state as { backgroundLocation?: unknown } | null)?.backgroundLocation) {
      window.scrollTo(0, 0);
    }
  }, [location, navType]);

  return null;
}
