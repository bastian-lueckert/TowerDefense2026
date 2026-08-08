# Tower Defense 2026

Ein vollständiges Tower-Defense-Spiel, das komplett im Browser läuft – auf PC, Tablet
und Smartphone. Nach dem Herunterladen wird **keine Internetverbindung** mehr benötigt:
Es gibt keine externen Bibliotheken, keine Web-Fonts, keine Bild- oder Tondateien.
Alle Grafiken werden per Canvas gezeichnet, alle Geräusche mit der WebAudio-API erzeugt.

## Starten

**Einfachster Weg:** `index.html` doppelklicken. Das war's.

**Als App installieren** (empfohlen für Handy/Tablet – Vollbild, eigenes Symbol):
Den Ordner über einen beliebigen Webserver ausliefern und die Seite im Browser über
„Zum Startbildschirm hinzufügen“ bzw. „Installieren“ speichern. Danach funktioniert
das Spiel dauerhaft offline, weil ein Service Worker alle Dateien lokal ablegt.

Zum lokalen Testen liegt ein winziger Server bei (nur dafür wird Node benötigt,
das Spiel selbst braucht ihn nicht):

```
node tools/serve.js 8123      # dann http://localhost:8123 öffnen
```

## Zwei Spielarten

**Feldzug** – Für jedes der vier Völker eine eigene Geschichte in 14 Kapiteln, erzählt
entlang seiner Mythologie. Jedes Level dauert etwa 5 bis 10 Minuten, ein kompletter
Feldzug rund zwei Stunden. Jedes Kapitel beginnt mit einem Missionsbild in Pixelgrafik
und einem Kommentar der Hauptfigur, deren Portrait ebenfalls in Pixeln gezeichnet ist.
Am Ende gibt es eine Punktzahl und bis zu drei Sterne (je nachdem, wie viele Leben übrig
sind) – dazu eine kurze Siegesfeier mit Konfetti und einem Banner in Frakturschrift.
Abgeschlossene Level lassen sich jederzeit wiederholen, um die Wertung zu verbessern.

| Volk | Feldzug | Gegenspieler |
|---|---|---|
| Mittelalter | Der Wurm unter dem Rabenstein | Kobolde, Irrlichter, Wyvern → **Drache** |
| Wikinger | Fimbulwinter | Draugr, Warge, Bergriesen → **Fenrir** |
| Römer | Die Lemuria | Lemuren, Satyrn, Minotauren → **Hydra** |
| Ägypter | Die Nacht ohne Sonne | Mumien, Schakale, Schabti → **Apophis** |

Wer alle vier Feldzüge zu Ende bringt, findet einen **fünften**, der vorher nirgends
auftaucht. In der Feldzugsauswahl steht bis dahin nur ein verschlossener Hinweis, dass
noch etwas wartet – was, verrät das Spiel nicht.

**Freies Spiel** – Volk, Karte und Schwierigkeit frei zusammenstellen, auch endlos.

## Spielprinzip

Gegner laufen vom roten Portal zu deiner Basis. Jeder, der durchkommt, kostet Leben.
Gold gibt es für Abschüsse, für geschaffte Wellen und als Bonus, wenn du die nächste
Welle vorziehst.

**Zu Beginn stehen nur zwei Türme bereit.** Die stärkeren musst du dir erst
verdienen – über Truhen, die während des Spiels auftauchen. Im Feldzug bestimmt zudem
das Kapitel, welche Turmarten überhaupt zur Verfügung stehen.

**Bauen:** Turm in der Liste antippen, dann ein freies Feld antippen. Auf dem Weg und
auf Felsen/Bäumen kann nicht gebaut werden. Freie Felder werden beim Bauen hervorgehoben.
Auf dem Handy kannst du den Finger vor dem Loslassen noch verschieben, um das Feld
genau zu treffen.

**Türme verbessern:** Turm antippen, dann „Upgrade“. Vier Stufen pro Turm. Im selben
Panel lässt sich die Zielpriorität umstellen (Erster / Letzter / Stärkster / Nächster)
und der Turm für 70 % der Investition verkaufen.

### Truhen und Wissensfragen

Alle 25 bis 40 Sekunden erscheint irgendwo auf der Karte eine Truhe. Tippst du sie an,
hält das Spiel an und stellt eine Frage zur Geschichte deines Volkes. Es gibt vier
Antworten, von denen genau eine stimmt.

