/* =====================================================================
   story/story-data.js - the story prototype's content (text only, no Babylon code)
   Loaded only with ?story=1. Cebuano lines are PLACEHOLDERS for a native speaker to check.
   Poems: Erlinda K. Alburo's text goes where POEM appears (used with her permission); none are written in her name.
   ===================================================================== */
(() => {
const S = G.STORY = {};
const POEM = '[ Balak ni Erlinda K. Alburo · ibutang dinhi ]';
S.POEM = POEM;

// one chapter = one day. u = time of day (0 Buntag … 1 Gabii)
S.chapters = [
  { id: 'prologue', n: 'Prologue · Hapon', title: 'Pag-uli', u: .55, line: ['Kaniadto, ako ang nagtudlo nimo sa ngalan sa mga bulak.', 'Long ago, I was the one who taught you the names of the flowers.'], pages: ['sampaguita'] },
  { id: 'I', n: 'Kapitulo I · Buntag', title: 'Ang nataran', u: .1, line: ['Sa buntag, klaro ang tanan. Para nimo, dili na para nako.', 'In the morning everything is clear. For you, not for me anymore.'], pages: ['gumamela', 'santan', 'rosas', 'bogambilya', 'pukingan'], fresh: 'Bag-o: mga tigmo (riddles)' },
  { id: 'II', n: 'Kapitulo II · Udto', title: 'Lim-aw ug baybayon', u: .3, line: ['Kaon na ta. Unya na ang bulak.', "Let's eat first. The flowers can wait."], pages: ['liryo', 'canna', 'heliconia', 'orkidyas', 'kadena'], fresh: 'Bag-o: mga silingan (neighbours)' },
  { id: 'III', n: 'Kapitulo III · Hapon', title: 'Tambal', u: .52, line: ['Ang tambal dili lang tanom, day. Tawo pud.', 'A remedy is not only a plant, dear. It is people too.'], pages: ['kamia', 'ilangilang', 'tsampaka', 'adelfa'], fresh: 'Bag-o: humot ug hikap (scent and touch)' },
  { id: 'IV', n: 'Kapitulo IV · Gabii', title: 'Brownout', u: .93, line: ['Dili na ko makakita. Simhota, paminawa.', "I can't see anymore. Smell. Listen."], pages: ['dama', 'kalachuchi', 'rosal'], fresh: 'Bag-o: humot lang (scent only) · hold O', brownout: true },
  { id: 'fiesta', n: 'Fiesta · Buntag', title: 'Pagmata', u: .12, line: ['Basaha, day. Gusto nakong madungog.', 'Read it to me, dear. I want to hear it.'], pages: [] },
];

// clue kinds: lola (her page), tigmo (riddle), sense (near the plant), place (overheard at a landmark)
// blanks are always Ngalan / Kanus-a or Asa / Gamit. traits: what you can tell Lola (yes = true of the flower)
S.pages = {
  sampaguita: {
    note: ['Gagmay ug puti. Humot kaayo inig kilumkilom.', 'Small and white. Sweetest at dusk.'],
    tigmo: null,
    blanks: [['Ngalan', 'Sampaguita'], ['Gamit', 'kuwintas sa altar']],
    clues: [
      { kind: 'place', at: 'shrine', who: 'Ikaw', ceb: 'Sa krus, naay daang kuwintas sa gagmayng puting bulak.', en: 'At the roadside cross, an old garland of small white flowers.', word: 'kuwintas sa altar' },
      { kind: 'sense', ceb: 'Humot. Sama sa gihikay ni Lola sa iyang sabakan.', en: 'Sweet. Like the one Lola is threading in her lap.' },
    ],
    traits: { yes: ['puti', 'gagmay', 'humot inig kilumkilom', 'gihimong kuwintas'], no: ['pula', 'dako', 'walay humot'] },
    ask: { puti: ['Unsa may kolor, day?', 'What colour is it, dear?'], 'humot inig kilumkilom': ['Kanus-a man kini mohumot?', 'When does it smell sweetest?'] },
    after: [['Lola Almira', 'Ingon sila, sauna, duha ka tawo nagsaad: sumpa kita.', 'They say, long ago, two people made a vow: sumpa kita, I promise you.'],
            ['Lola Almira', 'Ug sa lubnganan, mituybo kining gagmayng puting bulak.', 'And on the grave grew this small white flower.'],
            ['Ikaw', 'Sumpa kita, La. Atong humanon ni.', "I promise, La. We'll finish this."]],
  },
  gumamela: {
    note: ['Pula ug dako, lima ka talulot. Sa buntag mobukad, sa gabii malaya na.', 'Red and big, five petals. It opens in the morning and is gone by night.'],
    tigmo: ['Payong nga pula, usa ra ka adlaw ang kinabuhi.', 'A red umbrella that lives for only one day.'],
    blanks: [['Ngalan', 'Gumamela'], ['Kanus-a', 'usa ra ka adlaw ang bukad'], ['Gamit', 'tapal sa hubag']],
    clues: [
      { kind: 'lola', word: 'usa ra ka adlaw ang bukad' },
      { kind: 'place', at: 'well', who: 'Nang Iday', ceb: 'Kadtong pula nga bulak sa koral, gidugmok, ipapilit sa hubag ni Bebe.', en: 'That red flower by the fence, crushed and pressed on Bebe’s boil.', word: 'tapal sa hubag' },
      { kind: 'sense', ceb: 'Lima ka dagkong talulot, ug taas nga lawas sa tunga.', en: 'Five big petals, and a long column in the middle.' },
    ],
    traits: { yes: ['pula', 'dako', 'lima ka talulot', 'usa ka adlaw'], no: ['puti', 'inig gabii', 'gagmay'] },
    ask: { pula: ['Unsa may kolor niya?', 'What colour is it?'], 'lima ka talulot': ['Pila may talulot?', 'How many petals?'] },
  },
  santan: {
    note: ['Ang mga bata mosuyop sa tam-is sa iyang gagmayng bulak, pauli gikan sa eskwelahan.', 'Children suck the sweet from its tiny flowers on the way home from school.'],
    tigmo: ['Usa ka bola nga gagmayng bituon, tam-is ang tiil.', 'A ball of tiny stars with sweet feet.'],
    blanks: [['Ngalan', 'Santan'], ['Asa', 'koral sa nataran'], ['Gamit', 'gamot sa sakit sa tiyan']],
    clues: [
      { kind: 'place', at: 'arch', who: 'Ikaw', ceb: 'Sa ganghaan, ang koral pula ug kahel, pundok-pundok.', en: 'At the gate the hedge is red and orange, in little clusters.', word: 'koral sa nataran' },
      { kind: 'place', at: 'kubo', who: 'Nang Iday', ceb: 'Ang gamot sa santan, akong gilaga para sa sakit sa tiyan ni Bebe.', en: 'I boil santan root when Bebe has a stomach ache.', word: 'gamot sa sakit sa tiyan' },
      { kind: 'sense', ceb: 'Pundok-pundok. Upat ka talulot matag usa.', en: 'Round clusters. Four petals on each little flower.' },
    ],
    traits: { yes: ['pundok-pundok', 'upat ka talulot', 'pula o kahel', 'tam-is'], no: ['puti', 'dako', 'humot kaayo'] },
    ask: { 'pundok-pundok': ['Usa ra ba ka bulak, o daghan nga nagpundok?', 'One flower, or many gathered together?'], 'upat ka talulot': ['Pila may talulot?', 'How many petals?'] },
  },
  dama: {
    note: ['Dili na nako makita, pero kahibalo ko kanus-a siya mobukad. Ang iyang alimyon para sa mga molakaw sa gabii.', "I can't see it anymore, but I know when it opens. Its perfume is for the ones who walk at night."],
    tigmo: ['Usa ka babaye nga mag-ayo-ayo ra kon mosalop na ang adlaw.', 'A lady who dresses up only when the sun goes down.'],
    blanks: [['Ngalan', 'Dama de Noche'], ['Kanus-a', 'mobukad inig gabii'], ['Gamit', 'alimyon ra, dili imnon']],
    clues: [
      { kind: 'lola', word: 'mobukad inig gabii' },
      { kind: 'place', at: 'shrine', who: 'Nang Iday', ceb: 'Simhota lang, day. Ayaw inma.', en: "Just smell it, dear. Don't drink it.", word: 'alimyon ra, dili imnon' },
      { kind: 'sense', ceb: 'Tam-is kaayo ang hangin dinhi. Gagmayng berde-puti nga tubo.', en: 'The air is so sweet here. Tiny greenish-white tubes.' },
    ],
    traits: { yes: ['humot inig gabii', 'berde-puti', 'morag tubo', 'gagmay'], no: ['pula', 'inig buntag', 'dako'] },
    ask: { 'humot inig gabii': ['Humot ba kini sa gabii o sa buntag?', 'Is it fragrant at night or in the morning?'], 'berde-puti': ['Unsa may kolor, day?', 'What colour is it, dear?'] },
  },
};
S.decoys = { Gamit: ['bula sa mga bata', 'tsaa sa hilanat'], Kanus: ['mobukad inig buntag'] };

// side tales: overheard, optional, written at the back of the journal
S.tales = {
  hens: { title: 'Ang Banog ug ang Himungaan', type: 'Pabula', chapter: 'I', src: 'Visayan · Cole, 1916', lines: [
    ['Bebe', 'Nang, nganong nagkutkot man ang mga manok?', 'Nang, why do the hens keep scratching?'],
    ['Nang Iday', 'Ingon sila, sauna, gihatagan sa banog og singsing ang himungaan.', 'They say, long ago, the hawk gave the hen a ring.'],
    ['Nang Iday', 'Gilabay kini sa himungaan. Mao nga hangtod karon, nangita gihapon sila.', 'The hen threw it away. So to this day, they are still looking for it.'],
    ['Bebe', 'Tabangan nako sila pangita!', "I'll help them look!"]] },
  pusong: { title: 'Juan Pusong', type: 'Sugilanon', chapter: 'II', src: 'Visayan · Hart & Hart, 1974', lines: [
    ['Radyo', '…ug si Juan Pusong mipahiyom. Gilimbongan na pud niya ang datu!', '…and Juan Pusong smiled. He has fooled the datu again!'],
    ['Lola Almira', 'Hahaha. Kanang Pusong gyud.', 'Hahaha. That Pusong.']] },
  ilang: { title: 'Ang ilang-ilang', type: 'Alamat', chapter: 'III', src: 'Sevilla, 1908 · versions differ', lines: [
    ['Lola Almira', 'Kining kahoy sa ibabaw nato, ilang-ilang.', 'This tree above us is an ilang-ilang.'],
    ['Lola Almira', 'Ingon sila, adunay dalaga nga ginganlan og Ilang. Ang iyang hinigugma nagsige og tawag: Ilang, Ilang!', 'They say there was a girl named Ilang. The one who loved her kept calling: Ilang, Ilang!'],
    ['Lola Almira', 'Mao nga humot gihapon ang iyang ngalan.', 'That is why her name still smells sweet.']] },
  alitaptap: { title: 'Ang alitaptap', type: 'Alamat', chapter: 'IV', src: 'Eugenio, 1996 · versions differ', lines: [
    ['Bebe', 'La, ngitngit kaayo…', "La, it's so dark…"],
    ['Lola Almira', 'Ayaw kahadlok. Tan-awa, ang mga alitaptap.', "Don't be afraid. Look, the fireflies."],
    ['Lola Almira', 'Ingon sila, usa ka dalaga gikan sa langit ang mipili nga magpabilin dinhi.', 'They say a maiden from the sky chose to stay here.']] },
};

// the first meeting at the papag
S.prologue = [
  ['Ikaw', 'Lola! Mano po.', '(Ikaw takes her hand to bless)'],
  ['Lola Almira', 'Dako na man ka. Kahumot nimo og siyudad.', "You've grown. You smell like the city."],
  ['Lola Almira', 'Kini akong libro sa mga bulak. Wala na nako mahuman.', "This is my book of flowers. I couldn't finish it."],
  ['Lola Almira', 'Ikaw na ang akong mata.', 'You will be my eyes.'],
];
S.ending = [
  ['Ikaw', '(Ikaw reads the whole journal aloud, page by page)', ''],
  ['Lola Almira', POEM, '(Lola mouths the poems along)'],
  ['Lola Almira', 'Imo na ning hardin, day.', 'This garden is yours now, dear.'],
];

G.INFO_OTHER = G.INFO_OTHER || {};
G.INFO_OTHER.lola = { ceb: 'Lola Almira', sci: 'ang tag-iya sa hardin · the keeper of the garden', fact: 'A botanist who is losing her sight. Inspired by Erlinda K. Alburo’s Sinug-ang Hardin ni Almira.', color: '#c9a36b' };
})();
