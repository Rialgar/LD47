import './lib/playground.js';

import TextState from './states/text.js'
import GameState from './states/game.js'

const Start = TextState([
    "Stuck in a Loop (Working Title)",
    "",
    "Evade the (red) obstacles",
    "collect the (gold) coins",
    "",
    "Press enter or space",
    "to start.",
    "",
    "F1 anytime for controls."
], 'start');

const Help = TextState([
    "Controls",
    "",
    "Left/A - Evade towards the center",
    "Right/D - Evade towards the outside",
    "",
    "Press enter or space",
    "to continue.",
], 'start');

const Game = GameState();

const app = playground({
    preload: function() { },
    create: function() {
        this.layer.canvas.id = 'game';
    },
    ready: function() {
        this.setState(Start)
    },

    keydown: function(data) {
        if( data.key === "f1"){
            this.help();
        }
    },

        //custom functions

        help: function(){
            this.setState(Help);
        },
    
        loose: function(score){
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
    
        win: function(){
            //no win condition in this game
        },
    
        start: function(){
            this.setState(Game);
        },
    
        restart: function(){
            Game.create();
            this.setState(Game);
        }
});