/* =========================================================
   lore.js – Zusätzliche Hintergründe und Truhenfragen

   Wird nach factions.js geladen und hängt die Inhalte an die
   dort angelegten Listen an. So bleibt factions.js schlank und
   neue Fragen lassen sich hier bündeln.
   ========================================================= */
(function (global) {
  'use strict';
  var TD = global.TD;

  var EXTRA = {

    /* =====================================================
       MITTELALTER
       ===================================================== */
    medieval: {
      facts: [
        { id: 'motte', title: 'Burgen aus Holz',
          text: 'Die ersten Burgen waren Motten: ein aufgeschütteter Erdhügel mit einem Holzturm darauf. Stein kam erst später – er war teuer und die Bauzeit dauerte Jahrzehnte.' },
        { id: 'plague', title: 'Der Schwarze Tod',
          text: 'Zwischen 1347 und 1353 starb schätzungsweise ein Drittel der Bevölkerung Europas an der Pest. Ganze Dörfer fielen wüst und wurden nie wieder besiedelt.' },
        { id: 'hanse', title: 'Die Hanse',
          text: 'Der Städtebund der Hanse beherrschte den Handel in Nord- und Ostsee. Er hatte keine Hauptstadt und kein Heer – nur Verträge, Kontore und die Drohung, den Handel zu sperren.' },
        { id: 'parchment', title: 'Ein Buch kostete eine Herde',
          text: 'Bücher wurden auf Pergament aus Tierhaut geschrieben. Für eine einzige umfangreiche Handschrift brauchte man die Häute von über hundert Tieren.' },
        { id: 'gothic', title: 'Warum gotische Kirchen so hell sind',
          text: 'Spitzbogen, Kreuzrippengewölbe und Strebepfeiler leiteten das Gewicht nach außen ab. Die Wände mussten nichts mehr tragen – deshalb konnten sie riesigen Fenstern weichen.' },
        { id: 'guild', title: 'Zünfte und das Meisterstück',
          text: 'Handwerker organisierten sich in Zünften. Wer Meister werden wollte, musste ein Meisterstück abliefern – und die Zunft bestimmte, wie viele Meister es überhaupt geben durfte.' },
        { id: 'mill', title: 'Die stärksten Maschinen des Mittelalters',
          text: 'Wasser- und Windmühlen waren die wichtigsten Kraftmaschinen. Sie mahlten nicht nur Korn, sondern trieben auch Sägen, Hammerwerke und Blasebälge an.' },
        { id: 'tourney', title: 'Turniere',
          text: 'Turniere waren Training und Schauspiel zugleich. Beim Buhurt kämpften ganze Gruppen, beim Tjost ritten zwei Reiter mit Lanzen gegeneinander an.' },
        { id: 'window', title: 'Kleine Fenster',
          text: 'Fensterglas war ein Luxusgut. Die meisten Öffnungen blieben klein und wurden mit Holzläden, geöltem Tuch oder dünn geschliffenem Horn verschlossen.' },
        { id: 'cathedral', title: 'Bauzeit über Generationen',
          text: 'Kalkmörtel brauchte Monate zum Aushärten. Große Kathedralen wurden über Jahrhunderte gebaut – kaum ein Baumeister erlebte die Vollendung seines Werks.' },
        { id: 'falcon', title: 'Falknerei',
          text: 'Die Jagd mit abgerichteten Greifvögeln galt als Vorrecht des Adels. Kaiser Friedrich II. schrieb darüber ein Fachbuch, das noch heute als erstaunlich genau gilt.' },
        { id: 'siegetime', title: 'Belagerungen dauerten',
          text: 'Die meisten Burgen fielen nicht durch Sturm, sondern durch Hunger, Durst oder Verrat. Eine Belagerung konnte sich über Monate hinziehen.' }
      ],
      questions: [
        { fact: 'motte', q: 'Woraus bestanden die ersten Burgen?',
          answers: ['Aus einem Erdhügel mit Holzturm', 'Aus massivem Granit', 'Aus gebrannten Ziegeln', 'Aus Beton nach römischem Vorbild'], correct: 0 },
        { fact: 'plague', q: 'Wie viele Menschen starben schätzungsweise am Schwarzen Tod?',
          answers: ['Etwa ein Drittel Europas', 'Etwa jeder Hundertste', 'Etwa drei Viertel Europas', 'Nur wenige Tausend'], correct: 0 },
        { fact: 'plague', q: 'In welchen Jahren wütete die große Pestwelle in Europa?',
          answers: ['1347 bis 1353', '1247 bis 1253', '1447 bis 1453', '1547 bis 1553'], correct: 0 },
        { fact: 'hanse', q: 'Womit setzte die Hanse ihre Interessen durch?',
          answers: ['Mit Handelssperren und Verträgen', 'Mit einem stehenden Heer', 'Mit einer eigenen Königskrone', 'Mit päpstlichen Bannflüchen'], correct: 0 },
        { fact: 'parchment', q: 'Woraus wurde Pergament hergestellt?',
          answers: ['Aus Tierhaut', 'Aus Papyrus', 'Aus Holzschliff', 'Aus Leinenfasern'], correct: 0 },
        { fact: 'gothic', q: 'Warum konnten gotische Kathedralen so große Fenster haben?',
          answers: ['Strebepfeiler trugen das Gewicht nach außen ab', 'Das Glas war besonders stabil', 'Die Mauern wurden dicker gebaut', 'Die Dächer waren aus Holz'], correct: 0 },
        { fact: 'guild', q: 'Was musste abliefern, wer Meister werden wollte?',
          answers: ['Ein Meisterstück', 'Eine Geldsumme an den König', 'Einen Eid auf den Bischof', 'Ein Jahr Kriegsdienst'], correct: 0 },
        { fact: 'mill', q: 'Wofür wurden Wassermühlen außer zum Mahlen genutzt?',
          answers: ['Für Sägen, Hammerwerke und Blasebälge', 'Zum Heizen der Burgen', 'Zum Pumpen von Trinkwasser in Türme', 'Ausschließlich zum Mahlen'], correct: 0 },
        { fact: 'tourney', q: 'Was war ein Tjost?',
          answers: ['Ein Lanzengang zweier Reiter', 'Ein Gruppenkampf zu Fuß', 'Ein Bogenschießwettbewerb', 'Ein Festmahl nach dem Turnier'], correct: 0 },
        { fact: 'window', q: 'Womit wurden Fenster meist verschlossen, wenn Glas zu teuer war?',
          answers: ['Mit Holzläden, geöltem Tuch oder Horn', 'Mit Eisengittern', 'Mit Lehmziegeln', 'Sie blieben immer offen'], correct: 0 },
        { fact: 'cathedral', q: 'Warum dauerte der Bau großer Kathedralen so lange?',
          answers: ['Der Kalkmörtel brauchte Monate zum Aushärten', 'Es fehlte an Steinen', 'Die Kirche verbot schnelles Bauen', 'Man baute nur im Winter'], correct: 0 },
        { fact: 'falcon', q: 'Wer schrieb ein berühmtes Fachbuch über die Falknerei?',
          answers: ['Kaiser Friedrich II.', 'Karl der Große', 'Richard Löwenherz', 'Papst Innozenz III.'], correct: 0 },
        { fact: 'siegetime', q: 'Woran scheiterten belagerte Burgen meist?',
          answers: ['An Hunger, Durst oder Verrat', 'An eingestürzten Mauern', 'An Bränden durch Blitzschlag', 'An Erdbeben'], correct: 0 },
        { fact: 'motte', q: 'Was bedeutet der Begriff „Motte“ im Burgenbau?',
          answers: ['Ein künstlich aufgeschütteter Burghügel', 'Ein Wachturm an der Mauer', 'Ein Vorratskeller', 'Ein Wassergraben'], correct: 0 },
        { fact: 'hanse', q: 'In welchem Raum beherrschte die Hanse den Handel?',
          answers: ['Nord- und Ostsee', 'Mittelmeer', 'Schwarzes Meer', 'Atlantik vor Afrika'], correct: 0 },
        { fact: 'gothic', q: 'Welches Bauelement gehört NICHT zur Gotik?',
          answers: ['Der Rundbogen', 'Der Spitzbogen', 'Das Kreuzrippengewölbe', 'Der Strebepfeiler'], correct: 0 },
        { fact: 'guild', q: 'Was regelten die Zünfte außerdem?',
          answers: ['Wie viele Meister es geben durfte', 'Die Höhe der Königssteuer', 'Den Bau von Burgen', 'Die Ernennung von Bischöfen'], correct: 0 },
        { fact: 'parchment', q: 'Wie viele Tierhäute brauchte eine große Handschrift ungefähr?',
          answers: ['Über hundert', 'Etwa fünf', 'Genau eine', 'Rund zwanzig'], correct: 0 },
        { fact: 'tourney', q: 'Wie hieß der Gruppenkampf beim Turnier?',
          answers: ['Buhurt', 'Tjost', 'Melée royale', 'Pas d’armes'], correct: 0 },
        { fact: 'mill', q: 'Was waren die stärksten Maschinen des Mittelalters?',
          answers: ['Wasser- und Windmühlen', 'Dampfmaschinen', 'Ochsengespanne', 'Tretkräne'], correct: 0 }
      ]
    },

    /* =====================================================
       WIKINGER
       ===================================================== */
    viking: {
      facts: [
        { id: 'clinker', title: 'Klinkerbauweise',
          text: 'Die Planken der Langschiffe überlappten sich wie Dachschindeln und wurden vernietet. Das machte die Rümpfe leicht und biegsam – sie arbeiteten im Seegang mit, statt zu brechen.' },
        { id: 'navigation', title: 'Navigation ohne Kompass',
          text: 'Die Nordleute segelten nach Sonnenstand, Sternen, Wellenrichtung und Vogelflug. Manche Schiffe führten Raben mit: Flog der Vogel nicht zurück, lag Land in seiner Richtung.' },
        { id: 'oseberg', title: 'Das Oseberg-Schiff',
          text: 'In Norwegen fand man ein komplettes Schiff als Grab für zwei Frauen, mit Schlitten, Wagen und Textilien. Der Lehmboden hatte das Holz über tausend Jahre konserviert.' },
        { id: 'futhark', title: 'Das Futhark',
          text: 'Das Runenalphabet heißt Futhark – nach seinen ersten sechs Zeichen, genau wie unser „Alphabet“ nach Alpha und Beta benannt ist.' },
        { id: 'women', title: 'Rechte der Frauen',
          text: 'Nordische Frauen konnten Land erben, Geschäfte führen und sich scheiden lassen. Verließ der Mann den Hof, führte die Frau ihn allein – Schlüsselbund inklusive.' },
        { id: 'cities', title: 'Städte, die sie gründeten',
          text: 'Dublin, York und Nowgorod gehen auf nordische Siedler zurück. York hieß bei ihnen Jorvik – der Name steckt bis heute im heutigen.' },
        { id: 'varangian', title: 'Die Warägergarde',
          text: 'In Konstantinopel bildeten Nordmänner die Leibwache des byzantinischen Kaisers. Der Dienst war so begehrt, dass Männer aus Skandinavien eigens dorthin reisten.' },
        { id: 'normandy', title: 'Die Normandie',
          text: 'Der Name Normandie kommt von den „Nordmännern“. 911 erhielt ihr Anführer Rollo das Gebiet als Lehen – seine Nachfahren eroberten 1066 England.' },
        { id: 'skald', title: 'Skalden und Kenningar',
          text: 'Skalden dichteten in kunstvollen Umschreibungen, den Kenningar. Das Meer hieß „Walstraße“, ein Schiff „Wellenross“, Gold „Feuer des Flusses“.' },
        { id: 'mead', title: 'Met',
          text: 'Met wird aus Honig vergoren. Weil Honig kostbar war, galt Met als Getränk für Feste und Eide – Bier trank man im Alltag.' },
        { id: 'ivory', title: 'Walross-Elfenbein',
          text: 'Bevor afrikanisches Elfenbein Europa erreichte, kam der begehrte Rohstoff aus dem Norden: Walrosszähne aus Grönland waren ein Vermögen wert.' },
        { id: 'thingstead', title: 'Das Thing im Ortsnamen',
          text: 'Das Thing tagte unter freiem Himmel an festen Plätzen. Viele Orte tragen die Erinnerung daran bis heute im Namen, etwa Thingvellir auf Island.' }
      ],
      questions: [
        { fact: 'clinker', q: 'Was zeichnet die Klinkerbauweise aus?',
          answers: ['Überlappende, vernietete Planken', 'Planken auf Stoß verleimt', 'Ein Rumpf aus einem Stück', 'Eine Außenhaut aus Leder'], correct: 0 },
        { fact: 'clinker', q: 'Welchen Vorteil hatte der biegsame Rumpf?',
          answers: ['Er arbeitete im Seegang mit, statt zu brechen', 'Er war unsinkbar', 'Er brauchte kein Segel', 'Er war feuerfest'], correct: 0 },
        { fact: 'navigation', q: 'Wozu führten manche Schiffe Raben mit?',
          answers: ['Um Land zu finden', 'Als Opfergabe für Odin', 'Zum Überbringen von Nachrichten', 'Als Proviant'], correct: 0 },
        { fact: 'oseberg', q: 'Was war am Oseberg-Fund besonders?',
          answers: ['Ein vollständiges Schiff als Frauengrab', 'Eine Truhe voller Goldmünzen', 'Ein steinerner Tempel', 'Eine Runenbibliothek'], correct: 0 },
        { fact: 'oseberg', q: 'Warum blieb das Oseberg-Schiff so gut erhalten?',
          answers: ['Der Lehmboden konservierte das Holz', 'Es lag in einer Eishöhle', 'Es war mit Pech versiegelt', 'Es wurde ständig gepflegt'], correct: 0 },
        { fact: 'futhark', q: 'Woher hat das Futhark seinen Namen?',
          answers: ['Von seinen ersten sechs Zeichen', 'Von einem Gott', 'Von seinem Erfinder', 'Von der Stadt, in der es entstand'], correct: 0 },
        { fact: 'women', q: 'Was durften nordische Frauen?',
          answers: ['Land erben und sich scheiden lassen', 'Nur mit Erlaubnis das Haus verlassen', 'Kein Eigentum besitzen', 'Nicht am Thing teilnehmen, nie'], correct: 0 },
        { fact: 'cities', q: 'Welche Stadt geht auf nordische Siedler zurück?',
          answers: ['Dublin', 'Paris', 'Köln', 'Wien'], correct: 0 },
        { fact: 'cities', q: 'Wie hieß York zur Zeit der Nordmänner?',
          answers: ['Jorvik', 'Nordvik', 'Yorvold', 'Eburak'], correct: 0 },
        { fact: 'varangian', q: 'Was war die Warägergarde?',
          answers: ['Die Leibwache des byzantinischen Kaisers', 'Eine Flotte in der Ostsee', 'Ein Handelsbund', 'Ein Priesterorden'], correct: 0 },
        { fact: 'normandy', q: 'Woher stammt der Name „Normandie“?',
          answers: ['Von den Nordmännern', 'Von einem römischen Feldherrn', 'Von einem Fluss', 'Von einer Heiligen'], correct: 0 },
        { fact: 'normandy', q: 'Wer erhielt 911 die spätere Normandie als Lehen?',
          answers: ['Rollo', 'Harald Blauzahn', 'Knut der Große', 'Erik der Rote'], correct: 0 },
        { fact: 'skald', q: 'Was ist eine Kenning?',
          answers: ['Eine dichterische Umschreibung', 'Ein Runenzauber', 'Ein Schiffstyp', 'Ein Rechtsspruch'], correct: 0 },
        { fact: 'skald', q: 'Was bezeichnete die Kenning „Wellenross“?',
          answers: ['Ein Schiff', 'Einen Wal', 'Das Meer', 'Einen Sturm'], correct: 0 },
        { fact: 'mead', q: 'Woraus wird Met hergestellt?',
          answers: ['Aus Honig', 'Aus Gerste', 'Aus Beeren', 'Aus Birkensaft'], correct: 0 },
        { fact: 'ivory', q: 'Welches Elfenbein handelten die Nordleute?',
          answers: ['Walrosszähne aus Grönland', 'Elefantenzähne aus Afrika', 'Mammutstoßzähne aus Sibirien', 'Narwalhörner aus Japan'], correct: 0 },
        { fact: 'thingstead', q: 'Wo tagte ein Thing?',
          answers: ['Unter freiem Himmel an festen Plätzen', 'In der Halle des Jarls', 'In einem Tempel', 'An Bord des größten Schiffes'], correct: 0 },
        { fact: 'navigation', q: 'Wonach richteten sich nordische Seefahrer?',
          answers: ['Sonnenstand, Sterne, Wellen und Vogelflug', 'Nach dem Magnetkompass', 'Nach Seekarten mit Gradnetz', 'Nach Leuchttürmen'], correct: 0 },
        { fact: 'women', q: 'Was trug eine nordische Hausherrin als Zeichen ihrer Stellung?',
          answers: ['Einen Schlüsselbund', 'Eine goldene Krone', 'Ein Schwert am Gürtel', 'Einen roten Umhang'], correct: 0 },
        { fact: 'futhark', q: 'Womit ist die Benennung des Futhark vergleichbar?',
          answers: ['Mit „Alphabet“ nach Alpha und Beta', 'Mit „Buchstabe“ nach Buche', 'Mit „Schrift“ nach schreiben', 'Mit „Kalender“ nach Kalendae'], correct: 0 }
      ]
    },

    /* =====================================================
       RÖMER
       ===================================================== */
    roman: {
      facts: [
        { id: 'hypocaust', title: 'Fußbodenheizung',
          text: 'In Thermen und Villen stand der Boden auf kleinen Pfeilern. Darunter zog heiße Luft aus einem Ofen hindurch und wärmte Böden und Wände – das Hypokaustum.' },
        { id: 'cloaca', title: 'Die Cloaca Maxima',
          text: 'Roms großer Abwasserkanal wurde schon in der Königszeit angelegt und ist teilweise bis heute in Betrieb. Er entwässerte das Forum, das ursprünglich Sumpfland war.' },
        { id: 'colosseum', title: 'Das Kolosseum',
          text: 'Rund 50.000 Zuschauer fanden Platz. Über den Rängen ließ sich ein riesiges Sonnensegel spannen, das Velarium – bedient von abkommandierten Matrosen.' },
        { id: 'calendar', title: 'Der julianische Kalender',
          text: 'Julius Caesar ließ 46 v. Chr. den Kalender reformieren: 365 Tage und alle vier Jahre ein Schalttag. Das Jahr der Umstellung hatte 445 Tage.' },
        { id: 'garum', title: 'Garum',
          text: 'Die Grundwürze der römischen Küche war Garum, eine Sauce aus vergorenem Fisch. Sie wurde in eigenen Fabriken hergestellt und über das ganze Reich verschifft.' },
        { id: 'citizenship', title: 'Bürgerrecht für alle',
          text: 'Kaiser Caracalla dehnte 212 n. Chr. das römische Bürgerrecht auf nahezu alle freien Reichsbewohner aus – auch, um mehr Steuerzahler zu erhalten.' },
        { id: 'roadlayers', title: 'Wie eine Römerstraße aufgebaut war',
          text: 'Eine Straße bestand aus mehreren Schichten: grobe Steine unten, dann Schotter, dann Sand oder Mörtel, obenauf die Pflasterdecke – leicht gewölbt, damit Wasser ablief.' },
        { id: 'pompeii', title: 'Pompeji',
          text: 'Der Ausbruch des Vesuv verschüttete 79 n. Chr. eine ganze Stadt unter Asche. Gerade dadurch blieben Häuser, Wandbilder und sogar Brotlaibe erhalten.' },
        { id: 'praetorian', title: 'Die Prätorianer',
          text: 'Die Leibwache des Kaisers wurde selbst zum Machtfaktor: Mehrmals entschied sie, wer Kaiser wurde – und einmal versteigerte sie den Thron sogar meistbietend.' },
        { id: 'aqueduct2', title: 'Aquädukte, meist unsichtbar',
          text: 'Die berühmten Bogenreihen machen nur einen kleinen Teil aus. Der weitaus größte Teil der Wasserleitungen verlief unterirdisch – geschützt vor Sonne und Feinden.' },
        { id: 'numerals', title: 'Rechnen ohne Null',
          text: 'Römische Zahlen kennen keine Null und keinen Stellenwert. Gerechnet wurde deshalb meist auf dem Abakus, nicht schriftlich.' },
        { id: 'cohort', title: 'Aufbau der Legion',
          text: 'Eine Legion bestand aus zehn Kohorten, jede aus mehreren Zenturien. Diese feste Gliederung machte sie beweglich – Teile konnten selbstständig handeln.' }
      ],
      questions: [
        { fact: 'hypocaust', q: 'Wie funktionierte ein Hypokaustum?',
          answers: ['Heiße Luft zog unter dem Boden hindurch', 'Warmes Wasser floss in Rohren', 'Heiße Steine lagen im Raum', 'Ein Ofen stand mitten im Zimmer'], correct: 0 },
        { fact: 'cloaca', q: 'Was war die Cloaca Maxima?',
          answers: ['Roms großer Abwasserkanal', 'Ein Triumphbogen', 'Ein Getreidespeicher', 'Der größte Tempel Roms'], correct: 0 },
        { fact: 'cloaca', q: 'Was war das Forum Romanum ursprünglich?',
          answers: ['Sumpfland', 'Ein Steinbruch', 'Ein Friedhof für Kaiser', 'Ein Hafenbecken'], correct: 0 },
        { fact: 'colosseum', q: 'Wie hieß das Sonnensegel des Kolosseums?',
          answers: ['Velarium', 'Podium', 'Vomitorium', 'Spolarium'], correct: 0 },
        { fact: 'colosseum', q: 'Wer bediente das Sonnensegel im Kolosseum?',
          answers: ['Abkommandierte Matrosen', 'Gladiatoren', 'Sklaven aus Ägypten', 'Die Prätorianer'], correct: 0 },
        { fact: 'calendar', q: 'Wer ließ 46 v. Chr. den Kalender reformieren?',
          answers: ['Julius Caesar', 'Augustus', 'Nero', 'Konstantin'], correct: 0 },
        { fact: 'calendar', q: 'Wie viele Tage hatte das Jahr der Kalenderumstellung?',
          answers: ['445', '365', '400', '380'], correct: 0 },
        { fact: 'garum', q: 'Was war Garum?',
          answers: ['Eine Sauce aus vergorenem Fisch', 'Ein Weizenbier', 'Ein Olivenöl höchster Güte', 'Ein Süßwein'], correct: 0 },
        { fact: 'citizenship', q: 'Wer dehnte 212 n. Chr. das Bürgerrecht auf fast alle Reichsbewohner aus?',
          answers: ['Caracalla', 'Trajan', 'Hadrian', 'Marc Aurel'], correct: 0 },
        { fact: 'roadlayers', q: 'Warum waren Römerstraßen leicht gewölbt?',
          answers: ['Damit Regenwasser ablaufen konnte', 'Damit Wagen langsamer fuhren', 'Aus religiösen Gründen', 'Damit sie höher wirkten'], correct: 0 },
        { fact: 'pompeii', q: 'Was verschüttete Pompeji im Jahr 79 n. Chr.?',
          answers: ['Asche des Vesuv', 'Eine Sturmflut', 'Ein Erdrutsch', 'Ein Sandsturm'], correct: 0 },
        { fact: 'pompeii', q: 'Warum ist Pompeji für die Forschung so wertvoll?',
          answers: ['Die Asche konservierte die ganze Stadt', 'Dort lagerte das Reichsarchiv', 'Es war die zweitgrößte Stadt des Reiches', 'Dort wurden Kaiser gekrönt'], correct: 0 },
        { fact: 'praetorian', q: 'Was taten die Prätorianer einmal mit dem Kaiserthron?',
          answers: ['Sie versteigerten ihn meistbietend', 'Sie schafften ihn ab', 'Sie verbrannten ihn', 'Sie verschenkten ihn an Gallien'], correct: 0 },
        { fact: 'aqueduct2', q: 'Wo verlief der größte Teil römischer Wasserleitungen?',
          answers: ['Unterirdisch', 'Auf Bogenreihen', 'In offenen Kanälen', 'In Bleirohren über der Straße'], correct: 0 },
        { fact: 'numerals', q: 'Was fehlt den römischen Zahlen?',
          answers: ['Die Null und der Stellenwert', 'Zeichen für große Zahlen', 'Zeichen für die Fünf', 'Eine Schreibrichtung'], correct: 0 },
        { fact: 'numerals', q: 'Womit rechneten die Römer deshalb meist?',
          answers: ['Mit dem Abakus', 'Mit Rechenschiebern', 'Im Kopf, ohne Hilfsmittel', 'Mit Knotenschnüren'], correct: 0 },
        { fact: 'cohort', q: 'Aus wie vielen Kohorten bestand eine Legion?',
          answers: ['Zehn', 'Drei', 'Fünfzig', 'Hundert'], correct: 0 },
        { fact: 'hypocaust', q: 'Wo fand man Hypokausten vor allem?',
          answers: ['In Thermen und Villen', 'In Getreidespeichern', 'In Bergwerken', 'In Schiffen'], correct: 0 },
        { fact: 'roadlayers', q: 'Was lag zuunterst in einer Römerstraße?',
          answers: ['Grobe Steine', 'Feiner Sand', 'Die Pflasterdecke', 'Eine Holzlage'], correct: 0 },
        { fact: 'garum', q: 'Wie wurde Garum vertrieben?',
          answers: ['In Fabriken hergestellt und verschifft', 'Nur in Rom selbst verkauft', 'Von Legionären mitgeführt', 'Als Tauschware mit Germanen'], correct: 0 }
      ]
    },

    /* =====================================================
       ÄGYPTER
       ===================================================== */
    egyptian: {
      facts: [
        { id: 'nileflow', title: 'Ein Fluss, der nach Norden fließt',
          text: 'Der Nil fließt von Süden nach Norden. Deshalb liegt Oberägypten im Süden und Unterägypten im Norden – für uns verkehrt herum.' },
        { id: 'canopic', title: 'Die Kanopenkrüge',
          text: 'Leber, Lunge, Magen und Därme wurden getrennt in vier Krügen bestattet. Ihre Deckel zeigten die Köpfe der vier Horussöhne, die sie bewachten.' },
        { id: 'hatshepsut', title: 'Hatschepsut',
          text: 'Eine der wenigen Frauen auf dem Pharaonenthron regierte rund zwanzig Jahre. In Bildern ließ sie sich mit Königsbart darstellen – dem Zeichen des Amtes, nicht des Geschlechts.' },
        { id: 'beer', title: 'Bezahlt in Brot und Bier',
          text: 'Bier und Brot waren Grundnahrung und zugleich Lohn. Die Arbeiter an den Königsgräbern erhielten feste Tagesrationen – Streiklisten darüber sind erhalten.' },
        { id: 'tutankhamun', title: 'Das Grab des Tutanchamun',
          text: 'Howard Carter fand 1922 ein nahezu unberührtes Königsgrab. Gerade weil Tutanchamun als unbedeutend galt, blieb sein Grab von Grabräubern verschont.' },
        { id: 'rhind', title: 'Rechnen am Nil',
          text: 'Der Papyrus Rhind zeigt Aufgaben zu Brüchen, Flächen und Volumen. Die Ägypter rechneten fast nur mit Stammbrüchen – also Brüchen mit der Eins im Zähler.' },
        { id: 'obelisk', title: 'Ein Obelisk aus einem Stück',
          text: 'Obelisken wurden aus einem einzigen Granitblock gehauen. In Assuan liegt ein unvollendetes Exemplar noch im Steinbruch – es wäre über tausend Tonnen schwer gewesen.' },
        { id: 'cats', title: 'Heilige Katzen',
          text: 'Katzen standen unter dem Schutz der Göttin Bastet. Man mumifizierte sie zu Hunderttausenden als Weihegaben – ganze Katzenfriedhöfe wurden gefunden.' },
        { id: 'sphinx', title: 'Die Sphinx von Gizeh',
          text: 'Löwenkörper, Menschenkopf, rund 20 Meter hoch – und aus dem gewachsenen Fels herausgehauen statt aufgemauert.' },
        { id: 'cartouche', title: 'Die Kartusche',
          text: 'Königsnamen wurden von einer ovalen Linie umrahmt, der Kartusche. Genau diese Rahmen halfen Champollion, die ersten Namen zu entziffern.' },
        { id: 'pharaohgod', title: 'Der Pharao als Gott',
          text: 'Der Pharao galt als lebende Verkörperung des Horus und als Bindeglied zwischen Göttern und Menschen. Sein Amt sollte die Weltordnung Maat sichern.' },
        { id: 'bookdead', title: 'Das Totenbuch',
          text: 'Kein einzelnes Buch, sondern eine Sammlung von Sprüchen für die Reise ins Jenseits. Man legte sie den Toten mit ins Grab – wer es sich leisten konnte, in reich bebilderter Fassung.' }
      ],
      questions: [
        { fact: 'nileflow', q: 'In welche Richtung fließt der Nil?',
          answers: ['Von Süden nach Norden', 'Von Norden nach Süden', 'Von Osten nach Westen', 'Er wechselt jährlich die Richtung'], correct: 0 },
        { fact: 'nileflow', q: 'Wo liegt Oberägypten?',
          answers: ['Im Süden', 'Im Norden', 'Im Osten am Roten Meer', 'In der Wüste im Westen'], correct: 0 },
        { fact: 'canopic', q: 'Was wurde in Kanopenkrügen aufbewahrt?',
          answers: ['Innere Organe', 'Schmuck des Verstorbenen', 'Getreide als Wegzehrung', 'Heiliges Nilwasser'], correct: 0 },
        { fact: 'canopic', q: 'Wessen Köpfe zeigten die Deckel der Kanopenkrüge?',
          answers: ['Der vier Horussöhne', 'Der Pharaonen', 'Von Anubis allein', 'Von heiligen Tieren des Nils'], correct: 0 },
        { fact: 'hatshepsut', q: 'Was ist über Hatschepsut bekannt?',
          answers: ['Sie war eine Frau auf dem Pharaonenthron', 'Sie war die Mutter von Tutanchamun', 'Sie erfand die Hieroglyphen', 'Sie ließ die Cheops-Pyramide bauen'], correct: 0 },
        { fact: 'hatshepsut', q: 'Warum trägt Hatschepsut auf Bildern einen Bart?',
          answers: ['Er war ein Zeichen des Königsamts', 'Um Feinde zu täuschen', 'Es war eine Laune des Künstlers', 'Er zeigte ihr hohes Alter'], correct: 0 },
        { fact: 'beer', q: 'Womit wurden die Arbeiter an den Königsgräbern bezahlt?',
          answers: ['Mit Brot und Bier', 'Mit Goldringen', 'Mit Land am Nil', 'Mit Silbermünzen'], correct: 0 },
        { fact: 'beer', q: 'Was ist von den Grabarbeitern überliefert?',
          answers: ['Listen über einen Streik', 'Ihre Gesangbücher', 'Ihre Bauzeichnungen der Pyramiden', 'Briefe an den Pharao'], correct: 0 },
        { fact: 'tutankhamun', q: 'Warum blieb Tutanchamuns Grab weitgehend unberührt?',
          answers: ['Er galt als unbedeutender König', 'Es war mit Fallen gesichert', 'Es lag unter Wasser', 'Priester bewachten es dauerhaft'], correct: 0 },
        { fact: 'tutankhamun', q: 'Wer entdeckte 1922 das Grab des Tutanchamun?',
          answers: ['Howard Carter', 'Jean-François Champollion', 'Heinrich Schliemann', 'Flinders Petrie'], correct: 0 },
        { fact: 'rhind', q: 'Womit rechneten die Ägypter fast ausschließlich?',
          answers: ['Mit Stammbrüchen', 'Mit Dezimalzahlen', 'Mit negativen Zahlen', 'Mit Prozentwerten'], correct: 0 },
        { fact: 'obelisk', q: 'Woraus besteht ein Obelisk?',
          answers: ['Aus einem einzigen Steinblock', 'Aus aufeinandergesetzten Quadern', 'Aus Lehmziegeln mit Steinmantel', 'Aus Holz mit Goldblech'], correct: 0 },
        { fact: 'obelisk', q: 'Was liegt in Assuan noch im Steinbruch?',
          answers: ['Ein unvollendeter Obelisk', 'Eine unfertige Sphinx', 'Ein Sarkophag aus Gold', 'Der Grundstein einer Pyramide'], correct: 0 },
        { fact: 'cats', q: 'Welche Göttin schützte die Katzen?',
          answers: ['Bastet', 'Isis', 'Hathor', 'Nut'], correct: 0 },
        { fact: 'cats', q: 'Was fand man in ägyptischen Ausgrabungen zu Katzen?',
          answers: ['Ganze Katzenfriedhöfe mit Mumien', 'Verbote der Katzenhaltung', 'Katzen nur in Königsgräbern', 'Keinerlei Spuren'], correct: 0 },
        { fact: 'sphinx', q: 'Wie wurde die Sphinx von Gizeh hergestellt?',
          answers: ['Aus dem gewachsenen Fels gehauen', 'Aus Blöcken aufgemauert', 'Aus Lehm geformt', 'Aus Sandstein gegossen'], correct: 0 },
        { fact: 'cartouche', q: 'Was ist eine Kartusche?',
          answers: ['Ein ovaler Rahmen um Königsnamen', 'Ein Tonkrug für Papyrus', 'Ein Grabmal für Beamte', 'Ein Maß für Getreide'], correct: 0 },
        { fact: 'cartouche', q: 'Wobei halfen die Kartuschen bei der Entzifferung?',
          answers: ['Sie hoben Königsnamen hervor', 'Sie enthielten ein Alphabet', 'Sie nannten das Datum', 'Sie zeigten die Leserichtung'], correct: 0 },
        { fact: 'pharaohgod', q: 'Als Verkörperung welchen Gottes galt der Pharao?',
          answers: ['Des Horus', 'Des Osiris', 'Des Seth', 'Des Thot'], correct: 0 },
        { fact: 'bookdead', q: 'Was ist das ägyptische Totenbuch?',
          answers: ['Eine Sammlung von Sprüchen fürs Jenseits', 'Ein Verzeichnis aller Verstorbenen', 'Das Gesetzbuch des Pharaos', 'Eine Chronik der Könige'], correct: 0 }
      ]
    }
  };

  /* Inhalte an die Listen der jeweiligen Klasse anhängen */
  Object.keys(EXTRA).forEach(function (key) {
    var f = TD.FACTIONS[key];
    if (!f) return;
    f.facts = f.facts.concat(EXTRA[key].facts);
    f.questions = f.questions.concat(EXTRA[key].questions);
  });
})(window);
