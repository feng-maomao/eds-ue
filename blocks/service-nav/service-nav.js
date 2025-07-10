export default function decorate(block) {
  const [titleDiv, bodyDiv] = block.querySelectorAll(':scope > div');

  // Add CSS classes
  block.classList.add('service-nav');
  titleDiv.classList.add('service-nav-title');
  bodyDiv.classList.add('service-nav-body');

  // Wrap body content
  const bodyContent = document.createElement('div');
  bodyContent.classList.add('service-nav-body-content');
  bodyContent.innerHTML = bodyDiv.innerHTML;
  bodyDiv.innerHTML = '';
  bodyDiv.appendChild(bodyContent);

  // Initially hide the body
  bodyDiv.style.display = 'none';
  let isOpen = false;

  // Close body
  const closeBody = () => {
    bodyDiv.classList.remove('show');
    titleDiv.classList.remove('active');

    setTimeout(() => {
      bodyDiv.style.display = 'none';
    }, 300);

    isOpen = false;
    // eslint-disable-next-line no-use-before-define
    document.removeEventListener('click', handleClickOutside);
  };

  // Handle click outside
  const handleClickOutside = (event) => {
    if (!block.contains(event.target)) {
      closeBody();
    }
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
    titleDiv.classList.add('active');

    // Trigger animation
    requestAnimationFrame(() => {
      bodyDiv.classList.add('show');
    });

    isOpen = true;

    // Add click outside listener
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
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

  // Handle window resize for repositioning
  window.addEventListener('resize', handleResize);

  // Handle scroll for repositioning when in header
  window.addEventListener('scroll', () => {
    if (isOpen) {
      updateHeaderPosition();
    }
  });

  // Cleanup function for removing event listeners
  block.cleanup = () => {
    document.removeEventListener('click', handleClickOutside);
    window.removeEventListener('resize', handleResize);
  };

  // Clear and append elements
  block.textContent = '';
  block.append(titleDiv, bodyDiv);
}
