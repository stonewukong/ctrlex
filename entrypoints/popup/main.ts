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
      extensionsCount.innerText = extensions.length.toString();
    }

    if (extensionsList) {
      extensionsList.innerHTML = '';
      extensions.forEach((ex) => {
        const extensionItem = document.createElement('li');
        extensionItem.className =
          'p-3 gap-1.5 items-center hover:bg-selected-btn/10 cursor-pointer duration-300 transition-colors rounded-xl flex border border-btn-border/80 w-full justify-between';
        const imageURL =
          ex.icons?.[0]?.url || '/assets/icons/imagenotfound.svg';
        const isEnabled = ex.enabled ?? false;
        extensionItem.innerHTML = `
              <div class="flex gap-2 items-center">
                <!-- Icon -->
                <img
                  src=${imageURL}
                  alt="extension logo"
                  class="w-4 h-4"
                />
                <!-- Name -->
                <p class="text-ellipsis max-w-44 truncate">
                  ${ex.name}
                </p>
              </div>
              <div class="flex gap-2 items-center">
                <svg id="extension-details" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b4b4b4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info hover:stroke-neutral-50"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                <label class="inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" class="sr-only peer" ${
                  isEnabled ? 'checked' : ''
                }/>
                  <div
                    class="relative w-9 h-5 bg-btn-bg peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
                  ></div>
                </label>
              </div>
           `;
        extensionsList.appendChild(extensionItem);
      });
    }
  });
});
