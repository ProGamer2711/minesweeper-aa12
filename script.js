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
		this.isClicked = false;
	}

	static size = 50;

	/**
	 * @param {CanvasRenderingContext2D} ctx
	 */
	draw(ctx) {
		this.isClicked ? (ctx.fillStyle = "#00ff00") : (ctx.fillStyle = "#000000");
		this.type === "mine"
			? (ctx.fillStyle = "#ffff00")
			: (ctx.fillStyle = "#000000");
		ctx.strokeStyle = "#ffffff";

		ctx.fillRect(this.x * Tile.size, this.y * Tile.size, Tile.size, Tile.size);
		ctx.strokeRect(
			this.x * Tile.size,
			this.y * Tile.size,
			Tile.size,
			Tile.size
		);

		if (this.type !== "mine") this.drawNumber(ctx);
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

		this.generateMines();
		this.generateBoard();

		canvas.addEventListener("click", e => {
			let x = Math.floor(e.offsetX / Tile.size);
			let y = Math.floor(e.offsetY / Tile.size);
			this.board[x][y].isClicked = true;
			this.draw();
		});
	}

	generateMines() {
		for (let i = 0; i < this.mineCount; i++) {
			let x = Math.floor(Math.random() * this.width);
			let y = Math.floor(Math.random() * this.height);

			while (this.mines.some(mine => mine.x === x && mine.y === y)) {
				x = Math.floor(Math.random() * this.width);
				y = Math.floor(Math.random() * this.height);
			}

			this.mines.push({
				x,
				y,
			});
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
		for (let i = 0; i < this.width; i++) {
			for (let j = 0; j < this.height; j++) {
				this.board[i][j].draw(this.ctx);
			}
		}
	}
}

let canvas = document.getElementById("canvas");

let game = new Game(canvas, 10, 10, 10);

game.draw();
