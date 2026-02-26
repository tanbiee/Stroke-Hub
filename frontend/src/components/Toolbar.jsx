import { FiEdit3, FiCircle, FiTrash2, FiRotateCcw, FiRotateCw, FiDownload, FiSquare } from 'react-icons/fi';
import { BsEraserFill, BsPaintBucket } from 'react-icons/bs';
import { MdShowChart } from 'react-icons/md';
import './Toolbar.css';

const PRESET_COLORS = [
    '#ffffff', '#ff0000', '#ff6b35', '#ffc107',
    '#4caf50', '#2196f3', '#9c27b0', '#e91e63',
    '#00bcd4', '#795548', '#607d8b', '#000000',
];

export default function Toolbar({
    tool, setTool,
    color, setColor,
    brushSize, setBrushSize,
    onUndo, onRedo,
    onClear, onSave,
    canUndo, canRedo,
    canDraw,
}) {
    return (
        <div className="toolbar">
            {/* Tools */}
            <div className="toolbar-section">
                <span className="toolbar-label">Tools</span>
                <div className="toolbar-group">
                    <button
                        className={`btn-icon ${tool === 'pencil' ? 'active' : ''}`}
                        onClick={() => setTool('pencil')}
                        disabled={!canDraw}
                        title="Pencil"
                    >
                        <FiEdit3 />
                    </button>
                    <button
                        className={`btn-icon ${tool === 'fill' ? 'active' : ''}`}
                        onClick={() => setTool('fill')}
                        disabled={!canDraw}
                        title="Fill Bucket"
                    >
                        <BsPaintBucket />
                    </button>
                    <button
                        className={`btn-icon ${tool === 'line' ? 'active' : ''}`}
                        onClick={() => setTool('line')}
                        disabled={!canDraw}
                        title="Line"
                    >
                        <MdShowChart />
                    </button>
                    <button
                        className={`btn-icon ${tool === 'rect' ? 'active' : ''}`}
                        onClick={() => setTool('rect')}
                        disabled={!canDraw}
                        title="Rectangle"
                    >
                        <FiSquare />
                    </button>
                    <button
                        className={`btn-icon ${tool === 'circle' ? 'active' : ''}`}
                        onClick={() => setTool('circle')}
                        disabled={!canDraw}
                        title="Circle"
                    >
                        <FiCircle />
                    </button>
                    <button
                        className={`btn-icon ${tool === 'eraser' ? 'active' : ''}`}
                        onClick={() => setTool('eraser')}
                        disabled={!canDraw}
                        title="Eraser"
                    >
                        <BsEraserFill />
                    </button>
                </div>
            </div>

            {/* Divider */}
            <div className="toolbar-divider" />

            {/* Colors */}
            <div className="toolbar-section">
                <span className="toolbar-label">Color</span>
                <div className="color-palette">
                    {PRESET_COLORS.map((c) => (
                        <button
                            key={c}
                            className={`color-swatch ${color === c ? 'active' : ''}`}
                            style={{ backgroundColor: c }}
                            onClick={() => setColor(c)}
                            disabled={!canDraw}
                            title={c}
                        />
                    ))}
                    <input
                        type="color"
                        className="color-custom"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        disabled={!canDraw}
                        title="Custom color"
                    />
                </div>
            </div>

            {/* Divider */}
            <div className="toolbar-divider" />

            {/* Brush Size */}
            <div className="toolbar-section">
                <span className="toolbar-label">Size: {brushSize}px</span>
                <div className="toolbar-group">
                    <input
                        type="range"
                        className="brush-slider"
                        min="1"
                        max="20"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        disabled={!canDraw}
                    />
                    <div
                        className="brush-preview"
                        style={{
                            width: Math.max(brushSize, 4),
                            height: Math.max(brushSize, 4),
                            backgroundColor: tool === 'eraser' ? 'var(--text-muted)' : color,
                        }}
                    />
                </div>
            </div>

            {/* Divider */}
            <div className="toolbar-divider" />

            {/* Actions */}
            <div className="toolbar-section">
                <span className="toolbar-label">Actions</span>
                <div className="toolbar-group">
                    <button
                        className="btn-icon"
                        onClick={onUndo}
                        disabled={!canUndo || !canDraw}
                        title="Undo"
                    >
                        <FiRotateCcw />
                    </button>
                    <button
                        className="btn-icon"
                        onClick={onRedo}
                        disabled={!canRedo || !canDraw}
                        title="Redo"
                    >
                        <FiRotateCw />
                    </button>
                    <button
                        className="btn-icon"
                        onClick={onClear}
                        disabled={!canDraw}
                        title="Clear board"
                    >
                        <FiTrash2 />
                    </button>
                    <button
                        className="btn-icon"
                        onClick={onSave}
                        title="Save as image"
                    >
                        <FiDownload />
                    </button>
                </div>
            </div>
        </div>
    );
}
