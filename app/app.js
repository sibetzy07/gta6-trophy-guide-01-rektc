// GTA VI Trophy Guide & Tracker: a checklist that remembers what you earned
// (localStorage), filters by kind and grade, hides story spoilers until a
// trophy is earned, and shows a roadmap to the platinum built from the
// official trophy descriptions. The data is data/trophies.json, loaded from
// this app's own files — the page fetches nothing else.
const KEY = 'gta6-trophy-progress-v1';
const KINDS = ['all', 'story', 'missable', 'collectibles', 'activities', 'online'];

// The roadmap to the platinum, in the order to earn them, built from the
// official descriptions: which story chapters and missions, which
// collectibles and counts. ids name trophies in data/trophies.json.
const ROADMAP = [
  {
    title: 'Play the story, Chapters 1 to 4 and the finale',
    note: 'Twelve story trophies pop as you play. Save at the start of every chapter and keep one untouched save from just before the final mission.',
    ids: [2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 7],
    flags: { 3: 'Do the balcony meditation in Ch. 1 first', 5: 'Race Against Yago is time-sensitive', 7: 'Save before the final mission' },
  },
  {
    title: 'Side strands: Andy, Kenton, Billy, Randy, Tyrone, Bret',
    note: 'Each side character has a final mission with its own trophy. Andy, Billy and Tyrone strands do not count toward Strangers & Freaks — that trophy needs 8 other stranger strands.',
    ids: [22, 23, 24, 26, 27, 29, 25],
    flags: {},
  },
  {
    title: 'Robberies: jewelry, bank vaults, armored trucks, gang operations',
    note: 'Jewelry opens in Chapter 3 (Yasmani’s Jewelry Jobs gives the Snap Gun); bank vaults open near the end of Chapter 4 (That’s Where The Money Is). Bring your partner to vaults — you cannot carry all the bags alone.',
    ids: [39, 40, 41, 43, 33, 34],
    flags: { 40: '5 vaults for the trophy, 8 for 100%', 43: '1 operation per gang (9 gangs), 39 for 100%' },
  },
  {
    title: 'Activities and collectibles',
    note: 'The long middle: stunts, shooting, races, fishing, meditation, cards, WAiNK scans, challenges, vehicles and exploring every region. Most of these count toward 100% too.',
    ids: [15, 17, 18, 19, 20, 21, 28, 30, 31, 32, 35, 42, 16],
    flags: { 15: '250 stunts (300 for 100%)', 17: '42 gold medals', 18: '14 drone race locations', 28: 'MISSABLE — 18 spots, do Ch. 1 first', 30: '3 sets (15 for 100%)', 31: '100 scans', 32: '50 challenges (70 for 100%)', 35: '100 vehicles (200 for 100%)' },
  },
  {
    title: 'Money and property',
    note: 'Launder marked bills through your contacts, spend across the shops, then buy the garages and register cars. Garages come first: each registered car needs a free parking spot.',
    ids: [52, 53, 54, 55, 36, 37, 38, 44, 45, 46, 47, 48, 49, 50, 51],
    flags: { 54: '8 garages, $160,000 total' },
  },
  {
    title: '100% completion, then the platinum',
    note: 'After the story, open Touch Pad, Progress, 100% Completion and work the checklist: 15 of 18 card sets, 70 of 80 challenges, 300 of 397 stunts, 200 of 277 vehicles, all 8 bank vaults and all 39 gang operations. Finishing it earns A Long Road, and the platinum follows.',
    ids: [14, 1],
    flags: { 14: 'Gold — the last big step', 1: 'Platinum' },
  },
];

const params = new URLSearchParams(location.search);
const grid = document.getElementById('grid');
const empty = document.getElementById('empty');
const showing = document.getElementById('showing');
const kindsEl = document.getElementById('kinds');
const gradeEl = document.getElementById('grade');
const searchEl = document.getElementById('search');
const hideEarnedEl = document.getElementById('hide-earned');
const spoilersEl = document.getElementById('spoilers');
const checklistSection = document.getElementById('checklist');
const roadmapSection = document.getElementById('roadmap');

let earned = new Set();
try {
  earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]').filter((n) => Number.isInteger(n)));
} catch {
  earned = new Set();
}
const save = () => localStorage.setItem(KEY, JSON.stringify([...earned].sort((a, b) => a - b)));

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));
const isStory = (t) => t.kinds.includes('story');
const isHidden = (t) => spoilersEl.checked && isStory(t) && !earned.has(t.id);

