# SunSpots färgpalett

Vald av användaren 2026-09-16, från **Sunspot Color palette.pdf**, sida 1.

| Färg | Hex | Användning |
| --- | --- | --- |
| Blå | `#567EA9` | Byggnadsskuggor, sittpunkt, fokusmarkeringar och rubrikaccent |
| Ljusblå | `#94B7FC` | Väderkort, aktiva kartreglage och barernas kategoriillustrationer |
| Gräsgrön | `#9DC471` | Touchgrass, parkytor, parkmarkörer och parkernas kategoriillustrationer |
| Solgul | `#FFDD6F` | Logotyp, huvudknappar, vald dag, tidsreglage och restaurangillustrationer |
| Crème | `#FFF8CD` | Sidbakgrund, solinformation och nedtonad omgivning i Touchgrass |

Vita kort ger lugna läsytor. Mörkblå text (`#243A52`) och sekundär text (`#4C627A`) kompletterar paletten för läsbarhet. På ljusblått och grönt används den mörkare texten. Huvudtexten har minst 5,79:1 kontrast mot de fyra ljusa basfärgerna och vitt; sekundär text används på vitt, crème och gult med minst 4,74:1. Fel och destruktiva åtgärder behåller röd signalfärg.

Färgerna definieras som CSS-variabler i `src/styles.css`. `src/theme.js` läser samma variabler för Leaflet och Canvas, så kartlagren följer gränssnittets tema. Basens rasterkarta kommer från OpenStreetMap och har sina egna kartfärger. Parkfyllning och skuggor visas med transparens för att kartdetaljer ska vara läsbara.

Färg används tillsammans med text, ikoner, konturer och valmarkeringar. Grönt betyder parkyta; blå skugga betyder beräknad byggnadsskugga. Ingen av färgerna är en vädergaranti.

Verifierat 2026-09-16: produktionsbygge och befintligt webbläsartest passerar. Datorvyn (1440 × 1000), Touchgrass, mobilvyn (390 × 844) och mobilinbjudan har granskats visuellt. Beräknad textkontrast kontrollerades i Touchgrass-vyn utan underkända kombinationer. Detta är en riktad färgkontroll, inte en fullständig tillgänglighetsrevision.
