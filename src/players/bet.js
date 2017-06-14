import { mapGetters } from 'vuex';

import BetCtrl from './bet-ctrl';

// TODO: set bids at chips instead of numbers
export default {
  props: ['turn', 'player'],
  template: `
  <div class="player-money" >
    <h5>
      Money: £{{player.money}}
      <span :class="diffClass" >£{{moneyDiff}}</span>
    </h5>

    <bet-ctrl
      v-if="canBid"
      :money="player.money"
      @pushBet="setFirstBet" >
    </bet-ctrl>

    <div class="player-bet" v-show="bet > 0" >
      Bet: £{{bet}}
      <ul v-if="activeChips" >
        <li v-for="chip in activeChips" >{{ chip }}</li>
      </ul>
    </div>
  </div>
  `,
  components: {
    'bet-ctrl': BetCtrl,
  },
  data() {
    return {
      oldMoney: 0,
      bet: 0,
      betStart: 500,
      chipsStart: [],
      activeChips: [],
    };
  },
  computed: {
    diffClass() {
      return (this.moneyDiff > 0) ? 'money-plus' : 'money-minus';
    },

    moneyDiff() {
      const out = this.player.money - this.oldMoney;
      this.oldMoney = this.player.money;
      return out;
    },

    canBid() {
      return (this.gameStage === 0) && this.turn;
    },

    ...mapGetters([
      'gameRound',
      'gameStage',
    ]),
  },
  methods: {
    setBaseBet() {
      const money = this.player.money;
      this.betStart = (money < this.minBid) ? 0 : Math.max(this.minBid, Math.ceil(money / 2));
    },

    setFirstBet({ bet, chips }) {
      this.betStart = bet;
      this.chipsStart = chips;

      this.adjustBet('addBet');
      this.$store.dispatch('nextPlayer');
    },

    addChips() {
      const chips = this.activeChips;
      this.chipsStart.forEach(chip => chips.push(chip));
      this.activeChips = chips.sort((a, b) => a - b);
    },

    adjustBet(bidEvent) {
      const hasEnded = (this.bet === 0 && bidEvent !== 'addBet');
      if (!bidEvent || hasEnded) return this;

      if (bidEvent === 'addBet') this.addChips();

      const betStart = this.betStart;
      const multipliers = {
        // Todo: better split results
        addBet: { cost: -1, wins: 1, end: false },
        forfeit: { cost: 0.5, wins: -1, end: true },
        lose: { cost: 0, wins: -1, end: true },
        push: { cost: 0, wins: 0, end: true },
        win: { cost: 0, wins: 1, end: true },
        blackJack: { cost: 0, wins: 1.5, end: true },
      };

      const scoring = multipliers[bidEvent];

      const money = betStart * scoring.cost;
      const bet = betStart * scoring.wins;

      this.updateMonies({ money, bet });

      if (scoring.end) this.cashIn();

      return this;
    },

    cashIn() {
      this.updateMonies({ money: this.bet, bet: -this.bet });
      if (this.player.money < this.minBid) {
        this.$store.dispatch('playerEndGame', this.player);
      }
    },

    updateMonies({ money, bet }) {
      const player = this.player;
      this.$store.dispatch('playerUpdateMoney', { player, money, bet });

      this.bet += bet;
      return this;
    },

  },
  watch: {
    'player.bidEvent': 'adjustBet',
    gameRound: 'setBaseBet',
  },
};
