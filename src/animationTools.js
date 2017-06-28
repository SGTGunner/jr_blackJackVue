export function setPos(el, { x, y, r = 0 }) {
  el.dataset.posX = x;
  el.dataset.posY = y;
  el.dataset.posR = r;
  el.style.transform = `translate(${x}px,${y}px) rotate(${r}deg)`;
}

export function setTarget(el, { x, y, r = 0 }) {
  el.dataset.targetX = x;
  el.dataset.targetY = y;
  el.dataset.targetR = r;
}

export function setStartFinish(el, { start, finish = { x: 0, y: 0, r: 0 } }) {
  setPos(el, start);
  setTarget(el, finish);
}

export function runLerpLoop(el, done, speed) {
  const data = el.dataset;

  const closeEnough = (Math.abs(data.posX - data.targetX) < 0.5)
    && (Math.abs(data.posY - data.targetY) < 0.5);

  // ends the lerploop when the element is within 0.5px away from its goal
  if (closeEnough) return done();

  const multiplier = 10 / speed;
  const lerp = (start, finish) => ((1 - multiplier) * data[start]) + (multiplier * data[finish]);

  const x = lerp('posX', 'targetX');
  const y = lerp('posY', 'targetY');
  const r = lerp('posR', 'targetR');

  setPos(el, { x, y, r });

  requestAnimationFrame(() => runLerpLoop(el, done, speed));
  return true;
}

export function transformJiggle({
  scale = 10,
  offsetX = 0,
  offsetY = 0,
}) {
  const [x, y, r] = [0, 0, 0]
    .map(() => Math.round((Math.random() - 0.5) * scale));

  return {
    x: x + offsetX,
    y: y + offsetY,
    r,
  };
}


export function arrayStaggeredPush(toAdd, array, staggerTime) {
  if (toAdd.length === 0) return false;

  const item = toAdd.pop();
  array.push(item);
  setTimeout(() => arrayStaggeredPush(toAdd, array, staggerTime), staggerTime);
  return true;
}

export function arrayStaggeredPull(toRemove, array, staggerTime) {
  if (toRemove.length === 0) return false;

  const item = toRemove.pop();
  const find = array.indexOf(item);

//  console.log(find);

  if (find !== -1) {
    array.splice(find, 1);
  } else {
    console.log('TO FIX - pulling half chips');
    return true;
  }
  setTimeout(() => arrayStaggeredPull(toRemove, array, staggerTime), staggerTime);
  return true;
}