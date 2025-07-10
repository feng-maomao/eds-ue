import { loadCSS } from '../../scripts/aem.js';

/**
 * MegaMenu Web Component
 *
 * A reusable web component for complex navigation with dropdown menus.
 * Co-located with the header block for better organization.
 *
 * @example
 * // Usage in header.js (Constructor approach - recommended)
 * const megaMenu = new MegaMenu(parsedNavigationData, navSectionsElement);
 * nav.appendChild(megaMenu);
 *
 * // Alternative usage (Property-based approach)
 * const megaMenu = document.createElement('mega-menu');
 * megaMenu.navData = parsedNavigationData;
 * megaMenu.navSections = navSectionsElement;
 * nav.appendChild(megaMenu);
 *
 * @description
 * The component expects two properties to be set before being added to the DOM:
 *
 * - `navData`: Array of navigation data parsed from flat heading structure (h1/h2/h3/h4/p)
 * - `navSections`: DOM element where level 1 navigation items will be rendered
 *
 * Data structure for navData:
 * ```
 * [
 *   {
 *     text: "Level 1 Item",
 *     href: "#",
 *     hasLink: true,
 *     icon: DOMElement,
 *     description: "Optional description text from paragraph without link",
 *     overviewLink: {
 *       text: "Overview link text",
 *       href: "#overview",
 *       hasLink: true
 *     },
 *     hasSubmenu: true,
 *     children: [
 *       {
 *         text: "Level 2 Item",
 *         href: "#",
 *         hasLink: true,
 *         icon: DOMElement,
 *         description: "Optional description from paragraph without link",
 *         overviewLink: {
 *           text: "Level 2 overview link",
 *           href: "#level2-overview",
 *           hasLink: true
 *         },
 *         children: [
 *           {
 *             text: "Level 3 Item",
 *             href: "#",
 *             hasLink: true,
 *             icon: DOMElement,
 *             description: "Optional description from paragraph without link",
 *             overviewLink: {
 *               text: "Level 3 overview link",
 *               href: "#level3-overview",
 *               hasLink: true
 *             },
 *             children: [...]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * ]
 * ```
 *
 * The component automatically initializes when connected to the DOM via connectedCallback().
 * It creates progressive disclosure navigation with 4 levels (L1→L2→L3→L4) and handles
 * desktop/mobile responsive behavior.
 *
 * @param {Array} [navData] - Optional. Array of navigation data parsed from flat heading structure
 * @param {HTMLElement} [navSections] - Optional. DOM element where level 1 navigation items
 *   will be rendered
 */
class MegaMenu extends HTMLElement {
  constructor(navData = null, navSections = null) {
    super();
    this.activeSection = null;
    this.activeLevel2 = null;
    this.activeLevel3 = null;
    this.isDesktop = window.matchMedia('(min-width: 900px)');

    // Set data if provided in constructor
    if (navData) this.navData = navData;
    if (navSections) this.navSections = navSections;
  }

  async connectedCallback() {
    // Load component styles
    const cssPath = `${
      window.hlx?.codeBasePath || ''
    }/blocks/header/mega-menu.css`;
    await loadCSS(cssPath);

    // Process navigation if data is available
    if (this.navData && this.navSections) {
      this.#processNavigation(this.navData, this.navSections);
    }

    this.#setupEventListeners();
  }

