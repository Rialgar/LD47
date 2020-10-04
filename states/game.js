import explode from '../effects/explode.js';
import puff from '../effects/puff.js';

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
    x: (gameSize.x - 2 * innerBorder),
    y: (gameSize.y - 2 * innerBorder),
    arc: Math.PI * 0.5 * pathWidth / 2
}
const centerPath = [
    {
        start: { pos: 0, x: pathDistance, y: innerBorder },
        end: { pos: pathSize.y, x: pathDistance, y: gameSize.y - innerBorder }
    },
    {
        start: { pos: pathSize.y, angle: Math.PI },
        end: { pos: pathSize.y + pathSize.arc, angle: Math.PI * 0.5 },
        cx: innerBorder,
        cy: gameSize.y - innerBorder,
        r: pathWidth / 2
    },
    {
        start: { pos: pathSize.y + pathSize.arc, x: innerBorder, y: gameSize.y - pathDistance },
        end: { pos: pathSize.x + pathSize.y + pathSize.arc, x: gameSize.x - innerBorder, y: gameSize.y - pathDistance }
    },
    {
        start: { pos: pathSize.x + pathSize.y + pathSize.arc, angle: Math.PI * 0.5 },
        end: { pos: pathSize.x + pathSize.y + 2 * pathSize.arc, angle: 0 },
        cx: gameSize.x - innerBorder,
        cy: gameSize.y - innerBorder,
        r: pathWidth / 2
    },
    {
        start: { pos: pathSize.x + pathSize.y + 2 * pathSize.arc, x: gameSize.x - pathDistance, y: gameSize.y - innerBorder },
        end: { pos: pathSize.x + 2 * pathSize.y + 2 * pathSize.arc, x: gameSize.x - pathDistance, y: innerBorder }
    },
    {
        start: { pos: pathSize.x + 2 * pathSize.y + 2 * pathSize.arc, angle: Math.PI * 2 },
        end: { pos: pathSize.x + 2 * pathSize.y + 3 * pathSize.arc, angle: Math.PI * 1.5 },
        cx: gameSize.x - innerBorder,
        cy: innerBorder,
        r: pathWidth / 2
    },
    {
        start: { pos: pathSize.x + 2 * pathSize.y + 3 * pathSize.arc, x: gameSize.x - innerBorder, y: pathDistance },
        end: { pos: 2 * pathSize.x + 2 * pathSize.y + 3 * pathSize.arc, x: innerBorder, y: pathDistance }
    },
    {
        start: { pos: 2 * pathSize.x + 2 * pathSize.y + 3 * pathSize.arc, angle: Math.PI * 1.5 },
        end: { pos: 2 * pathSize.x + 2 * pathSize.y + 4 * pathSize.arc, angle: Math.PI },
        cx: innerBorder,
        cy: innerBorder,
        r: pathWidth / 2
    }
]
const pathLength = centerPath[centerPath.length - 1].end.pos;

const innerPath = JSON.parse(JSON.stringify(centerPath));
innerPath.forEach(segment => {
    if (segment.r) {
        segment.r = pathWidth / 4;
    }
    ['start', 'end'].forEach(key => {
        ['x', 'y'].forEach(axis => {
            if (segment[key][axis] === pathDistance) {
                segment[key][axis] += pathWidth / 4;
            }
            if (segment[key][axis] === gameSize[axis] - pathDistance) {
                segment[key][axis] -= pathWidth / 4;
            }
        });
    });
})
const outerPath = JSON.parse(JSON.stringify(centerPath));
outerPath.forEach(segment => {
    if (segment.r) {
        segment.r = 3 * pathWidth / 4;
    }
    ['start', 'end'].forEach(key => {
        ['x', 'y'].forEach(axis => {
            if (segment[key][axis] === pathDistance) {
                segment[key][axis] -= pathWidth / 4;
            }
            if (segment[key][axis] === gameSize[axis] - pathDistance) {
                segment[key][axis] += pathWidth / 4;
            }
        });
    });
});

function getPath(side) {
    return side < 0 ? innerPath : (side > 0 ? outerPath : centerPath);
}

