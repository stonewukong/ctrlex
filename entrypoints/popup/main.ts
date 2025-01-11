import '../../assets/tailwind.css';

type FilterType = 'all' | 'enabled' | 'disabled';
interface ExtensionStorage {
  enabledExtensions: string[];
  toggleAllState: boolean;
}

document.addEventListener('DOMContentLoaded', async () => {
  let extensions = await getExtensions();

  const extensionsTab = document.getElementById('extensions-tab');
  const modesTab = document.getElementById('modes-tab');
  const extensionsContent = document.getElementById('extensions-content');
  const modesContent = document.getElementById('modes-content');
  const toggleAll = document.querySelector<HTMLInputElement>('#toggle-all');

  const savedState: ExtensionStorage = await browser.storage.sync.get({
    enabledExtensions: [],
    toggleAllState: false,
  });

  if (toggleAll) {
    toggleAll.checked = savedState.toggleAllState;
  }

  extensionsTab?.classList.add('active-tab');
  extensionsContent?.classList.remove('hidden');
  modesContent?.classList.add('hidden');

  extensionsTab?.addEventListener('click', () => {
    extensionsTab.classList.add('active-tab');
    modesTab?.classList.remove('active-tab');
    extensionsContent?.classList.remove('hidden');
    modesContent?.classList.add('hidden');
  });

  modesTab?.addEventListener('click', () => {
    modesTab.classList.add('active-tab');
    extensionsTab?.classList.remove('active-tab');
    modesContent?.classList.remove('hidden');
    extensionsContent?.classList.add('hidden');
  });

  const extensionsCount =
    document.querySelector<HTMLParagraphElement>('#extensionsCount');

  const extensionsList =
    document.querySelector<HTMLUListElement>('#extensionsList');

  if (extensionsCount) {
    extensionsCount.innerText = extensions.length.toString();
  }

  if (extensionsList) {
    extensionsList.innerHTML = '';
    extensions.forEach((ex) => {
      const extensionItem = createExtensionItem(ex);
      extensionsList.appendChild(extensionItem);
    });
  }

  const search = document.querySelector<HTMLInputElement>('#search-ex');
  const exListItems = extensionsList?.querySelectorAll('li');
  search?.addEventListener('input', () =>
    searchExtensions(search, exListItems)
  );

  const filterButtons = document.querySelectorAll<HTMLButtonElement>('#filter');

  filterButtons.forEach((button) => {
    button.addEventListener('click', (e) => {
      const filterValue = (e.currentTarget as HTMLElement).textContent
        ?.trim()
        .toLowerCase() as FilterType;

      filterButtons.forEach((btn) =>
        btn.classList.replace('bg-selected-btn/10', 'bg-btn-bg')
      );

      button.classList.replace('bg-btn-bg', 'bg-selected-btn/10');
      button.classList.replace(
        'hover:bg-selected-btn/5',
        'hover:bg-selected-btn/10'
      );

      filterExtensions(filterValue, exListItems);
    });
  });

  toggleAll?.addEventListener('change', async () => {
    const newState = toggleAll.checked;

    await browser.storage.sync.set({ toggleAllState: newState });

    if (newState) {
      const enabledExtensions = extensions
        .filter((ex) => ex.enabled && ex.id !== browser.runtime.id)
        .map((ex) => ex.id);

      await browser.storage.sync.set({ enabledExtensions });

      for (const ex of extensions) {
        if (ex.id !== browser.runtime.id && ex.enabled) {
          await browser.management.setEnabled(ex.id, false);
        }
      }
    } else {
      const savedExtensions = await browser.storage.sync.get(
        'enabledExtensions'
      );
      if (savedExtensions.enabledExtensions) {
        for (const extId of savedExtensions.enabledExtensions) {
          await browser.management.setEnabled(extId, true);
        }
      }
    }
  });
});

function filterExtensions(
  filterValue: FilterType,
  exListItems: NodeListOf<HTMLLIElement> | undefined
) {
  if (!exListItems) return;

  exListItems?.forEach((ex) => {
    const toggleElement = ex.querySelector<HTMLInputElement>('input');
    if (!toggleElement) return;
    const isChecked = toggleElement.checked;
    switch (filterValue) {
      case 'enabled':
        ex.style.display = isChecked ? '' : 'none';
        break;
      case 'disabled':
        ex.style.display = isChecked ? 'none' : '';
        break;
      default:
        ex.style.display = '';
        break;
    }
  });
}

function searchExtensions(
  search: HTMLInputElement,
  exListItems: NodeListOf<HTMLLIElement> | undefined
) {
  const query = search.value.toLowerCase();
  exListItems?.forEach((ex) => {
    const nameElement = ex.querySelector('p');
    const name = nameElement?.textContent?.toLowerCase() || '';
    if (name.includes(query)) {
      ex.style.display = '';
    } else {
      ex.style.display = 'none';
    }
  });
}

function createExtensionItem(
  ex: chrome.management.ExtensionInfo
): HTMLLIElement {
  const exElement = document.createElement('li');
  exElement.className =
    'p-3 gap-1.5 items-center hover:bg-selected-btn/10 cursor-pointer duration-300 transition-colors rounded-xl flex border border-btn-border w-full justify-between';

  let isEnabled = ex.enabled;
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
  exName.className = 'text-ellipsis text-sm max-w-48 truncate text-content';
  exName.textContent = ex.name;
  exElementDiv.appendChild(exName);

  // Actions container
  const actionContainer = document.createElement('div');
  actionContainer.className = 'flex items-center';

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

  toggleInput.addEventListener('change', () => {
    isEnabled = !isEnabled;
    browser.management.setEnabled(ex.id, isEnabled);
  });

  toggleInput.addEventListener('change', async () => {
    isEnabled = !isEnabled;
    await browser.management.setEnabled(ex.id, isEnabled);

    // Update storage when individual extensions are toggled
    const savedState = await browser.storage.sync.get({
      enabledExtensions: [],
    });
    let enabledExtensions = savedState.enabledExtensions;

    if (isEnabled) {
      enabledExtensions.push(ex.id);
    } else {
      enabledExtensions = enabledExtensions.filter(
        (id: string) => id !== ex.id
      );
    }

    await browser.storage.sync.set({ enabledExtensions });
  });

  return exElement;
}

async function getExtensions(): Promise<chrome.management.ExtensionInfo[]> {
  return new Promise((resolve) => {
    const port = browser.runtime.connect();
    port.onMessage.addListener((data) => {
      if (!data || !data.message) {
        console.error('Failed to retrieve extensions data:', data);
        return resolve([]);
      }
      let extensions = data.message;
      extensions = extensions.filter(
        (ex: chrome.management.ExtensionInfo) =>
          ex.type !== 'theme' && ex.id !== 'addons-search-detection@mozilla.com'
      );
      resolve(extensions);
    });
  });
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
