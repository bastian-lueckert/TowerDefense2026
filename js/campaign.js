/* =========================================================
   campaign.js – Feldzüge der vier Völker

   Jedes Volk hat 14 Level mit durchgehender Geschichte, die
   sich an seiner Mythologie entlanghangelt. Die Kennwerte
   (Leben, Gold, Gegnerstärke) berechnet levelFor() aus der
   Levelnummer – so bleibt die Kurve über alle Völker gleich.
   ========================================================= */
(function (global) {
  'use strict';
  var TD = global.TD, U = TD.utils;

  var COUNT = 14;                 // Level je Volk
  var HERO_FROM = 3;              // ab hier steht die Hauptfigur selbst im Feld
  var HERO_AWAKENED = 11;         // nach der Wende ihrer Geschichte

  /* -------------------------------------------------------
     Erzählstränge
     'you' = Erzähler, 'hero' = die Hauptfigur spricht
     ------------------------------------------------------- */
  var STORY = {

    medieval: {
      title: 'Der Wurm unter dem Rabenstein',
      subtitle: 'Ein Feldzug in vierzehn Nächten',
      /* Bildbausteine je Kapitel – siehe scenes.js */
      scenes: [
        { sky:'day',    far:'forest',    structure:'castle',    ground:'grass', actor:'horde',  actorN:10 },
        { sky:'night',  far:'forest',    structure:'castle',    ground:'marsh', actor:'wisps',  weather:null },
        { sky:'dusk',   far:'hills',     structure:'camp',      ground:'grass', actor:'horde',  actorN:18 },
        { sky:'storm',  far:'forest',    structure:'ruin',      ground:'marsh', actor:'horde',  actorN:8, weather:'rain' },
        { sky:'storm',  far:'mountains', structure:'ruin',      ground:'stone', actor:'giant',  actorS:0.8 },
        { sky:'day',    far:'mountains', structure:'castle',    ground:'grass', actor:'dragon', actorS:0.75, actorY:16 },
        { sky:'night',  far:'hills',     structure:'ruin',      ground:'grass', actor:'horde',  actorN:16 },
        { sky:'dusk',   far:'hills',     structure:'castle',    ground:'grass', actor:'horde',  actorN:24, weather:'sparks' },
        { sky:'night',  far:'mountains', structure:'camp',      ground:'grass', actor:'wisps',  weather:'sparks' },
        { sky:'blood',  far:'mountains', structure:'ruin',      ground:'ash',   actor:'dragon', actorS:0.95, weather:'ash' },
        { sky:'storm',  far:'peaks',     structure:'ruin',      ground:'stone', actor:null,     weather:'rain' },
        { sky:'blood',  far:'volcano',   structure:'ruin',      ground:'ash',   actor:'horde',  actorN:12, weather:'ash' },
        { sky:'storm',  far:'peaks',     structure:null,        ground:'stone', actor:'birds',  weather:'rain' },
        { sky:'blood',  far:'volcano',   structure:'ruin',      ground:'ash',   actor:'dragon', actorS:1.5, actorY:22, weather:'sparks' }
      ],

      levels: [
        { title: 'Grünes Gezücht', map: 'meadow',
          text: 'Seit Tagen verschwinden Schafe. Heute Nacht kommen die Diebe selbst: kleine, grinsende Gestalten aus dem Unterholz.',
          hero: 'Kobolde. Lästig, aber kein Grund, die Glocke zu läuten. Stellt zwei Türme an den Waldweg.' },

        { title: 'Lichter im Moor', map: 'meadow',
          text: 'Ein Bote sollte Hilfe holen. Man fand nur seine Laterne – zwanzig Schritt neben dem Pfad, tief im Schlamm.',
          hero: 'Die Irrlichter locken sie vom Weg ab. Wer ihnen folgt, kommt nicht wieder.' },

        { title: 'Die Rattenflut', map: 'canyon',
          text: 'Erst kommen die Ratten, sagt man, dann die Pest. Die Kornkammern sind bereits leer gefressen.',
          hero: 'Sie laufen vor etwas davon. Das beunruhigt mich mehr als die Ratten selbst.' },

        { title: 'Die Moorhexe', map: 'canyon',
          text: 'Zwischen den Kobolden geht eine gebeugte Gestalt. Wo sie die Hand hebt, richten sich Gefallene wieder auf.',
          hero: 'Nehmt zuerst die Alte. Alles andere ist verschwendete Mühe.' },

        { title: 'Wachende Steine', map: 'frost',
          text: 'In der Nacht lösen sich Quader aus der alten Ringmauer und beginnen zu gehen. Jemand hat sie geweckt.',
          hero: 'Das ist keine Hexerei aus dem Moor. Das ist Alchemie – und die kostet Gold. Wer bezahlt sie?',
          heroNote: 'Adelheid steigt selbst auf die Mauer. Sie will nicht länger nur befehlen.' },

        { title: 'Schatten über der Feste', map: 'frost',
          text: 'Am Mittag verdunkelt sich der Hof. Was über die Mauer streicht, hat zwei Beine und zwei Schwingen.',
          hero: 'Eine Wyvern. Der kleine Vetter. Wenn die schon hier ist, ist der Große nicht weit.' },

        { title: 'Der Orden steht auf', map: 'ruins',
          text: 'Auf dem Friedhof der Ordensritter ist die Erde aufgeworfen. Die Grabplatten liegen von innen aufgestoßen.',
          hero: 'Ich habe unter diesen Wappen gedient. Jetzt schieße ich darauf. Verzeiht mir.',
          heroNote: 'Unter den Toten erkennt sie ein Wappen, das sie kennt: das ihres Vaters Bruder.' },

        { title: 'Belagerung', map: 'ruins',
          text: 'Sie kommen nicht mehr einzeln. Vom Wald bis zum Graben steht alles voll.',
          hero: 'Die Mauer hält. Sie muss halten. Rückt die Kessel nach vorn!' },

        { title: 'Der Hexenzirkel', map: 'meadow',
          text: 'Dreizehn Feuer brennen auf dem Hügel. In ihrer Mitte liegt eine Karte des Berges – mit einem roten Kreis.',
          hero: 'Sie beten ihn nicht an. Sie wecken ihn. Und der Kreis liegt genau unter meiner Burg.' },

        { title: 'Der Jungdrache', map: 'canyon', boss: true,
          text: 'Aus dem Stollen bricht etwas hervor, das noch nicht ausgewachsen ist – und trotzdem größer als ein Ochsenkarren.',
          hero: 'Wenn das die Brut ist … dann will ich die Mutter lieber nicht sehen.',
          outro: 'Der Jungdrache liegt. In seinem Magen findet ihr geschmolzenes Kettenhemd – ' +
                 'und einen Siegelring. Adelheid erkennt ihn sofort. Es ist der ihres Vaters.' },

        { title: 'Was der Vater tat', map: 'frost',
          text: 'In der Kammer unter der Kapelle stehen Tiegel, Bücher, ein Plan des Stollens. Die Handschrift ist die ihres Vaters.',
          hero: 'Er hat nicht gejagt. Er hat gegraben. Er wollte das Gold des Wurms – und hat ihn dabei geweckt.',
          heroNote: 'Sie hat die Feste gehalten, weil er sie ihr anvertraut hat. Jetzt weiß sie: Er hat all das verschuldet.' },

        { title: 'Das Nest', map: 'ruins',
          text: 'Zwischen den Knochen liegen Schalen, so groß wie Schilde. Die meisten sind aufgebrochen. Von innen.',
          hero: 'Ich habe sein Werk verteidigt und es Pflicht genannt. Ab heute verteidige ich die Leute im Tal.',
          heroNote: 'Adelheid lässt das Banner ihres Vaters einholen und ein neues hissen.' },

        { title: 'Der Aufstieg', map: 'frost',
          text: 'Der letzte Pfad windet sich am Abgrund entlang. Über euch kreisen die Schwingen, unter euch wartet nichts.',
          hero: 'Kein Rückzug mehr. Ab hier gibt es nur noch oben.' },

        { title: 'Der Wurm', map: 'ruins', boss: true, finale: true,
          text: 'Er hebt den Kopf, und der halbe Berg bewegt sich mit. Zwischen seinen Zähnen hängt ein Banner mit eurem Wappen.',
          hero: 'Mein Vater hat dich geweckt. Ich bringe dich zurück ins Dunkel – und ich tue es für sie, nicht für ihn.',
          outro: 'Der Wurm ist tot. Adelheid lässt den Stollen zumauern und das Gold darin liegen, ' +
                 'wo es liegt. Vor der Mauer steht fortan eine Wache – und über dem Tor ein Banner, ' +
                 'das nicht mehr das ihres Vaters ist, sondern ihres.' }
      ]
    },

    viking: {
      title: 'Fimbulwinter',
      subtitle: 'Drei Winter ohne Sommer',
      scenes: [
        { sky:'storm',  far:'fjord',     structure:'longhouse', ground:'snow',  actor:'horde',  actorN:9,  weather:'snow' },
        { sky:'night',  far:'hills',     structure:'ruin',      ground:'snow',  actor:'horde',  actorN:14, weather:'snow' },
        { sky:'aurora', far:'forest',    structure:'longhouse', ground:'snow',  actor:'wolf',   actorS:0.8 },
        { sky:'storm',  far:'fjord',     structure:'longhouse', ground:'snow',  actor:'birds',  weather:'snow' },
        { sky:'aurora', far:'mountains', structure:'camp',      ground:'snow',  actor:'wisps' },
        { sky:'storm',  far:'peaks',     structure:'ruin',      ground:'stone', actor:'giant',  actorS:1.1 },
        { sky:'storm',  far:'fjord',     structure:'longhouse', ground:'snow',  actor:'birds',  weather:'rain' },
        { sky:'night',  far:'peaks',     structure:'ruin',      ground:'snow',  actor:'giant',  actorS:0.9, weather:'snow' },
        { sky:'aurora', far:'mountains', structure:'gate',      ground:'snow',  actor:null,     gateGlow:'#4fd9a0' },
        { sky:'blood',  far:'forest',    structure:'longhouse', ground:'snow',  actor:'wolf',   actorS:1.3, weather:'sparks' },
        { sky:'storm',  far:'peaks',     structure:null,        ground:'snow',  actor:'horde',  actorN:16, weather:'snow' },
        { sky:'night',  far:'peaks',     structure:'gate',      ground:'stone', actor:'horde',  actorN:12, gateGlow:'#7a4ad9' },
        { sky:'blood',  far:'volcano',   structure:'ruin',      ground:'ash',   actor:'horde',  actorN:22, weather:'ash' },
        { sky:'blood',  far:'peaks',     structure:null,        ground:'snow',  actor:'wolf',   actorS:1.9, actorX:78, weather:'sparks' }
      ],

      levels: [
        { title: 'Der Sommer bleibt aus', map: 'frost',
          text: 'Der Schnee liegt noch, obwohl längst gesät sein müsste. Vom Fjord her kommen die ersten Gestalten über das Eis.',
          hero: 'Ein Winter ohne Sommer. Die Völva hat es gesagt, und ich habe gelacht. Jetzt lache ich nicht mehr.' },

        { title: 'Die Grabhügel öffnen sich', map: 'frost',
          text: 'Auf dem Hügelfeld der Ahnen ist der Boden aufgebrochen. Was heraussteigt, trägt noch die Waffen von damals.',
          hero: 'Draugr. Sie waren unsere Väter. Behandelt sie mit Respekt – und dann macht sie nieder.' },

        { title: 'Warge im Wald', map: 'meadow',
          text: 'Wölfe, so hoch wie ein Reiter. Sie jagen nicht aus Hunger. Sie jagen, weil jemand sie geschickt hat.',
          hero: 'Fenrirs Wurf. Der Alte selbst liegt noch in Ketten. Noch.' },

        { title: 'Rabenzeichen', map: 'meadow',
          text: 'Die Raben sammeln sich über dem Langhaus, Hunderte. Sie warten nicht auf Aas. Sie warten auf euch.',
          hero: 'Odins Vögel künden vom Fall. Nur sagen sie nie, von wessen.' },

        { title: 'Was die Völva sah', map: 'canyon',
          text: 'Die Seherin sitzt drei Tage reglos. Dann sagt sie: „Die Brücke brennt. Und die Schildmaid fällt vor dem Wolf."',
          hero: 'Sie hat noch nie geirrt. Genau das macht mir Sorge.',
          heroNote: 'Von hier an kämpft Sigrún nicht nur gegen den Winter, sondern gegen ihr eigenes Ende.' },

        { title: 'Riesen steigen herab', map: 'canyon',
          text: 'Die Berge im Osten bewegen sich. Erst beim dritten Blick erkennt ihr: Das sind keine Berge.',
          hero: 'Jötnar. Zielt auf die Knie. Alles andere erreicht ihr ohnehin nicht.' },

        { title: 'Sturm über dem Fjord', map: 'ruins',
          text: 'Der Nordwind kommt nicht vom Wetter. Er kommt von Flügeln, so breit wie ein Segel.',
          hero: 'Hræsvelgrs Brut. Haltet die Bogenschützen bereit – am Boden nützt euch keiner davon.' },

        { title: 'Das Eis kommt', map: 'ruins',
          text: 'Wo die Reifriesen gehen, gefriert der Atem in der Luft. Selbst euer Feuer wird kleiner.',
          hero: 'Hrimthursen. Frost gegen Frost bringt nichts – nehmt Feuer, nehmt Gift, nehmt alles Heiße.' },

        { title: 'Bifröst', map: 'frost',
          text: 'Am Horizont steht die Regenbogenbrücke in Flammen. Heimdalls Horn hat man bis hierher gehört.',
          hero: 'Wenn Bifröst brennt, ist es kein Vorzeichen mehr. Dann ist es soweit.' },

        { title: 'Der große Warg', map: 'meadow', boss: true,
          text: 'Aus dem brennenden Wald tritt ein Wolf, dem die Bäume nur bis zur Schulter reichen.',
          hero: 'Nicht der Vater. Nur ein Sohn. Und ich stehe noch.',
          outro: 'Der Warg fällt – und Sigrún mit ihm, blutend im Schnee. Sie steht wieder auf. ' +
                 'Zum ersten Mal zweifelt sie an der Weissagung: Vor diesem Wolf ist sie nicht gefallen.' },

        { title: 'Der Weg nach Jötunheim', map: 'canyon',
          text: 'Jenseits des Eisfelds beginnt Land, das keine Karte kennt. Der Boden hier ist warm.',
          hero: 'Die Völva sagte, ich falle vor dem Wolf. Sie sagte nicht, vor welchem – und nicht, dass ich liegen bleibe.',
          heroNote: 'Sigrún hört auf, ihr Ende zu fürchten, und fängt an, es zu bestreiten.' },

        { title: 'Das Tor', map: 'ruins',
          text: 'Zwei Pfeiler aus schwarzem Stein, dazwischen nichts als Wind. Und aus dem Nichts tritt eine Reihe nach der anderen.',
          hero: 'Verschließen können wir es nicht. Also verstopfen wir es.' },

        { title: 'Ragnarök', map: 'frost',
          text: 'Der Himmel reißt. Was jetzt kommt, kommt alles auf einmal.',
          hero: 'Es heißt, die Götter fallen an diesem Tag. Von uns hat nie jemand etwas gesagt.' },

        { title: 'Fenrir', map: 'canyon', boss: true, finale: true,
          text: 'Die Kette Gleipnir liegt zerrissen im Schnee. Er ist frei. Und er hat euch gesehen.',
          hero: 'Eine Weissagung ist kein Urteil. Sie ist eine Warnung – und Warnungen kann man beherzigen.',
          outro: 'Fenrir liegt. Sigrún steht. Die Völva senkt den Kopf: „Ich sah dich fallen." – ' +
                 '„Das tat ich", sagt Sigrún. „Zweimal. Aufstehen hast du nicht gesehen." ' +
                 'Der Schnee schmilzt zum ersten Mal seit drei Wintern.' }
      ]
    },

    roman: {
      title: 'Die Lemuria',
      subtitle: 'Als sich die Erde unter der IX. Legion öffnete',
      scenes: [
        { sky:'dusk',   far:'hills',     structure:'camp',    ground:'grass', actor:'wisps' },
        { sky:'night',  far:'hills',     structure:'temple',  ground:'stone', actor:'wisps',  weather:null },
        { sky:'day',    far:'hills',     structure:'camp',    ground:'grass', actor:'horde',  actorN:16 },
        { sky:'day',    far:'mountains', structure:'temple',  ground:'grass', actor:'birds' },
        { sky:'storm',  far:'mountains', structure:'ruin',    ground:'stone', actor:'giant',  actorS:0.85 },
        { sky:'dusk',   far:'hills',     structure:'temple',  ground:'stone', actor:'horde',  actorN:10 },
        { sky:'day',    far:'forest',    structure:'temple',  ground:'marsh', actor:'wisps' },
        { sky:'dusk',   far:'hills',     structure:'camp',    ground:'stone', actor:'horde',  actorN:20 },
        { sky:'night',  far:'mountains', structure:'gate',    ground:'stone', actor:null,     gateGlow:'#5a3a8a' },
        { sky:'blood',  far:'volcano',   structure:'gate',    ground:'ash',   actor:'wolf',   actorS:1.2, weather:'sparks' },
        { sky:'night',  far:'hills',     structure:null,      ground:'stone', actor:'wisps',  weather:null },
        { sky:'storm',  far:'peaks',     structure:'ruin',    ground:'ash',   actor:'horde',  actorN:24, weather:'ash' },
        { sky:'blood',  far:'hills',     structure:'camp',    ground:'ash',   actor:'horde',  actorN:18, weather:'ash' },
        { sky:'blood',  far:'volcano',   structure:'ruin',    ground:'marsh', actor:'serpent', actorS:1.2, weather:'sparks' }
      ],

      levels: [
        { title: 'Unruhe im Lager', map: 'ruins',
          text: 'In der Nacht der Lemuria wirft man Bohnen über die Schulter, um die Toten zu besänftigen. Diesmal hat es nicht gereicht.',
          hero: 'Wachablösung verdoppeln. Und schafft mir jemanden her, der weiß, was da unten liegt.' },

        { title: 'Die Toten steigen auf', map: 'ruins',
          text: 'Aus den Rissen im Boden quillt kalter Nebel. Darin bewegen sich Schemen, die einmal Menschen waren.',
          hero: 'Lemuren. Sie wollen zurück ins Licht. Wir lassen sie nicht durch.' },

        { title: 'Trunkene Wut', map: 'meadow',
          text: 'Die Vorratswagen sind aufgebrochen, der Wein ist fort. Zwischen den Fässern tanzt etwas mit Bocksbeinen.',
          hero: 'Satyrn. Schnell, laut und völlig unberechenbar. Haltet die Linie geschlossen.' },

        { title: 'Krallen von oben', map: 'meadow',
          text: 'Den Kurieren werden die Depeschen aus der Hand gerissen – zwanzig Fuß über dem Boden.',
          hero: 'Harpyien. Was fliegt, erreicht kein Onager. Denkt daran, bevor ihr baut.' },

        { title: 'Das Labyrinth', map: 'canyon',
          text: 'Unter dem alten Gutshof liegt ein Gang, den niemand gebaut haben will. Aus ihm kommt Schnauben.',
          hero: 'Wenn das ist, was ich glaube, dann ist es seit tausend Jahren wütend.' },

        { title: 'Erz, das geht', map: 'canyon',
          text: 'Die Bronzestatuen am Forum stehen nicht mehr, wo sie standen. Ihre Fußabdrücke stehen im Pflaster.',
          hero: 'Talos-Wächter. Pfeile prallen ab – nehmt Wucht, nehmt Gift, nehmt Verstand.' },

        { title: 'Die vergiftete Quelle', map: 'frost',
          text: 'Am Quellheiligtum singt jemand. Wer verwundet in dieses Wasser fällt, steht geheilt wieder auf.',
          hero: 'Die Nymphe zuerst. Sonst kämpfen wir bis in alle Ewigkeit gegen dieselben Gegner.' },

        { title: 'Der Befehl aus Rom', map: 'frost',
          text: 'Ein Reiter bringt eine versiegelte Tafel: Die Neunte soll sich zurückziehen und dem Senat Bericht erstatten. ' +
                'Die Dörfer im Tal bleiben, wo sie sind.',
          hero: 'Ich habe einmal gehorcht, als ich es besser wusste. Dreihundert Männer haben dafür bezahlt.',
          heroNote: 'Marcus steckt die Tafel ein, ohne sie zu verlesen. Zum ersten Mal in dreißig Jahren Dienst.' },

        { title: 'Der Schlund', map: 'ruins',
          text: 'Am Ende des Tals klafft ein Loch, in das der Nebel hineinfließt statt heraus.',
          hero: 'Da müssen wir hinunter. Nehmt Fackeln. Nehmt viele.' },

        { title: 'Der Höllenhund', map: 'canyon', boss: true,
          text: 'Drei Köpfe, ein Körper, und keine Kette am Hals. Der Wächter hat seinen Posten verlassen.',
          hero: 'Wenn der Türsteher draußen steht – wer passt dann drinnen auf?',
          outro: 'Der Hund liegt. Zwischen seinen Zähnen steckt ein Legionsadler. Nicht eurer. Ein älterer.' },

        { title: 'Am Styx', map: 'frost',
          text: 'Ein Fluss ohne Strömung, schwarz wie Tinte. Der Fährmann ist nicht da – sein Kahn treibt leer.',
          hero: 'Er holt niemanden mehr. Sie kommen jetzt selbst herüber.' },

        { title: 'Die Felder des Tartarus', map: 'ruins',
          text: 'Grauer Sand, so weit man sieht, und darin Reihen, die nie enden. Ein zweiter Reiter bringt dieselbe Order. Diesmal mit Strafandrohung.',
          hero: 'Meldet dem Senat: Der Legat hat die Tafel erhalten. Und der Legat bleibt.',
          heroNote: 'Er weiß, was das kostet: Rang, Ehre, womöglich den Kopf. Er unterschreibt trotzdem.' },

        { title: 'Die letzte Bresche', map: 'meadow',
          text: 'Was noch übrig ist von der Neunten, steht in einer Linie. Dahinter liegt die Welt der Lebenden.',
          hero: 'Hier. Nicht weiter. Testudo!' },

        { title: 'Die Hydra', map: 'canyon', boss: true, finale: true,
          text: 'Neun Hälse recken sich aus dem Sumpf. Für jeden, den ihr nehmt, richten sich zwei neue auf.',
          hero: 'Ein Befehl schützt niemanden. Männer schützen. Feuer nach vorn!',
          outro: 'Die Hydra fällt. Marcus lässt den Schlund mit Beton verfüllen – dem guten, der unter Wasser hält. ' +
                 'Der Senat entzieht ihm das Kommando und verleiht ihm im selben Schreiben einen Kranz. ' +
                 'Marcus bleibt trotzdem. Als Bauaufseher, sagt er. Über den Deckel.' }
      ]
    },

    egyptian: {
      title: 'Die Nacht ohne Sonne',
      subtitle: 'Zwölf Stunden Finsternis',
      scenes: [
        { sky:'dusk',  far:'pyramids', structure:'temple',  ground:'sand', actor:null,      sunX:24, sunY:34 },
        { sky:'night', far:'pyramids', structure:'pyramid', ground:'sand', actor:'horde',   actorN:12 },
        { sky:'sand',  far:'dunes',    structure:'obelisk', ground:'sand', actor:'horde',   actorN:16, weather:'sand' },
        { sky:'sand',  far:'dunes',    structure:'temple',  ground:'sand', actor:'horde',   actorN:26, weather:'sand' },
        { sky:'dusk',  far:'pyramids', structure:'obelisk', ground:'sand', actor:'birds' },
        { sky:'day',   far:'dunes',    structure:'pyramid', ground:'sand', actor:'giant',   actorS:0.8 },
        { sky:'blood', far:'dunes',    structure:'temple',  ground:'sand', actor:'horde',   actorN:14, weather:'sand' },
        { sky:'night', far:'pyramids', structure:'temple',  ground:'sand', actor:'wisps' },
        { sky:'night', far:'dunes',    structure:'obelisk', ground:'sand', actor:'horde',   actorN:20 },
        { sky:'blood', far:'dunes',    structure:'pyramid', ground:'sand', actor:'serpent', actorS:0.85, weather:'sand' },
        { sky:'night', far:'pyramids', structure:'gate',    ground:'stone', actor:null,     gateGlow:'#c9a24a' },
        { sky:'night', far:'dunes',    structure:'temple',  ground:'stone', actor:'wisps' },
        { sky:'blood', far:'dunes',    structure:'obelisk', ground:'sand', actor:'horde',   actorN:28, weather:'sand' },
        { sky:'blood', far:'pyramids', structure:'gate',    ground:'sand', actor:'serpent', actorS:1.5, actorX:64, weather:'sparks', gateGlow:'#ff8a3d' }
      ],

      levels: [
        { title: 'Die Sonne kommt zu spät', map: 'canyon',
          text: 'Heute Morgen stand Ra eine ganze Stunde zu spät am Horizont. In den Tempeln zittern die Priester.',
          hero: 'Apophis hat die Barke aufgehalten. Wenn er sie ganz verschlingt, kommt kein Morgen mehr.' },

        { title: 'Die Binden lösen sich', map: 'canyon',
          text: 'In der Nekropole stehen die Sargdeckel offen. Was herauskommt, geht steif – aber es geht.',
          hero: 'Sie sollten in Frieden ruhen. Stattdessen zieht sie etwas nach Westen.' },

        { title: 'Anubis’ Boten', map: 'meadow',
          text: 'Schakale umkreisen die Karawanen. Sie greifen nicht an. Sie treiben zusammen.',
          hero: 'Sie sammeln die Seelen ein. Nur bringen sie sie nicht mehr vor das Gericht.' },

        { title: 'Ein Teppich aus Käfern', map: 'meadow',
          text: 'Vom Horizont kommt ein Schatten, der raschelt. Er verschlingt jeden Halm auf seinem Weg.',
          hero: 'Der Skarabäus ist das Zeichen der Wiedergeburt. Dieser hier bringt nur Ende.' },

        { title: 'Seelen im Wind', map: 'ruins',
          text: 'Vögel mit menschlichen Gesichtern kreisen über dem Tempel. Sie rufen Namen – eure Namen.',
          hero: 'Ba-Vögel. Sie suchen ihre Körper. Und sie nehmen den erstbesten.' },

        { title: 'Diener aus Stein', map: 'ruins',
          text: 'Die kleinen Grabfiguren, die im Jenseits arbeiten sollten, sind gewachsen. Auf Manneshöhe. Und höher.',
          hero: 'Schabti. Sie kennen nur einen Befehl: arbeiten, bis es getan ist.' },

        { title: 'Sechmets Zorn', map: 'frost',
          text: 'Löwenköpfige Wächterinnen treten aus dem Tempeltor. Pfeile gleiten an ihnen ab wie Regen.',
          hero: 'Sie war einst unsere Beschützerin. Jemand hat ihren Zorn umgelenkt.' },

        { title: 'Das falsche Wort', map: 'frost',
          text: 'Ein Priester des Thot liest laut aus dem Totenbuch. Bei jedem Vers richten sich Gefallene wieder auf.',
          hero: 'Ich habe dieselben Sprüche gesprochen, dreißig Jahre lang. Und nichts ist geschehen. Bei ihm schon.',
          heroNote: 'Zum ersten Mal fragt sich Nefret, ob je ein Gott ihr geantwortet hat.' },

        { title: 'Tal der Könige', map: 'canyon',
          text: 'Jedes Grab im Tal steht offen. Aus jedem kommt eine Reihe. Sie alle ziehen nach Westen.',
          hero: 'Dorthin, wo die Sonne untergeht. Sie folgen ihm.' },

        { title: 'Die Brut der Schlange', map: 'meadow', boss: true,
          text: 'Aus dem Sand hebt sich ein Leib, dick wie eine Säule. Nur ein Junges – aber es wittert euch schon.',
          hero: 'Wenn schon die Brut so groß ist … dann betet für die zwölfte Stunde.',
          outro: 'Die Brut liegt. In ihrem Leib findet ihr Sand, der nie Sonne gesehen hat.' },

        { title: 'Die zwölf Tore', map: 'ruins',
          text: 'Die Sonnenbarke passiert in jeder Nachtstunde ein Tor. An diesem hier wartet bereits jemand.',
          hero: 'Ich rufe Ra an, und Ra schweigt. Elf Tore noch – und niemand hilft uns hindurch.' },

        { title: 'Die Halle der Wahrheit', map: 'frost',
          text: 'Hier wiegt man Herzen gegen eine Feder. Die Waage steht schief – und niemand bedient sie mehr.',
          hero: 'Die Götter richten nicht mehr. Sie sind nicht fort – sie waren nie die, die es taten. Wir waren es.',
          heroNote: 'Nefret legt die Ritualschale ab und nimmt den Stab in beide Hände.' },

        { title: 'Die zwölfte Stunde', map: 'canyon',
          text: 'Noch eine Stunde bis zum Sonnenaufgang. Alles, was die Nacht aufgeboten hat, steht zwischen euch und dem Morgen.',
          hero: 'Kein Gebet mehr. Stellt euch auf. Maat ist keine Gabe – sie ist Arbeit.' },

        { title: 'Apophis', map: 'ruins', boss: true, finale: true,
          text: 'Die Schlange des Chaos legt sich um die Barke. Ihr Maul ist größer als das Tor, durch das ihr gekommen seid.',
          hero: 'Ich habe mein Leben lang gewartet, dass ein Gott die Ordnung hält. Heute halte ich sie.',
          outro: 'Apophis weicht zurück, und die Barke fährt an. Die Sonne steigt – pünktlich. ' +
                 'Nefret lässt in den Tempel einen neuen Satz meißeln, unter die alten Sprüche: ' +
                 '„Die Ordnung fällt nicht vom Himmel. Sie wird gehalten." ' +
                 'Er kommt jede Nacht wieder. Und jede Nacht steht jemand hier.' }
      ]
    }
  };

  /* =====================================================
     JAPAN – der verborgene fünfte Feldzug
     ===================================================== */
  STORY.japan = {
    title: 'Die Nacht der hundert Dämonen',
    subtitle: 'Ein Feldzug, den nur findet, wer alle anderen bestand',

    scenes: [
      { sky:'dusk',   far:'forest',    structure:'temple',    ground:'grass', actor:null,      sunX:26, sunY:32 },
      { sky:'night',  far:'forest',    structure:'temple',    ground:'grass', actor:'wisps' },
      { sky:'storm',  far:'hills',     structure:'camp',      ground:'marsh', actor:'horde',   actorN:14, weather:'rain' },
      { sky:'night',  far:'mountains', structure:'castle',    ground:'grass', actor:'horde',   actorN:18 },
      { sky:'aurora', far:'peaks',     structure:'ruin',      ground:'snow',  actor:'wisps',   weather:'snow' },
      { sky:'storm',  far:'peaks',     structure:'castle',    ground:'stone', actor:'giant',   actorS:0.9, weather:'rain' },
      { sky:'night',  far:'forest',    structure:'temple',    ground:'marsh', actor:'birds' },
      { sky:'dusk',   far:'mountains', structure:'castle',    ground:'grass', actor:'horde',   actorN:22, weather:'sparks' },
      { sky:'night',  far:'peaks',     structure:'gate',      ground:'stone', actor:null,      gateGlow:'#b03a4a' },
      { sky:'blood',  far:'forest',    structure:'temple',    ground:'marsh', actor:'serpent', actorS:0.8, weather:'sparks' },
      { sky:'night',  far:'mountains', structure:'ruin',      ground:'snow',  actor:'horde',   actorN:16, weather:'snow' },
      { sky:'storm',  far:'volcano',   structure:'gate',      ground:'ash',   actor:'horde',   actorN:20, weather:'ash' },
      { sky:'blood',  far:'peaks',     structure:'castle',    ground:'ash',   actor:'wolf',    actorS:1.2, weather:'ash' },
      { sky:'blood',  far:'volcano',   structure:'temple',    ground:'marsh', actor:'serpent', actorS:1.6, actorX:66, weather:'sparks' }
    ],

    levels: [
      { title: 'Das Dorf am Bambuswald', map: 'bamboo',
        text: 'Ein Dorf am Fuß des Berges bittet um Schutz. Etwas geht nachts um, sagen sie – und niemand traut sich mehr auf den Pfad.',
        hero: 'Ich suche keine Bauern, die ich beschütze. Ich suche ein Ende, das meinen Namen trägt.',
        heroNote: 'Tomoe bleibt trotzdem. Nur diese eine Nacht, sagt sie sich.' },

      { title: 'Kodama im Nebel', map: 'bamboo',
        text: 'Zwischen den Halmen leuchten kleine Gestalten. Wo sie vorbeiziehen, verdorrt der Bambus.',
        hero: 'Baumgeister. Sie waren einmal harmlos. Etwas hat sie aufgestört.' },

      { title: 'Der Fluss der Kappa', map: 'meadow',
        text: 'Am Furt liegen umgestürzte Karren. Aus dem Wasser lugen Schalen hervor, wie flache Teller auf grünen Köpfen.',
        hero: 'Verneigt euch vor einem Kappa. Er verneigt sich zurück – und verschüttet dabei seine Kraft.' },

      { title: 'Der Fuchs mit neun Schwänzen', map: 'meadow',
        text: 'Eine Frau in feinem Gewand steht am Wegrand und bittet um Hilfe. Ihr Schatten hat mehr Schwänze, als ein Fuchs haben sollte.',
        hero: 'Ein Kitsune. Je älter, desto besser die Lüge.' },

      { title: 'Was der Priester sah', map: 'frost',
        text: 'Ein alter Mann im Bergtempel zeigt eine Schriftrolle: alle hundert Jahre ziehe die Parade. Diesmal, sagt er, zieht sie nicht vorbei – sie bleibt.',
        hero: 'Hyakki Yagyō. Ich hielt es für ein Ammenmärchen.',
        heroNote: 'Er fragt sie, warum sie kämpft. Sie hat keine Antwort, die ihr selbst gefällt.' },

      { title: 'Der Oni auf der Brücke', map: 'canyon',
        text: 'Ein Hörnerdämon mit eiserner Keule versperrt den Pass. Er lacht, als er die Kriegerin sieht.',
        hero: 'Endlich einer, der zurückschlägt.' },

      { title: 'Die Tengu des Berges', map: 'ruins',
        text: 'Aus den Wipfeln stoßen geflügelte Gestalten mit langen Nasen herab. Sie führen Schwerter – und sie können damit umgehen.',
        hero: 'Sie sollen die besten Fechter sein, die je gelebt haben. Sehen wir nach.' },

      { title: 'Die brennende Provinz', map: 'meadow',
        text: 'Vom Grat aus sieht man drei Dörfer brennen. Aus jedem zieht eine Reihe zum Berg – als folgten sie einem Ruf.',
        hero: 'Ich habe mein Leben lang nach einem Tod gesucht, der etwas bedeutet. Und dabei kein einziges Leben gerettet.',
        heroNote: 'Zum ersten Mal reitet sie nicht auf den Feind zu, sondern auf die Menschen dahinter.' },

      { title: 'Das Torii', map: 'ruins',
        text: 'Am Bergpass steht ein rotes Tor ohne Mauer. Dahinter ist die Luft kälter, und die Sterne stehen falsch.',
        hero: 'Ein Tor trennt das Heilige vom Übrigen. Dieses hier trennt gar nichts mehr.' },

      { title: 'Die Brut der Schlange', map: 'canyon', boss: true,
        text: 'Aus dem Nebel schiebt sich ein Leib, dick wie ein Balken – und dahinter ein zweiter Kopf, und ein dritter.',
        hero: 'Nur eine Brut. Nur ein Vorgeschmack.',
        outro: 'Die Brut liegt. In ihrem Leib findet Tomoe einen zerbrochenen Schwertgriff – ' +
               'den ihres gefallenen Herrn. Er ist also hier gewesen. Und er ist nicht durchgekommen.' },

      { title: 'Der Weg des Herrn', map: 'frost',
        text: 'Sie folgt der Spur, die er hinterließ: zerbrochene Waffen, ein zerfetztes Banner, kein Grab.',
        hero: 'Er ist allein hier hinaufgestiegen, um zu sterben wie ich es wollte. Es hat niemandem geholfen. Am wenigsten ihm.',
        heroNote: 'Tomoe begräbt den Schwertgriff am Wegrand – und lässt die Suche nach dem eigenen Ende dort liegen.' },

      { title: 'Die hundert Dämonen', map: 'ruins',
        text: 'Der Zug beginnt. Was da den Berg herabkommt, hat kein Ende, das man sehen könnte.',
        hero: 'Sie ziehen zum Dorf. Also stehe ich zwischen ihnen und dem Dorf.' },

      { title: 'Die letzte Wache', map: 'frost',
        text: 'Was vom Dorf noch steht, steht hinter ihr. Vor ihr steht alles andere.',
        hero: 'Haltet die Lampen an. Sie sollen sehen, dass hier jemand wacht.' },

      { title: 'Yamata no Orochi', map: 'bamboo', boss: true, finale: true,
        text: 'Acht Köpfe heben sich aus dem Tal, jeder so groß wie ein Tor. Susanoo besiegte sie einst mit List und acht Fässern Wein. Tomoe hat eine Naginata.',
        hero: 'Ich habe zu sterben gesucht und nichts gefunden. Jetzt suche ich zu leben – und stehe hier. Komm.',
        outro: 'Orochi weicht, und die Parade zerfällt mit ihm. Im Morgengrauen kehren die Dorfbewohner zurück ' +
               'und finden Tomoe schlafend an der Mauer, die Naginata quer über den Knien. ' +
               'Sie bleibt. Nicht als die, die zu sterben suchte – als die, die wacht.' }
    ]
  };

  /* -------------------------------------------------------
     Kennwerte aus der Levelnummer
     ------------------------------------------------------- */

  /** Welche Türme in diesem Level überhaupt gebaut werden dürfen. */
  function rolesFor(n) {
    if (n <= 1) return ['rapid', 'slow'];
    if (n <= 2) return ['rapid', 'slow', 'splash'];
    if (n <= 4) return ['rapid', 'slow', 'splash', 'dot'];
    if (n <= 6) return ['rapid', 'slow', 'splash', 'dot', 'chain'];
    return TD.ROLE_ORDER.slice();
  }

  /**
   * Wie weit die Gegnerauswahl vorgezogen wird. Dadurch treten in
   * späteren Leveln von Anfang an die schwereren Arten auf, ohne
   * dass die Lebenspunkte davonlaufen – die steuert hpMul.
   */
  function typeOffsetFor(n) {
    return Math.round((n - 1) * 1.05);
  }

  /**
   * Wegmuster des Kapitels. Anfangs ein einzelner Weg; später
   * kommen zweite und dritte Zuläufe dazu, damit die Verteidigung
   * nicht immer an derselben Stelle stehen kann.
   */
  function patternFor(n) {
    if (n <= 3) return 'single';
    if (n === 4 || n === 5) return 'twin';
    if (n === 6 || n === 7) return 'fork';
    /* Ab hier kein Rücksprung mehr auf einen einzelnen Weg: Der
       Wegausgleich macht Mehrwegkarten milder, ein später Einzelweg
       wäre sonst plötzlich härter als das Kapitel davor. */
    if (n === 8) return 'fork';
    if (n === 9 || n === 10) return 'cross';
    if (n === 11) return 'twin';
    if (n === 12) return 'triple';
    if (n === 13) return 'fork';
    return 'triple';                     // Finale
  }

  /**
   * Ausgleich für mehrere Wege. Wer an zwei Stellen gleichzeitig
   * verteidigen muss, kann seine Türme nicht bündeln – ohne
   * Ausgleich wären solche Kapitel schlicht unfair.
   * Bei 'fork' und 'triple' laufen die Wege am Ende zusammen,
   * dort greift die Verteidigung wieder gemeinsam.
   */
  var PATH_BALANCE = {
    single: { gold: 1.00, hp: 1.00 },
    fork:   { gold: 1.20, hp: 0.90 },
    cross:  { gold: 1.40, hp: 0.78 },
    twin:   { gold: 1.45, hp: 0.75 },
    triple: { gold: 1.50, hp: 0.72 }
  };

  /** Einfacher Streuwert für reproduzierbare Startwerte. */
  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) % 100000;
  }

  var API = TD.campaign = {

    COUNT: COUNT,

    /** Titel und Untertitel des Feldzugs. */
    info: function (factionKey) {
      var s = STORY[factionKey] || STORY.medieval;
      return { title: s.title, subtitle: s.subtitle, count: s.levels.length };
    },

    /**
     * Vollständige Levelbeschreibung.
     * @param {string} factionKey
     * @param {number} n 1-basierte Levelnummer
     */
    levelFor: function (factionKey, n) {
      var s = STORY[factionKey] || STORY.medieval;
      n = U.clamp(n, 1, s.levels.length);
      var raw = s.levels[n - 1];

      /* Rund 10–13 Wellen. Mehr würde ein Level über die angepeilten
         zehn Minuten hinausziehen; die Schwierigkeit kommt daher über
         hpMul und die Gegnerauswahl, nicht über die Länge. */
      var waves = 10 + Math.floor((n - 1) * 0.3);           // 10 … 13 Wellen
      var hpMul = 0.62 + (n - 1) * 0.066;                   // 0,62 … 1,48
      var lives = n <= 3 ? 22 : (n <= 7 ? 20 : (n <= 11 ? 18 : 16));
      var gold  = 340 + n * 18;

      if (raw.boss) { hpMul *= 0.87; lives += 5; }          // Bosslevel abfedern

      /* Jedes Kapitel bekommt einen eigenen Wegverlauf. Der Startwert
         hängt an Volk und Kapitel – derselbe Feldzug sieht also immer
         gleich aus, unterscheidet sich aber von jedem anderen. */
      var pattern = patternFor(n);
      var seed = hash(factionKey) + n * 7919;
      var mapDef = TD.maps.generate(raw.map, seed, pattern);

      var bal = PATH_BALANCE[pattern] || PATH_BALANCE.single;
      gold = Math.round(gold * bal.gold);
      hpMul *= bal.hp;

      /* Die Hauptfigur greift ab Kapitel 3 selbst ein – vorher führt
         sie noch aus dem Hintergrund. Ab Kapitel 11, nach der Wende
         ihrer Geschichte, kämpft sie merklich entschlossener. */
      var heroAvailable = n >= HERO_FROM;
      var heroAwakened = n >= HERO_AWAKENED;

      return {
        faction: factionKey,
        n: n,
        title: raw.title,
        mapDef: mapDef,
        pattern: pattern,
        pathCount: mapDef.routes.length,
        heroAvailable: heroAvailable,
        heroAwakened: heroAwakened,
        heroNote: raw.heroNote || null,
        scene: (s.scenes && s.scenes[n - 1]) || { sky: 'day', far: 'hills', ground: 'grass' },
        map: raw.map,
        story: raw.text,
        heroLine: raw.hero,
        outro: raw.outro || null,
        boss: !!raw.boss,
        finale: !!raw.finale,
        roles: rolesFor(n),
        typeOffset: typeOffsetFor(n),
        waves: waves,
        /* Passt in dieselbe Struktur wie die freien Schwierigkeitsgrade */
        diff: {
          key: 'campaign', name: 'Feldzug ' + n,
          lives: lives, gold: gold,
          hpMul: hpMul, waves: waves,
          goldMul: 1.12 - n * 0.008,
          scoreMul: 1 + (n - 1) * 0.12
        }
      };
    },

    /* ---------------- Fortschritt ---------------- */

    /** Gespeicherter Stand eines Volkes. */
    progress: function (factionKey) {
      var all = U.store.get('campaign', {});
      return all[factionKey] || { unlocked: 1, levels: {} };
    },

    saveResult: function (factionKey, n, score, stars, won) {
      var all = U.store.get('campaign', {});
      var p = all[factionKey] || { unlocked: 1, levels: {} };
      var prev = p.levels[n] || { score: 0, stars: 0 };

      if (won) {
        p.levels[n] = {
          score: Math.max(prev.score, score),
          stars: Math.max(prev.stars, stars)
        };
        if (n + 1 > p.unlocked && n < COUNT) p.unlocked = n + 1;
        else if (n >= COUNT) p.unlocked = COUNT;
      }
      all[factionKey] = p;
      U.store.set('campaign', all);
      return { isRecord: won && score > prev.score, prev: prev };
    },

    isUnlocked: function (factionKey, n) {
      return n <= API.progress(factionKey).unlocked;
    },

    /** Hat dieses Volk seinen Feldzug vollständig bestanden? */
    isFinished: function (factionKey) {
      var p = API.progress(factionKey);
      for (var n = 1; n <= COUNT; n++) {
        if (!p.levels[n]) return false;
      }
      return true;
    },

    /**
     * Der verborgene Feldzug öffnet sich erst, wenn alle vier
     * regulären Völker ihre Geschichte zu Ende gebracht haben.
     */
    secretUnlocked: function () {
      for (var i = 0; i < TD.FACTION_ORDER.length; i++) {
        if (!API.isFinished(TD.FACTION_ORDER[i])) return false;
      }
      return true;
    },

    /** Wie viele Feldzüge fehlen noch bis zur Enthüllung? */
    secretRemaining: function () {
      var n = 0;
      TD.FACTION_ORDER.forEach(function (f) {
        if (!API.isFinished(f)) n++;
      });
      return n;
    },

    /** Wurde die Enthüllung schon gezeigt? */
    secretSeen: function () {
      return !!U.store.get('secretSeen', false);
    },
    markSecretSeen: function () {
      U.store.set('secretSeen', true);
    },

    /** Sterne aus den verbliebenen Leben. */
    starsFor: function (lives, maxLives) {
      var frac = maxLives ? lives / maxLives : 0;
      if (frac >= 0.9) return 3;
      if (frac >= 0.5) return 2;
      return 1;
    },

    /** Zusammenfassung für die Levelauswahl. */
    summary: function (factionKey) {
      var p = API.progress(factionKey);
      var done = 0, stars = 0, score = 0;
      Object.keys(p.levels).forEach(function (k) {
        done++;
        stars += p.levels[k].stars || 0;
        score += p.levels[k].score || 0;
      });
      return {
        unlocked: p.unlocked, done: done, stars: stars,
        maxStars: COUNT * 3, score: score, count: COUNT,
        finished: done >= COUNT
      };
    }
  };
})(window);
