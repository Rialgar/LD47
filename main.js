import './lib/playground.js';

import TextState from './states/text.js'
import GameState from './states/game.js'

const Start = TextState([
    "== Sputtering around the Loop ==",
    "",
    "Evade the (red) obstacles",
    "collect the (gold) coins",
    "",
    "Press enter or space",
    "to start.",
    "",
    "F1 anytime for controls.",
    "M to Mute/Unmute"
], 'start');

const Help = TextState([
    "== Controls ==",
    "",
    "Left/A - Evade towards the center",
    "Right/D - Evade towards the outside",
    "",
    "M - Mute/Unmute",
    "",
    "Press enter or space",
    "to continue.",
], 'start');

const Game = GameState();

const app = playground({
    preload: function () {
        this.loadSounds("puff.wav", "coin.wav", "explode.wav", "death.wav", "highScore.wav");
        this.sound.alias('puff_s', 'puff', 0.1, 1);
        this.sound.alias('coin_s', 'coin', 0.2, 1);
        this.sound.alias('explode_s', 'explode', 0.2, 1);
        this.sound.alias('death_s', 'death', 0.2, 1);
        this.sound.alias('highScore_s', 'highScore', 0.2, 1);
    },
    create: function () {
        this.layer.canvas.id = 'game';
    },
    ready: function () {
        const doPlay = this.sound.play;
        const self = this;
        this.sound.play = function () {
            if (!self.muted) {
                doPlay.apply(self.sound, arguments);
            }
        }
        this.setState(Start)
    },

    keydown: function (data) {
        if (data.key === "f1") {
            this.help();
        } else if (data.key === "m") {
            this.muted = !this.muted;
            localStorage.muted = this.muted;
        }
    },

    //custom functions

    help: function () {
        this.setState(Help);
    },

    loose: function (score) {
        this.setState(TextState([
            "You lost",
            "",
            "Your score was",
            `${score}`,
            "",
            "Your highest score was",
            `${localStorage.highScore}`,
            '',
            "Press enter or space",
            "to restart.",
        ], 'restart'));
    },

    win: function () {
        //no win condition in this game
    },

    start: function () {
        this.setState(Game);
    },

    restart: function () {
        Game.create();
        this.setState(Game);
    },

    muted: localStorage.muted === 'true'
});