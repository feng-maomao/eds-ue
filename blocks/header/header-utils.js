/**
 * Convert an icon img element to inline SVG
 * @param {HTMLElement} iconElement - Icon element containing img
 * @returns {Promise<HTMLElement>} - Promise resolving to inline SVG element
 */
async function convertIconToSVG(iconElement) {
  if (!iconElement) return null;

  const img = iconElement.querySelector('img');
  if (!img || !img.src) return iconElement;

  try {
    const response = await fetch(img.src);
    const svgText = await response.text();

    // Create a temporary div to parse the SVG
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = svgText;

    const svgElement = tempDiv.querySelector('svg');
    if (svgElement) {
      // Create a new icon container with inline SVG
      const newIcon = document.createElement('div');
      newIcon.className = 'icon';
      newIcon.appendChild(svgElement);
      return newIcon;
    }
  } catch (error) {
    console.warn('Failed to load SVG:', img.src, error);
  }

  // Return original icon if conversion fails
  return iconElement;
}

/**
 * Recursively convert all icons in navigation data to inline SVG
 * @param {Array} navigationData - Array of navigation items
 */
async function convertIconsToSVG(navigationData) {
  const promises = navigationData.map(async (item) => {
    if (item.icon) {
      item.icon = await convertIconToSVG(item.icon);
    }
    if (item.children && item.children.length > 0) {
      await convertIconsToSVG(item.children);
    }
  });

  await Promise.all(promises);
}

export async function parseHeadingStructure(section) {
  const allElements = Array.from(section.querySelectorAll('h1, h2, h3, h4, p'));

  const navigationData = [];
  let currentLevel1 = null;
  let currentLevel2 = null;
  let currentLevel3 = null;

  allElements.forEach((element) => {
    if (element.tagName === 'P') {
      const paragraphText = element.textContent.trim();
      const paragraphLink = element.querySelector('a');

      if (paragraphLink) {
        // Paragraph with link - this is an overview/transition link
        const overviewLinkData = {
          text: paragraphText,
          href: paragraphLink.href,
          hasLink: true,
        };

        if (currentLevel3) {
          // Assign overview link to level 3
          currentLevel3.overviewLink = overviewLinkData;
        } else if (currentLevel2) {
          // Assign overview link to level 2
          currentLevel2.overviewLink = overviewLinkData;
        } else if (currentLevel1) {
          // Assign overview link to level 1
          currentLevel1.overviewLink = overviewLinkData;
        }
      } else if (currentLevel3) {
        // Paragraph without link - this is a description
        // We're in a level 3 context, assign to level 3
        if (!currentLevel3.description) {
          currentLevel3.description = paragraphText;
        } else {
          // Concatenate multiple paragraphs
          currentLevel3.description += ` ${paragraphText}`;
        }
      } else if (currentLevel2) {
        // We're in a level 2 context, assign to level 2
        if (!currentLevel2.description) {
          currentLevel2.description = paragraphText;
        } else {
          // Concatenate multiple paragraphs
          currentLevel2.description += ` ${paragraphText}`;
        }
      } else if (currentLevel1) {
        // We're in a level 1 context, assign to level 1
        if (!currentLevel1.description) {
          currentLevel1.description = paragraphText;
        } else {
          // Concatenate multiple paragraphs
          currentLevel1.description += ` ${paragraphText}`;
        }
      }
      return;
    }

    const level = parseInt(element.tagName.charAt(1), 10);
    const textContent = element.textContent.trim();
    const link = element.querySelector('a');
    const icon = element.querySelector('.icon');

    const itemData = {
      text: textContent,
      href: link ? link.href : '#',
      hasLink: !!link,
      icon,
      description: null, // Will be set by subsequent paragraphs
      overviewLink: null, // Will be set by subsequent paragraphs with links
      children: [],
    };

    if (level === 1) {
      currentLevel1 = itemData;
      currentLevel1.hasSubmenu = false;
      navigationData.push(currentLevel1);
      currentLevel2 = null;
      currentLevel3 = null;
    } else if (level === 2 && currentLevel1) {
      currentLevel1.hasSubmenu = true;
      currentLevel1.children.push(itemData);
      currentLevel2 = itemData;
      currentLevel3 = null;
    } else if (level === 3 && currentLevel2) {
      currentLevel2.children.push(itemData);
      currentLevel3 = itemData;
    } else if (level === 4 && currentLevel3) {
      currentLevel3.children.push(itemData);
    }
  });

  // Convert all icons to inline SVG
  await convertIconsToSVG(navigationData);

  return navigationData;
}
