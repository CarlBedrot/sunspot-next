# Eventkällor och detaljkort

SunSpot visar verkliga Köpenhamnsevent från en öppen källa och ett manuellt kontrollerat Luma-exempel. Det är ett första urval, inte hela stadens eller Lumas utbud.

## Upplevelsen

Välj **Event** och öppna listan, eller tryck **se veckan** i tidskontrollen. Veckolistan visar event som överlappar sjudagarsperioden. Val av ett event hoppar till dess start, eller veckans början om det redan pågår. Markörer visas bara när `startsAt <= vald tid < endsAt`. Markören och det öppna kortet försvinner vid sluttiden eller om filtret inte längre matchar. Event är oberoende av skuggberäkningen och behöver inte vara utomhus.

Detaljkortet är en scrollbar panel med omslag, arrangör, datum/tid, pris enligt källan, plats, liten karta, beskrivning och program när sådant finns. Tidsreglaget förblir åtkomligt. Anmälan sker på arrangörens sida; SunSpot registrerar inte besökaren. Dela använder enhetens delning eller kopierar källänken efter knapptryck. Varken deltagarantal, gäster eller kontaktuppgifter hittas på.

Flerdagarsevent kan vara utställningar med separata dagliga öppettider. Kortet uppmanar besökaren att kontrollera dessa; intervallet garanterar inte att lokalen är öppen hela perioden.

## Automatisk källa

[Københavns Bibliotekers event-API](https://bibliotek.kk.dk/api/v1/events) levererar bland annat workshops, film, föredrag, musik och gemensamma måltider. Gränssnittet beskrivs i [DPL:s integrationsdokumentation](https://danskernesdigitalebibliotek.github.io/dpl-docs/DPL-CMS/event-integration/) och [bibliotekens manual](https://github.com/danskernesdigitalebibliotek/folkebibliotekernes_cms_manual/blob/main/_integrationer/arrangements-api.md).

`server/events.js` normaliserar svaren, tar bort inställda/avslutade eller ogiltiga poster, deduplicerar UUID och kräver en fysisk adress med verifierade koordinater. Beskrivningar omvandlas från HTML till text och renderas som text. Bilder hämtas från källans domän och används med eventets källänk; ingen bildsamling kopieras in i repot. Saknat omslag får en grafisk reservbild.

`GET /api/events?from=<ISO>&to=<ISO>` accepterar högst åtta dagar. Servern delar samtidiga uppdateringar och cachelagrar i 15 minuter per process. Klienten uppdaterar var 15:e minut. Vid källfel görs nya försök tidigast efter en minut. Tidigare data kan visas i högst sex timmar med tydlig märkning, därefter tas de bort. Ett lyckat tomt svar tömmer tidigare data. Det är inte en realtidsgaranti för inställda event eller biljetter.

Koordinater hämtas inte för varje besökare. `data/event-locations.json` innehåller verifierade adresspunkter; `npm run data:event-locations` uppdaterar dem via Dataforsyningen. Okända adresser hoppas över tills underlaget uppdateras. Detta begränsar täckningen.

## Luma-exemplet

[Food Circularity Network Kick-Off Event](https://luma.com/39yoolg4), Rockstart, 17 september 2026, är samma event som i designreferensen. `src/curatedEvents.js` innehåller källänk, offentligt omslag, lokal, tid och ett sammanfattat program. Posten är manuellt kontrollerad och märks så; den synkas inte automatiskt. Källans eventtid slutar 18:00 men programmet fortsätter till 19:00. Detta visas i kortet; kartans sluttid följer 18:00.

[Lumas API](https://docs.luma.com/reference/getting-started-with-your-api) kräver Luma Plus och nycklar kopplade till egna kalendrar. Ingen sådan anslutning finns här och vi har inte tillgång till hela Discover-utbudet. Fler arrangörer kan anslutas via godkända flöden eller egna kalendrar.

## Testning

`npm test` omfattar normalisering, osäkra länkar, felaktiga datum, inställda event, cache, samtidiga anrop, återförsök och tomma svar. `npm run test:events` kontrollerar veckolista, hopp till starttid, mobilpanel, stängning, program, anmälningslänk, sluttid, dagbyte och källfel utan demo-fallback. `test:browser` och `test:solar` använder uttryckligen demo-event och ett isolerat eventflöde för reproducerbara regressionstester.