let kind = KINDS.includes(params.get('kind')) ? params.get('kind') : 'all';
let view = params.get('view') === 'roadmap' ? 'roadmap' : 'checklist';
if (params.get('grade')) gradeEl.value = params.get('grade');
if (params.get('q')) searchEl.value = params.get('q');
if (params.get('spoilers') === 'on') spoilersEl.checked = true;
if (params.get('hideEarned') === 'on') hideEarnedEl.checked = true;

function kindCount(k) {
  const list = k === 'all' ? trophies : trophies.filter((t) => t.kinds.includes(k));
  return `${list.filter((t) => earned.has(t.id)).length}/${list.length}`;
}

function renderKinds() {
  kindsEl.replaceChildren();
  for (const k of KINDS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pill' + (k === kind ? ' active' : '');
    b.setAttribute('aria-pressed', String(k === kind));
    const label = document.createElement('span');
    label.textContent = k === 'all' ? 'All' : k[0].toUpperCase() + k.slice(1);
    const n = document.createElement('span');
    n.className = 'n';
    n.textContent = ' ' + kindCount(k);
    b.append(label, n);
    b.addEventListener('click', () => {
      kind = k;
      renderKinds();
      render();
    });
    kindsEl.append(b);
  }
}

function renderProgress() {
  const total = trophies.length;
  const pct = Math.round((earned.size / total) * 100);
  document.getElementById('progress-count').textContent = `${earned.size} / ${total}`;
  document.getElementById('progress-pct').textContent = `${pct}%`;
  document.getElementById('progress-fill').style.width = `${pct}%`;
  const grades = ['platinum', 'gold', 'silver', 'bronze'];
  document.getElementById('grade-counts').textContent = grades
    .map((g) => {
      const list = trophies.filter((t) => t.grade === g);
      return `${g[0].toUpperCase() + g.slice(1)} ${list.filter((t) => earned.has(t.id)).length}/${list.length}`;
    })
    .join(' · ');
}

function card(t) {
  const el = document.createElement('article');
  el.className = 'card' + (earned.has(t.id) ? ' earned' : '');
  el.id = `trophy-${t.id}`;
  const hidden = isHidden(t);

  const head = document.createElement('div');
  head.className = 'card-head';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.id);
  box.setAttribute('aria-label', `Earned: ${t.name}`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.id);
    else earned.delete(t.id);
    save();
    renderProgress();
    renderKinds();
    if (hideEarnedEl.checked) render();
    else {
      el.classList.toggle('earned', box.checked);
      render(); // spoiler masking changes once a story trophy is earned
    }
  });
  const title = document.createElement('div');
  title.className = 'card-title';
  const h2 = document.createElement('h2');
  const num = document.createElement('span');
  num.className = 'num';
  num.textContent = `#${t.id}`;
  h2.append(num);
  h2.append(document.createTextNode(hidden ? 'Hidden story trophy' : t.name));
  const desc = document.createElement('p');
  desc.textContent = hidden
    ? 'Earn this trophy to reveal its name and description.'
    : t.description;
  title.append(h2, desc);
  const badge = document.createElement('span');
  badge.className = `badge ${t.grade}`;
  badge.textContent = t.grade;
  head.append(box, title, badge);
  el.append(head);

  const tags = document.createElement('div');
  tags.className = 'tags';
  for (const k of t.kinds) {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = k;
    tags.append(tag);
  }
  if (t.missable) {
    const tag = document.createElement('span');
    tag.className = 'tag missable';
    tag.textContent = 'Missable';
    tags.append(tag);
  }
  el.append(tags);

  if (!hidden) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'guide-btn';
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = 'Show guide';
    const guide = document.createElement('div');
    guide.className = 'guide';
    guide.hidden = true;
    const p = document.createElement('p');
    p.textContent = t.guide;
    guide.append(p);
    if (t.missable) {
      const miss = document.createElement('p');
      miss.className = 'miss-note';
      miss.textContent = 'Missable: do the Chapter 1 balcony meditation before Chapter 1 ends, and keep a manual save from the start of the chapter.';
      guide.append(miss);
    }
    const src = document.createElement('p');
    src.className = 'src';
    src.textContent = 'Source: ';
    const a = document.createElement('a');
    a.href = t.source.url;
    a.rel = 'noopener';
    a.textContent = t.source.name;
    src.append(a);
    guide.append(src);
    btn.addEventListener('click', () => {
      const open = guide.hidden;
      guide.hidden = !open;
      btn.textContent = open ? 'Hide guide' : 'Show guide';
      btn.setAttribute('aria-expanded', String(open));
      el.classList.toggle('open', open);
    });
    el.append(btn, guide);
    el._openGuide = () => {
      if (guide.hidden) btn.click();
    };
  } else {
    const note = document.createElement('p');
    note.className = 'hidden-note';
    note.textContent = 'Its guide stays hidden with the spoilers on. Tick “earned” to reveal it, or switch spoilers off.';
    el.append(note);
  }
  return el;
}

