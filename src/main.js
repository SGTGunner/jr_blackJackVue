import Vue from 'vue';

// import game from './game-play';
import PlayerFrame from './players/player-frame';
import OptionsForm from './options-form';
import Deck from './deck';

const app = new Vue({
  el: '#v-blackJack',
  components: {
    'player-frame': PlayerFrame,
    'options-form': OptionsForm,
  },
  data: {

    shared: {
      roundID: 0,
      stage: 0,
      player: 0,
      deck: [],
    },

    players: [],
  },
  computed: {

  },
  methods: {
    gameMsg(message) {
      return this[message]();
    },

    newGame(config, skipBets = false) {
      const newRoundID = this.shared.roundID + 1;

      this.players = config.players;

      this.shared = {
        roundID: newRoundID,
        activePlayer: 0,
        stage: 0,
        deck: new Deck(config.deckCount),
      };

      if (skipBets) {
        this.shared.activePlayer = 10;
        Vue.nextTick(() => this.endStage());
      }
    },
    endTurn() {
      const shared = this.shared;
      shared.activePlayer += 1;

      if (shared.stage === 0 && this.players[shared.activePlayer].isDealer) {
        return this.endStage();
      }

      if (shared.activePlayer === this.players.length) {
        return this.endStage();
      }

      return shared.activePlayer;
    },

    endStage() {
      const shared = this.shared;
//      const roundHooks = [
//        'place bids',
//        'deal first card',
//        'deal second card',
//        'player turns',
//        'end round',
//      ];

      shared.activePlayer = 0;
      shared.stage += 1;
//      console.log(roundHooks[shared.stage]);
    },
  },
});

// just here to skip the 'unused' error
export default app;
