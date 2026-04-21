// 7 участников очного курса AI Boost · новая реальность
// slug = идентификатор в URL, hash = секрет для входа без путаницы имён
export const PARTICIPANTS = [
  { slug: 'ayrat',    hash: 'a8f2', name: 'Айрат',     sphere: 'Металлоконструкции · навесы'     },
  { slug: 'marat',    hash: 'm3k7', name: 'Марат',     sphere: 'Крафтовый бар «Шемрак»'          },
  { slug: 'aigul',    hash: 'g9q1', name: 'Айгуль',    sphere: 'Управляющий детским центром'     },
  { slug: 'ilgiz',    hash: 'i4w8', name: 'Ильгиз',    sphere: 'Газовое оборудование'            },
  { slug: 'mishag',   hash: 'g6t2', name: 'Михаил Г.', sphere: 'Инженер · телеком'               },
  { slug: 'misha',    hash: 'n5r3', name: 'Михаил',    sphere: 'Строительство линий связи'       },
  { slug: 'iskander', hash: 'k1p6', name: 'Искандер',  sphere: 'Запчасти для сельхозтехники'     },
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
