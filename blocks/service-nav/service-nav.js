export default function decorate(block) {
  const [titleDiv, bodyDiv] = block.querySelectorAll(':scope > div');

  // Add CSS classes
  block.classList.add('service-nav');
  titleDiv.classList.add('service-nav-title');
  bodyDiv.classList.add('service-nav-body');

  // Make title focusable for accessibility and focusout events
  titleDiv.setAttribute('tabindex', '0');
  titleDiv.setAttribute('role', 'button');
  titleDiv.setAttribute('aria-expanded', 'false');
  titleDiv.setAttribute('aria-haspopup', 'true');

  // Wrap body content
  const bodyContent = document.createElement('div');
  bodyContent.classList.add('service-nav-body-content');
  bodyContent.innerHTML = bodyDiv.innerHTML;
  bodyDiv.innerHTML = '';
  bodyDiv.appendChild(bodyContent);

  // Make body content focusable for better focus management
  bodyContent.setAttribute('tabindex', '-1');

  // Initially hide the body
  bodyDiv.style.display = 'none';
  let isOpen = false;

  // Close body
  const closeBody = () => {
    bodyDiv.classList.remove('show');
    titleDiv.setAttribute('aria-expanded', 'false');

    bodyDiv.style.display = 'none';

    isOpen = false;
  };

  // Set CSS custom property for header positioning
  const updateHeaderPosition = () => {
    const header = document.querySelector('header');
    if (header && header.contains(block)) {
      const titleRect = titleDiv.getBoundingClientRect();
      document.documentElement.style.setProperty('--title-right-position', `${titleRect.right}px`);
    }
  };

  // Open body
  const openBody = () => {
    updateHeaderPosition();
    bodyDiv.style.display = 'block';
    titleDiv.setAttribute('aria-expanded', 'true');

    // Trigger animation
    requestAnimationFrame(() => {
      bodyDiv.classList.add('show');
    });

    isOpen = true;
  };

  // Toggle function
  const toggleBody = () => {
    if (isOpen) {
      closeBody();
    } else {
      openBody();
    }
  };

  // Handle window resize
  const handleResize = () => {
    if (isOpen) {
      updateHeaderPosition();
    }
  };

  // Add event listeners
  titleDiv.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleBody();
  });

  // Add keyboard support for accessibility
  titleDiv.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      toggleBody();
    }
  });

  // Handle window resize for repositioning
  window.addEventListener('resize', handleResize);

  // Handle scroll for repositioning when in header
  window.addEventListener('scroll', () => {
    if (isOpen) {
      updateHeaderPosition();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      closeBody();
    }
  });

  block.addEventListener('focusout', (e) => {
    if (isOpen && !block.contains(e.relatedTarget)) {
      closeBody();
    }
  });

  // Clear and append elements
  block.textContent = '';
  block.append(titleDiv, bodyDiv);
}