* **Richtig** – der nächste gesperrte Turm wird freigeschaltet. Sind schon alle frei,
  gibt es stattdessen ein Siegel für einen kostenlosen Ausbau plus Gold.
* **Falsch** – nur ein kleiner Trostbetrag Gold.

Nach jeder Antwort wird der passende geschichtliche Hintergrund eingeblendet – wer ihn
liest, beantwortet die nächste Frage sicherer. Alle Fragen stammen aus der Rubrik
**Wissenswertes**, die du vor dem Start und jederzeit im Pausemenü nachlesen kannst.

Je Volk gibt es rund **50 Hintergrundtexte und 79 Fragen** – zusammen über 300. Welche
schon dran waren, merkt sich das Spiel über Level hinweg: In einem kompletten Feldzug
(etwa 126 Truhen) taucht die erste Wiederholung erst bei Frage 80 auf.

### Die Hauptfigur

Jedes Volk hat eine Anführerin oder einen Anführer, die **einmal je Kapitel** aufs Feld
gesetzt werden können. Sie sind deutlich stärker als jeder Turm, durchdringen jede
Panzerung und haben eine Fähigkeit, die sich auflädt und von allein losgeht, sobald sie
sich lohnt:

| Figur | Fähigkeit | Wirkung |
|---|---|---|
| Adelheid von Rabenstein | Pfeilhagel | Bombardement in mehreren Wellen auf die dichteste Gruppe |
| Sigrún Eisenhand | Kriegsruf | Druckwelle: Schaden, starke Lähmung, wirft Gegner zurück |
| Marcus Valerius Corvus | Salve | Ein Bolzen auf jedes Ziel in Reichweite (bis zu acht) |
| Nefret-Iri | Sonnenstrahl | Strahl, der alles auf seiner Bahn trifft und verbrennen lässt |
| Tomoe Gozen | Sanren-giri | Drei Rundumschläge in Folge, jede Wunde blutet nach |

Sigrún und Marcus führen zusätzlich die Türme in ihrer Nähe an (+12 % Schaden bzw.
+18 % Feuertempo). Wie jeder Turm lassen sich die Figuren über vier Stufen ausbauen.

**Sie machen eine Entwicklung durch.** In den ersten beiden Kapiteln führen sie noch aus
dem Hintergrund; ab Kapitel 3 kämpfen sie selbst. Jede Figur trägt einen eigenen
Konflikt aus – Adelheid entdeckt, dass ihr Vater den Drachen selbst geweckt hat; Sigrún
kämpft gegen eine Weissagung, die ihren Tod ankündigt; Marcus muss zwischen Befehl und
Verantwortung wählen; Nefret verliert ihren Glauben an die Götter. Ab Kapitel 11, nach
der Wende ihrer Geschichte, kämpfen sie merklich entschlossener: mehr Schaden, schnellere
Fähigkeiten.

### Spielerklassen

Vier Völker mit eigenen Turmnamen, eigenem Aussehen, eigener Kampfweise – und eigenen
Gegnern aus ihrer jeweiligen Sagenwelt:

| Volk | Zeit | Stärke | Hauptfigur |
|---|---|---|---|
| Mittelalter | ca. 500 – 1500 n. Chr. | +10 % Reichweite für alle Türme | Adelheid von Rabenstein |
| Wikinger | ca. 793 – 1066 n. Chr. | +15 % Schaden, −8 % Reichweite | Sigrún Eisenhand |
| Römer | 753 v. Chr. – 476 n. Chr. | +15 % Feuertempo, Upgrades 12 % billiger | Marcus Valerius Corvus |
| Ägypter | ca. 3100 – 30 v. Chr. | Verlangsamung und Gift +30 %, Bau 8 % teurer | Nefret-Iri |
| Samurai 🔒 | Sengoku, 1467 – 1615 | +50 % Schaden gegen unverletzte Gegner | Tomoe Gozen |

Die Gegner tragen dieselben acht Rollen, treten aber je nach Volk als Kobold oder Draugr,
als Lemur oder Mumie an – mit passendem Aussehen, eigenen Farben und Erkennungszeichen
wie Hörnern, Grabbinden oder Irrlichtflammen.

### Türme

Jedes Volk hat für dieselben sechs Rollen eigene Bauten – beim Mittelalter etwa
Bogenturm, Teerschleuder und Tribock, bei den Römern Ballista, Aquädukt-Fluter und
Onager. Alle lassen sich über vier Stufen ausbauen.

