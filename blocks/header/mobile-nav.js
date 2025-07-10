/**
 * Mobile Navigation Component
 *
 * Handles hierarchical mobile navigation with progressive disclosure.
 * Transforms existing header for mobile navigation states.
 */
class MobileNav {
  constructor(navigationData, navSectionsElement) {
    this.navigationData = navigationData;
    this.navSectionsElement = navSectionsElement;
    this.currentLevel = 1;
    this.navigationStack = []; // Stack to track navigation history
    this.currentItems = navigationData; // Current items to display
    this.mobileNavContainer = null;
    this.mobileNavContent = null;
    this.originalHeaderContent = null; // Store original header content
    this.isInitialized = false; // Track if header content has been stored
    this.isNavigating = false; // Track if navigation is in progress

    this.init();
  }

  init() {
    this.createMobileNavContainer();
    // Note: storeOriginalHeaderContent() is called later when header is in DOM
  }

  storeOriginalHeaderContent() {
    // Store references to original header elements
    const header = document.querySelector('header');
    if (header) {
      this.originalHeaderContent = {
        navBrand: header.querySelector('.nav-brand'),
        navTools: header.querySelector('.nav-tools'),
        nav: header.querySelector('nav'),
      };
      this.isInitialized = true;
    }
  }

  createMobileNavContainer() {
    // Create main mobile navigation container (content only)
    this.mobileNavContainer = document.createElement('div');
    this.mobileNavContainer.className = 'mobile-nav-container';
    this.mobileNavContainer.style.display = 'none'; // Initially hidden

    // Create mobile nav content
    this.mobileNavContent = document.createElement('div');
    this.mobileNavContent.className = 'mobile-nav-content';

    // Append content to container
    this.mobileNavContainer.appendChild(this.mobileNavContent);

    // Insert mobile nav container after header element
    const header = document.querySelector('header');
    if (header && header.parentElement) {
      header.parentElement.insertBefore(this.mobileNavContainer, header.nextSibling);
    } else {
      // Fallback to body
      document.body.appendChild(this.mobileNavContainer);
    }

    // Prevent focus loss from closing mobile nav when clicking inside
    this.mobileNavContainer.addEventListener('mousedown', (e) => {
      e.preventDefault(); // Prevent focus change
    });

    this.mobileNavContainer.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevent focus change on touch devices
    });

    // Add focus management to prevent menu closing
    this.mobileNavContainer.addEventListener('focusin', (e) => {
      e.stopPropagation();
    });

    this.mobileNavContainer.addEventListener('focusout', (e) => {
      e.stopPropagation();
    });
  }

  ensureInitialized() {
    // Ensure header content is stored before using it
    if (!this.isInitialized) {
      this.storeOriginalHeaderContent();
    }
  }

  renderCurrentLevel() {
    if (!this.mobileNavContainer) return;

    // Ensure we have the original header content
    this.ensureInitialized();

    // Transform header based on current level
    this.transformHeader();

    // Render content
    this.renderMobileNavContent();
  }

  transformHeader() {
    if (!this.originalHeaderContent) return;

    if (this.currentLevel === 1) {
      // Level 1: Show logo + nav-tools with close button
      this.showLevel1Header();
    } else {
      // Level 2+: Show back button + close button
      this.showLevel2Header();
    }
  }

  showLevel1Header() {
    const { navBrand, navTools } = this.originalHeaderContent;

    // Reset to original brand content
    if (navBrand) {
      navBrand.style.display = '';
      navBrand.innerHTML = navBrand.getAttribute('data-original-content') || navBrand.innerHTML;
    }

    // Show nav-tools but hide icons except hamburger
    if (navTools) {
      navTools.style.display = '';

      // Hide icons except hamburger
      this.toggleNavToolsIcons(false);
    }
  }

  showLevel2Header() {
    const { navBrand, navTools } = this.originalHeaderContent;

    // Replace brand with back button
    if (navBrand) {
      // Store original content if not already stored
      if (!navBrand.getAttribute('data-original-content')) {
        navBrand.setAttribute('data-original-content', navBrand.innerHTML);
      }

      const currentParent = this.navigationStack[this.navigationStack.length - 1];
      const backText = currentParent ? currentParent.text : 'Back';

      navBrand.innerHTML = `
        <button class="mobile-nav-back-btn" type="button">
          <span class="back-arrow">←</span>
          <span class="back-text">${backText}</span>
        </button>
      `;

      // Add click handler to back button
      const backButton = navBrand.querySelector('.mobile-nav-back-btn');
      if (backButton) {
        backButton.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();

          // Prevent focus loss from closing menu
          e.currentTarget.blur();

          // Use setTimeout to ensure focus events are handled first
          setTimeout(() => {
            this.navigateBack();
          }, 10);
        });

        // Prevent focus events from interfering
        backButton.addEventListener('focus', (e) => {
          e.stopPropagation();
        });

        backButton.addEventListener('blur', (e) => {
          e.stopPropagation();
        });
      }
    }

    // Hide non-hamburger icons (hamburger stays visible as close button)
    if (navTools) {
      this.toggleNavToolsIcons(false);
    }
  }

  toggleNavToolsIcons(show) {
    const { navTools } = this.originalHeaderContent;
    if (!navTools) return;

    const toolItems = navTools.querySelectorAll('.icon, a, button');
    toolItems.forEach((item) => {
      // Skip hamburger button - it should always remain visible
      if (!item.closest('.nav-hamburger')) {
        item.style.display = show ? '' : 'none';
      }
    });
  }

  restoreOriginalHeader() {
    const { navBrand, navTools } = this.originalHeaderContent;

    // Restore brand content
    if (navBrand) {
      const originalContent = navBrand.getAttribute('data-original-content');
      if (originalContent) {
        navBrand.innerHTML = originalContent;
        navBrand.removeAttribute('data-original-content');
      }
      navBrand.style.display = '';
    }

    // Restore nav-tools
    if (navTools) {
      // Restore all icons visibility
      const toolItems = navTools.querySelectorAll('.icon, a, button');
      toolItems.forEach((item) => {
        if (!item.closest('.nav-hamburger')) {
          item.style.removeProperty('display');
        }
      });

      navTools.style.display = '';
    }
  }

  renderMobileNavContent() {
    if (!this.mobileNavContent) return;

    // Clear current content
    this.mobileNavContent.innerHTML = '';

    // Create navigation items container
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'mobile-nav-items';

    // Render navigation items
    this.currentItems.forEach((item) => {
      const navItem = document.createElement('div');
      navItem.className = 'mobile-nav-item';

      // Create item content
      const itemContent = document.createElement('div');
      itemContent.className = 'mobile-nav-item-content';

      // Add icon if exists
      if (item.icon) {
        const iconClone = item.icon.cloneNode(true);
        itemContent.appendChild(iconClone);
      }

      // Add text/link
      const textElement = document.createElement('span');
      textElement.className = 'mobile-nav-item-text';
      textElement.textContent = item.text;
      itemContent.appendChild(textElement);

      // Add arrow if item has children
      if (item.children && item.children.length > 0) {
        const arrow = document.createElement('span');
        arrow.className = 'mobile-nav-arrow';
        arrow.textContent = '→';
        itemContent.appendChild(arrow);

        // Add click handler for navigation
        navItem.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          this.navigateToLevel(item);
        });

        // Add touch handler for touch devices
        navItem.addEventListener('touchend', (e) => {
          e.stopPropagation();
          e.preventDefault();
          this.navigateToLevel(item);
        });

        navItem.classList.add('has-children');
      } else if (item.hasLink) {
        // Add click handler for direct links
        navItem.addEventListener('click', (e) => {
          e.stopPropagation();
          // Allow default behavior for links
          this.hide(); // Close mobile nav before navigation
          window.location.href = item.href;
        });

        navItem.classList.add('has-link');
      }

      navItem.appendChild(itemContent);
      itemsContainer.appendChild(navItem);
    });

    // Add overview link if available
    this.addOverviewLink(itemsContainer);

    // Append items container to content
    this.mobileNavContent.appendChild(itemsContainer);
  }

  addOverviewLink(container) {
    // Get the overview link from the current navigation context
    let overviewLink = null;

    if (this.navigationStack.length > 0) {
      // Get overview link from the current parent item
      const currentParent = this.navigationStack[this.navigationStack.length - 1];
      overviewLink = currentParent.overviewLink;
    } else if (this.currentLevel === 1) {
      // This would be level 1 overview links if needed
      return; // Skip for now as level 1 doesn't typically have overview
    }

    if (overviewLink) {
      const overviewContainer = document.createElement('div');
      overviewContainer.className = 'mobile-nav-overview';

      const overviewLinkElement = document.createElement('a');
      overviewLinkElement.href = overviewLink.href;
      overviewLinkElement.textContent = overviewLink.text;
      overviewLinkElement.className = 'mobile-nav-overview-link';

      overviewLinkElement.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hide(); // Close mobile nav before navigation
      });

      overviewContainer.appendChild(overviewLinkElement);
      container.appendChild(overviewContainer);
    }
  }

  navigateToLevel(item) {
    if (!item.children || item.children.length === 0) return;

    // Set navigation flag
    this.isNavigating = true;

    // Add current item to navigation stack
    this.navigationStack.push(item);

    // Update current level and items
    this.currentLevel += 1;
    this.currentItems = item.children;

    // Re-render with animation
    this.renderCurrentLevel();
    this.animateTransition('forward');

    // Clear navigation flag after animation
    setTimeout(() => {
      this.isNavigating = false;
    }, 350);
  }

  navigateBack() {
    if (this.navigationStack.length === 0) {
      // At top level, close mobile nav
      this.hide();
      return;
    }

    // Set navigation flag
    this.isNavigating = true;

    // Remove last item from stack
    this.navigationStack.pop();

    // Update current level and items
    this.currentLevel -= 1;

    if (this.navigationStack.length === 0) {
      // Back to level 1
      this.currentItems = this.navigationData;
    } else {
      // Back to previous level
      const parentItem = this.navigationStack[this.navigationStack.length - 1];
      this.currentItems = parentItem.children;
    }

    // Re-render with animation
    this.renderCurrentLevel();
    this.animateTransition('backward');

    // Clear navigation flag after animation
    setTimeout(() => {
      this.isNavigating = false;
    }, 350);
  }

  animateTransition(direction) {
    // Add transition classes for animation
    this.mobileNavContainer.classList.add(`transitioning-${direction}`);

    // Remove transition class after animation
    setTimeout(() => {
      this.mobileNavContainer.classList.remove(`transitioning-${direction}`);
    }, 300);
  }

  show() {
    // Reset to level 1
    this.currentLevel = 1;
    this.navigationStack = [];
    this.currentItems = this.navigationData;

    // Render and show
    this.renderCurrentLevel();
    this.mobileNavContainer.style.display = 'block';

    // Add show animation
    setTimeout(() => {
      this.mobileNavContainer.classList.add('show');
    }, 10);
  }

  hide() {
    // Don't hide if navigation is in progress
    if (this.isNavigating) {
      return;
    }

    // Hide with animation
    this.mobileNavContainer.classList.remove('show');

    // Restore original header if initialized
    if (this.isInitialized) {
      this.restoreOriginalHeader();
    }

    // Hide after animation
    setTimeout(() => {
      this.mobileNavContainer.style.display = 'none';
    }, 300);
  }

  /**
   * Force hide - used when we really need to close the menu
   */
  forceHide() {
    this.isNavigating = false;
    this.hide();
  }

  /**
   * Force cleanup of mobile nav state - used when switching to desktop
   */
  cleanup() {
    if (!this.isInitialized) return;

    // Immediately restore original header state
    this.restoreOriginalHeader();

    // Hide mobile nav container immediately
    this.mobileNavContainer.classList.remove('show');
    this.mobileNavContainer.style.display = 'none';

    // Reset navigation state
    this.currentLevel = 1;
    this.navigationStack = [];
    this.currentItems = this.navigationData;
  }

  isVisible() {
    return this.mobileNavContainer
           && this.mobileNavContainer.style.display !== 'none'
           && this.mobileNavContainer.classList.contains('show');
  }
}

export default MobileNav;
