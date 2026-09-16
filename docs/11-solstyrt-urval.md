# Solen styr urval och nästa stopp

Produktinriktning från användaren 2026-09-16, implementerad som lokal version 0.3.

## Önskat beteende

En användare sitter på en bar på Nørrebro. Appen följer den valda utomhuspunkten och visar ungefär hur länge den har byggnadssol. När cirka tio minuter återstår får användaren en varning och förslag på nästa bar i närheten med sol efter förflyttning och under den önskade vistelsen.

När tidsreglaget flyttas ska skuggade barer/restauranger försvinna från lista och kartmarkörer. En redan vald plats eller bevakning ligger kvar som detalj, med sitt nya status, så att användaren förstår varför den försvann. Parker har annan logik: delvis soliga parkytor är fortfarande relevanta och behålls.

## Modellen som nu körs

- 26 platser: de tidigare sju samt 19 OSM-noder med registrerad uteservering i Nørrebro-utdraget. Det är inte en komplett stadsinventering.
- Bar/restaurang: en utomhuspunkt. Om OSM-punkten ligger i en byggnad väljs en närliggande punkt utanför konturen, högst 60 m bort. Det är en synlig, uttryckligen uppskattad modellpunkt; inte en verifierad uteservering eller sittbar yta. En okontrollerad punkt kan hamna på gata eller olämplig sida. Användaren kan ange en egen punkt inom 100 m. En punkt inne i en byggnad ger okänt solläge.
- Park: ett 10 × 10-rutnät över parkens omslutande rektangel, klippt till parkpolygonen. Provpunkter i byggnader eller registrerat vatten utesluts. Andelen soliga provpunkter visas. Minst en solig provpunkt räcker för att behålla parken. Det är inte en kartläggning av sittbara gräsytor och tar inte hänsyn till träd.
- Skuggor: en stråle från markpunkten mot solen testas mot byggnadsprismor med samma footprint, höjd och solposition som kartlagret. Innergårdshål bevaras. Night = skugga; solhöjd 0–5° eller utanför täckningsmarginal = okänt. Okänt omvandlas aldrig till sol.
- Framtid: punktplatser provas per minut, parker var femte minut, upp till tre timmar framåt. Parkandel och gränser är approximativa. Minst-tid avslutas vid sista kända tid innan täckningen blir okänd.
- Standardfilter: dölj skuggade platser, känt stängda platser och ställen med `outdoor_seating=no`. Okända tillstånd ligger kvar märkta. Ett separat filter kräver tolkbara, öppna OSM-tider.
- Beräkningen sker i en Web Worker. Ett pågående jobb får slutföras; vid många sliderändringar behålls bara den senaste väntande begäran. Gamla resultat används inte som status för den nya tiden.

## Varning och nästa ställe

`Bevaka solen här` visar en förhandsvisning vid vald tid. Den blir en varning när 1–10 minuter återstår till beräknad skugga. `Följ klockan nu` uppdaterar verklig Köpenhamnstid var 15:e sekund och vid återgång till fliken. Ändring av datum eller slider går tillbaka till planeringsläge.

Systemnotiser begärs bara via en användartryckt knapp. De skickas bara i klockläge för självvald punkt, med beviljad behörighet. Samma punkt och beräknade skuggövergång ger högst en notis under den pågående bevakningen. Nekad/ej stödd notis ger fortsatt varning i gränssnittet. Ingen service worker, pushserver eller prenumerationslagring finns ännu. En öppen flik kan pausas av operativsystemet; detta är inte en tillförlitlig bakgrundsbevakning.

Nästa-förslag använder samma kategori och högst 1,5 km fågelväg från bevakad punkt. Gångtid uppskattas med faktor 1,3 och 75 m/min. Detta är inte verklig ruttberäkning och kan missa barriärer eller stängda passager. Sol krävs vid ankomst och i varje tidsprov under hela önskade vistelsen. Kända öppettider måste täcka vistelsen. Öppna ställen rankas före okända öppettider, därefter uppskattad gångtid. Uppskattade sittplatser märks även i förslagen.

## Öppettider och Google

OSM:s öppettider är en källsnapshot, inte liveinformation. Veckodagar, tidsintervall, midnattsöverskridande tider och `24/7` stöds. Säsongsregler, helgdagar, kommentarer och öppna sluttider behandlas som okända och kan läsas i källan. Därmed används ingen påhittad reservöppettid. Kontroll av uteserveringens egna tider återstår.

Google Places kan leverera `currentOpeningHours` och `regularOpeningHours`. Det kräver ett konfigurerat Google Maps Platform-projekt, API-åtkomst och fakturering. Inget sådant konto eller någon nyckel finns konfigurerad i SunSpot. [Fält och API](https://developers.google.com/maps/documentation/places/web-service/place-details).

För nya integrationer under Googles EES-villkor begränsar avsnitt 15 användning av vanlig Places API-information tillsammans med kartor. Places UI Kit är undantaget. Därför kopplar vi inte in ett vanligt Places-svar som öppettidsfilter på Leaflet-kartan utan att välja en tillåten integration för det aktuella kontot. UI Kit är ett möjligt spår för visning; åtkomst till data för egen filtrering och kombination behöver bekräftas separat. Ingen skrapning eller lokal Google-katalog byggs. [Aktuella EES-villkor, avsnitt 15–16](https://cloud.google.com/terms/maps-platform/eea/maps-service-terms), [Googles integrationsöversikt](https://developers.google.com/maps/comms/eea/faq).

## Nästa steg före en verklig pilot

1. Verifiera uteserveringsytor och skuggövergångar på plats, särskilt byggnadshöjder, takutsprång, träd och parasoller. Ange osäkerhetsintervall i stället för att lova minutprecision.
2. Välj och anslut en öppettidskälla för produktion, med verkliga undantag och uteserveringstider. Slutför Google-spåret om användaren har ett lämpligt konto.
3. Lägg till gångvägar och barriärer så att ankomsttid kan räknas ut från en faktisk rutt.
4. Publicera på HTTPS och implementera service worker + serverbaserad pushbevakning med uppsägning, deduplicering, omräkning och samtycke. Testa låst telefon och stängd app.
5. Låt användaren dela en sittplats med träffen. Nu sparas punkten bara i den egna webbläsaren och följer inte inbjudan.
