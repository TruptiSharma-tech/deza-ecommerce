import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Force scroll on navigation change
        const resetScroll = () => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            document.body.scrollTo({ top: 0, left: 0, behavior: 'instant' });

            // Check for internal Admin content wrapper
            const adminContent = document.querySelector('.admin-content');
            if (adminContent) {
                adminContent.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            }
        };

        // Fire immediately
        resetScroll();

        // Fire again slightly after to catch React.lazy() suspended render injection 
        const timeoutId = setTimeout(resetScroll, 100);

        return () => clearTimeout(timeoutId);
    }, [pathname]);

    return null;
};

export default ScrollToTop;
