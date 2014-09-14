goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.style');

goog.provide('thumbtack.minesweeper');
goog.provide('thumbtack.minesweeper.Tile');


/**
 * Chooses ten unique, random locations for the bombs.
 */
thumbtack.minesweeper.generateBombs = function() {
  var bombLocations = [];
  while (bombLocations.length < Config.NUM_BOMBS) {
    var x = this.getRandomNumberBetween(1, Config.WIDTH);
    var y = this.getRandomNumberBetween(1, Config.HEIGHT);
    var position = [x, y];
    var duplicate = false;
    // checks whether there's a bomb at that location already
    for (var i = 0; i < bombLocations.length; i++) {
      if (goog.array.equals(bombLocations[i], position)) duplicate = true;
    }
    if (!duplicate) bombLocations.push(position);
  }
  return bombLocations;
};

/**
 * Gets a random number between the specified min and max.
 */
thumbtack.minesweeper.getRandomNumberBetween = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

/**
 * Creates all tile objects.
 */
thumbtack.minesweeper.createTiles = function(parentElement) {
  var bombLocations = this.generateBombs();
  var indexCount = 1;
  for (var i = 1; i <= Config.HEIGHT; i++) {
    for (var j = 1; j <= Config.WIDTH; j++) {
      var position = [i, j];
      var isBomb = false;
      // check whether or not a bomb belongs at that tile so that
      // the tile object can be created
      for (var k = 0; k < bombLocations.length; k++) {
        if (goog.array.equals(bombLocations[k], position)) isBomb = true;
      }
      var parentRow = goog.dom.getElementByClass('row-' + i);
      var tile = new thumbtack.minesweeper.Tile(
          position, isBomb, parentRow, indexCount);
      // the allTiles array is designed so that a tile can be
      // accessed with an x, y position
      allTiles[position] = tile.makeTileDom();
      indexCount++;
    }
  }
};

/**
 * Constructor for a tile object.
 */
thumbtack.minesweeper.Tile = function(position, isBomb, parentElement, index) {
  this.x_ = position[0];
  this.y_ = position[1];
  this.isBomb_ = isBomb;
  this.parentElement_ = parentElement;
  this.index_ = index;
};

/**
 * Makes a DOM element for each tile for the board.
 */
thumbtack.minesweeper.Tile.prototype.makeTileDom = function() {
  var newTile = goog.dom.createDom('div', 'tile');
  this.setTileAttributes_(newTile);
  goog.dom.appendChild(this.parentElement_, newTile);
  this.clickTile_(newTile);
  return newTile;
};

thumbtack.minesweeper.Tile.prototype.setTileAttributes_ = function(newTile) {
  newTile.setAttribute('index', this.index_);
  newTile.setAttribute('x', this.x_);
  newTile.setAttribute('y', this.y_);
  newTile.setAttribute('bomb', this.isBomb_);
  newTile.setAttribute('visited', false);
};

/**
 * Called when a tile is on the board is clicked. The tile is marked
 * as visited and its adjacent tiles are checked, or if the tile contains
 * a bomb, then the game is over.
 */
thumbtack.minesweeper.Tile.prototype.clickTile_ = function(tile) {
  goog.events.listen(tile, goog.events.EventType.CLICK,
      goog.partial(function(tile) {
    if (this.getAttribute('bomb') == 'true') {
      var board = goog.dom.getElement('tiles');
      goog.style.setStyle(board, 'pointer-events', 'none');
      alert("Game Over :(");
    } else {
      var x = this.getAttribute('x');
      var y = this.getAttribute('y');
      this.setAttribute('visited', 'true');
      tile.checkAround_(x, y);
    }
  }, this));
};

/**
 * Uses BFS to check all the tiles around the clicked tile to obtain the counts
 * needed and to determine which adjacent tiles to mark as visited.
 */
