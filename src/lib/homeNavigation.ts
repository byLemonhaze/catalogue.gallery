import { HOME_SECTION_IDS, type HomeSectionKey } from '../constants/homeSections';

export function scrollToHomeSection(section: HomeSectionKey, behavior: ScrollBehavior = 'smooth') {
    const container = document.getElementById('home-scroll-container');
    const sectionElement = document.getElementById(HOME_SECTION_IDS[section]);
    const target = sectionElement?.querySelector<HTMLElement>('[data-home-scroll-anchor="true"]') || sectionElement;
    if (!container || !target) return;

    const navBottom = Array.from(document.querySelectorAll<HTMLElement>('[data-home-nav="true"]'))
        .map(element => element.getBoundingClientRect())
        .find(rect => rect.width > 0 && rect.height > 0)?.bottom ?? 0;
    const top = section === 'hero' ? 0 : Math.max(0,
        container.scrollTop + target.getBoundingClientRect().top - navBottom - 18,
    );
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    container.scrollTo({ top, behavior: reduceMotion ? 'instant' : behavior });
}
