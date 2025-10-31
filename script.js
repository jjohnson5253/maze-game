class MazeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.statusElement = document.getElementById('status'); // May be null
        this.levelDisplay = document.getElementById('level-display'); // May be null
        this.startScreen = document.getElementById('start-screen');
        this.playBtn = document.getElementById('play-btn');
        
        // Demon image element for jump scare
        this.demonImg = null;
        
        // Game state
        this.currentLevel = 1;
        this.gameStarted = false;
        this.gameWon = false;
        this.gameLost = false;
        this.showingStartScreen = true;
        this.jumpScareTriggered = false; // Track if jump scare has been triggered
        
        // Player (blue square) - smaller size for tiny cells
        this.player = {
            x: 0,
            y: 0,
            size: 4, // Much smaller to fit in 6px cells
            color: '#4A90E2'
        };
        
        // Mouse/touch position
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseOverCanvas = false;
        
        // Maze properties - Fixed size
        this.cellSize = 6; // Fixed wall width (50px / 8 = 6.25px, rounded to 6px)
        this.mazeWidth = 300; // Fixed maze width
        this.maze = [];
        this.startPos = { x: 0, y: 0 };
        this.endPos = { x: 0, y: 0 };
        this.thirdObstacleY = 0; // Store position of third obstacle
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.generateMaze();
        this.positionPlayButton();
        this.setupEventListeners();
        this.gameLoop();
    }
    
    setupCanvas() {
        // Fixed maze dimensions
        this.canvas.width = this.mazeWidth;  // Always 300px wide
        
        // Make maze twice as long height-wise (450px instead of 225px)
        const mazeHeight = Math.floor(this.mazeWidth * 1.5); // 450px height (300 * 1.5)
        this.canvas.height = mazeHeight;
        
        // Set CSS dimensions to match canvas dimensions
        this.canvas.style.width = this.mazeWidth + 'px';
        this.canvas.style.height = mazeHeight + 'px';
    }
    
    generateMaze() {
        // Fixed maze grid: 300px / 6px = 50 cols, 450px / 6px = 75 rows
        const cols = Math.floor(this.canvas.width / this.cellSize);   // 50 columns
        const rows = Math.floor(this.canvas.height / this.cellSize);  // 75 rows
        
        // Create maze array (1 = wall, 0 = path)
        this.maze = [];
        for (let y = 0; y < rows; y++) {
            this.maze[y] = [];
            for (let x = 0; x < cols; x++) {
                this.maze[y][x] = 1; // Start with all walls
            }
        }
        
        // Generate single level maze pattern
        this.generateLevel1();
        
        this.setStartAndEnd();
    }
    
    generateLevel1() {
        // Simple hand-crafted maze with progressively narrowing paths
        const cols = this.maze[0].length;  // 50 columns
        const rows = this.maze.length;     // 75 rows  
        const midX = Math.floor(cols / 2); // 25 (center column)
        
        // Fill entire maze with walls first
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                this.maze[y][x] = 1;
            }
        }
        
        // Create three sections with progressively narrower paths
        const firstThird = Math.floor(rows / 3);   // 0-25 rows
        const secondThird = Math.floor(rows * 2 / 3); // 26-50 rows
        // Third section: 51-75 rows
        
        // FIRST THIRD: Wide path (12 cells wide = ±6 from center)
        for (let y = 1; y < firstThird; y++) {
            for (let pathWidth = -6; pathWidth <= 6; pathWidth++) {
                const pathX = midX + pathWidth;
                if (pathX >= 1 && pathX < cols - 1) {
                    this.maze[y][pathX] = 0;
                }
            }
        }
        
        // SECOND THIRD: Medium path (6 cells wide = ±3 from center)  
        for (let y = firstThird; y < secondThird; y++) {
            for (let pathWidth = -3; pathWidth <= 3; pathWidth++) {
                const pathX = midX + pathWidth;
                if (pathX >= 1 && pathX < cols - 1) {
                    this.maze[y][pathX] = 0;
                }
            }
        }
        
        // THIRD THIRD: Narrow path (3 cells wide = ±1 from center, plus center)
        for (let y = secondThird; y < rows - 1; y++) {
            for (let pathWidth = -1; pathWidth <= 1; pathWidth++) {
                const pathX = midX + pathWidth;
                if (pathX >= 1 && pathX < cols - 1) {
                    this.maze[y][pathX] = 0;
                }
            }
        }
        
        // Add some simple obstacles in the wide sections for interest
        // First third: Add a wall block that extends to half the maze width
        const obstacle2Y = Math.floor(firstThird * 0.7);
        const halfWidth = Math.floor(cols / 2); // Half the width (25 columns)
        
        // Extended obstacle in first third - from center to half width
        for (let x = midX; x <= halfWidth; x++) {
            for (let y = obstacle2Y; y <= obstacle2Y + 2; y++) {
                if (x >= 1 && x < cols - 1 && y >= 1 && y < rows - 1) {
                    this.maze[y][x] = 1;
                }
            }
        }
        
        // Second third: Add smaller obstacles
        const obstacle3Y = Math.floor(firstThird + (secondThird - firstThird) * 0.5);
        // Center obstacle in second third  
        for (let x = midX - 1; x <= midX + 1; x++) {
            for (let y = obstacle3Y; y <= obstacle3Y + 1; y++) {
                if (x >= 1 && x < cols - 1 && y >= 1 && y < rows - 1) {
                    this.maze[y][x] = 1;
                }
            }
        }
        // Create passage around the obstacle
        this.maze[obstacle3Y][midX - 2] = 0;
        this.maze[obstacle3Y][midX + 2] = 0;
        this.maze[obstacle3Y + 1][midX - 2] = 0;
        this.maze[obstacle3Y + 1][midX + 2] = 0;
        
        // Third section: Add obstacle in the narrow final passage
        const obstacle4Y = Math.floor(secondThird + (rows - secondThird) * 0.6);
        this.thirdObstacleY = obstacle4Y; // Store for jump scare trigger
        // Three-row obstacle in the center of the narrow path
        if (obstacle4Y >= 1 && obstacle4Y < rows - 5) { // Leave room before the end
            for (let y = obstacle4Y; y <= obstacle4Y + 2; y++) { // Three rows long
                this.maze[y][midX] = 1; // Block the center
                // Force players to go around by ensuring side paths are clear
                this.maze[y][midX - 1] = 0; // Left path clear
                this.maze[y][midX + 1] = 0; // Right path clear
            }
        }
    }
    

    
    setStartAndEnd() {
        const cols = this.maze[0].length;
        const rows = this.maze.length;
        
        // For true center positioning, use exact pixel center of the maze
        const centerX = this.mazeWidth / 2; // 300px / 2 = 150px
        const centerGridX = Math.floor(centerX / this.cellSize); // Which grid cell this falls into
        
        // Set start position at top middle (exact center)
        // Make sure there's a clear path at the center
        this.maze[1][centerGridX] = 0; // Ensure start position is clear
        // Also clear adjacent cells for easier navigation
        if (centerGridX > 0) this.maze[1][centerGridX - 1] = 0;
        if (centerGridX < cols - 1) this.maze[1][centerGridX + 1] = 0;
        
        this.startPos = { 
            x: centerX, // Exact pixel center: 150px
            y: 1 * this.cellSize + this.cellSize / 2  // Top row center
        };
        this.player.x = this.startPos.x;
        this.player.y = this.startPos.y;
        
        // Set end position at bottom middle (exact center)
        this.maze[rows - 2][centerGridX] = 0; // Ensure end position is clear
        if (centerGridX > 0) this.maze[rows - 2][centerGridX - 1] = 0;
        if (centerGridX < cols - 1) this.maze[rows - 2][centerGridX + 1] = 0;
        
        this.endPos = { 
            x: centerX, // Exact pixel center: 150px
            y: (rows - 2) * this.cellSize + this.cellSize / 2 
        };
    }
    
    positionPlayButton() {
        // Position the play button within the wide start area (50px down from start)
        setTimeout(() => {
            // Calculate the exact position where the blue square will start
            // startPos.x and startPos.y are the pixel coordinates in the canvas
            const buttonX = this.startPos.x - (this.playBtn.offsetWidth / 2);
            const buttonY = (this.startPos.y - (this.playBtn.offsetHeight / 2)) + 50; // Move down 50px
            
            // Position the button within the start area
            this.playBtn.style.left = buttonX + 'px';
            this.playBtn.style.top = buttonY + 'px';
            this.playBtn.style.transform = 'none';
        }, 50);
    }
    
    showDemonImage() {
        // Create demon image element if it doesn't exist
        if (!this.demonImg) {
            this.demonImg = document.createElement('img');
            this.demonImg.src = 'image.png';
            this.demonImg.style.position = 'fixed';
            this.demonImg.style.top = '50%';
            this.demonImg.style.left = '50%';
            this.demonImg.style.transform = 'translate(-50%, -50%)';
            this.demonImg.style.maxWidth = '400px';
            this.demonImg.style.height = 'auto';
            this.demonImg.style.zIndex = '10000';
            this.demonImg.style.display = 'none';
            document.body.appendChild(this.demonImg);
        }
        
        // Play scream sound
        const screamAudio = new Audio('sound.wav');
        screamAudio.play().catch(e => console.log('Audio play failed:', e));
        
        // Show the demon image (and keep it visible)
        this.demonImg.style.display = 'block';
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseenter', () => this.isMouseOverCanvas = true);
        this.canvas.addEventListener('mouseleave', () => this.isMouseOverCanvas = false);
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', () => this.isMouseOverCanvas = false);
        
        // Play button
        this.playBtn.addEventListener('click', (e) => this.startGame(e));
        
        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }
    
    startGame(clickEvent) {
        console.log('Start game called');
        this.showingStartScreen = false;
        this.startScreen.classList.add('hidden');
        this.gameStarted = true;
        
        if (this.statusElement) {
            this.statusElement.textContent = 'Navigate to the red area to win!';
        }
        
        // Get the mouse position from the click event relative to canvas
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        // Calculate where the click happened on the canvas
        this.mouseX = (clickEvent.clientX - rect.left) * scaleX;
        this.mouseY = (clickEvent.clientY - rect.top) * scaleY;
        
        // Position the blue rectangle exactly where the mouse was clicked
        this.player.x = this.mouseX;
        this.player.y = this.mouseY;
        
        // Enable cursor tracking
        this.canvas.style.cursor = 'none';
        console.log('Game started successfully at position:', this.mouseX, this.mouseY);
    }

    handleMouseMove(e) {
        if (this.showingStartScreen || !this.gameStarted) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        this.mouseX = (e.clientX - rect.left) * scaleX;
        this.mouseY = (e.clientY - rect.top) * scaleY;
        
        this.updatePlayerPosition();
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        this.isMouseOverCanvas = true;
        this.handleTouchMove(e);
    }
    
    handleTouchMove(e) {
        if (this.showingStartScreen || !this.gameStarted) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        this.mouseX = (touch.clientX - rect.left) * scaleX;
        this.mouseY = (touch.clientY - rect.top) * scaleY;
        
        this.updatePlayerPosition();
    }
    
    updatePlayerPosition() {
        if (this.gameLost || this.gameWon) return;
        
        const newX = this.mouseX;
        const newY = this.mouseY;
        
        // Check collision with walls
        if (this.checkCollision(newX, newY)) {
            console.log('Wall collision detected, restarting level...');
            // Automatically restart the level by showing the play screen again
            this.restartLevel();
            return;
        }
        
        // Update player position
        this.player.x = newX;
        this.player.y = newY;
        
        // Check if halfway past the last obstacle
        if (!this.jumpScareTriggered && this.thirdObstacleY > 0) {
            const obstacleTopY = this.thirdObstacleY * this.cellSize; // Top of obstacle
            const obstacleBottomY = (this.thirdObstacleY + 2) * this.cellSize; // Bottom of 3-row obstacle
            const triggerY = obstacleTopY + ((obstacleBottomY - obstacleTopY) / 2); // Halfway through obstacle
            
            if (this.player.y > triggerY) {
                this.jumpScareTriggered = true;
                this.gameWon = true;
                console.log('Halfway past last obstacle, triggering jump scare...');
                // Show demon image and play scream for jump scare effect
                this.showDemonImage();
            }
        }
        
        // Check if reached actual end (for backup, though jump scare should trigger first)
        if (this.checkWinCondition() && !this.jumpScareTriggered) {
            this.gameWon = true;
            console.log('Reached end of maze, triggering jump scare...');
            // Show demon image and play scream for jump scare effect
            this.showDemonImage();
        }
    }
    
    checkCollision(x, y) {
        const halfSize = this.player.size / 2;
        
        // Check corners of the player square
        const corners = [
            { x: x - halfSize, y: y - halfSize },
            { x: x + halfSize, y: y - halfSize },
            { x: x - halfSize, y: y + halfSize },
            { x: x + halfSize, y: y + halfSize }
        ];
        
        for (const corner of corners) {
            const gridX = Math.floor(corner.x / this.cellSize);
            const gridY = Math.floor(corner.y / this.cellSize);
            
            if (gridX < 0 || gridX >= this.maze[0].length || gridY < 0 || gridY >= this.maze.length) {
                return true; // Out of bounds
            }
            
            if (this.maze[gridY] && this.maze[gridY][gridX] === 1) {
                return true; // Hit a wall
            }
        }
        
        return false;
    }
    
    checkWinCondition() {
        const distance = Math.sqrt(
            Math.pow(this.player.x - this.endPos.x, 2) +
            Math.pow(this.player.y - this.endPos.y, 2)
        );
        
        return distance < this.cellSize / 2;
    }
    
    restartLevel() {
        console.log('Restart level called');
        
        // Reset all game state (no level progression)
        this.showingStartScreen = true;
        this.gameStarted = false;
        this.gameWon = false;
        this.gameLost = false;
        this.jumpScareTriggered = false;
        
        // Update status
        if (this.statusElement) {
            this.statusElement.textContent = 'Click PLAY to start your maze adventure!';
            this.statusElement.style.color = 'white';
        }
        
        // Show start screen again
        this.startScreen.classList.remove('hidden');
        this.canvas.style.cursor = 'default';
        
        // Regenerate maze and reposition elements
        this.generateMaze();
        this.positionPlayButton();
        
        console.log('Restart completed - start screen should be visible');
    }
    
    handleResize() {
        this.setupCanvas();
        this.generateMaze();
        if (this.showingStartScreen) {
            this.positionPlayButton();
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw maze
        this.ctx.fillStyle = '#ffffff';
        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[y].length; x++) {
                if (this.maze[y][x] === 1) {
                    this.ctx.fillRect(
                        x * this.cellSize,
                        y * this.cellSize,
                        this.cellSize,
                        this.cellSize
                    );
                }
            }
        }
        
        // Draw end zone
        this.ctx.fillStyle = '#ff4444';
        this.ctx.beginPath();
        this.ctx.arc(this.endPos.x, this.endPos.y, this.cellSize / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw player
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(
            this.player.x - this.player.size / 2,
            this.player.y - this.player.size / 2,
            this.player.size,
            this.player.size
        );
        
        // Add glow effect to player
        this.ctx.shadowColor = this.player.color;
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(
            this.player.x - this.player.size / 2,
            this.player.y - this.player.size / 2,
            this.player.size,
            this.player.size
        );
        this.ctx.shadowBlur = 0;
    }
    
    gameLoop() {
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new MazeGame();
});