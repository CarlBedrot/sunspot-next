# SunSpot 0.3 — solstyrt urval

Historisk Vite-prototyp 2026-09-16. För den integrerade Next.js-versionen, se [integrationsstatus](14-nextjs-integration.md). Detta dokument är sanningskällan för körbar omfattning; äldre produktdokument beskriver målbild och tidigare undersökningar.

## Fungerar nu

- Kartan är huvudvy även på mobil. Daggenvägar, exakt klockslag och ett kontinuerligt sjudagarsreglage ligger längst ner. Filter, lista, väder och kartförklaring öppnas vid behov; platskort är stängda från start.
- Tre tydligt märkta demo-event har absoluta start-/sluttider. Samma markörform som för platser; visning är start inklusive och slut exklusive. Dagbyte, tidsdragning och öppna eventkort följer intervallet. Ingen verklig eventkälla är ansluten och demo-event går inte att boka.

- Bar och Restaurang har egna kartfokuslägen med samma kategoriurval i lista och kartmarkörer. Omgivningen tonas ned kring matchande ställen, med bibehållna byggnadsskuggor. Alla/Visa allt återställer kategori, sökning och sol-/öppettidsfilter, behåller dag/tid och visar hela platsurvalet. Mobilens platskort öppnas ovanför tidsreglaget och går att stänga.

- Touchgrass ersätter park-/promenadvalet: OSM-registrerade parker framhävs med gröna ytor och konturer, omgivande stad tonas ned och skuggorna syns med normal kontrast inom parkerna. Platskortet ligger ovanför tidsreglaget på mobilen. 139 namngivna OSM-parkytor i och vid Köpenhamns/Frederiksbergs kommuner ingår, bland annat Fælledparken; torget Ofelia Plads finns kvar under Alla. Gröna ytor betyder geografisk park, inte solgaranti.

- Mobilanpassad Leaflet-karta och lista med 163 OSM-platser, inklusive 19 extra barer/restauranger med registrerad uteservering på Nørrebro. Sökning accepterar också ”nörrebro”, ”faelledparken” och ”faelledsparken”.
- Idag plus sex dagar, tidsreglage i femminuterssteg över dygnet och besökslängd. Alla tider gäller Europe/Copenhagen.
- Kartlager från 19 523 OSM-byggnader och SunCalc. Kort, kartmarkörer, solfilter och uppskattad tid till skugga följer samma modell. Gamla demosolfönster är borttagna.
- Punktmodell för bar/restaurang, synlig blå beräkningspunkt och val av egen sittplats. Egna punkter sparas i webbläsaren. Punktval fungerar med karttryck eller kartans mittpunkt.
- Parkmodell med provpunkter inom verkliga OSM-gränser, inklusive multipolygoner och inre hål, utanför byggnader och registrerat vatten. Delvis soliga parker behålls och andelen soliga provpunkter visas.
- Standardfilter döljer skugga, känt stängda platser och registrerat saknad uteservering. Okända tillstånd visas märkta. Ett separat filter visar bara enligt OSM öppna platser.
- OSM-veckotider tolkas för vald lokal tid, även över midnatt. Komplexa eller saknade uppgifter blir okända.
- Solbevakning för bar/restaurang: förhandsvisning med slider och klockläge. Varning när högst tio minuter återstår till beräknad skugga. Förslag i närheten tar hänsyn till uppskattad gångtid, fortsatt sol och kända öppettider.
- Systemnotis när appen körs, efter användarens aktivering och endast för självvald punkt i klockläge. Dubbletter av samma skuggövergång under bevakningen undertrycks.
- MET Norway Locationforecast via servercache med Expires/Last-Modified, villkorliga anrop och återförsöksfördröjning. Felande väder visas som saknat eller äldre, aldrig påhittat. En punktprognos används för pilotområdet.
- Beständiga träffar, separata gäst-/värdbehörigheter, gästsvar ja/kanske/nej, ändring av eget svar och värdens inställning. SQLite används. Privata tokens är hashade på servern.

## Begränsningar

271 byggnader har OSM-angiven höjd, 4 066 uppskattas från våningsantal och 15 186 använder 12 m. Träd, terräng och detaljerade takformer saknas. Beräkningen är inte fältverifierad. Barers automatiska utomhuspunkter är uttryckligen uppskattade; faktisk uteservering och sittbar yta är inte verifierade. Sol betyder möjlig direkt byggnadssol, inte molnfritt väder.

Under 5° solhöjd eller nära/utanför utdragets gräns blir solläget okänt. Efter solnedgång är det skugga. Extraktets säkerhetsmarginal skyddar inte mot saknade byggnader inne i OSM-underlaget. Parkprocent avser provpunkter, inte exakt solig eller tillgänglig yta.

