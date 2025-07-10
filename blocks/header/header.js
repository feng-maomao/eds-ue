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
  document.body.style.overflowY = expanded || isDesktop.matches ? '' : 'hidden';
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

  while (fragment.firstElementChild) {
    const section = fragment.firstElementChild;

    if (sectionIndex < classes.length) {
      // e.g. nav-brand, nav-sections, nav-tools
      section.classList.add(`nav-${classes[sectionIndex]}`);

      // Handle nav sections with mega menu
      if (classes[sectionIndex] === 'sections') {
        // Create mega menu with constructor parameters
        const megaMenu = new MegaMenu(parseHeadingStructure(section), section);
        nav.appendChild(megaMenu);
        // Clear the raw section content, will be recreated by MegaMenu once added to the DOM
        section.textContent = '';
      }

      sectionIndex += 1;
    }

    nav.appendChild(section);
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
  <span class="nav-hamburger-icon"></span>
  </button>`;

  hamburger.addEventListener('click', () => toggleMenu(nav));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  // prevent mobile nav behavior on window resize
  toggleMenu(nav, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
