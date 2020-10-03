let scale = 1;
const offset = { x: 0, y: 0 };

const gameSize = {
    x: 160,
    y: 120
}

const outerBorder = 1;
const innerBorder = 13;
const pathWidth = innerBorder - outerBorder;
const pathDistance = (outerBorder + innerBorder) / 2;
const pathSize = {
    x: (gameSize.x - 2 * pathDistance),
    y: (gameSize.y - 2 * pathDistance)
}
const pathLength = 2 * pathSize.x + 2 * pathSize.y;

const playerMargin = 0;
const playerSize = (pathWidth - 2 - playerMargin) / 2;
const player = {
    position: 0,
    speed: 10,
    evasion: 0,
    round: 0,
    coins: 0
}

let things = [];

function getPathPoint(position) {
    if (position < pathSize.y) {
        return { x: pathDistance, y: pathDistance + position, segment: 0 };
    } else if (position < pathSize.x + pathSize.y) {
        return { x: pathDistance + position - pathSize.y, y: gameSize.y - pathDistance, segment: 1 };
    } else if (position < pathSize.x + 2 * pathSize.y) {
        return { x: gameSize.x - pathDistance, y: gameSize.y - pathDistance - (position - pathSize.x - pathSize.y), segment: 2 };
    } else {
        return { x: gameSize.x - pathDistance - (position - pathSize.x - 2 * pathSize.y), y: pathDistance, segment: 3 };
    }
}

function drawThing(ctx, position, side, margin, fillStyle) {
    const halfMargin = margin / 2;
    const halfMax = (pathWidth - 2) / 2;

    while (position > pathLength) {
        position -= pathLength;
    }

    const pathPoint = getPathPoint(position);
    ctx.fillStyle = fillStyle;

    let left, right, top, bottom;

    if (pathPoint.segment === 0 || pathPoint.segment === 2) {
        top = pathPoint.y - halfMax + margin;
        bottom = pathPoint.y + halfMax - margin;
        if (side < 0 && pathPoint.segment === 0 || side > 0 && pathPoint.segment === 2) {
            left = pathPoint.x + halfMargin;
            right = pathPoint.x + halfMax - halfMargin;
        } else if (side < 0 && pathPoint.segment === 2 || side > 0 && pathPoint.segment === 0) {
            left = pathPoint.x - halfMax + halfMargin;
            right = pathPoint.x - halfMargin;
        } else {
            left = pathPoint.x - halfMax;
            right = pathPoint.x + halfMax;
        }
    } else {
        left = pathPoint.x - halfMax + margin;
        right = pathPoint.x + halfMax - margin;
        if (side < 0 && pathPoint.segment === 3 || side > 0 && pathPoint.segment === 1) {
            top = pathPoint.y + halfMargin;
            bottom = pathPoint.y + halfMax - halfMargin;
        } else if (side < 0 && pathPoint.segment === 1 || side > 0 && pathPoint.segment === 3) {
            top = pathPoint.y - halfMax + halfMargin;
            bottom = pathPoint.y - halfMargin;
        } else {
            top = pathPoint.y - halfMax;
            bottom = pathPoint.y + halfMax;
        }
    }

    if (side < 0) {
        left = Math.max(pathDistance, left);
        right = Math.min(gameSize.x - pathDistance, right);
        top = Math.max(pathDistance, top);
        bottom = Math.min(gameSize.y - pathDistance, bottom);
    }

    const width = right - left;
    const height = bottom - top;

    ctx.fillRect(left, top, width, height);
}

const maxSpawnAttempts = 50;
const coinMargin = 3;
const coinSize = (pathWidth - 2 - coinMargin) / 2;
function addCoin() {
    let attempts = 0;
    let position, side;
    do {
        side = (Math.random() < 0.5) ? -1 : 1;
        position = Math.round(Math.random() * (pathLength * 2 / 3 - 2 * pathWidth) + player.position + pathLength / 3);
        attempts++;
    } while (attempts < maxSpawnAttempts && things.some(thing =>
        thing.side === side && thing.position - thing.size - coinSize < position && thing.position + thing.size + coinSize > position
    ));
    if (attempts < maxSpawnAttempts) {
        things.push({
            type: 'coin',
            size: coinSize,
            position,
            side,
            margin: coinMargin,
            fillStyle: 'gold',
            alive: true
        });
    } else {
        console.log("Skipping a Coin");
    }
}

const obstacleMargin = 0;
const obstacleSize = (pathWidth - 2 - obstacleMargin) / 2;
function addObstacle() {
    let attempts = 0;
    let position, side;
    do {
        side = (Math.random() < 0.5) ? -1 : 1;
        position = Math.round(Math.random() * (pathLength * 3 / 4 - 2 * pathWidth) + player.position + pathLength / 4);
        attempts++;
    } while (attempts < maxSpawnAttempts && things.some(thing =>
        (thing.side === side && thing.position - thing.size - obstacleSize < position && thing.position + thing.size + obstacleSize > position) ||
        (thing.side !== side && thing.type === 'obstacle' && thing.position - thing.size - 5*obstacleSize < position && thing.position + thing.size + 5*obstacleSize > position)
    ));
    if (attempts < maxSpawnAttempts) {
        things.push({
            type: 'obstacle',
            size: obstacleSize,
            position,
            side,
            margin: obstacleMargin,
            fillStyle: 'red',
            alive: true
        });
    } else {
        console.log("Skipping an Obstacle");
    }
}