const outLinePath = JSON.parse(JSON.stringify(centerPath));
outLinePath.forEach(segment => {
    if (segment.r) {
        segment.r = pathWidth;
    }
    ['start', 'end'].forEach(key => {
        ['x', 'y'].forEach(axis => {
            if (segment[key][axis] === pathDistance) {
                segment[key][axis] -= pathWidth / 2;
            }
            if (segment[key][axis] === gameSize[axis] - pathDistance) {
                segment[key][axis] += pathWidth / 2;
            }
        });
    });
});

const playerSize = 4;
const player = {
    position: 0,
    speed: 10,
    evasion: 0,
    round: 0,
    coins: 0
}

let things = [];
let effects = [];

function getPathPoint(path, position) {
    while (position < 0) {
        position += pathLength;
    }
    while (position >= pathLength) {
        position -= pathLength;
    }
    const segment = path.find(seg => seg.start.pos <= position && seg.end.pos > position);
    const blend = (position - segment.start.pos) / (segment.end.pos - segment.start.pos);
    if (segment.r) {
        const angle = segment.start.angle + (segment.end.angle - segment.start.angle) * blend;
        return {
            segment,
            angle,
            x: segment.cx + Math.cos(angle) * segment.r,
            y: segment.cy + Math.sin(angle) * segment.r
        }
    } else {
        return {
            segment,
            segmentIndex: path.indexOf(segment),
            x: segment.start.x + (segment.end.x - segment.start.x) * blend,
            y: segment.start.y + (segment.end.y - segment.start.y) * blend
        }
    }
}

function drawThing(ctx, position, side, size, color) {
    const path = getPath(side);
    const start = getPathPoint(path, position - size);
    const end = getPathPoint(path, position + size);
    ctx.beginPath();
    if (!start.angle) {
        ctx.lineTo(start.x, start.y);
    }

    if (start.angle || end.angle) {
        const cx = start.segment.cx || end.segment.cx;
        const cy = start.segment.cy || end.segment.cy;
        const r = start.segment.r || end.segment.r;
        const startAngle = start.angle || end.segment.start.angle;
        const endAngle = end.angle || start.segment.end.angle;

        ctx.arc(cx, cy, r, startAngle, endAngle, true);
    } else if (start.segment !== end.segment && end.segmentIndex != (start.segmentIndex + 1) % path.length) {
        const midSegment = path[(start.segmentIndex + 1) % path.length];
        ctx.arc(midSegment.cx, midSegment.cy, midSegment.r, midSegment.start.angle, midSegment.end.angle, true);
    }

    if (!end.angle) {
        ctx.lineTo(end.x, end.y);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.stroke();
}

const maxSpawnAttempts = 50;
const coinSize = 2;
function addCoin() {
    let attempts = 0;
    let position, side;
    do {
        side = (Math.random() < 0.5) ? -1 : 1;
        position = Math.random() * (pathLength * 2 / 3 - 2 * pathWidth) + player.position + pathLength / 3;
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
            color: 'rgb(218, 165, 32)',
            alive: true
        });
    } else {
        console.log("Skipping a Coin");
    }
}

const obstacleSize = 4;
function addObstacle() {
    let attempts = 0;
    let position, side;
    do {
        side = (Math.random() < 0.5) ? -1 : 1;
        position = Math.random() * (pathLength * 3 / 4 - 2 * pathWidth) + player.position + pathLength / 4;
        attempts++;
    } while (attempts < maxSpawnAttempts && things.some(thing =>
        (thing.side === side && thing.position - thing.size - obstacleSize < position && thing.position + thing.size + obstacleSize > position) ||
        (thing.side !== side && thing.type === 'obstacle' && thing.position - thing.size - 5 * obstacleSize < position && thing.position + thing.size + 5 * obstacleSize > position)
    ));
    if (attempts < maxSpawnAttempts) {
        things.push({
            type: 'obstacle',
            size: obstacleSize,
            position,
            side,
            color: 'red',
            alive: true
        });
    } else {
        console.log("Skipping an Obstacle");
    }
}

let score = 0;
let highScore = parseInt(localStorage.highScore) || 0;

function updateScore() {
    score = Math.round(player.position + pathLength * player.coins);
    if (score > highScore) {
        highScore = score;
        localStorage.highScore = highScore;
    }
}

