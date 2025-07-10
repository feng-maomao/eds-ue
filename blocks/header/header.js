import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { parseHeadingStructure } from './header-utils.js';
import MegaMenu from './mega-menu.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav);
      nav.querySelector('button').focus();
    } else {
      // Close mega menu on desktop
      const megaMenu = nav.querySelector('mega-menu');
      if (megaMenu) {
        megaMenu.closeMenus();
      }
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, false);
    }
  }
}

/**
 * Toggles the mobile nav menu
 * @param {Element} nav The container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null
    ? !forceExpanded
    : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');

  // Handle body overflow and scrollbar compensation
  if (expanded || isDesktop.matches) {
    // Menu is closing or we're on desktop - restore normal overflow
    document.body.style.overflowY = '';
    document.body.style.paddingRight = '';
  } else {
    // Menu is opening - prevent scrolling and compensate for scrollbar
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflowY = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }

  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  button.setAttribute(
    'aria-label',
    expanded ? 'Open navigation' : 'Close navigation',
  );

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';

  // Create basic nav structure
  const classes = ['brand', 'sections', 'tools'];
  let sectionIndex = 0;
  let navSections = null;

  while (fragment.firstElementChild) {
    const section = fragment.firstElementChild;

    if (sectionIndex < classes.length) {
      // e.g. nav-brand, nav-sections, nav-tools
      section.classList.add(`nav-${classes[sectionIndex]}`);

      // Store nav sections for later processing
      if (classes[sectionIndex] === 'sections') {
        navSections = section;
      }

      sectionIndex += 1;
    }

    nav.appendChild(section);
  }

  // Process nav sections with mega menu after the loop
  if (navSections) {
    const navigationData = await parseHeadingStructure(navSections);
    const megaMenu = new MegaMenu(navigationData, navSections);
    nav.appendChild(megaMenu);
    // Clear the raw section content, will be recreated by MegaMenu once added to the DOM
    navSections.textContent = '';
  }

  // hamburger for mobile - add to nav tools
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
  <span class="nav-hamburger-icon"></span>
  </button>`;

  hamburger.addEventListener('click', () => toggleMenu(nav));

  // Add hamburger to nav tools
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    navTools.appendChild(hamburger);
  } else {
    nav.appendChild(hamburger);
  }
  nav.setAttribute('aria-expanded', 'false');

  // prevent mobile nav behavior on window resize
  toggleMenu(nav, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