  #processNavigation(navigationData, navSections) {
    // Initially hide the web component
    this.style.display = 'none';
    // Create navigation items for each level 1
    navigationData.forEach((level1Data, index) => {
      this.#createLevel1Navigation(navSections, level1Data, index);
      if (level1Data.hasSubmenu) {
        this.#createMegaMenuContent(level1Data, `nav-${index}`);
      }
    });
  }

  #createLevel1Navigation(navSections, level1Data, index) {
    const level1Element = document.createElement('div');
    level1Element.textContent = level1Data.text;
    level1Element.classList.add('nav-drop', 'level1-item');
    level1Element.dataset.menuId = `nav-${index}`;

    // Add click handlers to the heading
    level1Element.addEventListener('click', (e) => {
      if (this.isDesktop.matches) {
        e.preventDefault();
        e.stopPropagation();
        this.#activateLevel1(level1Element);
      }
    });

    // Set ARIA attributes for accessibility
    level1Element.setAttribute('role', 'button');
    level1Element.setAttribute('aria-expanded', 'false');
    level1Element.setAttribute('tabindex', '0');

    // Handle keyboard navigation
    level1Element.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && this.isDesktop.matches) {
        e.preventDefault();
        this.#activateLevel1(level1Element);
      }
    });

    navSections.appendChild(level1Element);
  }

  #createMegaMenuContent(level1Data, menuId) {
    const megaContent = document.createElement('div');
    megaContent.className = 'mega-content';
    megaContent.id = `mega-${menuId}`;
    megaContent.style.display = 'none';

    const leftPanel = document.createElement('div');
    leftPanel.className = 'mega-left';

    const middlePanel = document.createElement('div');
    middlePanel.className = 'mega-middle';
    middlePanel.style.display = 'none'; // Initially hidden

    const rightPanel = document.createElement('div');
    rightPanel.className = 'mega-right';
    rightPanel.style.display = 'none'; // Initially hidden

    // Add level 1 description to the top of left panel
    if (level1Data.description) {
      const level1DescElement = document.createElement('div');
      level1DescElement.className = 'level1-description';
      level1DescElement.textContent = level1Data.description;
      leftPanel.appendChild(level1DescElement);
    }

    // Process level 2 items
    level1Data.children.forEach((level2Data, level2Index) => {
      const level2Id = `${menuId}-l2-${level2Index}`;

      // Create level 2 element for left panel
      const level2Element = document.createElement('div');
      level2Element.className = 'level2-item';
      level2Element.dataset.level2Id = level2Id;

      // Create item header container for icon and text
      const itemHeader = document.createElement('div');
      itemHeader.className = 'item-header';

      // Add icon if exists
      if (level2Data.icon) {
        const iconClone = level2Data.icon.cloneNode(true);
        itemHeader.appendChild(iconClone);
      }

      // Add text/link
      if (level2Data.hasLink) {
        const level2LinkElement = document.createElement('a');
        level2LinkElement.href = level2Data.href;
        level2LinkElement.textContent = level2Data.text;
        itemHeader.appendChild(level2LinkElement);
      } else {
        const textSpan = document.createElement('span');
        textSpan.textContent = level2Data.text;
        itemHeader.appendChild(textSpan);
      }

      // Add item header to level 2 element
      level2Element.appendChild(itemHeader);

      // Add click handler for level 2 activation
      level2Element.addEventListener('click', (e) => {
        e.stopPropagation();
        this.#activateLevel2(level2Element, megaContent, level2Data, level2Id);
      });

      leftPanel.appendChild(level2Element);

      // Create level 2 description (initially hidden)
      if (level2Data.description) {
        const level2DescElement = document.createElement('div');
        level2DescElement.className = 'level2-description';
        level2DescElement.dataset.level2Id = level2Id;
        level2DescElement.textContent = level2Data.description;
        level2DescElement.style.display = 'none'; // Initially hidden
        leftPanel.appendChild(level2DescElement);
      }

      // Store level 2 data for later use
      if (!megaContent.level2Data) {
        megaContent.level2Data = {};
      }
      megaContent.level2Data[level2Id] = level2Data;
    });

    // Add level 1 overview link at the bottom of left panel
    if (level1Data.overviewLink) {
      const overviewLinkElement = document.createElement('div');
      overviewLinkElement.className = 'overview-link';

      const overviewLinkAnchor = document.createElement('a');
      overviewLinkAnchor.href = level1Data.overviewLink.href;
      overviewLinkAnchor.textContent = level1Data.overviewLink.text;

      overviewLinkElement.appendChild(overviewLinkAnchor);
      leftPanel.appendChild(overviewLinkElement);
    }

    megaContent.appendChild(leftPanel);
    megaContent.appendChild(middlePanel);
    megaContent.appendChild(rightPanel);
    this.appendChild(megaContent);
  }

  #activateLevel2(level2Element, megaContent, level2Data, level2Id) {
    // Remove previous level 2 activation
    if (this.activeLevel2) {
      this.activeLevel2.classList.remove('active');
    }

    // Hide all level 2 descriptions
    megaContent.querySelectorAll('.level2-description').forEach((desc) => {
      desc.style.display = 'none';
    });

    // Activate this level 2
    level2Element.classList.add('active');
    this.activeLevel2 = level2Element;

    // Show description for this level 2
    const level2Description = megaContent.querySelector(
      `.level2-description[data-level2-id="${level2Id}"]`,
    );
    if (level2Description) {
      level2Description.style.display = 'block';
    }

    // Show level 3 items if they exist
    if (level2Data.children && level2Data.children.length > 0) {
      this.#showLevel3Items(megaContent, level2Data, level2Id);
    } else {
      // No level 3 items, hide middle and right panels
      MegaMenu.#hideMiddlePanel(megaContent);
      this.#hideLevel4Items(megaContent);
    }
  }

  #showLevel3Items(megaContent, level2Data, level2Id) {
    const middlePanel = megaContent.querySelector('.mega-middle');

    // Clear middle panel
    middlePanel.innerHTML = '';

    // Show middle panel
    middlePanel.style.display = 'flex';

    // Add level 2 item name at the top of middle panel
    const level2Header = document.createElement('div');
    level2Header.className = 'level2-header';
    level2Header.textContent = level2Data.text;
    middlePanel.appendChild(level2Header);

    // Create container for level 3 items
    const level3Container = document.createElement('div');
    level3Container.className = 'level3-container';
    middlePanel.appendChild(level3Container);

    let firstLevel3WithChildren = null;

    level2Data.children.forEach((level3Data, level3Index) => {
      const level3Id = `${level2Id}-l3-${level3Index}`;

      // Create level 3 element
      const level3Element = document.createElement('div');
      level3Element.className = 'level3-item';
      level3Element.dataset.level2Id = level2Id;
      level3Element.dataset.level3Id = level3Id;

      if (level3Data.children && level3Data.children.length > 0) {
        level3Element.classList.add('has-level4');
        // Remember the first level 3 item with children for auto-activation
        if (!firstLevel3WithChildren) {
          firstLevel3WithChildren = {
            element: level3Element,
            data: level3Data,
          };
        }
      }

      // Add icon if exists
      if (level3Data.icon) {
        const iconClone = level3Data.icon.cloneNode(true);
        level3Element.appendChild(iconClone);
      }

      // Add text/link
      if (level3Data.hasLink) {
        const level3LinkElement = document.createElement('a');
        level3LinkElement.href = level3Data.href;
        level3LinkElement.textContent = level3Data.text;
        level3Element.appendChild(level3LinkElement);
      } else {
        const textSpan = document.createElement('span');
        textSpan.textContent = level3Data.text;
        level3Element.appendChild(textSpan);
      }

      // Add click handler for level 3 activation
      if (level3Data.children && level3Data.children.length > 0) {
        level3Element.addEventListener('click', (e) => {
          e.stopPropagation();
          this.#activateLevel3(level3Element, megaContent, level3Data);
        });
      }

      level3Container.appendChild(level3Element);

      // Add description if exists
      if (level3Data.description) {
        const level3DescElement = document.createElement('div');
        level3DescElement.className = 'level3-description';
        level3DescElement.dataset.level2Id = level2Id;
        level3DescElement.dataset.level3Id = level3Id;
        level3DescElement.textContent = level3Data.description;
        level3Container.appendChild(level3DescElement);
      }
    });

    // Add level 2 overview link at the bottom of middle panel
    if (level2Data.overviewLink) {
      const overviewLinkElement = document.createElement('div');
      overviewLinkElement.className = 'overview-link';

      const overviewLinkAnchor = document.createElement('a');
      overviewLinkAnchor.href = level2Data.overviewLink.href;
      overviewLinkAnchor.textContent = level2Data.overviewLink.text;

      overviewLinkElement.appendChild(overviewLinkAnchor);
      middlePanel.appendChild(overviewLinkElement);
    }

    // Auto-activate the first level 3 item that has children
    if (firstLevel3WithChildren) {
      this.#activateLevel3(
        firstLevel3WithChildren.element,
        megaContent,
        firstLevel3WithChildren.data,
      );
    } else {
      // Hide right panel when no level 3 items have children
      this.#hideLevel4Items(megaContent);
    }
  }

  #activateLevel3(level3Element, megaContent, level3Data) {
    // Remove previous level 3 activation
    if (this.activeLevel3) {
      this.activeLevel3.classList.remove('active');
    }

    // Activate this level 3
    level3Element.classList.add('active');
    this.activeLevel3 = level3Element;

    // Show level 4 items if they exist
    if (level3Data.children && level3Data.children.length > 0) {
      MegaMenu.#showLevel4Items(megaContent, level3Data);
    }
  }

  static #showLevel4Items(megaContent, level3Data) {
    const rightPanel = megaContent.querySelector('.mega-right');

    // Clear right panel
    rightPanel.innerHTML = '';

    // Show right panel
    rightPanel.style.display = 'flex';

    // Add level 3 item name at the top of right panel
    const level3Header = document.createElement('div');
    level3Header.className = 'level3-header';
    level3Header.textContent = level3Data.text;
    rightPanel.appendChild(level3Header);

    // Create container for level 4 items
    const level4Container = document.createElement('div');
    level4Container.className = 'level4-container';
    rightPanel.appendChild(level4Container);

    level3Data.children.forEach((level4Data) => {
      // Create level 4 element
      const level4Element = document.createElement('div');
      level4Element.className = 'level4-item';

      // Add text/link
      if (level4Data.hasLink) {
        const level4LinkElement = document.createElement('a');
        level4LinkElement.href = level4Data.href;
        level4LinkElement.textContent = level4Data.text;
        level4Element.appendChild(level4LinkElement);
      } else {
        const textSpan = document.createElement('span');
        textSpan.textContent = level4Data.text;
        level4Element.appendChild(textSpan);
      }

      level4Container.appendChild(level4Element);

      // Add description if exists
      if (level4Data.description) {
        const level4DescElement = document.createElement('div');
        level4DescElement.className = 'level4-description';
        level4DescElement.textContent = level4Data.description;
        level4Container.appendChild(level4DescElement);
      }
    });

    // Add level 3 overview link at the bottom of right panel
    if (level3Data.overviewLink) {
      const overviewLinkElement = document.createElement('div');
      overviewLinkElement.className = 'overview-link';

      const overviewLinkAnchor = document.createElement('a');
      overviewLinkAnchor.href = level3Data.overviewLink.href;
      overviewLinkAnchor.textContent = level3Data.overviewLink.text;

      overviewLinkElement.appendChild(overviewLinkAnchor);
      rightPanel.appendChild(overviewLinkElement);
    }
  }

  #hideLevel4Items(megaContent) {
    const rightPanel = megaContent.querySelector('.mega-right');

    // Hide right panel
    rightPanel.style.display = 'none';

    // Reset level 3 activation
    if (this.activeLevel3) {
      this.activeLevel3.classList.remove('active');
      this.activeLevel3 = null;
    }
  }

  static #hideMiddlePanel(megaContent) {
    const middlePanel = megaContent.querySelector('.mega-middle');
    middlePanel.style.display = 'none';
  }

  #setupEventListeners() {
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this.isDesktop.matches && !this.contains(e.target)) {
        this.#closeAllMenus();
      }
    });

    // Handle responsive changes
    this.isDesktop.addEventListener('change', () => {
      if (!this.isDesktop.matches) {
        this.#closeAllMenus();
      }
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.isDesktop.matches) {
        this.#closeAllMenus();
      }
    });
  }

  #activateLevel1(level1Item) {
    const isCurrentlyActive = level1Item.classList.contains('nav-active');
    const { menuId } = level1Item.dataset;

    if (isCurrentlyActive) {
      this.#closeAllMenus();
    } else {
      // Close all first
      this.#closeAllMenus();

      // Activate this one
      level1Item.classList.add('nav-active');
      level1Item.setAttribute('aria-expanded', 'true');

      // Show mega menu
      const megaContent = this.querySelector(`#mega-${menuId}`);

      if (megaContent) {
        this.style.display = 'block';
        megaContent.style.display = 'flex';

        // Auto-activate the first level 2 item
        const firstLevel2Item = megaContent.querySelector('.level2-item');
        if (firstLevel2Item && megaContent.level2Data) {
          const { level2Id } = firstLevel2Item.dataset;
          const level2Data = megaContent.level2Data[level2Id];
          if (level2Data) {
            this.#activateLevel2(firstLevel2Item, megaContent, level2Data, level2Id);
          }
        }
      }
    }
  }

  #closeAllMenus() {
    // Remove active states and update ARIA attributes
    if (this.navSections) {
      this.navSections.querySelectorAll('.level1-item').forEach((item) => {
        item.classList.remove('nav-active');
        item.setAttribute('aria-expanded', 'false');
      });
    }

    // Reset internal state
    this.activeLevel2 = null;
    this.activeLevel3 = null;

    // Hide mega menu
    this.style.display = 'none';

    // Hide all mega contents and reset their state
    this.querySelectorAll('.mega-content').forEach((content) => {
      content.style.display = 'none';

      // Reset all activations
      content.querySelectorAll('.active').forEach((el) => {
        el.classList.remove('active');
      });

      // Hide all level 2 descriptions
      content.querySelectorAll('.level2-description').forEach((desc) => {
        desc.style.display = 'none';
      });

      // Hide middle and right panels
      const middlePanel = content.querySelector('.mega-middle');
      const rightPanel = content.querySelector('.mega-right');
      if (middlePanel) middlePanel.style.display = 'none';
      if (rightPanel) rightPanel.style.display = 'none';
    });
  }

  // Public API for header to interact with mega menu
  closeMenus() {
    this.#closeAllMenus();
  }
}

// Define the custom element
customElements.define('mega-menu', MegaMenu);

export default MegaMenu;
