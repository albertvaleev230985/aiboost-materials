const root = document.documentElement;
root.classList.add('js');
const mobile = matchMedia('(max-width:760px)');
const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)');
const motion = () => reducedMotion.matches ? 'instant' : 'smooth';

const tabs = [...document.querySelectorAll('.ltabs [role=tab]')];
const panels = [...document.querySelectorAll('.cpanel')];
const rings = [...document.querySelectorAll('.orbit [data-ring]')];
function selectTab(index) {
  tabs.forEach((tab, i) => {
    tab.setAttribute('aria-selected', String(i === index));
    tab.tabIndex = i === index ? 0 : -1;
    panels[i].classList.toggle('on', i === index);
    panels[i].hidden = i !== index;
  });
  rings.forEach(ring => ring.classList.toggle('on', Number(ring.dataset.ring) === index));
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(index));
  tab.addEventListener('keydown', event => {
    const keys = {
      ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length,
      Home: 0, End: tabs.length - 1
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    selectTab(keys[event.key]);
    tabs[keys[event.key]].focus();
  });
});
selectTab(0);

const disclosures = [...document.querySelectorAll('[data-disclosure]')];
function syncDisclosure(trigger) {
  const item = trigger.closest('.pi');
  const body = item.querySelector('.pi-b');
  if (mobile.matches) {
    const expanded = item.classList.contains('open');
    trigger.setAttribute('role', 'button');
    trigger.tabIndex = 0;
    trigger.setAttribute('aria-controls', body.id);
    trigger.setAttribute('aria-expanded', String(expanded));
    body.setAttribute('aria-hidden', String(!expanded));
  } else {
    for (const name of ['role', 'tabindex', 'aria-controls', 'aria-expanded']) trigger.removeAttribute(name);
    body.removeAttribute('aria-hidden');
  }
}
disclosures.forEach(trigger => {
  const toggle = () => {
    if (!mobile.matches) return;
    trigger.closest('.pi').classList.toggle('open');
    syncDisclosure(trigger);
  };
  trigger.addEventListener('click', toggle);
  trigger.addEventListener('keydown', event => {
    if (!mobile.matches || !['Enter',' '].includes(event.key)) return;
    event.preventDefault();
    toggle();
  });
  syncDisclosure(trigger);
});
mobile.addEventListener('change', () => disclosures.forEach(syncDisclosure));

document.querySelectorAll('[data-rail]').forEach(rail => {
  const dots = rail.nextElementSibling;
  const items = [...rail.children];
  const markers = items.map(() => dots.appendChild(document.createElement('i')));
  function update() {
    const start = rail.scrollLeft;
    const origin = items[0].offsetLeft;
    const lastStop = rail.scrollWidth - rail.clientWidth;
    const distance = item => Math.abs(Math.min(item.offsetLeft - origin, lastStop) - start);
    const nearest = lastStop > 0 && start >= lastStop - 1 ? items.length - 1 :
      items.reduce((best, item, i) => distance(item) < distance(items[best]) ? i : best, 0);
    markers.forEach((marker,i) => marker.classList.toggle('on', i === nearest));
  }
  rail.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', update);
  update();
});

const reveals = document.querySelectorAll('.rv');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('in'); observer.unobserve(entry.target);
    }
  }, {threshold:.06});
  reveals.forEach(el => observer.observe(el));
} else reveals.forEach(el => el.classList.add('in'));

const nav = document.querySelector('.snav');
const scroller = nav.querySelector('.snav-in');
const links = [...scroller.querySelectorAll('a')];
const sections = links.map(link => document.querySelector(link.hash));
let current = -2;
let queued = false;
function showProgress() {
  queued = false;
  const extent = root.scrollHeight - innerHeight;
  nav.style.setProperty('--p', extent > 0 ? Math.min(1, Math.max(0,scrollY/extent)) : 0);
  let index = -1;
  sections.forEach((section,i) => { if (section.getBoundingClientRect().top <= nav.offsetHeight+48) index = i; });
  if (index === current) return;
  current = index;
  links.forEach((link,i) => {
    link.classList.toggle('on',i === index);
    if (i === index) link.setAttribute('aria-current','location');
    else link.removeAttribute('aria-current');
  });
  const active = links[index];
  if (scroller.scrollWidth > scroller.clientWidth) {
    scroller.scrollTo({left:active ? active.offsetLeft - scroller.clientWidth/2 + active.offsetWidth/2 : 0,behavior:motion()});
  }
}
function scheduleProgress() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(showProgress);
}
window.addEventListener('scroll', scheduleProgress, {passive:true});
window.addEventListener('resize', scheduleProgress);
showProgress();
document.querySelector('[data-film]').addEventListener('click', () => {
  const film = document.querySelector('#workshop-film');
  film.play().catch(() => { /* Native controls stay available if the browser declines playback. */ });
});
