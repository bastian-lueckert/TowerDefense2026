/* =========================================================
   factions.js – Spielerklassen (Völker)

   Jede Klasse hat für dieselben sechs Turmrollen eigene Namen,
   Farben, Formen und eine eigene Kampfweise (Boni). Dazu
   geschichtliche Hintergründe – und Quizfragen, die sich genau
   auf diese Hintergründe beziehen.
   ========================================================= */
(function (global) {
  'use strict';
  var TD = global.TD = global.TD || {};

  /* Die sechs Rollen; die Grundwerte stehen in config.js */
  TD.ROLES = ['rapid', 'slow', 'splash', 'chain', 'sniper', 'dot'];

  TD.FACTIONS = {

    /* =====================================================
       MITTELALTER
       ===================================================== */
    medieval: {
      key: 'medieval',
      name: 'Mittelalter',
      era: 'ca. 500 – 1500 n. Chr.',
      tagline: 'Burgen, Bogenschützen und Belagerungsmaschinen',
      desc: 'Ausgewogene Verteidiger. Ihre hohen Mauern verschaffen jedem Turm mehr Übersicht.',
      bonusText: '+10 % Reichweite für alle Türme',
      hero: {
        name: 'Adelheid von Rabenstein',
        title: 'Burgvögtin',
        intro: 'Seit ihr Vater nicht von der Jagd zurückkam, hält Adelheid die Feste Rabenstein allein. ' +
               'Sie kennt jeden Stein der Mauer – und weiß, dass unter dem Berg etwas Altes erwacht ist.',
        weapon: 'bow',
        power: {
          key: 'arrowStorm', name: 'Pfeilhagel',
          desc: 'Lässt einen Hagel von Pfeilen auf die dichteste Gruppe niedergehen.',
          cooldown: 11, radius: 2.3, damage: 2.6, minTargets: 3, color: '#ffe066'
        }
      },
      colors: { primary: '#4a7fc1', secondary: '#2b4b78', stone: '#8d93a6', trim: '#e8d9a0' },
      bonus: { damage: 1.0, range: 1.10, rate: 1.0, status: 1.0, cost: 1.0, upgradeCost: 1.0 },

      towers: {
        rapid:  { name: 'Bogenturm',       desc: 'Armbrustschützen auf den Zinnen.' },
        slow:   { name: 'Teerschleuder',   desc: 'Heißer Teer verklebt die Beine.' },
        splash: { name: 'Tribock',         desc: 'Gegengewicht schleudert schwere Steine.' },
        chain:  { name: 'Alchemistenturm', desc: 'Blitzelixier springt von Feind zu Feind.' },
        sniper: { name: 'Langbogen-Erker', desc: 'Ein Meisterschütze trifft über die halbe Karte.' },
        dot:    { name: 'Pestkatapult',    desc: 'Verseuchte Ladung, die lange nachwirkt.' }
      },

      /* Gegner aus der europäischen Sagenwelt */
      enemies: {
        grunt:  { name: 'Kobold',        color: '#8fbf5a', motif: 'horns',   lore: 'Boshafte Waldgeister, die in Rudeln aus dem Unterholz brechen.' },
        runner: { name: 'Irrlicht',      color: '#bfe86a', motif: 'wisp',    lore: 'Trügerische Lichter, die Wanderer ins Moor locken.' },
        swarm:  { name: 'Rattenplage',   color: '#a08b7a', motif: 'ears',    lore: 'Wo die Pest wütet, laufen die Ratten voran.' },
        flyer:  { name: 'Wyvern',        color: '#7aa85a', motif: 'wings',   lore: 'Kleiner Vetter des Drachen – zwei Beine, zwei Schwingen.' },
        tank:   { name: 'Steingolem',    color: '#8f9bb3', motif: 'runes',   lore: 'Von einem Alchemisten aus Burgmauern erweckt.' },
        shield: { name: 'Bannritter',    color: '#b48bff', motif: 'halo',    lore: 'Ein Untoter im Harnisch, geschützt durch einen Fluch.' },
        healer: { name: 'Moorhexe',      color: '#7ee081', motif: 'hood',    lore: 'Sie flickt ihre Brut mit Kräutern und üblen Sprüchen.' },
        boss:   { name: 'Drache',        color: '#ff6a2b', motif: 'dragon',  lore: 'Der Wurm aus dem Rabenstein. Sein Atem schmilzt Eisen.' }
      },

      facts: [
        { id: 'trebuchet', title: 'Der Tribock',
          text: 'Das Trebuchet (Tribock) arbeitete mit einem schweren Gegengewicht statt mit Muskelkraft. Damit ließen sich Steine von über 100 Kilogramm schleudern – die stärkste Belagerungsmaschine vor dem Schießpulver.' },
        { id: 'longbow', title: 'Der englische Langbogen',
          text: 'Ein Langbogen war bis zu 1,80 m lang und verlangte jahrelanges Training. An Skeletten englischer Bogenschützen lassen sich die verformten Schultern und Wirbel bis heute nachweisen.' },
        { id: 'armour', title: 'Wie schwer war eine Ritterrüstung?',
          text: 'Ein vollständiger Plattenharnisch wog etwa 20 bis 25 Kilogramm – verteilt über den ganzen Körper. Ritter konnten darin laufen, aufsitzen und sogar am Boden kämpfen.' },
        { id: 'moat', title: 'Der trockene Burggraben',
          text: 'Burggräben waren häufig gar nicht mit Wasser gefüllt. Ihr wichtigster Zweck war es, das Untergraben der Mauern zu verhindern – Angreifer wären beim Tunnelbau eingebrochen.' },
        { id: 'crossbow', title: 'Die verbotene Armbrust',
          text: 'Das Zweite Laterankonzil verbot 1139 den Einsatz der Armbrust in Kriegen zwischen Christen. Die Waffe galt als zu tödlich – gehalten hat sich das Verbot nicht.' },
        { id: 'arrowslit', title: 'Schießscharten',
          text: 'Schießscharten waren außen schmal und nach innen breit ausgestellt. So bot die Öffnung dem Feind kaum ein Ziel, dem Schützen dahinter aber ein weites Schussfeld.' },
        { id: 'oil', title: 'Kochendes Öl? Eher nicht',
          text: 'Öl war viel zu kostbar, um es von der Mauer zu gießen. Verteidiger nutzten heißes Wasser, Sand oder Pech – Sand drang zudem glühend in die Rüstungsfugen.' },
        { id: 'keep', title: 'Der Bergfried',
          text: 'Der Bergfried war der letzte Rückzugsort einer Burg. Sein Eingang lag oft mehrere Meter über dem Boden und war nur über eine einziehbare Leiter oder Treppe erreichbar.' }
      ],

      questions: [
        { fact: 'trebuchet', q: 'Womit erzeugte ein Tribock seine Wurfkraft?',
          answers: ['Mit einem schweren Gegengewicht', 'Mit Schießpulver', 'Mit verdrillten Tierhaarsehnen', 'Mit Druckluft aus Blasebälgen'], correct: 0 },
        { fact: 'longbow', q: 'Woran erkennen Forscher heute noch englische Langbogenschützen?',
          answers: ['An verformten Schultern und Wirbeln', 'An abgeschliffenen Zähnen', 'An verkürzten Beinknochen', 'An fehlenden Fingergliedern'], correct: 0 },
        { fact: 'armour', q: 'Wie schwer war ein vollständiger Plattenharnisch etwa?',
          answers: ['20 bis 25 kg', '5 bis 8 kg', '50 bis 60 kg', 'Über 100 kg'], correct: 0 },
        { fact: 'moat', q: 'Wozu diente ein Burggraben in erster Linie?',
          answers: ['Er verhinderte das Untergraben der Mauern', 'Er diente als Trinkwasserspeicher', 'Er hielt Fische für die Versorgung', 'Er kühlte die Vorratskeller'], correct: 0 },
        { fact: 'crossbow', q: 'Welche Waffe verbot das Laterankonzil 1139 für Kriege zwischen Christen?',
          answers: ['Die Armbrust', 'Den Langbogen', 'Das Trebuchet', 'Die Streitaxt'], correct: 0 },
        { fact: 'arrowslit', q: 'Wie war eine Schießscharte gebaut?',
          answers: ['Außen schmal, nach innen breit', 'Außen breit, nach innen schmal', 'Überall gleich breit', 'Rund und nach oben offen'], correct: 0 },
        { fact: 'oil', q: 'Was gossen Verteidiger meist von der Mauer – statt des sagenumwobenen Öls?',
          answers: ['Heißes Wasser, Sand oder Pech', 'Wein und Essig', 'Flüssiges Blei', 'Geschmolzenen Schnee'], correct: 0 },
        { fact: 'keep', q: 'Was war der Bergfried einer Burg?',
          answers: ['Der letzte Rückzugsort', 'Der Stall für die Pferde', 'Die Küche der Burg', 'Der Wohnturm der Bauern'], correct: 0 },
        { fact: 'trebuchet', q: 'Wie schwer konnten die Geschosse eines großen Tribocks werden?',
          answers: ['Über 100 kg', 'Etwa 2 kg', 'Rund 10 kg', 'Höchstens 30 kg'], correct: 0 },
        { fact: 'keep', q: 'Warum lag der Eingang eines Bergfrieds oft hoch über dem Boden?',
          answers: ['Damit man die Zugangsleiter einziehen konnte', 'Damit Regenwasser abfließen konnte', 'Um Steuern zu sparen', 'Weil dort der Fels begann'], correct: 0 }
      ]
    },

    /* =====================================================
       WIKINGER
       ===================================================== */
    viking: {
      key: 'viking',
      name: 'Wikinger',
      era: 'ca. 793 – 1066 n. Chr.',
      tagline: 'Langschiffe, Runen und rohe Wucht',
      desc: 'Angriffslustig. Härtere Treffer, dafür etwas kürzere Reichweite.',
      bonusText: '+15 % Schaden, −8 % Reichweite',
      hero: {
        name: 'Sigrún Eisenhand',
        title: 'Schildmaid von Vestfjord',
        intro: 'Sigrún führt die Wehr von Vestfjord, seit der Jarl auf See blieb. ' +
               'Die Völva hat ihr den Fimbulwinter geweissagt – drei Winter ohne Sommer. Der erste hat begonnen.',
        weapon: 'axe',
        aura: { damage: 1.12, label: '+12 % Schaden für Türme in ihrer Nähe' },
        power: {
          key: 'warCry', name: 'Kriegsruf',
          desc: 'Eine Druckwelle wirft alles um sie herum zurück und lähmt es.',
          cooldown: 13, radius: 3.0, damage: 2.2, minTargets: 3,
          slow: 0.7, slowDur: 2.8, knockback: 46, color: '#ff8a4a'
        }
      },
      colors: { primary: '#c1533a', secondary: '#7a2f1e', stone: '#7d6a52', trim: '#e0c069' },
      bonus: { damage: 1.15, range: 0.92, rate: 1.0, status: 1.0, cost: 1.0, upgradeCost: 1.0 },

      towers: {
        rapid:  { name: 'Speerwerfer',     desc: 'Schnelle Wurfspeere aus dem Schildwall.' },
        slow:   { name: 'Frostrunenstein', desc: 'Eingeritzte Runen lassen den Atem gefrieren.' },
        splash: { name: 'Felsenkatapult',  desc: 'Grobe Felsbrocken, grobe Wirkung.' },
        chain:  { name: 'Thors Amboss',    desc: 'Der Hammerschlag ruft überspringende Blitze.' },
        sniper: { name: 'Adler-Ballista',  desc: 'Ein Bolzen, ein Ziel, egal wie weit.' },
        dot:    { name: 'Schlangengrube',  desc: 'Natterngift, das langsam wirkt.' }
      },

      /* Gegner aus der nordischen Mythologie */
      enemies: {
        grunt:  { name: 'Draugr',      color: '#7fa8a0', motif: 'skull',  lore: 'Wiedergänger aus den Grabhügeln, zäh und ohne Furcht.' },
        runner: { name: 'Warg',        color: '#c9b06a', motif: 'ears',   lore: 'Riesenwölfe aus Fenrirs Wurf, schneller als jedes Pferd.' },
        swarm:  { name: 'Rabenschwarm',color: '#9a8fb5', motif: 'beak',   lore: 'Sie künden vom Fall – und hacken schon vorher zu.' },
        flyer:  { name: 'Sturmadler',  color: '#cfdce8', motif: 'wings',  lore: 'Hræsvelgrs Brut. Ihr Flügelschlag ist der Nordwind.' },
        tank:   { name: 'Bergriese',   color: '#7d8a72', motif: 'horns',  lore: 'Ein Jötunn aus Jötunheim – langsam, aber kaum zu fällen.' },
        shield: { name: 'Hrimthurse',  color: '#a8c8ff', motif: 'frost',  lore: 'Reifriese, gepanzert mit ewigem Eis.' },
        healer: { name: 'Völva',       color: '#7ee081', motif: 'hood',   lore: 'Eine Seherin, die gefallene Krieger zurück auf die Beine singt.' },
        boss:   { name: 'Fenrir',      color: '#ff8a3d', motif: 'wolf',   lore: 'Der Wolf, der Ragnarök bringt. Ketten halten ihn nicht mehr.' }
      },

      facts: [
        { id: 'horns', title: 'Hörner? Fehlanzeige!',
          text: 'Kein einziger Wikingerhelm mit Hörnern wurde je gefunden. Das Bild stammt aus dem 19. Jahrhundert – vor allem von Kostümen für Richard Wagners Opern.' },
        { id: 'ships', title: 'Langschiffe im Flachwasser',
          text: 'Langschiffe hatten nur etwa einen Meter Tiefgang. Damit konnten die Wikinger weit in Flüsse hineinfahren und Städte erreichen, die sich vor der See sicher wähnten.' },
        { id: 'vinland', title: 'Amerika vor Kolumbus',
          text: 'Um das Jahr 1000 erreichten Nordmänner Neufundland. Die Siedlungsreste von L’Anse aux Meadows belegen: Sie waren rund 500 Jahre vor Kolumbus in Amerika.' },
        { id: 'althing', title: 'Eines der ältesten Parlamente',
          text: 'Das isländische Althing wurde um 930 gegründet. Diese Volksversammlung gilt als eine der ältesten noch bestehenden parlamentarischen Einrichtungen der Welt.' },
        { id: 'word', title: 'Wikinger war ein Beruf',
          text: '„Wikinger“ bezeichnete ursprünglich keine Volksgruppe, sondern eine Tätigkeit: auf Fahrt gehen. Die meisten Nordleute waren Bauern, Händler und Handwerker.' },
        { id: 'trade', title: 'Handel bis Bagdad',
          text: 'In skandinavischen Gräbern wurden Zehntausende arabische Silbermünzen gefunden. Die Handelswege der Nordmänner reichten über russische Flüsse bis nach Zentralasien.' },
        { id: 'ulfberht', title: 'Die Ulfberht-Schwerter',
          text: 'Schwerter mit der Inschrift „+VLFBERH+T“ bestanden aus außergewöhnlich reinem Stahl. Gute Klingen waren so wertvoll, dass sie eigene Namen bekamen und vererbt wurden.' },
        { id: 'runes', title: 'Warum Runen so kantig sind',
          text: 'Runen wurden in Holz und Stein geritzt. Deshalb bestehen sie fast nur aus geraden Linien – runde Formen ließen sich der Holzmaserung entgegen kaum schneiden.' }
      ],

      questions: [
        { fact: 'horns', q: 'Was stimmt über Wikingerhelme?',
          answers: ['Sie hatten keine Hörner', 'Nur Anführer trugen Hörner', 'Die Hörner dienten als Trinkgefäß', 'Hörner zeigten die Zahl der Fahrten'], correct: 0 },
        { fact: 'horns', q: 'Woher stammt das Bild vom gehörnten Wikingerhelm?',
          answers: ['Aus Kostümen des 19. Jahrhunderts', 'Aus Grabfunden in Norwegen', 'Aus römischen Berichten', 'Aus isländischen Sagas'], correct: 0 },
        { fact: 'ships', q: 'Welchen Vorteil bot der geringe Tiefgang der Langschiffe?',
          answers: ['Sie konnten weit in Flüsse fahren', 'Sie waren im Sturm sicherer', 'Sie brauchten keine Ruder', 'Sie fuhren doppelt so schnell'], correct: 0 },
        { fact: 'vinland', q: 'Wann erreichten Nordmänner nachweislich Amerika?',
          answers: ['Um das Jahr 1000', 'Um 1400', 'Um 500', 'Erst nach Kolumbus'], correct: 0 },
        { fact: 'vinland', q: 'Wo liegt die bekannte Wikingersiedlung L’Anse aux Meadows?',
          answers: ['In Neufundland', 'In Grönland', 'In Irland', 'Auf Island'], correct: 0 },
        { fact: 'althing', q: 'Was ist das isländische Althing?',
          answers: ['Eine der ältesten Volksversammlungen', 'Ein heiliger Berg', 'Ein Handelsschiff', 'Ein Julfest'], correct: 0 },
        { fact: 'word', q: 'Was bedeutete das Wort „Wikinger“ ursprünglich?',
          answers: ['Eine Tätigkeit: auf Fahrt gehen', 'Ein Adelstitel', 'Einen Schiffstyp', 'Einen Priester Odins'], correct: 0 },
        { fact: 'trade', q: 'Welche Funde belegen die weiten Handelswege der Nordmänner?',
          answers: ['Arabische Silbermünzen', 'Chinesisches Porzellan', 'Römische Statuen', 'Ägyptische Papyri'], correct: 0 },
        { fact: 'ulfberht', q: 'Was zeichnete die Ulfberht-Schwerter aus?',
          answers: ['Außergewöhnlich reiner Stahl', 'Klingen aus Bronze', 'Eine doppelte Blutrinne', 'Griffe aus Walross-Elfenbein'], correct: 0 },
        { fact: 'runes', q: 'Warum bestehen Runen fast nur aus geraden Linien?',
          answers: ['Sie wurden in Holz und Stein geritzt', 'Sie ahmten Sternbilder nach', 'Runden galten als Unglück', 'Sie stammen von Zahlzeichen ab'], correct: 0 }
      ]
    },

    /* =====================================================
       RÖMER
       ===================================================== */
    roman: {
      key: 'roman',
      name: 'Römer',
      era: '753 v. Chr. – 476 n. Chr.',
      tagline: 'Disziplin, Technik und Torsionsgeschütze',
      desc: 'Drillmaschine. Höhere Feuergeschwindigkeit und günstigere Verbesserungen.',
      bonusText: '+15 % Feuertempo, Upgrades 12 % billiger',
      hero: {
        name: 'Marcus Valerius Corvus',
        title: 'Legat der IX. Legion',
        intro: 'Ein Legat, der lieber Gräben ausheben lässt als Reden hält. ' +
               'Als sich bei den Lemuria die Erde öffnete, war seine Legion die einzige, die nicht davonlief.',
        weapon: 'gladius',
        aura: { rate: 1.18, label: '+18 % Feuertempo für Türme in seiner Nähe' },
        power: {
          key: 'volley', name: 'Salve',
          desc: 'Gibt das Kommando: ein Bolzen auf jedes Ziel in Reichweite.',
          cooldown: 10, radius: 3.4, damage: 1.9, minTargets: 3,
          maxTargets: 8, color: '#ffd166'
        }
      },
      colors: { primary: '#c9a227', secondary: '#8c2f2f', stone: '#ddd6c4', trim: '#b03a3a' },
      bonus: { damage: 1.0, range: 1.0, rate: 1.15, status: 1.0, cost: 1.0, upgradeCost: 0.88 },

      towers: {
        rapid:  { name: 'Ballista',         desc: 'Torsionsgeschütz im Dauerfeuer.' },
        slow:   { name: 'Aquädukt-Fluter',  desc: 'Schwallwasser bremst die Reihen aus.' },
        splash: { name: 'Onager',           desc: 'Der „Wildesel“ tritt kräftig aus.' },
        chain:  { name: 'Jupiters Zorn',    desc: 'Der Blitz des Göttervaters sucht sich Ziele.' },
        sniper: { name: 'Scorpio',          desc: 'Präzisionsgeschütz der Legion.' },
        dot:    { name: 'Brandpech-Werfer', desc: 'Brennendes Pech frisst sich fest.' }
      },

      /* Gegner aus der römisch-griechischen Mythologie */
      enemies: {
        grunt:  { name: 'Lemur',        color: '#9fb0c9', motif: 'skull',  lore: 'Ruhelose Totengeister, die zu den Lemuria aus der Unterwelt steigen.' },
        runner: { name: 'Satyr',        color: '#d9b45a', motif: 'horns',  lore: 'Bocksbeinige Wesen – trunken, schnell und völlig unberechenbar.' },
        swarm:  { name: 'Schattenbrut', color: '#b39fd9', motif: 'wisp',   lore: 'Namenlose Schemen, die dem Zug der Toten folgen.' },
        flyer:  { name: 'Harpyie',      color: '#b08858', motif: 'beak',   lore: 'Halb Frau, halb Raubvogel. Sie raubt, was nicht festgebunden ist.' },
        tank:   { name: 'Minotaurus',   color: '#a3705a', motif: 'horns',  lore: 'Aus dem Labyrinth entkommen – und noch immer wütend.' },
        shield: { name: 'Bronzewächter',color: '#c9a86a', motif: 'halo',   lore: 'Ein Talos aus Erz, dem Pfeile nichts anhaben können.' },
        healer: { name: 'Nymphe',       color: '#7ee081', motif: 'hood',   lore: 'Quellgeist, dessen Wasser Wunden im Nu schließt.' },
        boss:   { name: 'Hydra',        color: '#5fbf7a', motif: 'hydra',  lore: 'Für jeden Kopf, den du nimmst, wachsen zwei nach.' }
      },

      facts: [
        { id: 'concrete', title: 'Beton, der unter Wasser härtet',
          text: 'Römischer Beton enthielt Vulkanasche (Puzzolan) und erhärtete sogar unter Wasser. Die Kuppel des Pantheons ist bis heute die größte unbewehrte Betonkuppel der Welt.' },
        { id: 'roads', title: 'Alle Wege führen nach Rom',
          text: 'Das Reich verfügte über rund 80.000 Kilometer befestigte Straßen. Meilensteine gaben die Entfernung an – gemessen wurde ab dem goldenen Meilenstein im Herzen Roms.' },
        { id: 'legion', title: 'Die Maultiere des Marius',
          text: 'Legionäre trugen 30 Kilogramm und mehr an Ausrüstung selbst. Wegen dieser Last spotteten Zeitgenossen über die „Maultiere des Marius“.' },
        { id: 'aqueduct', title: 'Wasser über Dutzende Kilometer',
          text: 'Aquädukte überwanden weite Strecken mit winzigem Gefälle – oft nur wenige Zentimeter pro Kilometer. Die Stadt Rom wurde von elf solcher Leitungen versorgt.' },
        { id: 'torsion', title: 'Wie Ballista und Onager schossen',
          text: 'Beide waren Torsionsgeschütze: Die Energie steckte in straff verdrillten Bündeln aus Tiersehnen oder Frauenhaar, nicht in einem gebogenen Bogen.' },
        { id: 'camp', title: 'Jede Nacht eine neue Festung',
          text: 'Auf dem Marsch errichtete eine Legion jeden Abend ein befestigtes Lager mit Graben, Wall und Palisade – nach immer demselben Grundriss.' },
        { id: 'testudo', title: 'Die Schildkröte',
          text: 'Bei der Testudo schlossen die Legionäre ihre Schilde nach vorn und über den Köpfen zu einem Panzer zusammen. Die Formation schützte vor Pfeilhagel beim Vorrücken.' },
        { id: 'limes', title: 'Der Limes',
          text: 'Der obergermanisch-raetische Limes war rund 550 Kilometer lang und mit Wachtürmen und Kastellen bestückt. Er diente vor allem der Überwachung von Grenzverkehr und Handel.' }
      ],

      questions: [
        { fact: 'concrete', q: 'Was machte römischen Beton so besonders?',
          answers: ['Er härtete sogar unter Wasser', 'Er war durchsichtig', 'Er blieb dauerhaft biegsam', 'Er wurde ohne Wasser angerührt'], correct: 0 },
        { fact: 'concrete', q: 'Welches Bauwerk trägt bis heute die größte unbewehrte Betonkuppel?',
          answers: ['Das Pantheon', 'Das Kolosseum', 'Die Engelsburg', 'Der Circus Maximus'], correct: 0 },
        { fact: 'roads', q: 'Wie viele Kilometer befestigte Straßen hatte das Römische Reich etwa?',
          answers: ['Rund 80.000 km', 'Rund 800 km', 'Rund 8.000 km', 'Rund 800.000 km'], correct: 0 },
        { fact: 'legion', q: 'Warum nannte man Legionäre „Maultiere des Marius“?',
          answers: ['Sie trugen ihre schwere Ausrüstung selbst', 'Sie ritten ausschließlich Maultiere', 'Sie versorgten die Lasttiere', 'Sie waren für ihren Starrsinn bekannt'], correct: 0 },
        { fact: 'aqueduct', q: 'Wie stark war das Gefälle römischer Aquädukte typischerweise?',
          answers: ['Nur wenige Zentimeter pro Kilometer', 'Etwa zehn Meter pro Kilometer', 'Rund 45 Grad', 'Sie verliefen exakt waagerecht'], correct: 0 },
        { fact: 'torsion', q: 'Worin steckte die Energie einer römischen Ballista?',
          answers: ['In verdrillten Sehnenbündeln', 'In einem Gegengewicht', 'In gespanntem Stahl', 'In heißem Dampf'], correct: 0 },
        { fact: 'camp', q: 'Was baute eine römische Legion auf dem Marsch jeden Abend?',
          answers: ['Ein befestigtes Lager mit Graben und Wall', 'Einen Tempel für Mars', 'Eine steinerne Brücke', 'Ein Amphitheater'], correct: 0 },
        { fact: 'testudo', q: 'Was war die Testudo?',
          answers: ['Eine Schildformation zum Schutz vor Pfeilen', 'Ein Rammbock', 'Ein Wachturm', 'Ein Feldzeichen'], correct: 0 },
        { fact: 'limes', q: 'Wie lang war der obergermanisch-raetische Limes ungefähr?',
          answers: ['Rund 550 km', 'Rund 50 km', 'Rund 5.000 km', 'Rund 150 km'], correct: 0 },
        { fact: 'roads', q: 'Wovon aus wurden die Entfernungen im Römischen Reich gemessen?',
          answers: ['Vom goldenen Meilenstein in Rom', 'Von der jeweiligen Provinzhauptstadt', 'Von der nächsten Legionsfestung', 'Von der Küste aus'], correct: 0 }
      ]
    },

    /* =====================================================
       ÄGYPTER
       ===================================================== */
    egyptian: {
      key: 'egyptian',
      name: 'Ägypter',
      era: 'ca. 3100 – 30 v. Chr.',
      tagline: 'Pyramiden, Hieroglyphen und die Kraft der Sonne',
      desc: 'Meister der Flüche. Verlangsamung und Gift wirken deutlich stärker – dafür ist alles etwas teurer.',
      bonusText: 'Verlangsamung und Gift +30 %, Bau 8 % teurer',
      hero: {
        name: 'Nefret-Iri',
        title: 'Priesterin des Ra',
        intro: 'Sie wacht über die Sonnenbarke, die jede Nacht durch die Unterwelt fährt. ' +
               'Diesmal ist die Schlange Apophis nicht satt geworden – und die Sonne ging zu spät auf.',
        weapon: 'staff',
        power: {
          key: 'sunbeam', name: 'Sonnenstrahl',
          desc: 'Bündelt das Licht des Ra zu einem Strahl, der alles auf seiner Bahn verbrennt.',
          cooldown: 12, damage: 3.4, minTargets: 2,
          width: 30, poison: 14, poisonDur: 4, color: '#ffd166'
        }
      },
      colors: { primary: '#e0b24a', secondary: '#2f7d84', stone: '#e8d3a0', trim: '#3b6ea5' },
      bonus: { damage: 1.0, range: 1.0, rate: 1.0, status: 1.30, cost: 1.08, upgradeCost: 1.0 },

      towers: {
        rapid:  { name: 'Bogen-Obelisk',       desc: 'Schützen auf steinernem Pfeiler.' },
        slow:   { name: 'Sandsturm-Säule',     desc: 'Wirbelnder Sand nimmt Sicht und Tempo.' },
        splash: { name: 'Skarabäus-Schleuder', desc: 'Ein Schwarm, der in der Menge zerplatzt.' },
        chain:  { name: 'Sonnenspiegel',       desc: 'Gebündeltes Sonnenlicht springt weiter.' },
        sniper: { name: 'Auge des Horus',      desc: 'Nichts entgeht dem wachenden Blick.' },
        dot:    { name: 'Skorpionschrein',     desc: 'Skorpiongift zersetzt auch dicke Panzer.' }
      },

      /* Gegner aus der ägyptischen Mythologie */
      enemies: {
        grunt:  { name: 'Mumie',        color: '#d9c9a0', motif: 'bandage', lore: 'Aus den Grabkammern gestiegen, die Binden noch am Leib.' },
        runner: { name: 'Schakal',      color: '#c98a4a', motif: 'ears',    lore: 'Anubis’ Boten. Sie wittern jede Beute im Dunkeln.' },
        swarm:  { name: 'Skarabäen',    color: '#5fbf9a', motif: 'scarab',  lore: 'Ein Teppich aus Käfern, der alles unter sich begräbt.' },
        flyer:  { name: 'Ba-Vogel',     color: '#5fa8d9', motif: 'beak',    lore: 'Die Seele der Toten, mit menschlichem Kopf auf Vogelleib.' },
        tank:   { name: 'Schabti-Koloss',color:'#c9b06a', motif: 'runes',   lore: 'Ein Dienerfigürchen, gewachsen zu steinerner Größe.' },
        shield: { name: 'Löwenwächter', color: '#e0a04a', motif: 'halo',    lore: 'Sechmets Kriegerin – ihr Zorn prallt an Pfeilen ab.' },
        healer: { name: 'Thot-Priester',color: '#7ee081', motif: 'hood',    lore: 'Er liest aus dem Totenbuch und hebt die Gefallenen empor.' },
        boss:   { name: 'Apophis',      color: '#ff5a3d', motif: 'serpent', lore: 'Die Schlange des Chaos, die allnächtlich die Sonnenbarke angreift.' }
      },

      facts: [
        { id: 'cheops', title: 'Rekordhalter über 3.800 Jahre',
          text: 'Die Cheops-Pyramide war ursprünglich rund 146 Meter hoch. Damit blieb sie über 3.800 Jahre lang das höchste Bauwerk der Welt – länger als jedes andere Gebäude der Geschichte.' },
        { id: 'workers', title: 'Keine Sklaven am Bau',
          text: 'Die Pyramiden wurden von bezahlten und versorgten Facharbeitern errichtet. Man fand ihre Siedlungen, Bäckereien und sogar ihre Gräber direkt neben der Baustelle.' },
        { id: 'rosetta', title: 'Der Schlüssel zu den Hieroglyphen',
          text: 'Mit Hilfe des Steins von Rosetta gelang Jean-François Champollion 1822 die Entzifferung der Hieroglyphen. Der Stein trägt denselben Text in drei Schriften.' },
        { id: 'nile', title: 'Das Jahr des Nils',
          text: 'Das ägyptische Jahr hatte drei Jahreszeiten: Achet (Überschwemmung), Peret (Aussaat) und Schemu (Ernte). Die Nilflut brachte fruchtbaren Schlamm auf die Felder.' },
        { id: 'mummy', title: 'Das Herz blieb drin',
          text: 'Die Mumifizierung dauerte rund 70 Tage. Das Gehirn wurde entfernt und verworfen – das Herz aber ließ man im Körper, denn es galt als Sitz von Verstand und Gefühl.' },
        { id: 'cleopatra', title: 'Kleopatra und die Mondlandung',
          text: 'Kleopatra VII. lebte zeitlich näher an der ersten Mondlandung als am Bau der Cheops-Pyramide. Zwischen Pyramide und Kleopatra liegen rund 2.500 Jahre.' },
        { id: 'calendar', title: 'Ein Kalender mit 365 Tagen',
          text: 'Die Ägypter rechneten mit zwölf Monaten zu je 30 Tagen und fügten am Jahresende fünf zusätzliche Tage an – zusammen 365. Ein Schalttag fehlte allerdings.' },
        { id: 'scarab', title: 'Der heilige Pillendreher',
          text: 'Der Skarabäus galt als Sinnbild der Wiedergeburt. Wie der Käfer seine Kugel rollt, so schiebe der Gott Chepri jeden Morgen die Sonne über den Horizont.' }
      ],

      questions: [
        { fact: 'cheops', q: 'Wie lange blieb die Cheops-Pyramide das höchste Bauwerk der Welt?',
          answers: ['Über 3.800 Jahre', 'Etwa 300 Jahre', 'Rund 1.000 Jahre', 'Bis heute'], correct: 0 },
        { fact: 'workers', q: 'Wer errichtete die Pyramiden?',
          answers: ['Bezahlte und versorgte Facharbeiter', 'Ausschließlich Kriegsgefangene', 'Priester im Ehrendienst', 'Bauern als Strafarbeit'], correct: 0 },
        { fact: 'rosetta', q: 'Wer entzifferte 1822 die Hieroglyphen?',
          answers: ['Jean-François Champollion', 'Howard Carter', 'Heinrich Schliemann', 'Napoleon Bonaparte'], correct: 0 },
        { fact: 'rosetta', q: 'Was macht den Stein von Rosetta so wertvoll?',
          answers: ['Er trägt denselben Text in drei Schriften', 'Er ist aus massivem Gold', 'Er zeigt eine Sternenkarte', 'Er nennt alle Pharaonen'], correct: 0 },
        { fact: 'nile', q: 'Wie hieß die Jahreszeit der Nilüberschwemmung?',
          answers: ['Achet', 'Peret', 'Schemu', 'Duat'], correct: 0 },
        { fact: 'mummy', q: 'Welches Organ ließ man bei der Mumifizierung im Körper?',
          answers: ['Das Herz', 'Das Gehirn', 'Die Lunge', 'Die Leber'], correct: 0 },
        { fact: 'mummy', q: 'Wie lange dauerte eine vollständige Mumifizierung?',
          answers: ['Rund 70 Tage', 'Etwa 7 Tage', 'Genau ein Jahr', 'Drei Monate'], correct: 0 },
        { fact: 'cleopatra', q: 'Was trifft auf Kleopatra VII. zeitlich zu?',
          answers: ['Sie lebte näher an der Mondlandung als am Pyramidenbau', 'Sie erlebte den Bau der Cheops-Pyramide', 'Sie regierte vor den ersten Hieroglyphen', 'Sie war die erste Pharaonin überhaupt'], correct: 0 },
        { fact: 'calendar', q: 'Wie war der ägyptische Kalender aufgebaut?',
          answers: ['12 Monate zu 30 Tagen plus 5 Zusatztage', '10 Monate zu 36 Tagen', '13 Monate zu 28 Tagen', '12 Monate mit Schalttag'], correct: 0 },
        { fact: 'scarab', q: 'Wofür stand der Skarabäus?',
          answers: ['Für Wiedergeburt und die aufgehende Sonne', 'Für Krieg und Eroberung', 'Für die Nilfischerei', 'Für den Handel mit Nubien'], correct: 0 }
      ]
    }
  };

  /* =====================================================
     JAPAN – verborgen, bis alle vier Feldzüge bestanden sind
     ===================================================== */
  TD.FACTIONS.japan = {
    key: 'japan',
    name: 'Samurai',
    era: 'Sengoku-Zeit, ca. 1467 – 1615',
    tagline: 'Stahl, Stille und die Nacht der hundert Dämonen',
    desc: 'Meister des ersten Schlags. Wer noch unverletzt ist, bekommt den härtesten Hieb.',
    bonusText: '+50 % Schaden gegen unverletzte Gegner',
    secret: true,
    colors: { primary: '#b03a4a', secondary: '#2f3b52', stone: '#d9d2c4', trim: '#e0b24a' },
    bonus: { damage: 1.0, range: 1.0, rate: 1.0, status: 1.0, cost: 1.0, upgradeCost: 1.0,
             firstStrike: 1.5 },

    hero: {
      name: 'Tomoe Gozen',
      title: 'Onna-musha',
      intro: 'Tomoe Gozen ritt an der Spitze, wo andere zurückblieben. Seit ihr Herr fiel, sucht sie ' +
             'den Tod, der ihrem Namen gerecht wird – und findet stattdessen ein Dorf, das sie braucht.',
      weapon: 'naginata',
      power: {
        key: 'threeCuts', name: 'Sanren-giri',
        desc: 'Drei Schnitte in einem Atemzug – rundum, und jede Wunde blutet nach.',
        cooldown: 11, radius: 2.6, damage: 1.5, minTargets: 3,
        cuts: 3, poison: 11, poisonDur: 3.5, color: '#ff6a7a'
      }
    },

    towers: {
      rapid:  { name: 'Yumi-Turm',       desc: 'Langbogenschützen auf hoher Plattform.' },
      slow:   { name: 'Nebelglocke',     desc: 'Ihr Klang lähmt, wer ihn hört.' },
      splash: { name: 'Ōzutsu',          desc: 'Standrohr mit grober Ladung. Nichts für Flieger.' },
      dot:    { name: 'Shinobi-Versteck',desc: 'Vergiftete Wurfsterne aus dem Dunkeln.' },
      chain:  { name: 'Raijin-Trommel',  desc: 'Der Donnergott schlägt, der Blitz springt weiter.' },
      sniper: { name: 'Teppō-Stand',     desc: 'Ein Schuss aus der Luntenmuskete, ein Ziel.' }
    },

    /* Gegner aus der japanischen Geisterwelt (Yōkai) */
    enemies: {
      grunt:  { name: 'Kappa',        color: '#5aa87a', motif: 'horns',   lore: 'Wassergeist mit einer Schale auf dem Kopf. Verschüttet sie, verliert er seine Kraft.' },
      runner: { name: 'Kitsune',      color: '#e0a04a', motif: 'ears',    lore: 'Fuchsgeist. Je mehr Schwänze, desto älter und listiger.' },
      swarm:  { name: 'Kodama',       color: '#c8e0d4', motif: 'wisp',    lore: 'Baumgeister. Ihr Klopfen im Wald gilt als gutes Zeichen – meistens.' },
      flyer:  { name: 'Tengu',        color: '#c9503a', motif: 'beak',    lore: 'Geflügelte Bergdämonen, unübertroffen im Schwertkampf.' },
      tank:   { name: 'Oni',          color: '#8f5a9a', motif: 'horns',   lore: 'Hörnerdämonen mit eiserner Keule. Bohnen sollen sie vertreiben.' },
      shield: { name: 'Komainu',      color: '#a8a094', motif: 'halo',    lore: 'Steinerne Löwenhunde, die Schreine bewachen – hier bewachen sie nichts Gutes.' },
      healer: { name: 'Yamabushi',    color: '#7ee081', motif: 'hood',    lore: 'Bergasket mit Zaubersprüchen, die Gefallene wieder auf die Beine bringen.' },
      boss:   { name: 'Yamata no Orochi', color:'#7a4ad9', motif:'hydra', lore: 'Die achtköpfige Schlange. Susanoo besiegte sie einst mit acht Fässern Reiswein.' }
    },

    facts: [
      { id: 'hyakki', title: 'Die Nachtparade',
        text: 'Hyakki Yagyō heißt „die Nachtparade der hundert Dämonen". In Sommernächten sollen die Yōkai gemeinsam durch die Straßen ziehen – wer ihnen begegnet, tut gut daran, sich zu verstecken.' },
      { id: 'tomoe', title: 'Tomoe Gozen',
        text: 'Das Heike-Monogatari beschreibt Tomoe Gozen als Kriegerin von außergewöhnlicher Stärke und Bogenkunst – „eine Kriegerin, die es mit tausend aufnahm".' },
      { id: 'katana', title: 'Wie ein Katana entsteht',
        text: 'Die Klinge wird aus Lagen unterschiedlich harten Stahls gefaltet. Der harte Schneidenstahl bleibt scharf, der weichere Kern verhindert, dass die Klinge bricht.' },
      { id: 'tanegashima', title: 'Die Luntenmuskete',
        text: '1543 brachten portugiesische Schiffbrüchige Feuerwaffen nach Tanegashima. Innerhalb weniger Jahrzehnte stellte Japan mehr davon her als jedes Land Europas.' },
      { id: 'castle', title: 'Japanische Burgen',
        text: 'Die geschwungenen Steinmauern sind so gefügt, dass sie Erdbeben standhalten. Der Holzbau darüber konnte brennen – die Mauer blieb.' },
      { id: 'onna', title: 'Onna-musha',
        text: 'Frauen des Kriegerstandes lernten den Umgang mit der Naginata, um Haus und Hof zu verteidigen. Grabfunde belegen, dass manche auch auf dem Schlachtfeld standen.' },
      { id: 'bushido', title: 'Der Weg des Kriegers',
        text: 'Was wir „Bushidō" nennen, wurde erst in der langen Friedenszeit der Edo-Periode als Lehre niedergeschrieben – da hatten die großen Schlachten längst aufgehört.' },
      { id: 'sakura', title: 'Die Kirschblüte',
        text: 'Die Kirschblüte gilt als Sinnbild des Lebens: strahlend schön und nach wenigen Tagen vorbei. Das Betrachten der Blüte hat einen eigenen Namen – Hanami.' }
    ],

    questions: [
      { fact: 'hyakki', q: 'Was bedeutet Hyakki Yagyō?', answers: ['Die Nachtparade der hundert Dämonen', 'Das Fest der tausend Lichter', 'Der Weg des Schwertes', 'Die Nacht der langen Messer'], correct: 0 },
      { fact: 'hyakki', q: 'Was sollte man laut Überlieferung tun, wenn die Yōkai ziehen?', answers: ['Sich verstecken', 'Ihnen Reis anbieten', 'Laut singen', 'Ihnen folgen'], correct: 0 },
      { fact: 'tomoe', q: 'In welchem Werk wird Tomoe Gozen beschrieben?', answers: ['Im Heike-Monogatari', 'Im Kojiki', 'Im Genji-Monogatari', 'Im Hagakure'], correct: 0 },
      { fact: 'tomoe', q: 'Wofür war Tomoe Gozen berühmt?', answers: ['Für ihre Stärke und Bogenkunst', 'Für ihre Dichtung', 'Für ihre Teezeremonie', 'Für ihre Heilkunst'], correct: 0 },
      { fact: 'katana', q: 'Warum wird der Stahl eines Katana gefaltet?', answers: ['Harte Schneide und weicher Kern in einer Klinge', 'Damit sie leichter wird', 'Für das Muster auf der Klinge allein', 'Um Eisen zu sparen'], correct: 0 },
      { fact: 'tanegashima', q: 'Wie kamen 1543 Feuerwaffen nach Japan?', answers: ['Durch portugiesische Schiffbrüchige', 'Über chinesische Händler', 'Durch niederländische Gesandte', 'Sie wurden in Japan erfunden'], correct: 0 },
      { fact: 'tanegashima', q: 'Was geschah nach der Einführung der Luntenmuskete?', answers: ['Japan stellte mehr davon her als jedes Land Europas', 'Sie wurde sofort verboten', 'Sie blieb eine Seltenheit', 'Sie ersetzte den Bogen nie'], correct: 0 },
      { fact: 'castle', q: 'Warum sind die Steinmauern japanischer Burgen geschwungen?', answers: ['Damit sie Erdbeben standhalten', 'Aus religiösen Gründen', 'Um Wasser abzuleiten', 'Damit Leitern abrutschen'], correct: 0 },
      { fact: 'onna', q: 'Welche Waffe lernten Frauen des Kriegerstandes?', answers: ['Die Naginata', 'Das Katana allein', 'Den Kriegsfächer', 'Die Muskete'], correct: 0 },
      { fact: 'bushido', q: 'Wann wurde der Bushidō als Lehre niedergeschrieben?', answers: ['In der Friedenszeit der Edo-Periode', 'Während der großen Schlachten', 'Im 12. Jahrhundert', 'Erst im 20. Jahrhundert'], correct: 0 },
      { fact: 'sakura', q: 'Wofür steht die Kirschblüte?', answers: ['Für die Schönheit und Kürze des Lebens', 'Für Reichtum', 'Für den Sieg im Kampf', 'Für die Ewigkeit'], correct: 0 },
      { fact: 'sakura', q: 'Wie heißt das Betrachten der Kirschblüte?', answers: ['Hanami', 'Kanji', 'Bonsai', 'Ikebana'], correct: 0 }
    ]
  };

  TD.FACTION_ORDER = ['medieval', 'viking', 'roman', 'egyptian'];

  /** Verborgene Völker – erst nach Abschluss aller Feldzüge spielbar. */
  TD.SECRET_FACTIONS = ['japan'];

  /** Alle Völker, die gerade zur Verfügung stehen. */
  TD.availableFactions = function () {
    var list = TD.FACTION_ORDER.slice();
    if (TD.campaign && TD.campaign.secretUnlocked()) {
      list = list.concat(TD.SECRET_FACTIONS);
    }
    return list;
  };

  /* -------------------------------------------------------
     Hilfsfunktionen
     ------------------------------------------------------- */
  TD.factions = {

    get: function (key) {
      return TD.FACTIONS[key] || TD.FACTIONS.medieval;
    },

    /** Anzeigename eines Turms in der gewählten Klasse. */
    towerName: function (factionKey, role) {
      return TD.factions.get(factionKey).towers[role].name;
    },

    towerDesc: function (factionKey, role) {
      return TD.factions.get(factionKey).towers[role].desc;
    },

    /**
     * Zieht eine Quizfrage, bevorzugt eine noch nicht gestellte.
     * Die Antworten werden gemischt zurückgegeben.
     * @param {string} factionKey
     * @param {string[]} askedIds bereits gestellte Fragen (Index als String)
     */
    drawQuestion: function (factionKey, askedIds) {
      var f = TD.factions.get(factionKey);
      var pool = [], i;
      for (i = 0; i < f.questions.length; i++) {
        if (askedIds.indexOf(String(i)) < 0) pool.push(i);
      }
      if (!pool.length) {                       // alle durch: von vorn
        for (i = 0; i < f.questions.length; i++) pool.push(i);
      }
      var idx = pool[Math.floor(Math.random() * pool.length)];
      var q = f.questions[idx];

      // Antworten mischen und merken, wo die richtige gelandet ist
      var opts = q.answers.map(function (text, i2) {
        return { text: text, right: i2 === q.correct };
      });
      for (var s = opts.length - 1; s > 0; s--) {
        var r = Math.floor(Math.random() * (s + 1));
        var tmp = opts[s]; opts[s] = opts[r]; opts[r] = tmp;
      }

      // Zugehörigen Hintergrundtext für die Auflösung suchen
      var fact = null;
      for (var k = 0; k < f.facts.length; k++) {
        if (f.facts[k].id === q.fact) { fact = f.facts[k]; break; }
      }

      return { id: String(idx), question: q.q, options: opts, fact: fact };
    }
  };
})(window);