| Rolle | Kosten | Besonderheit | Von Anfang an? |
|---|---|---|---|
| Schnellfeuer | 50 | Günstig und schnell, guter Allrounder | ja |
| Verlangsamung | 75 | Bremst Gegner im Umkreis aus | ja |
| Flächenschaden | 110 | Trifft mehrere, aber **keine Flieger** | Truhe |
| Gift/Brand | 130 | Schaden über Zeit, ignoriert Panzerung | Truhe |
| Kettenblitz | 145 | Springt auf mehrere Ziele über | Truhe |
| Scharfschütze | 170 | Riesige Reichweite, ignoriert Panzerung | Truhe |

### Wege und Portale

Gegner müssen nicht von einer einzigen Stelle kommen. Eine Karte kann mehrere Wege
haben – dann tauchen sie an mehreren nummerierten Portalen auf:

| Muster | Beschreibung |
|---|---|
| einzeln | Ein Weg vom Portal zur Basis |
| zwei Wege | Zwei getrennte Wege, beide führen zur Basis |
| Gabelung | Zwei Portale, deren Wege sich unterwegs vereinigen |
| Kreuzung | Ein Weg von der Seite, einer von oben – sie kreuzen sich |
| drei Zuläufe | Drei Portale mit gemeinsamem Endstück |

Weil sich die Verteidigung bei mehreren Wegen nicht bündeln lässt, gibt es auf solchen
Karten mehr Startgold und etwas weniger zähe Gegner.

**Im Feldzug hat jedes Kapitel seinen eigenen Wegverlauf** – alle 56 sind verschieden.
Sie werden aus dem Kapitel und dem Volk errechnet, sehen also bei jedem Spieler gleich
aus, wiederholen sich aber nie. Der Vorspann zeigt die Karte vorab.

### Musik

Jedes Volk hat sein eigenes Stück, gespielt von einem kleinen Sequencer – keine
Audiodateien, alles synthetisiert:

| Volk | Stück | Charakter |
|---|---|---|
| Mittelalter | Tanz auf dem Burghof | Estampie-artiger Tanz, dorisch, Laute und Flöte |
| Wikinger | Lied vom Fjord | Schwer und schreitend, mit Trommel und Fläche |
| Römer | Marsch der Neunten | Marschtritt mit Blech und Schnarrtrommel |
| Ägypter | Barke des Ra | Hijaz-Tonleiter, Rohrflöte und Rahmentrommel |
| Samurai | Kirschblüten und Stahl | In-Skala, Koto und Shakuhachi über Taiko |

In der Pause wird die Musik leiser statt abgeschaltet.

### Besondere Felder

Auf jeder Karte liegen sieben Felder, die Türme spürbar verändern. Beim Bauen wird
angezeigt, ob das Feld zum gewählten Turm passt.

| Feld | Wirkung |
|---|---|
| ▲ Anhöhe | Mehr Reichweite, besonders für Scharfschützen (+45 %) |
| ≈ Quelle | Verstärkt Verlangsamung und Gift; Wurfmaschinen feuern langsamer |
| ✦ Glutspalte | Mehr Schaden für Sprengsätze und Gifte; Frostwirkung schmilzt dahin |
| ◈ Kraftader | Alle feuern schneller, Kettenblitze treffen zwei Ziele mehr |

### Gegner

Läufer, Sprinter, Schwärme, **Flieger** (nehmen die Luftlinie – die gestrichelte Linie
zeigt ihre Route, sobald welche unterwegs sind), Panzer (viel Panzerung), Schildlinge
(prozentualer Schadensschild), Heiler (heilen ihre Umgebung) und alle zehn Wellen ein
Koloss als Boss.

Panzerung zieht Schaden flach ab, lässt aber immer mindestens ein Viertel durch –
schnelle Türme bleiben also brauchbar, effizient sind gegen Panzer aber Scharfschütze
und Gift.

### Steuerung am PC

| Taste | Funktion |
|---|---|
| `1`–`6` | Turm auswählen |
| `H` | Hauptfigur auswählen (einmal je Kapitel) |
| Rechtsklick | Zurück in den Übersichtsmodus (Bau abbrechen, Auswahl aufheben) |
| `Leertaste` | Pause |
| `F` | Geschwindigkeit 1× / 2× / 3× |
| `N` | Nächste Welle vorziehen |
| `U` / `V` | Turm verbessern / verkaufen |
| `M` | Ton an/aus |
| `Esc` | Abbrechen bzw. Menü |

