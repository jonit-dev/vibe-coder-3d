const CameraDebugOverlay = ({ position }: { position: [number, number, number] }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'rgba(0,0,0,0.7)',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: 14,
        padding: '6px 12px',
        borderRadius: 6,
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      cam: [{position[0].toFixed(2)}, {position[1].toFixed(2)}, {position[2].toFixed(2)}]
    </div>
  );
};

export default CameraDebugOverlay;
