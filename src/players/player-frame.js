// import Vue from 'vue';
import { mapGetters } from 'vuex';

import PlayerHand from './hand';
import PlayerBet from './bet';

export default {
  props: ['player'],
  template: `
  <section class="player-frame" :class="playerClass" >

    <h3 class="player-name" :class="{active: isPlayerTurn, inactive: isPlayerInactive }" >{{player.name}}</h3>

    <player-hand
      :player="player"
      :turn="isPlayerTurn" >
    </player-hand>

    <player-bet
      v-if="!player.isDealer"
      :player="player"
      :turn="isPlayerTurn" >
    </player-bet>

  </section>`,
  components: {
    'player-hand': PlayerHand,
    'player-bet': PlayerBet,
  },
  data() {
    return {
      playerClass: `player-${this.player.index}`,
      skip: false,
    };
  },

  computed: {
    isPlayerTurn() {
      return this.gameActivePlayer === this.player.index;
    },

    isPlayerInactive() {
      return !this.player.inGame;
    },

    ...mapGetters([
      'gameActivePlayer',
      'dealer',
      'gameStage',
      'minBid',
    ]),
  },

  methods: {

    // TODO:
    // fix the skipping of players when out of money.

    turnCheck() {
      const cantBid = !this.player.inGame;
      const wontBid = this.gameStage === 0 && this.player.isDealer;

      if (this.isPlayerTurn && (cantBid || wontBid)) {
        this.emitEndTurn();
      }
    },

    emitEndTurn() {
      this.$store.dispatch('nextPlayer');
    },

    endRound() {
      const dealerScore = this.dealer.score;
      if (dealerScore === 0) return false;

      const result = this.getScores(dealerScore);

      this.emitBidChange(result);

      return true;
    },
    emitBidChange(event) {
      const player = this.player;
      this.$store.dispatch('playerBidEvent', { player, event });
    },

    getScores(dealerScore) {
      const playerScore = this.player.score;
      switch (true) {
      case dealerScore === playerScore:
        return 'push';
      case playerScore > 21 || dealerScore === 21:
        return 'lose';
      case dealerScore > 21 || playerScore > dealerScore:
        return 'win';
      default: // dealerScore > playerScore
        return 'lose';
      }
    },
  },
  watch: {
    'dealer.score': 'endRound',
    isPlayerTurn: 'turnCheck',
  },
};
