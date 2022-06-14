class Tile {
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} type
	 * @param {number | null} number
	 */
	constructor(x, y, type, number = null) {
		this.x = x;
		this.y = y;
		/**
		 * @type {"tile" | "none" | "mine"}
		 */
		this.type = type;
		this.number = number;
		this.isUncovered = false;
		this.isFlagged = false;
		this.flaggedWrong = false;
	}

	static size = 50;

	/**
	 * @param {CanvasRenderingContext2D} ctx
	 */
	draw(ctx) {
		ctx.fillStyle =
			(this.x % 2 === 0 && this.y % 2 === 0) ||
			(this.x % 2 === 1 && this.y % 2 === 1)
				? "#fbf99b"
				: "#e4d372";

		if (this.isUncovered) {
			ctx.fillStyle =
				(this.x % 2 === 0 && this.y % 2 === 0) ||
				(this.x % 2 === 1 && this.y % 2 === 1)
					? "#a97941"
					: "#b4996d";
			if (this.type === "mine") ctx.fillStyle = "#ffff00";
		} else if (this.flaggedWrong) {
			ctx.fillStyle = "#00ff00";
		}

		ctx.fillRect(this.x * Tile.size, this.y * Tile.size, Tile.size, Tile.size);

		if (this.isFlagged) {
			let image = new Image();
			image.src = "./images/flag.png";

			ctx.drawImage(
				image,
				this.x * Tile.size,
				this.y * Tile.size,
				Tile.size,
				Tile.size
			);
		}

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
		/**
		 * @type {Tile[][]}
		 */
		this.board = [];
		this.mines = [];
		this.width = width;
		this.height = height;
		this.mineCount = mines;
		this.isOver = false;
		this.started = false;

		this.generateEmptyBoard();
		this.drawBoard();

		/**
		 * @param {Event} e
		 */
		this.uncoverListener = e => {
			let x = Math.floor(e.offsetX / Tile.size);
			let y = Math.floor(e.offsetY / Tile.size);

			if (!this.started) {
				this.started = true;
				this.generateMines({ x, y });
				this.generateBoard();
			}

			let tile = this.board[x][y];

			if (tile.isFlagged) return;

			tile.uncover(this);
			if (tile.number === null && tile.type !== "mine")
				this.uncoverRecursively(tile);

			this.drawBoard();
		};

		/**
		 * @param {Event} e
		 */
		this.flagListener = e => {
			e.preventDefault();
			let x = Math.floor(e.offsetX / Tile.size);
			let y = Math.floor(e.offsetY / Tile.size);

			let tile = this.board[x][y];

			tile.isFlagged = !tile.isFlagged;
			this.drawBoard(this.ctx);
		};

		canvas.addEventListener("click", this.uncoverListener);
		canvas.addEventListener("contextmenu", this.flagListener);
	}

	/**
	 * @param {{ x: number, y: number }} startingTile
	 */
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

			while (
				this.mines.some(mine => mine.x === x && mine.y === y) ||
				clearTiles.some(tile => tile.x === x && tile.y === y)
			) {
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

	/**
	 * @param {{ x: number, y: number }} tile
	 */
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

	/**
	 * @param {Tile} tile
	 */
	uncoverRecursively(tile) {
		this.getNeighbors({ x: tile.x, y: tile.y }).forEach(neighborCoords => {
			let neighborTile = this.board[neighborCoords.x][neighborCoords.y];
			if (
				neighborTile.type === "mine" ||
				neighborTile.isUncovered ||
				neighborTile.isFlagged
			)
				return;

			neighborTile.uncover(this);
			if (neighborTile.number === null && neighborTile.type !== "mine")
				this.uncoverRecursively(neighborTile);
		});
	}

	removeWrongFlags() {
		for (let i = 0; i < this.width; i++) {
			for (let j = 0; j < this.height; j++) {
				let tile = this.board[i][j];

				if (tile.isFlagged && tile.type !== "mine") {
					tile.isFlagged = false;
					tile.flaggedWrong = true;
					tile.draw(this.ctx);
				}
			}
		}
	}

	drawBoard() {
		this.ctx.clearRect(0, 0, this.width * Tile.size, this.height * Tile.size);
		for (let i = 0; i < this.board.length; i++) {
			for (let j = 0; j < this.board[i].length; j++) {
				this.board[i][j].draw(this.ctx);
			}
		}
	}

	/**
	 * @param {"win" | "loss"} message
	 */
	end(reason) {
		this.drawBoard();
		this.canvas.removeEventListener("click", this.uncoverListener);
		this.canvas.removeEventListener("contextmenu", this.flagListener);

		if (reason === "win") {
			setTimeout(() => alert("You win!"), 1);
		} else if (reason === "loss") {
			this.removeWrongFlags();
			setTimeout(() => alert("You lose!"), 1);
		}
	}
}

let canvas = document.getElementById("canvas");

let game = new Game(canvas, 16, 16, 40);

game.drawBoard();
