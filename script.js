class Tile {
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} type
	 */
	constructor(x, y, type, number = null) {
		this.x = x;
		this.y = y;
		this.type = type;
		this.number = number;
		this.isUncovered = false;
	}

	static size = 50;

	/**
	 * @param {CanvasRenderingContext2D} ctx
	 */
	draw(ctx) {
		ctx.fillStyle = "#696969";
		ctx.strokeStyle = "#ffffff";

		if (this.isUncovered) {
			ctx.fillStyle = "#333333";
			if (this.type === "mine") ctx.fillStyle = "#ffff00";
		}

		ctx.fillRect(this.x * Tile.size, this.y * Tile.size, Tile.size, Tile.size);
		ctx.strokeRect(
			this.x * Tile.size,
			this.y * Tile.size,
			Tile.size,
			Tile.size
		);

		if (this.isUncovered && this.type !== "mine") {
			this.drawNumber(ctx);
		}
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx
	 */
	drawNumber(ctx) {
		if (this.number === null) return;

		ctx.fillStyle = "#ffffff";
		ctx.font = "30px Arial";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";

		ctx.fillText(
			this.number,
			this.x * Tile.size + Tile.size / 2,
			this.y * Tile.size + Tile.size / 2
		);
	}

	/**
	 * @param {Game} game
	 */
	uncover(game) {
		this.isUncovered = true;

		if (this.type === "mine") {
			game.end("loss");
		} else {
			let board = game.board;
			let emptySpacesLeft = false;

			for (let i = 0; i < board.length; i++) {
				for (let j = 0; j < board[i].length; j++) {
					if (board[i][j].type === "mine") continue;
					if (!board[i][j].isUncovered) emptySpacesLeft = true;
				}
			}

			if (!emptySpacesLeft) game.end("win");
		}
	}
}

class Game {
	/**
	 * @param {HTMLCanvasElement} canvas
	 * @param {number} width
	 * @param {number} height
	 * @param {number} mines
	 */
	constructor(canvas, width, height, mines) {
		canvas.width = width * Tile.size;
		canvas.height = height * Tile.size;

		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.board = [];
		this.mines = [];
		this.width = width;
		this.height = height;
		this.mineCount = mines;
		this.isOver = false;
		this.started = false;

		this.generateEmptyBoard();
		this.draw();

		this.clickListener = e => {
			let x = Math.floor(e.offsetX / Tile.size);
			let y = Math.floor(e.offsetY / Tile.size);

			if (!this.started) {
				this.started = true;
				this.generateMines({ x, y });
				this.generateBoard();
			}

			this.board[x][y].uncover(this);
			this.draw();
		};

		canvas.addEventListener("click", this.clickListener);
	}

	generateMines(startingTile) {
		let clearTiles = [];
		for (let i = startingTile.x - 1; i <= startingTile.x + 1; i++) {
			for (let j = startingTile.y - 1; j <= startingTile.y + 1; j++) {
				if (i < 0 || i >= this.width || j < 0 || j >= this.height) continue;
				clearTiles.push({ x: i, y: j });
			}
		}

		for (let i = 0; i < this.mineCount; i++) {
			let x = Math.floor(Math.random() * this.width);
			let y = Math.floor(Math.random() * this.height);

			while (this.mines.some(mine => mine.x === x && mine.y === y) || 
				   clearTiles.some(tile => tile.x === x && tile.y === y)) {
				x = Math.floor(Math.random() * this.width);
				y = Math.floor(Math.random() * this.height);
			}

			this.mines.push({
				x,
				y,
			});
		}
	}

	generateEmptyBoard() {
		for (let i = 0; i < this.width; i++) {
			this.board[i] = [];
			for (let j = 0; j < this.height; j++) {
				this.board[i][j] = new Tile(i, j, "none");
			}
		}
	}

	generateBoard() {
		for (let i = 0; i < this.width; i++) {
			this.board[i] = [];
			for (let j = 0; j < this.height; j++) {
				let type = "tile";
				if (this.mines.some(mine => mine.x === i && mine.y === j))
					type = "mine";
				this.board[i][j] = new Tile(i, j, type);
			}
		}

		for (let mine of this.mines) {
			let neighbors = this.getNeighbors(mine);
			for (let neighbor of neighbors) {
				let number = this.calculateNumber(neighbor);
				this.board[neighbor.x][neighbor.y].number = number;
			}
		}
	}

	/**
	 * @param {{ x: number, y: number }} tile
	 */
	getNeighbors(tile) {
		let neighbors = [];

		for (let i = tile.x - 1; i <= tile.x + 1; i++) {
			for (let j = tile.y - 1; j <= tile.y + 1; j++) {
				if (i < 0 || i >= this.width || j < 0 || j >= this.height) continue;
				if (i === tile.x && j === tile.y) continue;
				neighbors.push({ x: i, y: j });
			}
		}

		return neighbors;
	}

	calculateNumber(tile) {
		let neighbors = this.getNeighbors(tile);
		let mineCount = 0;

		for (let neighbor of neighbors) {
			if (
				this.mines.some(mine => mine.x === neighbor.x && mine.y === neighbor.y)
			)
				mineCount++;
		}

		return mineCount;
	}

	draw() {
		this.ctx.clearRect(0, 0, this.width * Tile.size, this.height * Tile.size);
		for (let i = 0; i < this.board.length; i++) {
			for (let j = 0; j < this.board[i].length; j++) {
				this.board[i][j].draw(this.ctx);
			}
		}
	}

	end(reason) {
		if (reason === "loss") {
			alert("You lost!");
		} else {
			alert("You won!");
		}

		this.draw();
		this.canvas.removeEventListener("click", this.clickListener);
	}
}

let canvas = document.getElementById("canvas");

let game = new Game(canvas, 5, 5, 3);

game.draw();