let puffEffect = puff({r: 255, g: 255, b: 255, dampening: 0.5, speedScale: 1200, maxAge: .5, partIntervalMin: 0.01, partIntervalMax: 0.01});

const GameState = () => ({
    create: function () {
        this.resize();

        player.position = 0;
        player.speed = 50;
        player.evasion = 0;
        player.round = 0;
        player.coins = 0;
        things = [];
        effects = [puffEffect];
        score = 0;

        puffEffect.reset();
        puffEffect.move(pathDistance, pathDistance, pathDistance, pathDistance, 1);

        addCoin();
        addObstacle();

        updateScore();
    },
    resize: function () {
        scale = Math.floor(Math.min(this.app.width / gameSize.x, this.app.height / gameSize.y));
        offset.x = (this.app.width - scale * gameSize.x) / 2;
        offset.y = (this.app.height - scale * gameSize.y) / 2;
    },

    step: function (dt) {
        const prevPlayerPoint = getPathPoint(getPath(player.evasion), player.position);
        player.position += player.speed * dt;
        const playerPoint = getPathPoint(getPath(player.evasion), player.position);
        puffEffect.move(prevPlayerPoint.x, prevPlayerPoint.y, playerPoint.x, playerPoint.y, dt);

        updateScore();
        things.forEach(thing => {
            if (player.evasion * thing.side >= 0 && thing.position - thing.size - playerSize < player.position && thing.position + thing.size + playerSize > player.position) {
                switch (thing.type) {
                    case 'coin':
                        player.coins += 1;                        
                        updateScore();
                        thing.alive = false;
                        break;
                    case 'obstacle':
                        if (thing.hitOnce) {
                            this.app.sound.play('death_s');
                            this.app.loose(score);
                        } else {
                            thing.hitOnce = true;
                        }
                        break;
                }
            }
            if (thing.position <= player.position - 2 * pathWidth) {
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
            const point = getPathPoint(getPath(thing.side), thing.position);
            switch (thing.type) {
                case 'coin':
                    addCoin();
                    this.app.sound.play('coin_s');
                    effects.push(explode({x: point.x, y: point.y, r: 218, g: 165, b: 32, dampening: 0.05, maxSpeed: 50, maxAge: 2, partCount: 20, gravity: -50}));
                    break;
                case 'obstacle':
                    addObstacle();
                    this.app.sound.play('explode_s');
                    effects.push(explode({x: point.x, y: point.y, r: 255, g: 0, b: 0, dampening: 0.05, maxSpeed: 50, maxAge: 2, partCount: 20, gravity: 50}));
                    player.speed += .2;
                    break;
            }
        })
        things = things.filter(thing => thing.alive);
        effects.forEach(effect => {
            effect.update(dt, this.app);
        });
        effects = effects.filter(effect => effect.alive);
        if (player.position > player.round * pathLength) {
            player.round++;
            addCoin();
            addObstacle();
        }
    },
    render: function (dt) {
        const ctx = this.app.layer.context;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, this.app.width, this.app.height);

        ctx.save();
        ctx.transform(scale, 0, 0, scale, offset.x, offset.y);

        ctx.strokeStyle = 'white';
        ctx.beginPath();
        outLinePath.forEach(segment => {
            if (segment.r) {
                ctx.arc(segment.cx, segment.cy, segment.r, segment.start.angle, segment.end.angle, true);
            } else {
                ctx.lineTo(segment.start.x, segment.start.y);
                ctx.lineTo(segment.end.x, segment.end.y);
            }
        });
        ctx.closePath();
        ctx.stroke();
        ctx.lineJoin = 'round';
        ctx.strokeRect(innerBorder, innerBorder, gameSize.x - 2 * innerBorder, gameSize.y - 2 * innerBorder);
        ctx.lineJoin = 'miter';

        ctx.globalAlpha = 1;

        things.forEach(thing => {
            drawThing(ctx, thing.position, thing.side, thing.size, thing.color);
        });

        effects.forEach(effect => effect.draw(ctx));

        drawThing(ctx, player.position, player.evasion, playerSize, 'turquoise');

        const textMargin = 4;
        const textLeft = innerBorder + textMargin;
        const textRight = gameSize.x - innerBorder - textMargin;

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