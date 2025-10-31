class MazeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.statusElement = document.getElementById('status'); // May be null
        this.levelDisplay = document.getElementById('level-display'); // May be null
        this.startScreen = document.getElementById('start-screen');
        this.playBtn = document.getElementById('play-btn');
        
        // Game state
        this.currentLevel = 1;
        this.gameStarted = false;
        this.gameWon = false;
        this.gameLost = false;
        this.showingStartScreen = true;
        
        // Player (blue square)
        this.player = {
            x: 0,
            y: 0,
            size: 15,
            color: '#4A90E2'
        };
        
        // Mouse/touch position
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseOverCanvas = false;
        
        // Maze properties - Fixed size
        this.cellSize = 50; // Fixed wall width
        this.mazeWidth = 300; // Fixed maze width
        this.maze = [];
        this.startPos = { x: 0, y: 0 };
        this.endPos = { x: 0, y: 0 };
        
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
        // Fixed maze grid: 300px / 50px = 6 cols, 225px / 50px = 4.5 ≈ 5 rows (rounded up)
        const cols = Math.floor(this.canvas.width / this.cellSize);   // 6 columns
        const rows = Math.floor(this.canvas.height / this.cellSize);  // 4-5 rows depending on height
        
        // Create maze array (1 = wall, 0 = path)
        this.maze = [];
        for (let y = 0; y < rows; y++) {
            this.maze[y] = [];
            for (let x = 0; x < cols; x++) {
                this.maze[y][x] = 1; // Start with all walls
            }
        }
        
        // Generate different maze patterns based on level
        switch (this.currentLevel) {
            case 1:
                this.generateLevel1();
                break;
            case 2:
                this.generateLevel2();
                break;
            case 3:
                this.generateLevel3();
                break;
            default:
                this.generateRandomMaze();
        }
        
        this.setStartAndEnd();
    }
    
    generateLevel1() {
        // Simple maze with vertical path from top middle to bottom middle
        const cols = this.maze[0].length;
        const rows = this.maze.length;
        const midX = Math.floor(cols / 2);
        
        // Create a simple path
        for (let y = 1; y < rows - 1; y++) {
            for (let x = 1; x < cols - 1; x++) {
                this.maze[y][x] = 0;
            }
        }
        
        // Add some walls to create a simple maze
        for (let y = 2; y < rows - 2; y += 2) {
            for (let x = 3; x < cols - 3; x += 3) {
                // Skip walls that would block the center vertical path
                if (Math.abs(x - midX) > 2) {
                    this.maze[y][x] = 1;
                    this.maze[y][x + 1] = 1;
                    this.maze[y + 1][x] = 1;
                }
            }
        }
        
        // Ensure clear vertical path down the middle
        for (let y = 1; y < rows - 1; y++) {
            this.maze[y][midX] = 0;
            // Also clear adjacent cells for a wider path
            if (midX - 1 >= 1) this.maze[y][midX - 1] = 0;
            if (midX + 1 < cols - 1) this.maze[y][midX + 1] = 0;
        }
    }
    
    generateLevel2() {
        // More complex maze with vertical path
        const cols = this.maze[0].length;
        const rows = this.maze.length;
        const midX = Math.floor(cols / 2);
        
        // Create paths
        for (let y = 1; y < rows - 1; y++) {
            for (let x = 1; x < cols - 1; x++) {
                this.maze[y][x] = 0;
            }
        }
        
        // Add more complex wall patterns, but avoid blocking center path
        for (let y = 2; y < rows - 2; y++) {
            for (let x = 2; x < cols - 2; x++) {
                if ((x + y) % 3 === 0 && Math.random() < 0.6) {
                    // Don't place walls too close to center vertical path
                    if (Math.abs(x - midX) > 1) {
                        this.maze[y][x] = 1;
                    }
                }
            }
        }
        
        // Ensure clear vertical path down the middle
        for (let y = 1; y < rows - 1; y++) {
            this.maze[y][midX] = 0;
        }
    }
    
    generateLevel3() {
        // Very narrow passages
        const cols = this.maze[0].length;
        const rows = this.maze.length;
        
        // Fill with walls
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                this.maze[y][x] = 1;
            }
        }
        
        // Create very narrow winding path
        let currentX = 1;
        let currentY = 1;
        this.maze[currentY][currentX] = 0;
        
        while (currentX < cols - 2 || currentY < rows - 2) {
            const directions = [];
            
            if (currentX < cols - 2) directions.push('right');
            if (currentY < rows - 2) directions.push('down');
            if (currentX > 1 && Math.random() < 0.3) directions.push('left');
            if (currentY > 1 && Math.random() < 0.3) directions.push('up');
            
            const direction = directions[Math.floor(Math.random() * directions.length)];
            
            switch (direction) {
                case 'right': currentX++; break;
                case 'down': currentY++; break;
                case 'left': currentX--; break;
                case 'up': currentY--; break;
            }
            
            this.maze[currentY][currentX] = 0;
        }
    }
    
    generateRandomMaze() {
        // Fallback random maze generation
        const cols = this.maze[0].length;
        const rows = this.maze.length;
        
        for (let y = 1; y < rows - 1; y++) {
            for (let x = 1; x < cols - 1; x++) {
                this.maze[y][x] = Math.random() < 0.7 ? 0 : 1;
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
        // Position the play button at the exact start position (top middle of maze)
        setTimeout(() => {
            // Calculate the exact position where the blue square will start
            // startPos.x and startPos.y are the pixel coordinates in the canvas
            const buttonX = this.startPos.x - (this.playBtn.offsetWidth / 2);
            const buttonY = this.startPos.y - (this.playBtn.offsetHeight / 2);
            
            // Position the button at the start location
            this.playBtn.style.left = buttonX + 'px';
            this.playBtn.style.top = buttonY + 'px';
            this.playBtn.style.transform = 'none';
        }, 50);
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
        this.playBtn.addEventListener('click', () => this.startGame());
        
        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }
    
    startGame() {
        console.log('Start game called');
        this.showingStartScreen = false;
        this.startScreen.classList.add('hidden');
        this.gameStarted = true;
        
        if (this.statusElement) {
            this.statusElement.textContent = 'Navigate to the red area to win!';
        }
        
        // Set initial mouse position to start position so player doesn't immediately lose
        this.mouseX = this.startPos.x;
        this.mouseY = this.startPos.y;
        this.player.x = this.startPos.x;
        this.player.y = this.startPos.y;
        
        // Enable cursor tracking
        this.canvas.style.cursor = 'none';
        console.log('Game started successfully');
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
        
        // Check if reached end
        if (this.checkWinCondition()) {
            this.gameWon = true;
            if (this.statusElement) {
                if (this.currentLevel < 3) {
                    this.statusElement.textContent = `Level ${this.currentLevel} Complete! Click restart to continue.`;
                    this.statusElement.style.color = '#44ff44';
                } else {
                    this.statusElement.textContent = 'Congratulations! You completed all levels!';
                    this.statusElement.style.color = '#44ff44';
                }
            }
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
        if (this.gameWon && this.currentLevel < 3) {
            this.currentLevel++;
            if (this.levelDisplay) {
                this.levelDisplay.textContent = `Challenge ${this.currentLevel}`;
            }
        }
        
        // Reset all game state
        this.showingStartScreen = true;
        this.gameStarted = false;
        this.gameWon = false;
        this.gameLost = false;
        
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