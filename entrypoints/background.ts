export default defineBackground(() => {
  getExtensions().then((extensions) => {
    browser.runtime.onConnect.addListener((port) => {
      port.postMessage({ message: extensions });
    });
  });
});

async function getExtensions() {
  try {
    const res = await browser.management.getAll();
    return res;
  } catch (error) {
    console.error('Error retrieving extensions:', error);
    return 0;
  }
}