thumbtack.minesweeper.Tile.prototype.checkAround_ = function(x, y) {
  var queue = [];
  var position = [x, y];
  var tile = allTiles[position];
  tile.setAttribute('visited', true);
  queue.push({position: position, index: tile.getAttribute('index')});

  // Continue until queue is empty.
  while (queue.length > 0) {
    var count = 0;
    var tileObject = queue.pop();
    var currTile = allTiles[tileObject.position];
    var x = parseInt(currTile.getAttribute('x'));
    var y = parseInt(currTile.getAttribute('y'));
    var index = currTile.getAttribute('index');

    // left
    if (x - 1 > 0) {
      // bottom
      if (this.bombExists_(x - 1, y + 1)) {
        count++;
      } else if (y + 1 <= Config.HEIGHT && !this.isVisited_(x - 1, y + 1)) {
        queue.push({position: [x - 1, y + 1], index: index});
      }

      if (this.bombExists_(x - 1, y)) {
        count++;
      } else if (!this.isVisited_(x - 1, y)) {
        queue.push({position: [x - 1, y], index: index});
      }

      // top
      if (this.bombExists_(x - 1, y - 1)) {
        count++;
      } else if (y - 1 > 0 && !this.isVisited_(x - 1, y - 1)) {
        queue.push({position: [x - 1, y - 1], index: index});
      }
    }

    // right
    if (x + 1 <= Config.WIDTH) {
      // bottom
      if (this.bombExists_(x + 1, y + 1)) {
        count++;
      } else if (y + 1 <= Config.HEIGHT && !this.isVisited_(x + 1, y + 1)) {
        queue.push({position: [x + 1, y + 1], index: index});
      }

      if (this.bombExists_(x + 1, y)) {
        count++;
      } else if (!this.isVisited_(x + 1, y)) {
        queue.push({position: [x + 1, y], index: index});
      }

      // top
      if (this.bombExists_(x + 1, y - 1)) {
        count++;
      } else if (y - 1 > 0 && !this.isVisited_(x + 1, y - 1)) {
        queue.push({position: [x + 1, y - 1], index: index});
      }
    }
    
    // bottom middle
    if (this.bombExists_(x, y + 1)) {
      count++;
    } else if (y + 1 <= Config.HEIGHT && !this.isVisited_(x, y + 1)) {
      queue.push({position: [x, y + 1], index: index});
    }

    // top middle
    if (this.bombExists_(x, y - 1)) {
      count++;
    } else if (y - 1 > 0 && !this.isVisited_(x, y -1)) {
      queue.push({position: [x, y - 1], index: index});
    }
    this.changeTile_(currTile, count);
    for (var i = queue.length - 1; i >= 0; i--) {
      if (queue[i].index == index && count > 0) {
          queue.splice(i, 1);
      }
    }
    currTile.setAttribute('visited', true);

    // checks whether the user has won after each move.
    if (validate()) {
      var board = goog.dom.getElement('tiles');
      goog.style.setStyle(board, 'pointer-events', 'none');
      alert("You win!");
    }
  }
};

/**
 * Sets and styles the tile's count number color.
 */
thumbtack.minesweeper.Tile.prototype.changeTile_ = function(tile, count) {
  if (count > 0) {
    goog.dom.setTextContent(tile, count);
    if (count == 1) {
      goog.style.setStyle(tile, 'color', 'blue');
    } else if (count == 2) {
      goog.style.setStyle(tile, 'color', 'green');
    } else if (count == 3) {
      goog.style.setStyle(tile, 'color', 'red');
    } else if (count == 4) {
      goog.style.setStyle(tile, 'color', 'darkblue');
    } else if (count == 5) {
      goog.style.setStyle(tile, 'color', 'brown');
    } else if (count == 6) {
      goog.style.setStyle(tile, 'color', 'cyan');
    } else if (count == 7) {
      goog.style.setStyle(tile, 'color', 'black');
    } else if (count == 8) {
      goog.style.setStyle(tile, 'color', 'gray');
    }
  }
  goog.dom.classes.add(tile, 'visited');
};

/**
 * Given the x, y position of a tile, checks whether there's a bomb.
 */
thumbtack.minesweeper.Tile.prototype.bombExists_ = function(x, y) {
  var position = [x, y];
  if (x > 0 && x <= Config.WIDTH && y > 0 && y <= Config.HEIGHT) {
    if (allTiles[position].getAttribute('bomb') == 'true') return true;
  }
  return false;
};

/**
 * Given the x, y position of a tile, checks whether the tile has been visited.
 */
thumbtack.minesweeper.Tile.prototype.isVisited_ = function(x, y) {
  var position = [x, y];
  if (x > 0 && x <= Config.WIDTH && y > 0 && y <= Config.HEIGHT) {
    if (allTiles[position].getAttribute('visited') == 'true') return true;
  }
  return false;
};