let score = 0;
let highScore = parseInt(localStorage.highScore) || 0;

function updateScore(){
    score = Math.round(player.position) + pathLength*player.coins;
    if(score > highScore){
        highScore = score;
        localStorage.highScore = highScore;
    }
}

const GameState = () => ({
    create: function () {
        this.resize();

        player.position = 0;
        player.speed = 50;
        player.evasion = 0;
        player.round = 0;
        player.coins = 0;
        things = [];
        score = 0;

        addCoin();
        addObstacle();
    },
    resize: function () {
        scale = Math.floor(Math.min(this.app.width / gameSize.x, this.app.height / gameSize.y));
        offset.x = (this.app.width - scale * gameSize.x) / 2;
        offset.y = (this.app.height - scale * gameSize.y) / 2;
    },

    step: function (dt) {
        player.position += player.speed * dt;
        updateScore();
        things.forEach(thing => {
            if(player.evasion * thing.side >= 0 && thing.position - thing.size - playerSize < player.position && thing.position + thing.size + playerSize > player.position){
                switch (thing.type) {
                    case 'coin':
                        player.coins += 1;
                        updateScore();
                        thing.alive = false;
                        break;
                    case 'obstacle':
                        if(thing.hitOnce){
                            this.app.loose(score);
                        } else {
                            thing.hitOnce = true;
                        }
                        break;
                }
            }
            if(thing.position <= player.position - 2 * pathWidth){
                switch (thing.type) {
                    case 'coin':
                        thing.position += pathLength;
                        break;
                    case 'obstacle':
                        thing.alive = false;
                        break;
                }
            }            
        })
        things.filter(thing => !thing.alive).forEach(thing => {
            switch (thing.type) {
                case 'coin':
                    addCoin();
                    break;
                case 'obstacle':
                    addObstacle();
                    player.speed += .1;
                    break;
            }
        })
        things = things.filter(thing => thing.alive);
        if(player.position > player.round * pathLength){
            player.round++;
            addCoin();
            addObstacle();
        }
    },
    render: function (dt) {
        const ctx = this.app.layer.context;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, this.app.width, this.app.height);

        ctx.strokeStyle = 'white';
        ctx.strokeRect(offset.x, offset.y, gameSize.x * scale, gameSize.y * scale);

        ctx.save();
        ctx.transform(scale, 0, 0, scale, offset.x, offset.y);

        ctx.strokeStyle = 'white';
        ctx.strokeRect(outerBorder, outerBorder, gameSize.x - 2 * outerBorder, gameSize.y - 2 * outerBorder);
        ctx.strokeRect(innerBorder, innerBorder, gameSize.x - 2 * innerBorder, gameSize.y - 2 * innerBorder);

        drawThing(ctx, player.position, player.evasion, playerMargin, 'turquoise');

        things.forEach(thing => {
            drawThing(ctx, thing.position, thing.side, thing.margin, thing.fillStyle);
        });

        const textMargin = 4;
        const textLeft = innerBorder + textMargin;
        const textRight =  gameSize.x - innerBorder - textMargin;

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'white';
        ctx.font = `5px 'Press Start 2P'`;
        ctx.fillText("Distance", textLeft, innerBorder + textMargin);
        ctx.fillText("Coins", textLeft, innerBorder + textMargin + 20);
        ctx.fillText("Score", textLeft, innerBorder + textMargin + 40);
        ctx.fillText("Highscore", textLeft, innerBorder + textMargin + 60);

        ctx.textAlign = 'right';
        ctx.fillText(Math.round(player.position), textRight, innerBorder + textMargin + 10);
        ctx.fillText(player.coins, textRight, innerBorder + textMargin + 30);
        ctx.fillText(score, textRight, innerBorder + textMargin + 50);
        ctx.fillText(highScore, textRight, innerBorder + textMargin + 70);

        ctx.restore();
    },

    keydown: function (data) {
        if (data.key === 'left' || data.key === 'a') {
            player.evasion -= 1;
        }
        if (data.key === 'right' || data.key === 'd') {
            player.evasion += 1;
        }
    },
    keyup: function (data) {
        if (data.key === 'left' || data.key === 'a') {
            player.evasion += 1;
        }
        if (data.key === 'right' || data.key === 'd') {
            player.evasion -= 1;
        }
    },

    mousedown: function (data) { },
    mouseup: function (data) { },
    mousemove: function (data) { },

    gamepaddown: function (data) { },
    gamepadhold: function (data) { },
    gamepadup: function (data) { },
    gamepadmove: function (data) { },
});

export default GameState;