Ein Rechtsklick bringt dich jederzeit zurück in den Übersichtsmodus – er beendet den
Baumodus und hebt eine Turmauswahl auf. Klickst du im Baumodus auf einen bestehenden
Turm, wird dieser ausgewählt, statt eine Fehlermeldung zu zeigen.

**Endgegner** treten im Feldzug nur in Kapitel 10 und im Finale auf, jeweils in der
letzten Welle – und werden im Kapitelvorspann angekündigt.

Die Vorschau **Nächste Welle** zeigt jeden Gegner als dieselbe Figur, die gleich auch
über die Karte läuft. Ein Zeigen darauf nennt Namen, Besonderheiten und einen Satz aus
der Sagenwelt.

## Spielstand

Alles wird automatisch im Browser gespeichert: freigeschaltete Kapitel, Sterne,
Punktzahlen, Bestwerte im freien Spiel, bereits gestellte Fragen und eine
Gesamtstatistik. Unter **Spielstand** im Hauptmenü siehst du den Überblick und kannst
den kompletten Stand als Text sichern – zum Aufheben oder um ihn auf einem anderen
Gerät wieder einzuspielen. Dort lässt sich der Fortschritt auch löschen (mit Rückfrage).

Läuft das Spiel im privaten Modus des Browsers, weist die Seite darauf hin, dass nichts
dauerhaft gespeichert werden kann.

## Umfang

5 Feldzüge à 14 Kapitel (zusammen rund 10 Stunden), dazu das freie Spiel mit
4 Karten × 4 Schwierigkeitsgraden. 30 verschiedene Türme, 40 Gegnervarianten aus fünf
Mythologien, fast 380 Wissensfragen, 70 Missionsbilder und fünf Pixel-Hauptfiguren.
Wellen werden prozedural erzeugt und sind pro Wellennummer reproduzierbar.

## Aufbau

```
index.html          Grundgerüst und Bedienoberfläche
css/style.css       Layout (Sidebar im Quer-, Leiste im Hochformat)
js/utils.js         Mathe-, Farb- und Zeichenhilfen
js/audio.js         Synthetische Geräusche (WebAudio)
js/music.js         Sequencer und die vier Musikstücke
js/factions.js      Völker: Turmnamen, Gegner, Boni, Geschichte, Quizfragen
js/lore.js          Weitere Hintergrundtexte und Fragen (hängt sie an)
js/lore-*.js        Der große Fragenbestand, eine Datei je Volk
js/characters.js    Hauptfiguren als Pixelgrafik (32×32-Raster)
js/scenes.js        Missionsbilder aus Pixel-Bausteinen (128×72)
js/titlescreen.js   Titelbild und die Frakturschrift (selbst gezeichnet)
js/celebrate.js     Siegesfeier nach gewonnenen Leveln
js/config.js        Balance: Rollen, Gegner, Felder, Schwierigkeiten
js/campaign.js      Feldzüge: Story, Bildbausteine, Levelkurve, Sterne
js/progress.js      Speicherung, Statistik, Sicherung und Wiederherstellung
js/maps.js          Karten, Wegerzeugung (mehrere Wege), besondere Felder
js/waves.js         Prozeduraler Wellengenerator
js/entities.js      Gegner, Türme, Geschosse, Truhen, Partikel
js/render.js        Sämtliche Canvas-Grafik im Comicstil
js/ui.js            HUD, Shop, Turmpanel, Menüs, Quiz
js/game.js          Spielzustand, Schleife, Regeln, Eingabe
sw.js               Service Worker für den Offline-Betrieb
tools/serve.js      Kleiner Testserver (optional)
```

**Heldenfähigkeiten** stehen in `js/factions.js` unter `hero.power`; ausgeführt werden
sie in `Tower.usePower()` in `js/entities.js`. Eine neue Fähigkeit heißt: dort einen
`case` ergänzen und die zugehörige Darstellung in `drawEffect()` in `js/render.js`.
Verzögerte Treffer (wie beim Pfeilhagel) laufen über `game.strikes` und damit über die
Spieluhr – nie über `setTimeout`, sonst ignorieren sie Pause und Zeitraffer.

