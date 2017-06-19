import { mapGetters } from 'vuex';


export default {
  props: ['cards', 'framepos'],
  template: `
  <div class="player-cards" >
    <div class="hand-score shadow-light" :class="{ 'error-text': score > 21 }" >
      {{score}} {{scoreStr}}
    </div>

    <transition-group
      name="cards"
      @before-enter="beforeEnter"
      @enter="enter"
      tag="div" >
      <div v-for="(card, idx) in this.cards"
        class="card-outer"
        :class="card.suit"
        :key="idx"
        :data-index="idx" >

        <div class="card shadow-light" :class="card.suit" >
          <span>{{card.face}}</span>
        </div>
      </div>
    </transition-group>

  </div>
  `,
  data() {
    return {
      aces: 0,
    };
  },
  computed: {
    transitionPosition() {
      const shoe = this.shoePos;
      const frame = this.framepos;
      // todo: figure out why these magic numbers are needed

      return {
        x: shoe.x - frame.x - 5,
        y: shoe.y - frame.y - 70,
        r: 0,
      };
    },

    score() {
      const cards = this.cards;

      if (cards.length === 0) return 0;

      this.aces = cards.reduce((count, card) => count + (card.face === 'A'), 0);

      let newScore = cards.reduce((score, card) => score + card.score, 0);

      // reduces as many aces as needed (if possible) to keep the score down
      while (newScore > 21 && this.aces > 0) {
        this.aces -= 1;
        newScore -= 10;
      }
      this.$emit('input', newScore);

      return newScore;
    },

    scoreStr() {
      const score = this.score;

      switch (true) {
      case (score > 21):
        return 'Bust';
      case (score === 21 && this.cards.length < 3):
        return 'BlackJack';
      case (this.aces > 0):
        return 'Soft';
      default:
        return '';
      }
    },

    ...mapGetters([
      'shoePos',
    ]),
  },
  methods: {
    beforeEnter(el) {
      const offsetX = el.dataset.index * 30;

      const position = this.transitionPosition;
      this.transformJiggle(el, { offsetX });

      this.setPos(el, position);
    },
    enter(el, done) {
      this.lerpLoop(el, done);
    },

    setPos(el, { x, y, r }) {
      el.dataset.posX = x;
      el.dataset.posY = y;
      el.dataset.posR = r;
      el.style.transform = `translate(${x}px,${y}px) rotate(${r}deg)`;
    },

    lerpLoop(el, done) {
      const data = el.dataset;
      const speed = 0.2;

      if (data.posX === data.targetX) return done();

      const x = ((1 - 0.1) * data.posX) + (0.1 * data.targetX);
      const y = ((1 - speed) * data.posY) + (speed * data.targetY);
      const r = ((1 - speed) * data.posR) + (speed * data.targetZ);

      this.setPos(el, { x, y, r });

      requestAnimationFrame(() => this.lerpLoop(el, done));
//      setTimeout(() => this.lerpLoop(el, done), 10);
      return true;
    },

    transformJiggle(el, {
      scale = 10,
      offsetX = 0,
      offsetY = 0,
    }) {
      const [x, y, r] = [0, 0, 0]
        .map(() => (Math.random() - 0.5) * scale);

      el.dataset.targetX = x + offsetX;
      el.dataset.targetY = y + offsetY;
      el.dataset.targetZ = r;

//      return `translate(${nudgeX + offsetX}px,${nudgeY + offsetY}px) rotate(${rotate}deg)`;
    },




  },
//  directives: {
//    position: {
//      bind(el, binding, vnode) {
//        const offsetX = binding.value * 30;
//        el.style.transform = transformJiggle({ offsetX });
//      },
//    },
//  },
};