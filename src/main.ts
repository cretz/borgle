import './style.css'

class BoardPos {
  readonly paths: WordPath[] = []
  correct: boolean = false

  constructor(readonly x: number, readonly y: number, readonly letter: string) {}

  findPaths(
    parentNode: TrieNode,
    parentPrefix: string,
    parentPath: BoardPos[],
    grid: BoardPos[][],
    results: WordPath[],
  ) {
    // Return if letter not in parent
    const node = parentNode[this.letter]
    if (node === undefined) return
    // If a complete word, mark it
    const path = [...parentPath, this]
    if (node.word) {
      const wordPath = new WordPath(path)
      results.push(wordPath)
      // Append path to each pos
      for (const pos of path) pos.paths.push(wordPath)
    }
    // Try in each direction
    const prefix = parentPrefix + this.letter
    for (let x = this.x - 1; x <= this.x + 1; x++) {
      for (let y = this.y - 1; y <= this.y + 1; y++) {
        if ((x == this.x && y == this.y) || x < 0 || x >= grid.length || y < 0 || y >= grid[0].length) continue
        grid[x][y].findPaths(node, prefix, path, grid, results)
      }
    }
  }
}

class WordPath {
  guesses: string[] = []

  constructor(readonly path: BoardPos[]) {}
}

class BoggleBoard {
  constructor(readonly grid: BoardPos[][], readonly paths: WordPath[]) {}
}

type TrieNode = { [c: string]: TrieNode|undefined } & { word?: true }

interface Random { nextChar(): string }

function buildBoard(h: number, w: number, rnd: Random, dict: TrieNode) {
  // Create 2D board array
  const grid = new Array<BoardPos[]>(w)
  for (let x = 0; x < w; x++) {
    grid[x] = new Array<BoardPos>(h)
    for (let y = 0; y < h; y++) {
      grid[x][y] = new BoardPos(x, y, rnd.nextChar())
    }
  }

  // Check for known words by walking each pos
  // TODO(cretz): Improve perf over this naive approach
  const paths: WordPath[] = []
  for (const posSet of grid) for (const pos of posSet) pos.findPaths(dict, "", [], grid, paths)
  return new BoggleBoard(grid, paths)
}

interface DictWordReader {
  // Empty when done
  nextWords(): Promise<string[]>
}

async function buildDict(reader: DictWordReader) {
  const root: TrieNode = {}
  while (true) {
    const words = await reader.nextWords()
    if (!words) return root
    for (const word of words) {
      let curr = root
      for (let i = 0; i < word.length; i++) {
        let next = curr[word[i]]
        if (!next) {
          next = {}
          curr[word[i]] = next
        }
        curr = next
      }
      curr.word = true
    }
  }
}