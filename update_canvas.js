const fs = require('fs');

let content = fs.readFileSync('src/components/CreativeCanvasEditor.tsx', 'utf8');

// Fix handleResize logic to account for height
const oldResize = `    const handleResize = () => {
      const container = document.getElementById('canvas-editor-container');
      if (container) {
        const availableWidth = container.clientWidth - 48; // padding
        const newScale = Math.min(availableWidth / CANVAS_WIDTH, 0.8);
        setScale(newScale);
      }
    };`;

const newResize = `    const handleResize = () => {
      const container = document.getElementById('canvas-editor-container');
      if (container) {
        const availableWidth = container.clientWidth - 64; 
        const availableHeight = container.clientHeight - 64;
        const scaleX = availableWidth / CANVAS_WIDTH;
        const scaleY = availableHeight / CANVAS_HEIGHT;
        const newScale = Math.min(scaleX, scaleY, 1); 
        setScale(newScale);
      }
    };`;

content = content.replace(oldResize, newResize);
fs.writeFileSync('src/components/CreativeCanvasEditor.tsx', content, 'utf8');
console.log('CreativeCanvasEditor updated');