Gångtid är en uppskattning från fågelväg, utan vägnät. OSM-tider är en snapshot; helgdagar/säsongsuttryck och serveringens egna tider saknas i tolkningen. Google Places, ShadeMap, faktisk bakgrundspush och vägbaserad gångrutt är inte anslutna. En pausad/stängd app får ingen tillförlitlig bevakning. [Detaljer och nästa steg](11-solstyrt-urval.md).

Inbjudningar fungerar där den lokala servern nås; ingen internetpublicering, bordsbokning, vänlista eller kontoåterställning. Egna sittplatspunkter delas ännu inte med träffen. Om lokal webbläsarlagring raderas försvinner lokal åtkomst till värd-/gäståtgärder och egna punkter. Träffar stängs för läsning sju dagar efter slut och rensas efter 30 dagar vid serverstart.

## Teknik och verifiering

React + Vite, Leaflet, Web Worker för exponeringsanalys, Express och Node SQLite. Ingen betaltjänst provisionerad. Modell och kartlager delar OSM-byggnader samt SunCalc-position; ray casting respektive canvasprojektion använder samma lokala Mercator-skala.

`npm test` täcker API/behörigheter, gästuppdatering, beständighet, väderintervall, tidszon, skugggeometri och innergårdar, partiella parker, öppettider över midnatt och rekommendationer efter ankomst. Ett regressionsprov mot Köpenhamnsutdraget visar att en bar går från sol till skugga medan parken behålls.

`npm run test:browser` provar karta, tidsreglage, zoom, natt, dataladdningsfel/återförsök samt hela inbjudningsflödet. `npm run test:solar` provar dynamisk filtrering av kort och kartmarkörer, sittplatsval, solvarning, förslag, planering kontra klockläge, notisdeduplicering med simulerad Notification-klass och mobilvy. Browsernotisens UI-logik testas, inte leverans till en fysisk telefon.

Skärmbilder sparas i ignorerade `artifacts/`. Produktionsbygge och visuella kontroller körs inför leverans.

### Verifiering av det utökade parkurvalet, 2026-09-16

Importen hämtar namngivna `leisure=park`-objekt via kommungränser, inte en förvald lista med två parker. Sex OSM-noder saknar parkgräns och hoppas över. OSM-objekt med uttryckligen begränsat tillträde hoppas också över. Varken OSM:s fullständighet eller faktisk offentlig tillgång är fältverifierad.

Regressionstester kontrollerar Fælledparken, Nørrebroparken, Østre Anlæg, Frederiksberg Have, Superkilens separata delar, vattenexkludering och okänd soltäckning. Webbläsartestet söker fram Fælledparken med alternativ stavning, väljer parken och skapar en inbjudan, samt kontrollerar parkvalet på mobil. Skuggmodellen har samma geografiska täckning som tidigare.

Verifierat: 16 tester passerar, webbläsarflödet och solbevakningsflödet passerar, och produktionsbygget lyckas. Ett lokalt ombygge av platsdata ger identiska filer. Smala parker utan användbara provpunkter märks okända dagtid och filtreras som skugga nattetid. Produktionsbygget varnar för större JavaScript-filer eftersom parkgeometrierna ännu levereras tillsammans med klienten.

### Verifiering av kategori- och filteråterställning, 2026-09-16

Produktionsbygge och utökat webbläsartest passerar. Testet jämför listans och kartans platser i Bar/Restaurang, växlar fokuslager och provar full återställning med kombinerad sökning/sol/öppettider samt återställning via Alla nattetid. Mobilkontrollen provar Visa allt, kategoriövergångar och att platskortet ligger under kartan. Dator- och mobilvyer har granskats visuellt. Aktivitetsfiltren ändrar inga beräkningar, platsdata eller bevakningar.

### Kartvy och tidsstyrda demo-event, 2026-09-16

Den tidigare sidopanelen har ersatts av sök-/aktivitetsknappar på kartan, ett tidsreglage längst ner och paneler som öppnas vid behov. Eventfiltreringen körs direkt i klienten oberoende av den asynkrona solberäkningen. En ändrad dag eller tid tar omedelbart bort inaktuella eventmarkörer och eventkort. Sol- och öppettidsfilter gäller platser; eventens giltighet styrs av deras tidsintervall. Alla/Visa allt upphäver inte eventens datum.

Testerna har anpassats till den nya navigeringen och omfattar tidsgränser, måndag till tisdag via reglaget, midnatt, sommartid, filter, platsval, inbjudningar och solbevakning även när bevakningspanelen är minimerad. Äldre verifieringsanteckningar om kort under kartan beskriver tidigare layout.

Verifierat: samtliga 18 tester, webbläsarflödet och solbevakningsflödet passerar. Produktionsbygget lyckas med den tidigare storleksvarningen för klientens JavaScript. Datorvy och mobilvy har granskats visuellt, inklusive eventkort ovanför tidsreglaget.