function render() {
  const q = searchEl.value.trim().toLowerCase();
  const grade = gradeEl.value;
  const list = trophies.filter((t) => {
    if (kind !== 'all' && !t.kinds.includes(kind)) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (hideEarnedEl.checked && earned.has(t.id)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
    return true;
  });
  grid.replaceChildren();
  for (const t of list) grid.append(card(t));
  showing.textContent = `Showing ${list.length} of ${trophies.length} trophies`;
  empty.hidden = list.length !== 0;
  empty.textContent = kind === 'online'
    ? 'No online trophies: all 55 trophies unlock in single-player at launch — no online mode, no online trophies.'
    : 'No trophies match these filters.';
}

function renderRoadmap() {
  const phases = document.getElementById('phases');
  phases.replaceChildren();
  for (const phase of ROADMAP) {
    const li = document.createElement('li');
    li.className = 'phase';
    const h3 = document.createElement('h3');
    const step = document.createElement('span');
    step.className = 'step';
    step.textContent = `Step ${ROADMAP.indexOf(phase) + 1}`;
    h3.append(step, document.createTextNode(phase.title));
    const note = document.createElement('p');
    note.textContent = phase.note;
    const ul = document.createElement('ul');
    for (const id of phase.ids) {
      const t = byId.get(id);
      const item = document.createElement('li');
      const g = document.createElement('span');
      g.className = `g ${t.grade}`;
      g.textContent = t.grade;
      item.append(g, document.createTextNode(` ${t.name}`));
      if (phase.flags[id]) {
        const flag = document.createElement('span');
        flag.className = 'flag';
        flag.textContent = ` — ${phase.flags[id]}`;
        item.append(flag);
      }
      ul.append(item);
    }
    li.append(h3, note, ul);
    phases.append(li);
  }
}

function setView(v) {
  view = v;
  const isRoadmap = v === 'roadmap';
  roadmapSection.hidden = !isRoadmap;
  checklistSection.hidden = isRoadmap;
  document.getElementById('tab-checklist').classList.toggle('active', !isRoadmap);
  document.getElementById('tab-roadmap').classList.toggle('active', isRoadmap);
  document.getElementById('tab-checklist').setAttribute('aria-pressed', String(!isRoadmap));
  document.getElementById('tab-roadmap').setAttribute('aria-pressed', String(isRoadmap));
  document.querySelector('.controls').style.display = isRoadmap ? 'none' : '';
}

document.getElementById('tab-checklist').addEventListener('click', () => setView('checklist'));
document.getElementById('tab-roadmap').addEventListener('click', () => setView('roadmap'));
gradeEl.addEventListener('change', render);
searchEl.addEventListener('input', render);
hideEarnedEl.addEventListener('change', render);
spoilersEl.addEventListener('change', render);

document.getElementById('export').addEventListener('click', () => {
  const data = { game: 'Grand Theft Auto VI', platform: 'PlayStation 5', earned: [...earned].sort((a, b) => a - b) };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = (Array.isArray(data) ? data : data.earned ?? []).filter((n) => byId.has(n));
    earned = new Set(ids);
    save();
    renderProgress();
    renderKinds();
    render();
  } catch {
    alert('That file is not a trophy progress export from this guide.');
  }
  e.target.value = '';
});

renderKinds();
renderProgress();
renderRoadmap();
render();
setView(view);

// Deep links for screenshots and sharing: ?open=<id> expands that trophy's guide.
const openId = Number(params.get('open'));
if (openId && byId.has(openId)) {
  const el = document.getElementById(`trophy-${openId}`);
  if (el && el._openGuide) {
    el._openGuide();
    // Scroll only as far as needed to reveal the trophy: a deep jump can
    // leave a headless capture blank, so 'nearest' moves the least.
    el.scrollIntoView({ block: 'nearest' });
  }
}
