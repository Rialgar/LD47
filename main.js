import './lib/playground.js';

import TextState from './states/text.js'

const Start = TextState([
    "Nothing to See here",
    "This is an empty game shell",
    "",
    "Press enter, space or start", "to start.",
    "",
    "F1 anytime for controls."
], 'start');

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
        },
    
        loose: function(){
        },
    
        win: function(){
        },
    
        start: function(){
        },
    
        restart: function(){
        }
});