Türme **und** Gegner entstehen aus **Rolle × Volk**: `js/config.js` legt die Grundwerte
fest, `js/factions.js` steuert Namen, Boni und Aussehen bei. `TD.towerDef()` und
`TD.enemyDef()` führen beides zusammen. Ein neues Volk anzulegen heißt deshalb: einen
Eintrag in `TD.FACTIONS` ergänzen (Türme, Gegner, Held, Fakten, Fragen), in
`js/campaign.js` einen Erzählstrang hinterlegen und in `js/render.js` je einen
Zeichenzweig in `drawPlinth()`, `drawWeapon()` und ggf. `drawMotif()` hinzufügen.

**Neue Fragen** kommen in die `js/lore-*.js` des jeweiligen Volkes: einen Eintrag bei
`facts` anlegen und Fragen mit `fact: '<id>'` darauf verweisen lassen. Die richtige
Antwort steht dabei immer an erster Stelle (`correct: 0`) – gemischt wird erst beim
Ziehen. Die Dateien hängen ihre Inhalte an die Listen aus `factions.js` an, sonst ist
nichts zu tun.

**Die Frakturschrift** des Logos steckt in `js/titlescreen.js` als Pixelmuster (A–Z und
0–9, je 12 × 14 Punkte). Ein Webfont kam nicht in Frage, weil das Spiel offline laufen
soll. `TD.titlescreen.writeText()` schreibt damit auf jedes Raster – die Siegesfeier
nutzt dieselbe Schrift für ihr Banner.

**Missionsbilder** werden nicht gemalt, sondern in `js/scenes.js` aus Bausteinen
zusammengesetzt (Himmel, Ferne, Bauwerk, Boden, Gestalt, Wetter). Welche Bausteine ein
Kapitel nutzt, steht in `js/campaign.js` im Feld `scenes`. Ein neues Bauwerk oder eine
neue Gestalt heißt: eine Zeichenfunktion in `scenes.js` ergänzen und im `switch`
eintragen.

**Neue Musikstücke** kommen in `js/music.js`. Ein Stück ist eine Liste von Spuren, jede
Note als `[Schritt, MIDI-Note, Länge, Lautstärke]` – ein Schritt ist eine Sechzehntel.
Die Instrumente (`lute`, `flute`, `brass`, `reed`, `pad`, `bass`, `drum`) werden dort
ebenfalls synthetisiert.

**Wegverläufe** erzeugt `TD.maps.generate(thema, startwert, muster)` in `js/maps.js`.
Ein neues Muster heißt: einen Zweig im `switch` ergänzen, der eine Liste von Wegen
zurückgibt. Wege sind Folgen von Rasterpunkten; laufen mehrere Wege auf denselben
Endpunkt zu, verschmelzen sie optisch von allein.

**Der verborgene Feldzug** hängt an `TD.campaign.secretUnlocked()`: Es prüft, ob alle
Völker aus `TD.FACTION_ORDER` ihre 14 Kapitel abgeschlossen haben. Oberflächen fragen
nie `TD.FACTION_ORDER` direkt ab, sondern `TD.availableFactions()` – so bleibt ein
verstecktes Volk überall gleichzeitig verborgen. Weitere Geheimvölker lassen sich in
`TD.SECRET_FACTIONS` eintragen.

Die Schwierigkeit eines Kapitels steuert `levelFor()` in `js/campaign.js` über vier
Stellschrauben: `hpMul` (Zähigkeit), `typeOffset` (welche Gegnerarten auftreten), die
Wellenzahl und den Wegausgleich `PATH_BALANCE`. Der Umfang einer einzelnen Welle hängt
bewusst nur von der Welle *innerhalb* des Levels ab – sonst würden späte Kapitel
deutlich über zehn Minuten dauern.

Die Skripte sind bewusst klassische `<script>`-Dateien ohne Module – nur so lässt sich
das Spiel auch direkt per `file://` öffnen, ohne dass ein Server nötig ist.

Das Spielfeld rechnet intern immer mit 960 × 576 Punkten (20 × 12 Felder à 48 px) und
wird passend zum Bildschirm skaliert; auf hochauflösenden Displays wird entsprechend
schärfer gerendert.

### Beim Weiterentwickeln

Der Service Worker liefert Dateien aus dem Cache – nach Änderungen siehst du sonst noch
die alte Fassung. Zwei Möglichkeiten:

* die Seite mit `?nosw` in der Adresse aufrufen (`http://localhost:8123/?nosw`), oder
* die Versionsnummer `CACHE` in `sw.js` hochzählen.
