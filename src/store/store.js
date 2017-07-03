// todo: general tidy of the store. group actions, split mutations.
// combine more into more ... function groups?
// merge commonly done actions into big chains ()

import Vue from 'vue';
import Vuex, { mapMutations } from 'vuex';

import { getRandom, buildDeck, mutationSetters, mutationIncrements, actionSetters, getState, playerSetters } from './storeTools';

Vue.use(Vuex);

export default new Vuex.Store({

  strict: process.env.NODE_ENV !== 'production',

  state: {
    // game stage ids
    gameRound: -1,
    gameStage: -1,
    gameActivePlayer: 0,

    // players & dealer
    dealer: {},
    players: [],
    activePlayerCount: 0,

    // deck and cards
    deck: [],
    shoePos: {},

    // other options
    config: {
      minBet: 0,
      autoTime: 250,
      deckCount: 6,
    },

    newMessage: '',

    handRules: false,

    eventID: 0,
    eventBus: {
      idx: -1,
      type: false,
      value: false,
    },

  },

  mutations: {
    // game stage ids
    SET_STAGE(state, i) {
      state.gameActivePlayer = 0;
      state.gameStage = i;
    },

    // players & dealer
    PLAYER_UPDATE_MONEY(state, { idx, value }) {
      state.players[idx].money += value;
    },

    DEALER_SET_PEEKED(state, card) {
      state.dealer.peeked = card;
    },

    PLAYER_END_GAME(state, player) {
      state.activePlayerCount -= 1;
      state.players[player.index].inGame = false;
    },

    // deck and cards
    SPLICE_CARD(state, cardIdx) {
      state.deck.splice(cardIdx, 1);
    },

    ...mutationIncrements({
      NEXT_ROUND: { reset: 'gameStage', value: 'gameRound' },
      NEXT_STAGE: { reset: 'gameActivePlayer', value: 'gameStage' },
      NEXT_ACTIVE_PLAYER: { value: 'gameActivePlayer', reset: false },
      NEXT_EVENT: { value: 'eventID', reset: false },
    }),

    ...mutationSetters({
      SET_PLAYERS: 'players',
      SET_PLAYER_COUNT: 'activePlayerCount',
      SET_DEALER: 'dealer',
      SET_ROUND: 'gameRound',
      SET_DECK: 'deck',
      SET_SHOE_POS: 'shoePos',
      SET_CONFIG: 'config',
      CTRL_SET_HAND_RULES: 'handRules',
      SET_EVENT: 'eventBus',
      SET_MESSAGE: 'newMessage',
    }),

    ...playerSetters({
      PLAYER_SET_SCORE: 'score',
      PLAYER_SET_BET: 'firstBet',
    }),
  },

  actions: {
    // game stage ids
    newGame: ({ commit }, options) => {
      console.log('new game');

      const dealer = options.players.find(player => player.isDealer);
      const deck = buildDeck(options.config.deckCount);

      // commit('NEXT_ACTIVE_PLAYER');
      commit('NEXT_ROUND');
      commit('SET_CONFIG', options.config);
      commit('SET_DECK', deck);
      commit('SET_PLAYERS', options.players);
      commit('SET_PLAYER_COUNT', options.players.length);
      commit('SET_DEALER', dealer);
    },

    resetGame: ({ commit }) => {
      console.log('reset all');

      commit('SET_PLAYERS', []);
      commit('SET_STAGE', -1);
    },

    nextRound: ({ state, commit }) => {
      console.log('new round');

      const quarterDeck = (state.config.deckCount * 13); // 25% of total cards in game

//      if (state.activePlayerCount < 4) { // TEMP ending early
//        console.log('GAME OVER');
//        return false;
//      }
      state.players.forEach(player => commit('PLAYER_SET_SCORE', { idx: player.index, value: 0 }));
      commit('NEXT_ROUND');

      if (state.deck.length < quarterDeck) {
        console.log('reshuffling cards');
        const deck = buildDeck(state.config.deckCount);
        commit('SET_DECK', deck);
      }
      return true;
    },

    // TODO: no longer a promise.
    nextStage: ({ state, commit, dispatch }) => {
      const stagePromise = () => new Promise((resolve) => {
        commit('NEXT_STAGE');
        resolve();
      });

      return stagePromise();
//        .then(() => {
//        setTimeout(() => {
//          if (state.gameStage > 5) {
//            dispatch('nextRound');
//          }
//        }, 3000);
//      });
    },

    nextPlayerPromise: ({ commit }) => new Promise((resolve) => {
      commit('NEXT_ACTIVE_PLAYER');
      resolve();
    }),

    nextPlayer: ({ state, dispatch }) => dispatch('nextPlayerPromise').then(() => {
      if (state.gameActivePlayer > state.players.length - 1) dispatch('nextStage');
    }),

    // players
    playerSetBet: ({ commit }, { idx, value }) => new Promise((resolve) => {
      commit('PLAYER_UPDATE_MONEY', { idx, value: -value });
      commit('PLAYER_SET_BET', { idx, value });
      resolve();
    }),

    // deck and cards
    deckDrawPromise: ({ state, commit }, idx) => new Promise((resolve, reject) => {
      const card = state.deck[idx];
      commit('SPLICE_CARD', idx);
      resolve(card);
    }),

    deckDrawRandom: ({ state, dispatch }) => {
      const rng = getRandom(state.deck.length);
      return dispatch('deckDrawPromise', rng);
    },

    deckDrawPeek: ({ state, dispatch }, toMatch) => {
      if (toMatch !== 10 && toMatch !== 11) return Promise.resolve(false);

      const rng = getRandom(state.deck.length);
//      const rng = 0; // temp, to increase the odds of dealer blackjack

      const rngCard = state.deck[rng];
      const rngCardValue = rngCard[0] === 1 ? 11 : Math.min(10, rngCard[0]);

      if (rngCardValue + toMatch === 21) {
        return dispatch('deckDrawPromise', rng);
      }

      dispatch('deckDrawPromise', rng).then(card => dispatch('dealerCard', card));
      return Promise.resolve(false);
    },

    doEvent: ({ commit }, values) => new Promise((resolve) => {
      commit('SET_EVENT', values);
      commit('NEXT_EVENT');
      resolve();
    }),

    // TODO new promise group?
    ...actionSetters({
      setStage: 'SET_STAGE',
      playerSetScore: 'PLAYER_SET_SCORE',
      playerSetBid: 'PLAYER_SET_BET',
      playerUpdateMoney: 'PLAYER_UPDATE_MONEY',
      dealerCard: 'DEALER_SET_PEEKED',
      playerEndGame: 'PLAYER_END_GAME',
      handCtrlRules: 'CTRL_SET_HAND_RULES',
      setShoePos: 'SET_SHOE_POS',
      setNewMessage: 'SET_MESSAGE',
    }),
  },

  getters: {

    // other options
    minBet: state => state.config.minBet,
    autoTime: state => state.config.autoTime,


    ...getState([
      'gameRound',
      'gameStage',
      'gameActivePlayer',
      'activePlayerCount', // todo set this as function rather than just a number?
      'players',
      'dealer',
      'handRules',
      'eventID',
      'eventBus', // TODO combine events to a single getter? and check any other getters
      'shoePos',
      'newMessage',
    ]),
  },

});
