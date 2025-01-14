import '../../assets/tailwind.css';
import { v4 as secure } from '@lukeed/uuid/secure';

type FilterType = 'all' | 'enabled' | 'disabled';

interface Mode {
  id: string;
  name: string;
  extensions: string[];
  enabled: boolean;
}

interface ExtensionStorage {
  enabledExtensions: string[];
  toggleAllState: boolean;
  modes: Mode[];
}

document.addEventListener('DOMContentLoaded', async () => {
  let extensions = await getExtensions();

  const extensionsTab = document.getElementById('extensions-tab');
  const modesTab = document.getElementById('modes-tab');
  const extensionsContent = document.getElementById('extensions-content');
  const modesContent = document.getElementById('modes-content');
  const toggleAll = document.querySelector<HTMLInputElement>('#toggle-all');
  const extensionsCount =
    document.querySelector<HTMLParagraphElement>('#extensionsCount');
  const extensionsList =
    document.querySelector<HTMLUListElement>('#extensionsList');
  const addModeBtn = document.querySelector<HTMLButtonElement>('#add-mode-btn');
  const saveModeBtn = document.querySelector<HTMLButtonElement>('#save-mode');
  const cancelModalBtn =
    document.querySelector<HTMLButtonElement>('#cancel-modal');
  const modeModal = document.querySelector<HTMLButtonElement>('#mode-modal');
  const modesList = document.querySelector<HTMLButtonElement>('#modes-list');
  const modeForm = document.getElementById('mode-form') as HTMLFormElement;
  const modeNameInput = document.getElementById(
    'mode-name-input'
  ) as HTMLInputElement;
  let newModeName: string;

  modeForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!modeNameInput.value.trim()) {
      modeNameInput.classList.add('border-red-600');
      modeNameInput.focus();
    } else {
      modeNameInput.classList.remove('border-red-600');

      newModeName = modeNameInput.value.trim();

      modeNameInput.value = '';

      const modeId = secure();
      const newMode = {
        id: modeId,
        name: newModeName,
        enabled: false,
        extensions: [],
      };

      // Save new mode to storage
      const savedState: ExtensionStorage = await browser.storage.sync.get({
        modes: [],
      });
      const modes = [...savedState.modes, newMode];
      await saveModesToStorage(modes);

      // Add to the UI
      const modeItem = createModeItem(
        modeId,
        newMode.name,
        newMode.extensions,
        newMode.enabled
      );
      modesList?.appendChild(modeItem);

      modeModal?.classList.replace('flex', 'hidden');
    }
  });

  document.getElementById('cancel-modal')?.addEventListener('click', () => {
    document.getElementById('mode-modal')?.classList.replace('flex', 'hidden');
    modeNameInput.classList.remove('border-red-600');
  });

  const savedState: ExtensionStorage = await browser.storage.sync.get({
    enabledExtensions: [],
    toggleAllState: false,
    modes: [],
  });

  if (toggleAll) {
    toggleAll.checked = savedState.toggleAllState;
  }

  extensionsContent?.classList.remove('hidden');
  modesContent?.classList.add('hidden');

  extensionsTab?.addEventListener('click', () => {
    extensionsTab?.classList.replace('bg-btn-border/15', 'bg-btn-border/50');
    modesTab?.classList.replace('bg-btn-border/50', 'bg-btn-border/15');
    extensionsContent?.classList.remove('hidden');
    modesContent?.classList.add('hidden');
  });

  modesTab?.addEventListener('click', () => {
    modesTab.classList.replace('bg-btn-border/15', 'bg-btn-border/50');
    extensionsTab?.classList.replace('bg-btn-border/50', 'bg-btn-border/15');
    modesContent?.classList.remove('hidden');
    extensionsContent?.classList.add('hidden');
  });

  toggleAll?.addEventListener('change', () =>
    toggleAllExtensions(toggleAll, extensions, extensionsList)
  );

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

  if (savedState.modes.length > 0 && modesList) {
    savedState.modes.forEach((mode) => {
      const modeItem = createModeItem(
        mode.id,
        mode.name,
        mode.extensions,
        mode.enabled
      );
      modesList.appendChild(modeItem);
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

  addModeBtn?.addEventListener('click', () => {
    if (modeModal?.classList.contains('hidden')) {
      modeModal.classList.replace('hidden', 'flex');
    } else {
      modeModal?.classList.replace('flex', 'hidden');
    }
  });

  cancelModalBtn?.addEventListener('click', () => {
    if (modeModal?.classList.contains('flex')) {
      modeModal?.classList.replace('flex', 'hidden');
    }

    modeNameInput.value = '';
  });
});

async function toggleAllExtensions(
  toggleAll: HTMLInputElement | null,
  extensions: chrome.management.ExtensionInfo[],
  extensionsList: HTMLUListElement | null
) {
  const newState = toggleAll?.checked;

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

    extensionsList?.classList.add('opacity-40');
    extensionsList?.querySelectorAll('li').forEach((li) => {
      li.classList.add('pointer-events-none');
      const toggleDiv = li.querySelector('#toggle-ex');

      if (toggleDiv) {
        toggleDiv.classList.replace(
          'peer-checked:bg-blue-600',
          'peer-checked:bg-red-600'
        );
      }
    });
  } else {
    const savedExtensions = await browser.storage.sync.get('enabledExtensions');
    if (savedExtensions.enabledExtensions) {
      for (const extId of savedExtensions.enabledExtensions) {
        await browser.management.setEnabled(extId, true);
      }
    }
    extensionsList?.classList.remove('opacity-40');
    extensionsList?.querySelectorAll('li').forEach((li) => {
      li.classList.remove('pointer-events-none');
      const toggleDiv = li.querySelector('#toggle-ex');
      console.log(toggleDiv);
      if (toggleDiv) {
        toggleDiv.classList.replace(
          'peer-checked:bg-red-600',
          'peer-checked:bg-blue-600'
        );
      }
    });
  }
}

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
    'p-3 gap-1.5 items-center hover:bg-selected-btn/10 select-none duration-300 transition-colors rounded-xl flex border bg-btn-border/10 border-btn-border/40 w-full justify-between';

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
  toggleDiv.id = 'toggle-ex';
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

