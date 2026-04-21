// 6 участников очного курса AI Boost · новая реальность (Айрата на финале не будет)
// slug = идентификатор в URL, fullName = ФИО для сертификата
export const PARTICIPANTS = [
  { slug: 'marat',    name: 'Марат',     fullName: 'Шайдулин Марат',     sphere: 'Крафтовый бар «Шемрак»'      },
  { slug: 'aigul',    name: 'Айгуль',    fullName: 'Рахматуллина Айгуль', sphere: 'Управляющий детским центром' },
  { slug: 'ilgiz',    name: 'Ильгиз',    fullName: 'Рахматуллин Ильгиз',  sphere: 'Газовое оборудование'        },
  { slug: 'mishag',   name: 'Михаил Г.', fullName: 'Гончар Михаил',       sphere: 'Инженер · телеком'           },
  { slug: 'misha',    name: 'Михаил',    fullName: 'Желудков Михаил',     sphere: 'Строительство линий связи'   },
  { slug: 'iskander', name: 'Искандер',  fullName: 'Бибарцев Искандер',   sphere: 'Запчасти для сельхозтехники' },
];

export const HOST_KEY = 'albert2026'; // используется в host.html?key=...

export function findBySlug(slug) {
  return PARTICIPANTS.find(p => p.slug === slug);
}

export function parseUserFromURL() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('user');
  if (!slug) return null;
  return findBySlug(slug);
}
