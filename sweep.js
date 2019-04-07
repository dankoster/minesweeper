const readline = require('readline');

function random(max) {
	return Math.floor(Math.random() * Math.floor(max));
}

function randomCoordinate({ maxX, maxY }) {
	return { x: random(maxX), y: random(maxY) }
}

class Square {
	constructor(x, y) {
		this.hasMine = false
		this.hasFlag = false
		this.isRevealed = false
		this.adjacent = 0
		this.x = x
		this.y = y
	}

	get flag() { return this.hasFlag }
	set flag(value) { this.hasFlag = value }
	set reveal(value) { this.isRevealed = value }
	get display() {
		return this.hasFlag ?
			'\u2690' : //flag icon
			this.isRevealed ?
				(this.hasMine ? '\u2622' : (this.adjacent || ' ')) :
				'\u25E6' //small empty dot icon
	} 
}

class Minefield {
	constructor({ size, mineCount = 5 }) {
		this.size = size
		this.grid = []
		for (var x = 0; x < size; x++) {
			var row = []
			for (var y = 0; y < size; y++) {
				row.push(new Square(x, y))
			}
			this.grid.push(row)
		}

		//distribute mines without duplicates!
		while (mineCount > 0) {
			let pos = randomCoordinate({ maxX: size, maxY: size })
			let square = this.grid[pos.x][pos.y]
			if (!square.hasMine) {
				square.hasMine = true
				mineCount--
			}
		}
	}

	draw({ curPos: { x = 0, y = 0 } }) {
		let display = ''
		for (let row = 0; row < this.size; row++) {
			for (let col = 0; col < this.size; col++) {
				let square = this.grid[row][col]
				display += curPos.is(row, col) ? `>${square.display}<` : ` ${square.display} `
			}
			display += '\n'
		}
		return display
	}

	touch({ x, y }) {
		let square = this.getSquare({ x, y })
		if (square) {
			if (square.hasMine) {
				this.revealAll()
				return "KaBOOM!"
			}
			else {
				try {
					this.clear(square)
				}
				catch (error) {
					return error
				}
				return "Clear!"
			}
		}
	}

	revealAll() {
		for (let row = 0; row < this.size; row++) {
			for (let col = 0; col < this.size; col++) {
				let square = this.grid[row][col]
				square.reveal = true
			}
		}
	}

	clear(square) {
		square.reveal = true

		//get all the adjacent squares
		let adjacent = []
		for (let dx = -1; dx <= 1; dx++) {
			for (let dy = -1; dy <= 1; dy++) {
				let s = this.getSquare({ x: square.x + dx, y: square.y + dy })
				if (s !== square)  //discard the current square
					adjacent.push(s)
			}
		}
		//count the adjacent mines
		if (square.adjacent == 0)
			adjacent.forEach((s) => {
				if (s && s.hasMine)
					square.adjacent++
			})

		//if there are no adjacent mines, try to clear the adjacent squares recursively
		if (!square.adjacent)
			adjacent.forEach((s) => { if (s && !s.isRevealed) this.clear(s) })
	}

	getSquare({ x, y }) {
		let square = undefined
		if (0 <= x && x < size && 0 <= y && y < size)
			square = this.grid[x][y]
		return square
	}

	flag({ x, y }) {
		let square = this.grid[x][y]
		square.flag = !square.flag
	}
}

let size = 20
let mineCount = 35
let minefield = new Minefield({ size, mineCount })
var curPos = {
	x: size / 2,
	y: size / 2,
	is: function (X, Y) { return this.x == X && this.y == Y }
}

console.clear()
readline.clearLine(process.stdout);
process.stdout.write(minefield.draw({ curPos })) 

readline.emitKeypressEvents(process.stdin);
if (process.stdin.setRawMode) process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
	if (key.name === 'escape' || key.ctrl && key.name === 'c')
		process.exit()
	else {
		let message = ''
		switch (key.name) {
			case 'up':
				curPos.x = (curPos.x == 0 ? size : curPos.x) -1
				break;
			case 'down':
				curPos.x = (curPos.x + 1) % size
				break;
			case 'left':
				curPos.y = (curPos.y == 0 ? size : curPos.y) -1
				break;
			case 'right':
				curPos.y = (curPos.y + 1) % size
				break;
			case 'space':
				message = minefield.touch(curPos)
				break;
			default:
				minefield.flag(curPos)
				message = `toggle flag on ${curPos.x},${curPos.y}`
				break;
		}

		if (!message) message = `move ${key.name} to ${curPos.x},${curPos.y}`

		console.clear()
		readline.clearLine(process.stdout);
		process.stdout.write(minefield.draw({ curPos })) 
		console.log(message)
		//console.log(key)
	}
});