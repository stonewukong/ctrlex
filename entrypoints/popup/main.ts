import '../../assets/tailwind.css';

document.addEventListener('DOMContentLoaded', () => {
  let extensions: chrome.management.ExtensionInfo[];
  const extensionsCount =
    document.querySelector<HTMLParagraphElement>('#extensionsCount');
  const port = browser.runtime.connect();

  const extensionsList =
    document.querySelector<HTMLParagraphElement>('#extensionsList');

  port.onMessage.addListener((data) => {
    extensions = data.message;

    if (extensionsCount) {
      extensions = extensions.filter(
        (ex) =>
          ex.type !== 'theme' && ex.id !== 'addons-search-detection@mozilla.com'
      );
      extensionsCount.innerText = extensions.length.toString();
    }

    if (extensionsList) {
      extensionsList.innerHTML = '';
    }

    extensions.forEach((ex) => {
      const extensionItem = createExtensionItem(ex);
      extensionsList?.appendChild(extensionItem);
    });
  });
});

function createExtensionItem(
  ex: chrome.management.ExtensionInfo
): HTMLLIElement {
  const exElement = document.createElement('li');
  exElement.className =
    'p-3 gap-1.5 items-center hover:bg-selected-btn/10 cursor-pointer duration-300 transition-colors rounded-xl flex border border-btn-border/80 w-full justify-between';

  const isEnabled = ex.enabled ?? false;
  const exElementDiv = document.createElement('div');
  exElementDiv.className = 'flex gap-2 items-center';

  // Extension Icon
  const icon = document.createElement('img');
  icon.alt = '';
  if (navigator.userAgent.toLowerCase().includes('firefox')) {
    const exIconURLPromise = getExtensionIcon(ex.id);

    exIconURLPromise.then((data) => {
      if (data) {
        const iconUrl = data.icon_url;
        icon.src = iconUrl;
      } else {
        console.log('Failed to fetch icon for extension:', ex.id);
      }
    });
  } else {
    icon.src = ex.icons?.[0]?.url ?? '';
  }
  icon.className = 'w-4 h-4';
  exElementDiv.appendChild(icon);

  // Extension Name
  const exName = document.createElement('p');
  exName.className = 'text-ellipsis max-w-44 truncate';
  exName.textContent = ex.name;
  exElementDiv.appendChild(exName);

  // Actions container
  const actionContainer = document.createElement('div');
  actionContainer.className = 'flex gap-2 items-center';

  const detailsSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b4b4b4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info hover:stroke-white duration-200 transition-colors">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M12 16v-4"></path>
    <path d="M12 8h.01"></path>
  </svg>
`;
  const detailsIcon = document.createElement('div');
  detailsIcon.innerHTML = detailsSVG;
  actionContainer.appendChild(detailsIcon);

  const toggleLabel = document.createElement('label');
  toggleLabel.className = 'inline-flex items-center cursor-pointer';

  const toggleInput = document.createElement('input');
  toggleInput.type = 'checkbox';
  toggleInput.className = 'sr-only peer';
  toggleInput.checked = isEnabled;

  const toggleDiv = document.createElement('div');
  toggleDiv.className =
    'relative w-9 h-5 bg-btn-bg peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600';

  toggleLabel.appendChild(toggleInput);
  toggleLabel.appendChild(toggleDiv);
  actionContainer.appendChild(toggleLabel);

  exElement.appendChild(exElementDiv);
  exElement.appendChild(actionContainer);

  return exElement;
}

async function getExtensionIcon(id: string) {
  try {
    const res = await fetch(
      `https://addons.mozilla.org/api/v4/addons/addon/${id}/`
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch extension icon: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching extension icon:', error);
    return null;
  }
}
