/* =====================================================================
   data/flowers.js - the registry of the hero flowers (18). Each flower lives in its own folder
   public/flowers/<id>/ (card.js = its guide card, model.js = its 3D model, renders/ = screenshots);
   boot.js loads every card after this file
   Facts come from public Philippine ethnobotany sources (StuartXchange, PTKDL); folk uses only, not medical advice.
   The flowers are typical Cebuano garden plants - NOT taken from Alburo's text (which could not be found).
   G.FLOWER_ORDER is the bayong (basket) order: collecting all of them awakens the garden.
   ===================================================================== */
G.INFO = {};
G.FLOWER_ORDER = ['sampaguita', 'gumamela', 'kalachuchi', 'santan', 'dama', 'bogambilya', 'kadena', 'ilangilang', 'rosas', 'canna', 'heliconia', 'kamia', 'orkidyas', 'liryo', 'adelfa', 'pukingan', 'tsampaka', 'rosal'];
G.flowerCard = c => { G.INFO[c.id] = c; };                               // called by flowers/<id>/card.js
