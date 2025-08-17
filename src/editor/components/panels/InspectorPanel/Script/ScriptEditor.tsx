import React, { useCallback, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

export interface IScriptEditorProps {
  code: string;
  language: 'javascript' | 'typescript';
  onChange: (code: string) => void;
  hasErrors?: boolean;
  errorMessage?: string;
  height?: number | string;
}

export const ScriptEditor: React.FC<IScriptEditorProps> = ({
  code,
  language = 'javascript',
  onChange,
  hasErrors = false,
  errorMessage,
  height = '300px',
}) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (newValue: string | undefined) => {
    onChange(newValue || '');
  };

  // Default "Hello World" script template demonstrating editor context
  const defaultValue =
    language === 'typescript'
      ? `// Hello World TypeScript Script
// This demonstrates basic editor context access

function onStart(): void {
  // Hello World with entity information
  console.log("🎮 Hello World! Script started!");
  console.log("📍 Entity ID:", entity.id);
  console.log("📛 Entity name:", entity.name);
  console.log("🌍 Current position:", entity.transform.position);
  
  // Demonstrate entity manipulation
  console.log("✨ Changing entity color to show interaction...");
  if (three.mesh) {
    three.material.setColor("#00ff00"); // Green color
  }
  
  // Show available context objects
  console.log("🔧 Available context:");
  console.log("   - entity: Entity manipulation API");
  console.log("   - time: Game time information");
  console.log("   - input: User input handling");
  console.log("   - math: Math utilities");
  console.log("   - three: Three.js object access");
  console.log("   - console: Logging functions");
}

function onUpdate(deltaTime: number): void {
  // Gentle rotation to show the script is running
  entity.transform.rotate(0, deltaTime * 0.5, 0);
  
  // Periodic status update (every 2 seconds)
  if (Math.floor(time.time) % 2 === 0 && Math.floor(time.time * 10) % 10 === 0) {
    console.log("🔄 Script running! Position:", entity.transform.position);
  }
}`
      : `// Hello World JavaScript Script
// This demonstrates basic editor context access

function onStart() {
  // Hello World with entity information
  console.log("🎮 Hello World! Script started!");
  console.log("📍 Entity ID:", entity.id);
  console.log("📛 Entity name:", entity.name);
  console.log("🌍 Current position:", entity.transform.position);
  
  // Demonstrate entity manipulation
  console.log("✨ Changing entity color to show interaction...");
  if (three.mesh) {
    three.material.setColor("#00ff00"); // Green color
  }
  
  // Show available context objects
  console.log("🔧 Available context:");
  console.log("   - entity: Entity manipulation API");
  console.log("   - time: Game time information");
  console.log("   - input: User input handling");
  console.log("   - math: Math utilities");
  console.log("   - three: Three.js object access");
  console.log("   - console: Logging functions");
}

function onUpdate(deltaTime) {
  // Gentle rotation to show the script is running
  entity.transform.rotate(0, deltaTime * 0.5, 0);
  
  // Periodic status update (every 2 seconds)
  if (Math.floor(time.time) % 2 === 0 && Math.floor(time.time * 10) % 10 === 0) {
    console.log("🔄 Script running! Position:", entity.transform.position);
  }
}`;

  // Use the provided code or fall back to default template
  const editorValue = code || defaultValue;

  return (
    <div className="flex flex-col h-full border border-gray-600 rounded overflow-hidden">
      <div className="flex-1">
        <Editor
          height={height}
          defaultLanguage={language}
          language={language}
          theme="vs-dark"
          value={editorValue}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 12,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            contextmenu: true,
            quickSuggestions: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
            parameterHints: { enabled: true },
            hover: { enabled: true },
            bracketPairColorization: { enabled: true },
            folding: true,
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            selectOnLineNumbers: true,
            roundedSelection: false,
            readOnly: false,
            cursorStyle: 'line',
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
          }}
        />
      </div>

      {/* Error display */}
      {hasErrors && errorMessage && (
        <div className="bg-red-900 border-t border-red-700 px-3 py-2 text-xs text-red-200">
          <div className="flex items-center">
            <span className="mr-2">❌</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Script help text */}
      <div className="bg-gray-800 px-3 py-2 text-xs text-gray-400 border-t border-gray-600 flex-shrink-0">
        <div className="flex items-center justify-between">
          <span>
            💡 Use <code>entity</code>, <code>time</code>, <code>input</code>, <code>math</code>,{' '}
            <code>three</code>, and <code>console</code> objects
          </span>
          <span className="text-gray-500">
            {language === 'typescript' ? 'TypeScript' : 'JavaScript'}
          </span>
        </div>
      </div>
    </div>
  );
};