function createModeItem(
  id: string,
  name: string,
  extensions: string[],
  enabled: boolean
): HTMLLIElement {
  const modeContainer = document.createElement('li');

  modeContainer.className =
    'p-4 bg-btn-border/10 rounded-xl hover:bg-btn-border/20 border border-btn-border/40 transition-colors duration-200';

  const modeInfo = document.createElement('div');

  modeInfo.className = 'flex justify-between items-start';

  const titleAndDescContainer = document.createElement('div');
  titleAndDescContainer.className = 'flex flex-col gap-2';
  const titleContainer = document.createElement('p');
  titleContainer.className = 'text-sm font-medium text-content';
  titleContainer.textContent = name;

  titleAndDescContainer.appendChild(titleContainer);

  modeInfo.appendChild(titleAndDescContainer);

  const settingsToggleContainer = document.createElement('div');
  settingsToggleContainer.className = 'flex gap-1 items-center';

  const svgContainer = document.createElement('div');
  svgContainer.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" 
       width="18" 
       height="18" 
       viewBox="0 0 24 24" 
       fill="none" 
       stroke-width="2" 
       stroke-linecap="round" 
       stroke-linejoin="round" 
       class="lucide lucide-settings hover:stroke-neutral-400 transition-colors duration-300 cursor-pointer stroke-neutral-50">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
`;

  const toggleLabel = document.createElement('label');
  toggleLabel.className = 'inline-flex items-center cursor-pointer';

  const toggleInput = document.createElement('input');
  toggleInput.type = 'checkbox';
  toggleInput.className = 'sr-only peer';

  const toggleDiv = document.createElement('div');
  toggleDiv.className =
    'relative w-9 h-5 bg-btn-bg peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600';
  toggleDiv.id = 'toggle-mode';
  toggleLabel.appendChild(toggleInput);
  toggleLabel.appendChild(toggleDiv);

  settingsToggleContainer.appendChild(svgContainer);
  settingsToggleContainer.appendChild(toggleLabel);

  modeInfo.appendChild(settingsToggleContainer);
  modeContainer.appendChild(modeInfo);

  toggleInput.addEventListener('change', async () => {
    enabled = toggleInput.checked;

    const savedState: ExtensionStorage = await browser.storage.sync.get({
      modes: [],
    });
    const modeToUpdate = savedState.modes.find((mode) => mode.id === id);
    if (modeToUpdate) {
      modeToUpdate.enabled = enabled;
    }
    await saveModesToStorage(savedState.modes);
  });

  return modeContainer;
}

function editMode(modeId: string) {
  console.log('edit', modeId);
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

async function saveModesToStorage(modes: Mode[]) {
  await browser.storage.sync.set({ modes });
}
