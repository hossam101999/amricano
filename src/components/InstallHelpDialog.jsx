function InstallHelpDialog({ isIos, isAndroid, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scaleIn">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Install this app</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          The install option appears only on supported browsers and requires a secure connection (HTTPS).
          If you do not see it, you can still use the app in the browser.
        </p>
        {isIos ? (
          <ol className="list-decimal list-inside text-gray-700 dark:text-gray-200 space-y-1 mb-5">
            <li>Open this app in Safari (iOS does not support install from Chrome or other browsers).</li>
            <li>Tap the Share button.</li>
            <li>Scroll and tap "Add to Home Screen".</li>
            <li>Edit the name if you want, then tap "Add".</li>
          </ol>
        ) : isAndroid ? (
          <ol className="list-decimal list-inside text-gray-700 dark:text-gray-200 space-y-1 mb-5">
            <li>Open this app in Chrome or Samsung Internet.</li>
            <li>Open the browser menu (three dots).</li>
            <li>Tap "Install app" or "Add to Home screen".</li>
            <li>Confirm the install.</li>
          </ol>
        ) : (
          <ol className="list-decimal list-inside text-gray-700 dark:text-gray-200 space-y-1 mb-5">
            <li>Open this app in Chrome or Edge on desktop.</li>
            <li>Look for the install icon in the address bar, or open the browser menu.</li>
            <li>Select "Install app" or "Install Scoreboard".</li>
            <li>Confirm the install.</li>
          </ol>
        )}
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-5">
          If install is missing: refresh the page, leave private/incognito mode, or check that the site is served over HTTPS.
        </div>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-semibold transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default InstallHelpDialog;
