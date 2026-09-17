# Produktanteckningar: solen hjälper oss välja

Antecknat 2026-09-16. Detta dokument bevarar användarens riktning och skiljer den från våra arbetsförslag och tekniska undersökningsresultat vid anteckningstillfället. Senare implementation framgår av [versionsstatusen](10-prototypstatus.md).

## Användarens idéer

- Undersök om data från SunCalc och/eller ShadeMap går att ladda ned och använda direkt.
- Platser: barer, restauranger och parker.
- Yr-integration som visar ”exakt väder”.
- Möjlighet att ”boka” möten med vänner utifrån ”Take a walk”, ”Go to a bar” och ”Eat at a restaurant”.
- **Sun guides your decision.**
- En mer lättanvänd rendering av sol och skugga, med en kartupplevelse som påminner om Google Maps.

## Föreslagen produktöversättning

Starta med ”Vad vill du göra?” och låt aktivitet, tid och sol styra platsförslagen. Behåll även fri kartutforskning. En träff sparar vald aktivitet så att inbjudan säger vad gruppen ska göra.

”Boka” tolkas tills vidare som att bestämma aktivitet, plats och tid med vänner och samla svar. Restaurangreservation och köp är separata framtida funktioner. För promenader föreslås först en park och mötespunkt; att hitta en solig rutt är en kvarvarande produktidé som kräver ruttgeometri och soltillgång längs vägen vid beräknad passagetid.

Yr-önskemålet översätts till en tydlig lokal prognos med källa, giltighetstid och uppdateringstid. Prognosen ska inte beskrivas som en exakt observation vid en uteservering. Gränssnittets språk är ännu inte beslutat; aktivitetsnamnen ovan är användarens konceptetiketter.

## Vad vi kan återanvända

| Alternativ | Kontrollerat i dokumentationen | Betydelse för SunSpot |
| --- | --- | --- |
| SunCalc-biblioteket | JavaScript-bibliotek för bland annat solposition och soltider. [Projektet](https://github.com/mourner/suncalc). | Kan återanvända beräkningar; är inte ett färdigt dataset med Köpenhamns byggnadsskuggor. |
| SunCalc.org | Webbverktyget visar solbana och solfaser för en plats och dag. [Webbplatsen](https://www.suncalc.org/). | Ska inte förväxlas med biblioteket eller antas erbjuda nedladdningsbara stadsskuggor. Någon sådan export är inte verifierad. |
| ShadeMap SDK | Leverantören beskriver integration med bland annat MapLibre/Mapbox och egna höjd-/byggnadsdata. [Utvecklarsidan](https://shademap.app/about/). | Kandidat för sol-/skugglager i vår egen kartupplevelse. Tillgång till SDK betyder inte automatiskt tillgång till rådata. |
| ShadeMap-export | Utvecklarens exempel visar export till GeoTIFF och en separat beräkning av sol längs en rutt. [Exportexempel](https://github.com/ted-piotrowski/shademap-examples/blob/main/docs/large-geotiff.md), [ruttexempel](https://github.com/ted-piotrowski/shademap-examples/blob/main/docs/route.md). | Tekniskt exportspår finns. Pris, villkor för lagring/återpublicering och resultatens lokala kvalitet återstår att verifiera. Exemplen har inte körts. |
| Yr / MET Norway | Yr:s utvecklarguide hänvisar till MET Weather API och Locationforecast. [Yr:s integrationsguide](https://developer.yr.no/doc/GettingStarted/). | Önskat primärt väderspår. En direktintegration med samma värden som varje vy på yr.no är inte verifierad. |

En exporterad skuggbild avser ett visst område och en viss tid; ackumulerad soltid över en dag anger inte när ett sammanhängande solfönster inträffar. Vi behöver resultat som kan kopplas till våra vistelseytor och flera tidpunkter, med känd upplösning, kvalitet och källa.

## Kartans riktning

Stor karta med platssökning, aktivitetsfilter, tydliga platsmarkörer och ett informationskort som kan dras upp från nederkanten på mobilen. Lägg till tidsreglage och ett av/på-val för sol-/skugglagret. Gatunamn, parker och platser ska förbli läsbara under lagret.

Google Maps är här en referens för interaktion och orienterbarhet. Valet av kartmotor, baskarta och skuggmotor görs separat efter prototypen. En snygg skuggrendering ska inte i sig avgöra platsrankningen.

## Nästa undersökning

Pröva i nästa utvecklingsfas om ShadeMap kan ge både användbar rendering och stabila resultat för tio ytor. Jämför standardunderlaget med eget DHM-underlag när det är möjligt. Kontrollera också exportens tidssemantik, beräkning utanför bildkanten, mobilprestanda och tillåtna sätt att lagra resultat. Bedöm därefter om egen skuggmotor behövs.

För Yr-spåret: prova Locationforecast för pilotområdet och säkerställ att prognosens olika tidsintervall visas korrekt. Dessa uppgifter ligger i [genomförandeplanen](07-genomforandeplan.md).
