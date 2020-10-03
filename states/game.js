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

const player = {
    position: 0,
    speed: 10,
    evasion: 0,
    round: 0
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
    console.log(attempts);
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
    }
}

const GameState = () => ({
    create: function () {
        this.resize();

        player.position = 0;
        player.speed = 50;
        player.evasion = 0;
        things = [];

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
        things.forEach(thing => {
            thing.alive &= thing.position >= player.position - 2 * pathWidth;
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

        drawThing(ctx, player.position, player.evasion, 0, 'green');

        things.forEach(thing => {
            drawThing(ctx, thing.position, thing.side, thing.margin, thing.fillStyle);
        });

        ctx.restore();
    },

    keydown: function (data) {
        if (data.key === 'left') {
            player.evasion -= 1;
        }
        if (data.key === 'right') {
            player.evasion += 1;
        }
    },
    keyup: function (data) {
        if (data.key === 'left') {
            player.evasion += 1;
        }
        if (data.key === 'right') {
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