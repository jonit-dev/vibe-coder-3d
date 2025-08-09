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
  language,
  onChange,
  hasErrors = false,
  errorMessage,
  height = 300,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor) => {
      editorRef.current = editor;

      // Configure editor options
      editor.updateOptions({
        fontSize: 12,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        automaticLayout: true,
        bracketPairColorization: { enabled: true },
        suggest: {
          showFields: true,
          showFunctions: true,
          showConstructors: true,
          showMethods: true,
          showProperties: true,
        },
      });

      // Add script API types to Monaco's TypeScript compiler
      if (language === 'typescript' || language === 'javascript') {
        const scriptAPITypes = `
        interface IMathAPI {
          readonly PI: number;
          readonly E: number;
          abs(x: number): number;
          sin(x: number): number;
          cos(x: number): number;
          tan(x: number): number;
          sqrt(x: number): number;
          pow(x: number, y: number): number;
          random(): number;
          floor(x: number): number;
          ceil(x: number): number;
          round(x: number): number;
          clamp(value: number, min: number, max: number): number;
          lerp(a: number, b: number, t: number): number;
          radToDeg(rad: number): number;
          degToRad(deg: number): number;
          distance(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number;
        }

        interface ITransformAPI {
          readonly position: [number, number, number];
          readonly rotation: [number, number, number];
          readonly scale: [number, number, number];
          setPosition(x: number, y: number, z: number): void;
          setRotation(x: number, y: number, z: number): void;
          setScale(x: number, y: number, z: number): void;
          translate(x: number, y: number, z: number): void;
          rotate(x: number, y: number, z: number): void;
          lookAt(targetPos: [number, number, number]): void;
          forward(): [number, number, number];
          right(): [number, number, number];
          up(): [number, number, number];
        }

        interface IInputAPI {
          isKeyPressed(key: string): boolean;
          isKeyDown(key: string): boolean;
          isKeyUp(key: string): boolean;
          mousePosition(): [number, number];
          isMouseButtonPressed(button: number): boolean;
          isMouseButtonDown(button: number): boolean;
          isMouseButtonUp(button: number): boolean;
        }

        interface IEntityAPI {
          readonly id: number;
          readonly name: string;
          readonly transform: ITransformAPI;
          getComponent<T = any>(componentType: string): T | null;
          setComponent<T = any>(componentType: string, data: Partial<T>): boolean;
          hasComponent(componentType: string): boolean;
          removeComponent(componentType: string): boolean;
        }

        interface IConsoleAPI {
          log(...args: any[]): void;
          warn(...args: any[]): void;
          error(...args: any[]): void;
          info(...args: any[]): void;
        }

        interface ITimeAPI {
          readonly time: number;
          readonly deltaTime: number;
          readonly frameCount: number;
        }

        // Three.js API types
        interface IThreeJSAPI {
          readonly object3D: any | null;
          readonly mesh: any | null;
          readonly group: any | null;
          readonly scene: any | null;
          readonly parent: any | null;
          readonly children: any[];
          
          material: {
            get(): any | null;
            set(material: any): void;
            setProperty(property: string, value: any): void;
            setColor(color: string | number): void;
            setOpacity(opacity: number): void;
            setMetalness(metalness: number): void;
            setRoughness(roughness: number): void;
          };
          
          geometry: {
            get(): any | null;
            setProperty(property: string, value: any): void;
            scale(x: number, y: number, z: number): void;
            rotateX(angle: number): void;
            rotateY(angle: number): void;
            rotateZ(angle: number): void;
          };
          
          animate: {
            position(to: [number, number, number], duration: number): Promise<void>;
            rotation(to: [number, number, number], duration: number): Promise<void>;
            scale(to: [number, number, number], duration: number): Promise<void>;
          };
          
          raycast(origin: [number, number, number], direction: [number, number, number]): any[];
          lookAt(target: [number, number, number]): void;
          worldPosition(): [number, number, number];
          worldRotation(): [number, number, number];
          setVisible(visible: boolean): void;
          isVisible(): boolean;
        }

        // Global script context variables
        declare const entity: IEntityAPI;
        declare const time: ITimeAPI;
        declare const input: IInputAPI;
        declare const math: IMathAPI;
        declare const console: IConsoleAPI;
        declare const three: IThreeJSAPI;
        declare const parameters: Record<string, any>;

        // Lifecycle functions that can be implemented
        declare function onStart(): void;
        declare function onUpdate(deltaTime: number): void;
        declare function onDestroy(): void;
        declare function onEnable(): void;
        declare function onDisable(): void;
      `;

        // Add extra libraries for IntelliSense
        monaco.languages.typescript.javascriptDefaults.addExtraLib(
          scriptAPITypes,
          'script-api.d.ts',
        );

        monaco.languages.typescript.typescriptDefaults.addExtraLib(
          scriptAPITypes,
          'script-api.d.ts',
        );
      }
    },
    [language],
  );

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        onChange(value);
      }
    },
    [onChange],
  );

  // Update error markers when errors change
  useEffect(() => {
    if (editorRef.current && hasErrors && errorMessage) {
      const model = editorRef.current.getModel();
      if (model) {
        // Simple error parsing - in a real implementation, you'd parse the error
        // to extract line numbers and provide more precise error locations
        monaco.editor.setModelMarkers(model, 'script-errors', [
          {
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 100,
            message: errorMessage,
            severity: monaco.MarkerSeverity.Error,
          },
        ]);
      }
    } else if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monaco.editor.setModelMarkers(model, 'script-errors', []);
      }
    }
  }, [hasErrors, errorMessage]);

  // Set theme
  const theme = 'vs-dark';

  const defaultCode =
    language === 'typescript'
      ? `// TypeScript Script Example
// Access entity properties through 'entity' object
// Use 'time', 'input', 'math', 'console', and 'three' for engine features

function onStart() {
  console.log("Script started on entity:", entity.name);
  
  // Transform operations
  entity.transform.setPosition(0, 0, 0);
  
  // Three.js material manipulation
  if (three.mesh) {
    three.material.setColor("#ff6b6b");
    three.material.setOpacity(0.8);
  }
}

function onUpdate(deltaTime: number) {
  // Entity transform operations
  entity.transform.rotate(0, deltaTime, 0);
  
  // Three.js object manipulation
  if (three.object3D) {
    const time = performance.now() * 0.001;
    const bounce = Math.sin(time * 2) * 0.5;
    three.object3D.position.y = bounce;
  }
  
  // Raycast example
  const hits = three.raycast([0, 0, 0], [0, -1, 0]);
  if (hits.length > 0) {
    console.log("Hit detected:", hits[0].distance);
  }
}`
      : `// JavaScript Script Example
// Access entity properties through 'entity' object
// Use 'time', 'input', 'math', 'console', and 'three' for engine features

function onStart() {
  console.log("Script started on entity:", entity.name);
  
  // Transform operations
  entity.transform.setPosition(0, 0, 0);
  
  // Three.js material manipulation
  if (three.mesh) {
    three.material.setColor("#ff6b6b");
    three.material.setOpacity(0.8);
  }
}

function onUpdate(deltaTime) {
  // Entity transform operations
  entity.transform.rotate(0, deltaTime, 0);
  
  // Three.js object manipulation
  if (three.object3D) {
    const time = performance.now() * 0.001;
    const bounce = Math.sin(time * 2) * 0.5;
    three.object3D.position.y = bounce;
  }
  
  // Raycast example
  const hits = three.raycast([0, 0, 0], [0, -1, 0]);
  if (hits.length > 0) {
    console.log("Hit detected:", hits[0].distance);
  }
}`;

  // Calculate the actual editor height by subtracting the help text area
  const actualHeight =
    typeof height === 'string' && height === '100%'
      ? 'calc(100% - 40px)' // Subtract help text height
      : height;

  return (
    <div className="flex flex-col h-full border border-gray-600 rounded overflow-hidden">
      <div className="flex-1">
        <Editor
          height={actualHeight}
          defaultLanguage={language}
          language={language}
          value={code || defaultCode}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme={theme}
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
          }}
        />
      </div>

      {/* Script help text */}
      <div className="bg-gray-800 px-3 py-2 text-xs text-gray-400 border-t border-gray-600 flex-shrink-0">
        <div className="flex items-center justify-between">
          <span>
            Use <code>entity</code>, <code>time</code>, <code>input</code>, <code>math</code>,{' '}
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
