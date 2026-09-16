# Kartvy och event

Kartan är appens huvudvy. På mobil ryms kartan och tidskontrollen i skärmens höjd. Sökning, aktivitet, filter och listknapp finns överst; veckoreglaget finns längst ner. Platskort och eventkort visas efter val och går att stänga. Längre platsinformation, sittplatsval och solbevakning finns under **Mer om platsen**. Kartförklaringen öppnas med **Om kartan**.

## Tidskontrollen

Reglaget representerar lokala minuter över idag och sex följande dagar, i femminuterssteg. Ett drag över midnatt ändrar både datum och klockslag. Dagknapparna byter dag med bibehållen tid; tidsfältet låter användaren ange klockslaget exakt. Alla tider visas för Europe/Copenhagen. Vald tid omvandlas till ett absolut tidsögonblick innan event filtreras eller solberäkningen körs.

## Eventdata

`src/events.js` innehåller demonstrationen och intervalfiltreringen. Varje event har stabilt `id`, `name`, `category: "event"`, koordinater, symbol, beskrivning, `startsAt`, `endsAt` och `demo`. Tiderna lagras som ISO-strängar med tidszon. Inkommande verkliga data måste ha entydiga tidszoner och ett slut efter start.

Synlighetsregeln är `startsAt <= vald tid < endsAt`. Ett event som slutar 17:00 försvinner exakt 17:00. Ett event som pågår över midnatt får synas på båda datumen, men bara inom intervallet. Ogiltiga intervall visas inte. Alla och Event visar tidsmässigt giltiga event; Bar, Mat och Touchgrass visar sina respektive platser. Sökningen gäller eventnamnet. Sol och OSM-öppettider används inte för att gissa om ett event pågår.

Markörer använder samma Leaflet-knapp och form som platser. Demo-märkningen finns i markörnamnet, listan och detaljkortet. Event visas direkt vid tidsändring, utan att invänta Web Workerns skuggberäkning. Ett öppet kort visas endast medan eventet är giltigt för aktuellt datum, tid och filter.

## Demonstrationens gräns

Ingen eventleverantör eller arrangör är ansluten. Eventen är påhittade och erbjuds inte som bokningsbara evenemang. Tre exempel skapas för den aktuella sjudagarsvyn: måndagshäng, livemusik nästa dag och utomhusbio på lördag. De finns för att prova kartan och tidsövergångarna. Verklig integration behöver också hantera uppdateringar, inställda event, dubbletter, källänkar och användningsvillkor.

Platsers vanliga inbjudningar, gästsvar, skuggberäkning och solbevakning finns kvar. Ingen ny extern publicering eller meddelandesändning ingår.
