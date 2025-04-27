import React from 'react';

const Editor: React.FC = () => {
  return (
    <div className="w-full h-screen flex flex-col bg-gray-900 text-white">
      <header className="p-4 bg-gray-800 border-b border-gray-700 flex items-center">
        <h1 className="text-xl font-bold">Game Editor (WIP)</h1>
      </header>
      <main className="flex-1 flex overflow-hidden">
        {/* Hierarchy Panel */}
        <aside className="w-64 bg-gray-800 border-r border-gray-700 p-4 flex-shrink-0">
          <div className="font-semibold mb-2">Hierarchy</div>
          <div className="opacity-60 text-sm">(Scene objects will appear here)</div>
        </aside>
        {/* Viewport */}
        <section className="flex-1 bg-gray-900 flex items-center justify-center border-r border-gray-700">
          <div className="opacity-60 text-lg">[Viewport]</div>
        </section>
        {/* Inspector Panel */}
        <aside className="w-80 bg-gray-800 p-4 flex-shrink-0">
          <div className="font-semibold mb-2">Inspector</div>
          <div className="opacity-60 text-sm">(Selected object properties will appear here)</div>
        </aside>
      </main>
    </div>
  );
};

export default Editor;
