import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export function ScrollToTop() {
  const location = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // If the navigation action is PUSH (new link) or REPLACE, scroll to top.
    // If the action is POP (back button), do nothing (let browser restore scroll).
    if (navType !== 'POP') {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, navType]);

  return null;
}
