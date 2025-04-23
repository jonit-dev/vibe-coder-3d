import { useEngineStore } from '@core/state/engineStore';

export default function DebugMenu() {
  const { debug, showFps, quality, shadows, setDebug, setShowFps, setQuality, setShadows } =
    useEngineStore();

  if (!debug) {
    return (
      <button
        className="fixed bottom-4 right-4 bg-indigo-600 text-white px-3 py-2 rounded-md shadow-lg hover:bg-indigo-700 transition-colors"
        onClick={() => setDebug(true)}
      >
        Show Debug
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-gray-800 bg-opacity-90 text-white p-4 rounded-lg shadow-lg w-64 z-50">
      <h3 className="text-xl font-bold mb-4 border-b border-gray-600 pb-2">Debug Menu</h3>

      <div className="space-y-3">
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={debug}
              onChange={(e) => setDebug(e.target.checked)}
              className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 mr-2"
            />
            <span>Debug Mode</span>
          </label>
        </div>

        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showFps}
              onChange={(e) => setShowFps(e.target.checked)}
              className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 mr-2"
            />
            <span>Show FPS</span>
          </label>
        </div>

        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={shadows}
              onChange={(e) => setShadows(e.target.checked)}
              className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 mr-2"
            />
            <span>Shadows</span>
          </label>
        </div>

        <div className="flex flex-col">
          <label className="mb-1">Quality:</label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value as 'low' | 'medium' | 'high')}
            className="bg-gray-700 text-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
    </div>
  );
}
