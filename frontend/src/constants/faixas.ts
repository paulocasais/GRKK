export const FAIXAS_INFANTIL = [
  'Branca/Amarela',
  'Amarela',
  'Amarela/Laranja',
  'Laranja',
  'Laranja/Verde',
  'Verde',
  'Verde/Azul',
  'Azul',
  'Azul/Vermelha',
  'Vermelha',
  'Marrom',
  'Marrom I',
  'Marrom II',
];

export const FAIXAS_ADULTO = [
  'Amarela',
  'Laranja',
  'Verde',
  'Azul',
  'Vermelha',
  'Marrom',
  'Marrom I',
  'Marrom II',
  'Preta I',
  'Preta II',
];

// Flat list of all unique belts in logical progression order (Infantil + Adulto Preta)
export const FAIXAS = [
  'Branca',
  'Branca/Amarela',
  'Amarela',
  'Amarela/Laranja',
  'Laranja',
  'Laranja/Verde',
  'Verde',
  'Verde/Azul',
  'Azul',
  'Azul/Vermelha',
  'Vermelha',
  'Marrom',
  'Marrom I',
  'Marrom II',
  'Preta I',
  'Preta II',
];

export interface BeltStyle {
  bg: string;
  border: string;
  text: string;
  stripe?: string;
  progressClass: string;
}

export const CORES_FAIXAS: Record<string, BeltStyle> = {
  'Branca':          { bg: 'bg-white',        border: 'border-zinc-300',   text: 'text-zinc-800', progressClass: 'bg-white border border-gray-300' },
  'Branca/Amarela':  { bg: 'bg-white',        border: 'border-yellow-450', text: 'text-zinc-800', stripe: 'bg-yellow-450', progressClass: 'bg-gradient-to-r from-white to-yellow-400 border border-yellow-400' },
  'Amarela':         { bg: 'bg-yellow-450',   border: 'border-yellow-600', text: 'text-zinc-900', progressClass: 'bg-yellow-400' },
  'Amarela/Laranja': { bg: 'bg-yellow-450',   border: 'border-orange-500', text: 'text-zinc-900', stripe: 'bg-orange-500', progressClass: 'bg-gradient-to-r from-yellow-400 to-orange-500' },
  'Laranja':         { bg: 'bg-orange-500',   border: 'border-orange-700', text: 'text-white', progressClass: 'bg-orange-500' },
  'Laranja/Verde':   { bg: 'bg-orange-500',   border: 'border-emerald-600',text: 'text-white', stripe: 'bg-emerald-600', progressClass: 'bg-gradient-to-r from-orange-500 to-emerald-700' },
  'Verde':           { bg: 'bg-emerald-700',  border: 'border-emerald-900',text: 'text-white', progressClass: 'bg-emerald-600' },
  'Verde/Azul':      { bg: 'bg-teal-600',     border: 'border-teal-800',   text: 'text-white', stripe: 'bg-blue-600', progressClass: 'bg-gradient-to-r from-emerald-600 to-blue-600' },
  'Azul':            { bg: 'bg-blue-600',     border: 'border-blue-800',   text: 'text-white', progressClass: 'bg-blue-600' },
  'Azul/Vermelha':   { bg: 'bg-indigo-600',   border: 'border-indigo-800', text: 'text-white', stripe: 'bg-red-500', progressClass: 'bg-gradient-to-r from-blue-600 to-red-500' },
  'Vermelha':        { bg: 'bg-red-600',      border: 'border-red-800',    text: 'text-white', progressClass: 'bg-red-500' },
  'Marrom':          { bg: 'bg-amber-900',    border: 'border-amber-950',  text: 'text-white', progressClass: 'bg-amber-800' },
  'Marrom I':        { bg: 'bg-amber-900',    border: 'border-amber-950',  text: 'text-white', stripe: 'bg-white', progressClass: 'bg-amber-900' },
  'Marrom II':       { bg: 'bg-amber-900',    border: 'border-amber-950',  text: 'text-white', stripe: 'bg-amber-400', progressClass: 'bg-amber-950' },
  'Preta I':         { bg: 'bg-zinc-950',     border: 'border-yellow-600', text: 'text-gold',  stripe: 'bg-yellow-500', progressClass: 'bg-zinc-900 border border-zinc-700' },
  'Preta II':        { bg: 'bg-zinc-950',     border: 'border-yellow-500', text: 'text-gold',  stripe: 'bg-yellow-400', progressClass: 'bg-zinc-950 border border-gold/40' },
};
