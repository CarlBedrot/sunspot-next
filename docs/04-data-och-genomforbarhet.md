# Data och genomförbarhet

Källkontroll: 2026-09-16. Ursprunglig genomförbarhetsstudie med senare status för prototypens väder- och platsintegration. Verifierad fältprecision saknas; aktuell implementation beskrivs i [versionsstatusen](10-prototypstatus.md).

## Slutsats

Ett avgränsat pilotförsök verkar tekniskt rimligt. Det svåraste är att få rätt geometri för ytan där människor sitter och de objekt som skuggar den. En väderkälla löser inte den delen. Fullständig, aktuell och fritt återanvändbar skuggdata för alla platser i en stad är inte verifierad.

## Källor och status

| Behov | Kandidat och verifierat stöd | Vad som återstår |
| --- | --- | --- |
| Väder, förstahandsval | Yr önskas av användaren. MET Norways Locationforecast används nu i den lokala prototypen och har svarat med prognos för Köpenhamn. [Locationforecast-guide](https://docs.api.met.no/doc/locationforecast/HowTO.html). | Följ upp kvalitet och längre drift. Ingen garanti om exakt lokalt väder eller identisk presentation med yr.no. |
| Vädervillkor | MET kräver identifierade anrop, cachehantering och attribution. [Användningsvillkor](https://docs.api.met.no/doc/TermsOfService.html), [datalicens](https://docs.api.met.no/doc/License.html). | Implementera enligt villkoren och ange faktisk källa. Yr-logotyp eller officiell anknytning ska inte antas ingå. |
| Väderalternativ | Open-Meteo kvarstår som jämförelse eller möjlig reserv. [API-dokumentation](https://open-meteo.com/en/docs), [åtkomstvillkor](https://open-meteo.com/en/pricing). | Välj bara om behovet motiverar det. Ingen automatisk blandning eller tyst växling mellan leverantörer är beslutad. |
| Terräng och hinder | Danmarks Højdemodel innehåller terräng- och ytdata i 0,4-metersgrid. Klimadatastyrelsen beskriver fri tillgång via Datafordeleren och Dataforsyningen. [Danmarks Højdemodel](https://www.klimadatastyrelsen.dk/groen-omstilling-og-klimasikring/klimasikring/danmarks-hoejdemodel). | Hämta ett prov av DHM/Terræn och DHM/Overflade för pilotområdet. Kontrollera aktuell åtkomst, villkor, mätår, koordinat- och höjdsystem samt hur byggnader och vegetation representeras. Dataset har inte hämtats. |
| Kommunala komplement | Köpenhamns kommun hänvisar till kartor och öppna data. [Kommunens kart- och datasida](https://www.kk.dk/om-kommunen/fakta-og-statistik/kort-og-data). | Undersök användbara park-, träd- och uteserveringsdata. Tillgängliga återanvändbara vistelsepolygoner är inte verifierade. |
| Platser | Sju platsnamn och koordinater från OpenStreetMap har importerats via Overpass för prototypen. Datan omfattas av ODbL. [OSM:s licensinformation](https://www.openstreetmap.org/copyright). | Öppettider, verkliga vistelseytor och täckning för fler platser återstår att kontrollera. |
| Bakgrundskarta | OSM:s publika kartservrar har användningspolicy och begränsad kapacitet. [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/). | Välj separat kartleverantör eller egen drift inför pilot. Öppen kartdata är inte samma sak som fri drift av en karttjänst. |
| Solposition | SunCalc erbjuder beräkning av solposition. [Projektets dokumentation](https://github.com/mourner/suncalc). | Verifiera vald versions vinkelkonvention, tidsbehandling och lämplighet mot referensfall. Biblioteket beräknar inte stadsskuggor åt oss. |
| Skuggmotor och export | ShadeMap erbjuder ett JavaScript-SDK och utvecklaren publicerar ett GeoTIFF-exportexempel. [SDK](https://shademap.app/about/), [export](https://github.com/ted-piotrowski/shademap-examples/blob/main/docs/large-geotiff.md). | Testa integration och lokala resultat. Rätt till lagring, återpublicering och kommersiell användning, pris samt tillgång till rådata återstår att verifiera. |

## Rekommenderat spår

Börja med tio manuellt definierade vistelseytor i Köpenhamn. Prova först om ShadeMaps SDK eller exporterade resultat kan täcka behovet; jämför med ett prov av DHM:s terräng- och ytmodeller som eget underlag. En egen rasterbaserad skuggmotor är alternativet om återanvändningen inte räcker. Välj utifrån precision, rättigheter, drift och faktisk kostnad. Se [produktanteckningarna](09-produktanteckningar.md) för skillnaden mellan SunCalc, rendering, export och rådata.

ShadeMaps publika hjälp beskriver att hinder utanför kartvyn kan falla bort och att byggnader utan höjd får ett standardvärde. Testa därför om zoom och utsnitt påverkar våra tio kontrollplatser och hur vald SDK/datauppsättning hanterar detta. En exporterad bild är inte automatiskt tillräckligt tillförlitlig för platsrankning. [ShadeMaps begränsningar](https://shademap.app/help/).

Datafordelerens ”Overflade skyggekort” beskrivs som en visualisering av höjdvariationer. Det är inte färdiga solfönster för valfria datum; vi behöver höjdvärdena eller en tjänst som faktiskt beräknar tidsberoende skuggor. [Datafordelerens dataöversikt](https://datafordeler.dk/dataoversigt/).

För produktionen är manuellt kontrollerade platser en avsiktlig begränsning. En företagskoordinat är inte tillräcklig för att automatiskt publicera en solprognos. Manuellt identifierade ytor ska ha dokumenterat ursprung; underlaget får inte hämtas genom otillåten kopiering från andra karttjänster.

## Dataluckor som avgör kvaliteten

- **Uteserveringar:** vilken sida av byggnaden, vilken utbredning och vilken höjd gäller? Flyttas serveringen mellan säsonger?
- **Träd:** saknas kronvolym eller säsongsinformation kan en byggnadsmodell vara systematiskt för optimistisk.
- **Markiser och parasoller:** rörliga hinder kan inte betraktas som kända utan aktuella observationer.
- **Terräng och höga hinder:** en snäv importgräns kan missa skuggor som når in utifrån området.
- **Öppettider:** lokalen och uteserveringen kan ha olika tider. Okänt får inte tolkas som öppet.
- **Aktualitet:** renoveringar, nybyggnation och förändrade parkytor måste kunna flaggas och granskas.

## Köpenhamn som vald pilotstad

Användaren har valt Köpenhamn. Ett mindre sammanhängande område avgränsas inför datatestet så att det omfattar både uteserveringar och parkytor. Stadens val är därmed fastställt; den lokala datakvaliteten är ännu inte verifierad.

Klimadatastyrelsen beskriver en rullande insamling där ungefär en femtedel av landet uppdateras varje år och skanning helst sker före lövsprickning. Kontrollera därför mätåret för just pilotområdet och hur väl vegetationen representerar sommarskugga. Gridstorleken är inte ett löfte om lika hög noggrannhet i våra solfönster. [DHM:s insamling och uppdatering](https://www.klimadatastyrelsen.dk/groen-omstilling-og-klimasikring/klimasikring/danmarks-hoejdemodel).

## Källspårning

Varje import ska registrera källa, datasetidentifierare, hämtningsdatum, källans mät-/uppdateringsdatum om tillgängligt, licenslänk, koordinatsystem, transformation och versionsidentitet. En härledd solberäkning ska kunna härledas tillbaka till dessa poster.

För OSM måste attribution och relevanta ODbL-krav hanteras innan distribution. Att lagra olika källor i separata tabeller avgör inte i sig licensfrågan. För nationella och kommunala data behövs datasetets egna metadata och villkor; uttrycket ”öppna geodata” ersätter inte denna kontroll.

## Kostnader att mäta

Budgeten är ännu inte bestämd. Logga under datatestet kostnad eller offert för kartvisningar, väderanrop, eventuellt skugg-API, beräkningstid, lagring och manuell platsgranskning. Jämför scenarier om 100, 1 000 och 10 000 aktiva användare per månad.

En enkel kalkyl ska vara: fasta driftkostnader + anrop × pris + beräkningstid × pris + lagring × pris. Använd verkliga leverantörsofferter och mätvärden, inte antagna gratisnivåer. Det här dokumentet innehåller inga verifierade driftkostnader.
