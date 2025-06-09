# AssetLoaderModal & useAssetLoader Hook

A generic asset loading system for browsing and selecting files from the public/assets folder.

## Features

- **Generic & Reusable**: Works with any asset type and folder structure
- **File Type Filtering**: Restrict selection to specific file extensions
- **Preview Support**: Built-in image preview for visual assets
- **Folder Navigation**: Browse through nested folder structures
- **Clean UI**: Modern modal interface with folder icons and previews

## Components

### AssetLoaderModal

The main modal component for asset selection.

```tsx
<AssetLoaderModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSelect={(assetPath) => console.log('Selected:', assetPath)}
  title="Select Texture"
  basePath="/assets/textures"
  allowedExtensions={['jpg', 'png', 'gif']}
  showPreview={true}
/>
```

#### Props

- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Called when modal is closed
- `onSelect: (assetPath: string) => void` - Called when asset is selected
- `title?: string` - Modal title (default: "Select Asset")
- `basePath?: string` - Starting folder path (default: "/assets")
- `allowedExtensions?: string[]` - Allowed file extensions (default: all)
- `showPreview?: boolean` - Show image previews (default: true)

### useAssetLoader Hook

A convenience hook that manages modal state and provides a clean API.

```tsx
const skyboxLoader = useAssetLoader({
  title: 'Select Skybox Texture',
  basePath: '/assets/skyboxes',
  allowedExtensions: ['jpg', 'jpeg', 'png'],
  showPreview: true,
  onSelect: (assetPath) => {
    // Handle selection
    setSkyboxTexture(assetPath);
  },
});

// In your JSX:
<button onClick={skyboxLoader.openModal}>Browse</button>
<AssetLoaderModal {...skyboxLoader.modalProps} />
```

#### Hook Options

- `title?: string` - Modal title
- `basePath?: string` - Starting folder path
- `allowedExtensions?: string[]` - Allowed file extensions
- `showPreview?: boolean` - Show image previews
- `onSelect?: (assetPath: string) => void` - Selection callback

#### Hook Returns

- `isOpen: boolean` - Current modal state
- `openModal: () => void` - Opens the modal
- `closeModal: () => void` - Closes the modal
- `handleSelect: (assetPath: string) => void` - Internal selection handler
- `modalProps: object` - Pre-configured props for AssetLoaderModal

## Usage Examples

### Basic Texture Selection

```tsx
const [texture, setTexture] = useState('');

const textureLoader = useAssetLoader({
  title: 'Select Texture',
  basePath: '/assets/textures',
  allowedExtensions: ['jpg', 'png'],
  onSelect: setTexture,
});

return (
  <>
    <div>Current: {texture || 'None'}</div>
    <button onClick={textureLoader.openModal}>Browse Textures</button>
    <AssetLoaderModal {...textureLoader.modalProps} />
  </>
);
```

### Model Selection

```tsx
const modelLoader = useAssetLoader({
  title: 'Select 3D Model',
  basePath: '/assets/models',
  allowedExtensions: ['glb', 'gltf'],
  showPreview: false, // No preview for 3D models
  onSelect: (modelPath) => {
    loadModel(modelPath);
  },
});
```

### Audio Asset Selection

```tsx
const audioLoader = useAssetLoader({
  title: 'Select Audio File',
  basePath: '/assets/audio',
  allowedExtensions: ['mp3', 'wav', 'ogg'],
  showPreview: false,
  onSelect: (audioPath) => {
    setBackgroundMusic(audioPath);
  },
});
```

## Adding New Asset Types

To support new asset types, update the `knownAssets` object in `AssetLoaderModal.tsx`:

```tsx
const knownAssets: Record<string, IAssetFile[]> = {
  '/assets/audio': [
    {
      name: 'background.mp3',
      path: '/assets/audio/background.mp3',
      type: 'file',
      extension: 'mp3',
    },
    // ... more audio files
  ],
  // ... other asset folders
};
```

In a production environment, this would be replaced with a proper API call to discover assets dynamically.

## Future Enhancements

- **Dynamic Asset Discovery**: Replace hardcoded asset list with server API
- **Upload Support**: Allow uploading new assets through the modal
- **Search & Filter**: Add search functionality for large asset libraries
- **Metadata Display**: Show file size, dimensions, and other metadata
- **Multi-Selection**: Support selecting multiple assets at once
- **Drag & Drop**: Support dragging assets directly into components
