
import React, { useState, useEffect, useMemo } from 'react';
import { searchBusinesses, suggestTranslation } from './services/geminiService';
import { Business, SearchState, LocationCoords } from './types';
import BusinessTable from './components/BusinessTable';

type LocationHierarchy = Record<string, Record<string, string[]>>;

const LOCATION_DATA: LocationHierarchy = {
  "Polska": {
    "Dolnośląskie": ["Wrocław", "Jelenia Góra", "Legnica", "Wałbrzych", "bolesławiecki", "dzierżoniowski", "głogowski", "górowski", "jaworski", "kamiennogórski", "kłodzki", "legnicki", "lubański", "lubiński", "lwówecki", "milicki", "oleśnicki", "oławski", "polkowicki", "strzeliński", "średzki", "świdnicki", "trzebnicki", "wałbrzyski", "wołowski", "wrocławski", "ząbkowicki", "zgorzelecki", "złotoryjski"],
    "Kujawsko-Pomorskie": ["Bydgoszcz", "Toruń", "Włocławek", "Grudziądz", "aleksandrowski", "brodnicki", "bydgoski", "chełmiński", "golubsko-dobrzyński", "grudziądzki", "inowrocławski", "lipnowski", "mogileński", "nakielski", "radziejowski", "rypiński", "sępoleński", "świecki", "toruński", "tucholski", "wąbrzeski", "włocławski", "żniński"],
    "Lubelskie": ["Lublin", "Biała Podlaska", "Chełm", "Zamość", "bialski", "biłgorajski", "chełmski", "hrubieszowski", "janowski", "krasnostawski", "kraśnicki", "lubartowski", "lubelski", "łęczyński", "łukowski", "opolski", "parczewski", "puławski", "radzyński", "rycki", "świdnicki", "tomaszowski", "włodawski", "zamojski"],
    "Lubuskie": ["Gorzów Wielkopolski", "Zielona Góra", "gorzowski", "krośnieński", "międzyrzecki", "nowosolski", "słubicki", "strzelecko-drezdenecki", "sulęciński", "świebodziński", "wschowski", "zielonogórski", "żagański", "żarski"],
    "Łódzkie": ["Łódź", "Piotrków Trybumalski", "Skierniewice", "bełchatowski", "brzeziński", "kutnowski", "łaski", "łęczycki", "łowicki", "łódzki wschodni", "opoczyński", "pabianicki", "pajęczański", "piotrkowski", "poddębicki", "radomszczański", "rawski", "sieradzki", "skierniewicki", "tomaszowski", "wieluński", "wieruszowski", "zduńskowolski", "zgierski"],
    "Małopolskie": ["Kraków", "Nowy Sącz", "Tarnów", "bocheński", "brzeski", "chrzanowski", "dąbrowski", "gorlicki", "krakowski", "limanowski", "miechowski", "myślenicki", "nowosądecki", "nowotarski", "olkuski", "oświęcimski", "proszowicki", "suszki", "tarnowski", "tatrzański", "wadowicki", "wielicki"],
    "Mazowieckie": ["Warszawa", "Ostrołęka", "Płock", "Radom", "Siedlce", "białobrzeski", "ciechanowski", "garwoliński", "gostyniński", "grodziski", "grójecki", "kozienicki", "legionowski", "lipski", "łosicki", "makowski", "miński", "mławski", "nowodworski", "ostrołęcki", "ostrowski", "otwocki", "piaseczyński", "płocki", "płoński", "pruszkowski", "przasnyski", "przysuski", "pułtuski", "radomski", "siedlecki", "sierpecki", "sochaczewski", "sokołowski", "szydłowiecki", "warszawski zachodni", "węgrowski", "wołożyński", "wyszkowski", "zwoleński", "żuromiński", "żyrardowski"],
    "Opolskie": ["Opole", "brzeski", "głubczycki", "kędzierzyńsko-kozielski", "kluczborski", "krapkowicki", "namysłowski", "nyski", "oleski", "opolski", "prudnicki", "strzelecki"],
    "Podkarpackie": ["Rzeszów", "Krosno", "Przemyśl", "Tarnobrzeg", "bieszczadzki", "brzozowski", "dębicki", "jarosławski", "jasielski", "kolbuszowski", "krośnieński", "leski", "leżajski", "lubaczowski", "łańcucki", "mielecki", "niżański", "przemyski", "przeworski", "ropczycko-sędziszowski", "rzeszowski", "sanocki", "stalowowolski", "strzyżowski", "tarnobrzeski"],
    "Podlaskie": ["Białystok", "Łomża", "Suwałki", "augustowski", "białostocki", "bielski", "grajewski", "hajnowski", "kolneński", "łomżyński", "moniecki", "sejneński", "siemiatycki", "sokólski", "suwalski", "wysokomazowiecki", "zambrowski"],
    "Pomorskie": ["Gdańsk", "Gdynia", "Słupsk", "Sopot", "bytowski", "chojnicki", "człuchowski", "gdański", "kartuski", "kościerski", "kwidzyński", "lęborski", "malborski", "nowodworski", "pucki", "słupski", "starogardzki", "sztumski", "tczewski", "wejherowski"],
    "Śląskie": ["Katowice", "Bielsko-Biała", "Bytom", "Chorzów", "Częstochowa", "Dąbrowa Górnicza", "Gliwice", "Jastrzębie-Zdrój", "Jaworzno", "Mysłowice", "Piekary Śląskie", "Ruda Śląska", "Rybnik", "Siemianowice Śląskie", "Sosnowiec", "Świętochłowice", "Tychy", "Zabrze", "Żory", "będziński", "bielski", "bieruńsko-lędziński", "cieszyński", "częstochowski", "gliwicki", "kłobucki", "lubliniecki", "mikołowski", "myszkowski", "pszczyński", "raciborski", "rybnicki", "tarnogórski", "wodzisławski", "zawierciański", "żywiecki"],
    "Świętokrzyskie": ["Kielce", "buski", "jędrzejowski", "kazimierski", "kielecki", "konecki", "opatowski", "ostrowiecki", "pińczowski", "sandomierski", "skarżyski", "starachowicki", "staszowski", "włoszczowski"],
    "Warmińsko-Mazurskie": ["Olsztyn", "Elbląg", "bartoszycki", "braniewski", "działdowski", "elbląski", "ełcki", "giżycki", "gołdapski", "iławski", "kętrzyński", "lidzbarski", "mrągowski", "nidzicki", "nowomiejski", "olecki", "olsztyński", "ostródzki", "piski", "szczycieński", "węgorzewski"],
    "Wielkopolskie": ["Poznań", "Kalisz", "Konin", "Leszno", "chodzieski", "czarnkowsko-trzcianecki", "gnieźnieński", "gostyński", "grodziski", "jarociński", "kaliski", "kępiński", "kolski", "koniński", "kościański", "krotoszyński", "leszczyński", "międzychodzki", "nowotomyski", "obornicki", "ostrowski", "ostrzeszowski", "pilski", "pleszewski", "poznański", "rawicki", "słupecki", "szamotulski", "średzki", "śremski", "turecki", "wągrowiecki", "wolsztyński", "wrzesiński", "złotowski"],
    "Zachodniopomorskie": ["Szczecin", "Koszalin", "Świnoujście", "białogardzki", "choszczeński", "drawski", "goleniowski", "gryficki", "gryfiński", "kamieński", "kołobrzeski", "koszaliński", "myśliborski", "policki", "pyrzycki", "sławieński", "stargardzki", "szczecinecki", "świdwiński", "wałecki"]
  },
  "Niemcy": {
    "Baden-Württemberg": ["Stuttgart", "Mannheim", "Karlsruhe", "Freiburg", "Heidelberg", "Heilbronn", "Ulm", "Pforzheim", "Alb-Donau-Kreis", "Biberach", "Böblingen", "Bodenseekreis", "Breisgau-Hochschwarzwald", "Calw", "Emmendingen", "Enzkreis", "Esslingen", "Freudenstadt", "Göppingen", "Heidenheim", "Hohenlohekreis", "Konstanz", "Lörrach", "Ludwigsburg", "Main-Tauber-Kreis", "Neckar-Odenwald-Kreis", "Ortenaukreis", "Ostalbkreis", "Rastatt", "Ravensburg", "Rems-Murr-Kreis", "Reutlingen", "Rhein-Neckar-Kreis", "Rottweil", "Schwäbisch Hall", "Sigmaringen", "Tübingen", "Tuttlingen", "Waldshut", "Zollernalbkreis"],
    "Bayern": ["München", "Nürnberg", "Augsburg", "Regensburg", "Ingolstadt", "Fürth", "Würzburg", "Erlangen", "Bamberg", "Bayreuth", "Landshut", "Passau", "Aichach-Friedberg", "Altötting", "Amberg-Sulzbach", "Ansbach", "Aschaffenburg", "Bad Kissingen", "Bad Tölz-Wolfratshausen", "Berchtesgadener Land", "Cham", "Coburg", "Dachau", "Deggendorf", "Dillingen a.d. Donau", "Dingolfing-Landau", "Donau-Ries", "Ebersberg", "Eichstätt", "Erding", "Forchheim", "Freising", "Freyung-Grafenau", "Fürstenfeldbruck", "Garmisch-Partenkirchen", "Günzburg", "Haßberge", "Hof", "Kelheim", "Kitzingen", "Kronach", "Kulmbach", "Landsberg am Lech", "Lichtenfels", "Lindau", "Main-Spessart", "Miesbach", "Miltenberg", "Mühldorf a. Inn", "Neu-Ulm", "Neuburg-Schrobenhausen", "Neumarkt i.d. OPf.", "Neustadt a.d. Aisch-Bad Windsheim", "Neustadt a.d. Waldnaab", "Nürnberger Land", "Oberallgäu", "Ostallgäu", "Pfaffenhofen a.d. Ilm", "Regen", "Rhön-Grabfeld", "Rosenheim", "Roth", "Rottal-Inn", "Schwandorf", "Schweinfurt", "Starnberg", "Straubing-Bogen", "Tirschenreuth", "Traunstein", "Unterallgäu", "Weißenburg-Gunzenhausen", "Wunsiedel i. Fichtelgebirge", "Würzburg"],
    "Berlin": ["Berlin (Stadtstaat)", "Mitte", "Friedrichshain-Kreuzberg", "Pankow", "Charlottenburg-Wilmersdorf", "Spandau", "Steglitz-Zehlendorf", "Tempelhof-Schöneberg", "Neukölln", "Treptow-Köpenick", "Marzahn-Hellersdorf", "Lichtenberg", "Reinickendorf"],
    "Brandenburg": ["Potsdam", "Cottbus", "Brandenburg an der Havel", "Frankfurt (Oder)", "Barnim", "Dahme-Spreewald", "Elbe-Elster", "Havelland", "Märkisch-Oderland", "Oberhavel", "Oberspreewald-Lausitz", "Oder-Spree", "Ostprignitz-Ruppin", "Potsdam-Mittelmark", "Prignitz", "Spree-Neiße", "Teltow-Fläming", "Uckermark"],
    "Bremen": ["Bremen (Stadt)", "Bremerhaven"],
    "Hamburg": ["Hamburg (Stadtstaat)", "Altona", "Bergedorf", "Eimsbüttel", "Hamburg-Mitte", "Hamburg-Nord", "Harburg", "Wandsbek"],
    "Hessen": ["Frankfurt am Main", "Wiesbaden", "Kassel", "Darmstadt", "Offenbach am Main", "Bergstraße", "Darmstadt-Dieburg", "Fulda", "Giessen", "Groś-Gerau", "Hersfeld-Rotenburg", "Hochtaunykreis", "Lahn-Dill-Kreis", "Limburg-Weilburg", "Main-Kinzig-Kreis", "Main-Taunus-Kreis", "Marburg-Biedenkopf", "Odenwaldkreis", "Offenbach", "Rheingau-Taunus-Kreis", "Schwalm-Eder-Kreis", "Vogelsbergkreis", "Waldeck-Frankenberg", "Werra-Meißner-Kreis", "Wetteraukreis"],
    "Mecklenburg-Vorpommern": ["Rostock", "Schwerin", "Ludwigslust-Parchim", "Mecklenburgische Seenplatte", "Nordwestmecklenburg", "Vorpommern-Greifswald", "Vorpommern-Rügen"],
    "Niedersachsen": ["Hannover", "Braunschweig", "Osnabrück", "Oldenburg", "Wolfsburg", "Göttingen", "Salzgitter", "Ammerland", "Aurich", "Celle", "Cloppenburg", "Cuxhaven", "Diepholz", "Emsland", "Friesland", "Gifhorn", "Goslar", "Grafschaft Bentheim", "Hameln-Pyrmont", "Harburg", "Heidekreis", "Helmstedt", "Hildesheim", "Holzminden", "Leer", "Lüchow-Dannenberg", "Lüneburg", "Nienburg/Weser", "Northeim", "Osterholz", "Peine", "Rotenburg (Wümme)", "Schaumburg", "Stade", "Uelzen", "Vechta", "Verden", "Wesermarsch", "Wittmund", "Wolfenbüttel"],
    "Nordrhein-Westfalen": ["Köln", "Düsseldorf", "Dortmund", "Essen", "Duisburg", "Bochum", "Wuppertal", "Bielefeld", "Bonn", "Münster", "Gelsenkirchen", "Mönchengladbach", "Aachen", "Borken", "Coesfeld", "Düren", "Ennepe-Ruhr-Kreis", "Euskirchen", "Gütersloh", "Heinsberg", "Herford", "Hochsauerlandkreis", "Höxter", "Kleve", "Lippe", "Märkischer Kreis", "Mettmann", "Minden-Lübbecke", "Oberbergischer Kreis", "Olpe", "Paderborn", "Recklinghausen", "Rhein-Erft-Kreis", "Rhein-Kreis Neuss", "Rhein-Sieg-Kreis", "Rheinisch-Bergischer Kreis", "Siegen-Wittgenstein", "Soest", "Steinfurt", "Unna", "Viersen", "Warendorf", "Wesel"],
    "Rheinland-Pfalz": ["Mainz", "Ludwigshafen", "Koblenz", "Trier", "Kaiserslautern", "Ahrweiler", "Altenkirchen", "Alzey-Worms", "Bad Dürkheim", "Bad Kreuznach", "Bernkastel-Wittlich", "Birkenfeld", "Cochem-Zell", "Donnersbergkreis", "Eifelkreis Bitburg-Prüm", "Germersheim", "Kusel", "Mainz-Bingen", "Mayen-Koblenz", "Neuwied", "Rhein-Hunsrück-Kreis", "Rhein-Lahn-Kreis", "Rhein-Pfalz-Kreis", "Südliche Weinstraße", "Südwestpfalz", "Trier-Saarburg", "Vulkaneifel", "Westerwaldkreis"],
    "Saarland": ["Saarbrücken", "Merzig-Wadern", "Neunkirchen", "Saarlouis", "Saarpfalz-Kreis", "St. Wendel"],
    "Sachsen": ["Leipzig", "Dresden", "Chemnitz", "Bautzen", "Erzgebirgskreis", "Görlitz", "Meißen", "Mittelsachsen", "Nordsachsen", "Sächsische Schweiz-Osterzgebirge", "Vogtlandkreis", "Zwickau"],
    "Sachsen-Anhalt": ["Magdeburg", "Halle (Saale)", "Dessau-Roßlau", "Altmarkkreis Salzwedel", "Anhalt-Bitterfeld", "Börde", "Burgenlandkreis", "Harz", "Jerichower Land", "Mansfeld-Südharz", "Saalekreis", "Salzlandkreis", "Stendal", "Wittenberg"],
    "Schleswig-Holstein": ["Kiel", "Lübeck", "Flensburg", "Neumünster", "Dithmarschen", "Herzogtum Lauenburg", "Nordfriesland", "Ostholstein", "Pinneberg", "Plön", "Rendsburg-Eckernförde", "Schleswig-Flensburg", "Segeberg", "Steinburg", "Stormarn"],
    "Thüringen": ["Erfurt", "Jena", "Gera", "Weimar", "Altenburger Land", "Eichsfeld", "Gotha", "Greiz", "Hildburghausen", "Ilm-Kreis", "Kyffhäuserkreis", "Nordhausen", "Saale-Holzland-Kreis", "Saale-Orla-Kreis", "Saalfeld-Rudolstadt", "Schmalkalden-Meiningen", "Sömmerda", "Sonneberg", "Unstrut-Hainich-Kreis", "Wartburgkreis", "Weimarer Land"]
  },
  "Rumunia": {
    "Regiony (Județe)": [
      "Alba", "Arad", "Argeś", "Bacău", "Bihor", "Bistrița-Năsăud", "Botośani", "Braśov", "Brăila", "Bucureśti",
      "Buzău", "Caraś-Severin", "Călaraśi", "Cluj", "Constanța", "Covasna", "Dâmbovița", "Dolj", "Galați", 
      "Giurgiu", "Gorj", "Harghita", "Hunedoara", "Ialomița", "Iaśi", "Ilfov", "Maramureś", "Mehedinți", 
      "Mureś", "Neamț", "Olt", "Prahova", "Satu Mare", "Sălaj", "Sibiu", "Suceava", "Teleorman", "Timiś", 
      "Tulcea", "Vaslui", "Vâlcea", "Vrancea"
    ]
  },
  "Litwa": {
    "Alytaus": ["Alytus miestas", "Alytaus rajonas", "Druskininkai", "Lazdijai", "Varėna"],
    "Kauno": ["Kaunas miestas", "Kauno rajonas", "Birštonas", "Jonava", "Kaišiadorys", "Kėdainiai", "Prienai", "Raseiniai"],
    "Klaipėdos": ["Klaipėda miestas", "Klaipėdos rajonas", "Neringa", "Palanga", "Skuodas", "Šilutė", "Kretinga"],
    "Marijampolės": ["Marijampolė", "Vilkaviškis", "Kalvarija", "Kazlų Rūda", "Šakiai"],
    "Panevėžio": ["Panevėžys miestas", "Panevėžio rajonas", "Biržai", "Kupiškis", "Pasvalys", "Rokiškis"],
    "Šiaulių": ["Šiauliai miestas", "Šiaulių rajonas", "Akmenė", "Joniškis", "Kelmė", "Pakruojis", "Radviliškis"],
    "Tauragės": ["Tauragė", "Jurbarkas", "Pagęgiai", "Šilalė"],
    "Telšių": ["Telšiai", "Mażeikiai", "Plungę", "Rietavas"],
    "Utenos": ["Utena", "Anykščiai", "Ignalina", "Molętai", "Zarasai", "Visaginas"],
    "Vilniaus": ["Vilnius miestas", "Vilniaus rajonas", "Elektręnai", "Šalčininkai", "Širvintos", "Švenčionys", "Trakai", "Ukmergę"]
  },
  "Łotwa": {
    "Miasta Wydzielone": ["Rīga", "Daugavpils", "Jelgava", "Jūrmala", "Liepāja", "Rēzekne", "Ventspils"],
    "Municypia (Novadi)": [
      "Aizkraukles", "Alūksnes", "Augśdaugavas", "Ādażu", "Balvu", "Bauskas", "Cēsu", "Dienvidkurzemes",
      "Dobeles", "Gulbenes", "Jelgavas", "Jēkabpils", "Ķekavas", "Krāslavas", "Kuldīgas", "Limbażu",
      "Līvānu", "Ludzas", "Madonas", "Mārupes", "Ogres", "Olaines", "Preiļu", "Rēzeknes", "Ropażu",
      "Salaspils", "Saldus", "Saulkrastu", "Siguldas", "Smiltenes", "Talsu", "Tukuma", "Valkas",
      "Valmieras", "Varakļānu", "Ventspils"
    ]
  },
  "Austria": {
    "Burgenland": ["Eisenstadt", "Rust", "Eisenstadt-Umgebung", "Güssing", "Jennersdorf", "Mattersburg", "Neusiedl am See", "Oberpullendorf", "Oberwart"],
    "Kärnten": ["Klagenfurt am Wörthersee", "Villach", "Feldkirchen", "Hermagor", "Klagenfurt-Land", "St. Veit an der Glan", "Spittal an der Drau", "Villach-Land", "Völkermarkt", "Wolfsberg"],
    "Niederösterreich": ["St. Pölten", "Krems an der Donau", "Waidhofen an der Ybbs", "Wiener Neustadt", "Amstetten", "Baden", "Bruck an der Leitha", "Gänserndorf", "Gmünd", "Hollabrunn", "Horn", "Korneuburg", "Krems", "Lilienfeld", "Melk", "Mistelbach", "Mödling", "Neunkirchen", "St. Pölten-Land", "Scheibbs", "Tulln", "Waidhofen an der Thaya", "Wiener Neustadt-Land", "Zwettl"],
    "Oberösterreich": ["Linz", "Steyr", "Wels", "Braunau am Inn", "Eferding", "Freistadt", "Gmunden", "Grieskirchen", "Kirchdorf an der Krems", "Linz-Land", "Perg", "Ried im Innkreis", "Rohrbach", "Schärding", "Steyr-Land", "Urfahr-Umgebung", "Vöcklabruck", "Wels-Land"],
    "Salzburg": ["Salzburg", "Hallein", "Salzburg-Umgebung", "St. Johann im Pongau", "Tamsweg", "Zell am See"],
    "Steiermark": ["Graz", "Deutschlandsberg", "Graz-Umgebung", "Hartberg-Fürstenfeld", "Leibnitz", "Leoben", "Liezen", "Murau", "Murtal", "Südoststeiermark", "Voitsberg", "Weiz"],
    "Tirol": ["Innsbruck", "Imst", "Innsbruck-Land", "Kitzbühel", "Kitzbühel", "Kufstein", "Landeck", "Lienz", "Reutte", "Schwaz"],
    "Vorarlberg": ["Bregenz", "Dornbirn", "Feldkirch", "Bludenz"],
    "Wien": ["Wien (Stadtbezirke 1-23)"]
  },
  "Węgry": {
    "Budapest": ["Budapest"],
    "Bács-Kiskun": ["Kecskemét", "Baja", "Kiskunfélegyháza", "Kalocsa", "Kiskőrös"],
    "Baranya": ["Pécs", "Komló", "Mohács", "Szigetvár", "Siklós"],
    "Békés": ["Békéscsaba", "Gyula", "Orosháza", "Szarvas", "Mezőberény"],
    "Borsod-Abaúj-Zemplén": ["Miskolc", "Ózd", "Kazincbarcika", "Mezőkövesd", "Szerencs"],
    "Csongrád-Csanád": ["Szeged", "Hódmezővásárhely", "Szentes", "Makó", "Csongrád"],
    "Fejér": ["Székesfehérvár", "Dunaújváros", "Mór", "Bicske", "Sárbogárd"],
    "Győr-Moson-Sopron": ["Győr", "Sopron", "Mosonmagyaróvár", "Csorna", "Kapuvár"],
    "Hajdú-Bihar": ["Debrecen", "Hajdúböszörmény", "Hajdúszoboszló", "Balmazújváros", "Berettyóújfalu"],
    "Heves": ["Eger", "Gyöngyös", "Hatvan", "Heves", "Füzesabony"],
    "Jász-Nagykun-Szolnok": ["Szolnok", "Jászberény", "Törökszentmiklós", "Karcag", "Mezőtúr"],
    "Komárom-Esztergom": ["Tatabánya", "Esztergom", "Tata", "Komárom", "Oroszlány"],
    "Nógrád": ["Salgótarján", "Balassagyarmat", "Bátonyterenye", "Pásytó"],
    "Pest": ["Érd", "Cegléd", "Vác", "Gödöllő", "Dunakeszi", "Szigetszentmiklós", "Nagykőrös"],
    "Somogy": ["Kaposvár", "Siófok", "Marcali", "Barcs", "Nagyatád"],
    "Szabolcs-Szatmár-Bereg": ["Nyíregyháza", "Mátészalka", "Kisvárda", "Tiszavasvári", "Nyírbátor"],
    "Tolna": ["Szekszárd", "Paks", "Dombóvár", "Bonyhád", "Tolna"],
    "Vas": ["Szombathely", "Sárvár", "Körmend", "Kőszeg", "Celldömölk"],
    "Veszprém": ["Veszprém", "Pápa", "Ajka", "Várpalota", "Tapolca", "Balatonfüred"],
    "Zala": ["Zalaegerszeg", "Nagykanizsa", "Keszthely", "Lenti"]
  },
  "Czechy": {
    "Praha": ["Praha"],
    "Středočeský kraj": ["Benešov", "Beroun", "Kladno", "Kolín", "Kutná Hora", "Mělník", "Mladá Boleslav", "Nymburk", "Praha-východ", "Praha-západ", "Příbram", "Rakovník"],
    "Jihočeský kraj": ["České Budějovice", "Český Krumlov", "Jindřichův Hradec", "Písek", "Prachatice", "Strakonice", "Tábor"],
    "Plzeňský kraj": ["Domažlice", "Klatovy", "Plzeň-město", "Plzeň-jih", "Plzeň-sever", "Rokycany", "Tachov"],
    "Karlovarský kraj": ["Cheb", "Karlovy Vary", "Sokolov"],
    "Ústecký kraj": ["Děčín", "Chomutov", "Litoměřice", "Louny", "Most", "Teplice", "Ústí nad Labem"],
    "Liberecký kraj": ["Česká Lípa", "Jablonec nad Nisou", "Liberec", "Semily"],
    "Královéhradecký kraj": ["Hradec Králové", "Jičín", "Náchod", "Rychnov nad Kněžnou", "Trutnov"],
    "Pardubický kraj": ["Chrudim", "Pardubice", "Svitavy", "Ústí nad Orlicí"],
    "Kraj Vysočina": ["Havlíčkův Brod", "Jihlava", "Pelhřimov", "Třebíč", "Žďár nad Sázavou"],
    "Jihomoravský kraj": ["Blansko", "Brno-město", "Brno-venkov", "Břeclav", "Hodonín", "Vyškov", "Znojmo"],
    "Olomoucký kraj": ["Jeseník", "Olomouc", "Prostějov", "Přerov", "Šumperk"],
    "Moravskoslezský kraj": ["Bruntál", "Frýdek-Místek", "Karviná", "Nový Jičín", "Opava", "Ostrava-město"],
    "Zlínský kraj": ["Kroměříž", "Uherské Hradiště", "Vsetín", "Zlín"]
  },
  "Słowacja": {
    "Bratislavský kraj": ["Bratislava I-V", "Malacky", "Pezinok", "Senec"],
    "Trnavský kraj": ["Dunajská Streda", "Galanta", "Hlohovec", "Piešťany", "Senica", "Skalica", "Trnava"],
    "Trenčiansky kraj": ["Bánovce nad Bebravou", "Ilava", "Myjava", "Nové Mesto nad Váhom", "Partizánske", "Považská Bystrica", "Prievidza", "Púchov", "Trenčín"],
    "Nitriansky kraj": ["Komárno", "Levice", "Nitra", "Nové Zámky", "Šaľa", "Topoľčany", "Zlaté Moravce"],
    "Žilinský kraj": ["Bytča", "Čadca", "Dolný Kubín", "Kysucké Nové Mesto", "Liptovský Mikuláš", "Martin", "Námestovo", "Ružomberok", "Turčianske Teplice", "Tvrdośín", "Žilina"],
    "Banskobystrický kraj": ["Banská Bystrica", "Banská Štiavnica", "Brezno", "Detva", "Krupina", "Lučenec", "Poltár", "Revúca", "Rimavská Sobota", "Veľký Krtíš", "Zvolen", "Žarnovica", "Žiar nad Hronom"],
    "Prešovský kraj": ["Bardejov", "Humenné", "Kežmarok", "Levoča", "Medzilaborce", "Poprad", "Preśov", "Sabinov", "Snina", "Stará Ľubovňa", "Stropkov", "Svidník", "Vranov nad Topľou"],
    "Kośický kraj": ["Gelnica", "Košice I-IV", "Košice-okolie", "Michalovce", "Rožňava", "Sobrance", "Spišská Nová Ves", "Trebišov"]
  },
  "Włochy": {
    "Abruzzo": ["L'Aquila", "Chieti", "Pescara", "Teramo"],
    "Basilicata": ["Potenza", "Matera"],
    "Calabria": ["Catanzaro", "Cosenza", "Crotone", "Reggio Calabria", "Vibo Valentia"],
    "Campania": ["Napoli", "Avellino", "Benevento", "Caserta", "Salerno"],
    "Emilia-Romagna": ["Bologna", "Ferrara", "Forlì-Cesena", "Modena", "Parma", "Piacenza", "Ravenna", "Reggio Emilia", "Rimini"],
    "Friuli-Venezia Giulia": ["Trieste", "Gorizia", "Pordenone", "Udine"],
    "Lazio": ["Roma", "Frosinone", "Latina", "Rieti", "Viterbo"],
    "Liguria": ["Genova", "Imperia", "La Spezia", "Savona"],
    "Lombardia": ["Milano", "Bergamo", "Brescia", "Como", "Cremona", "Lecco", "Lodi", "Mantova", "Monza e della Brianza", "Pavia", "Sondrio", "Varese"],
    "Marche": ["Ancona", "Ascoli Piceno", "Fermo", "Macerata", "Pesaro e Urbino"],
    "Molise": ["Campobasso", "Isernia"],
    "Piemonte": ["Torino", "Alessandria", "Asti", "Biella", "Cuneo", "Novara", "Verbano-Cusio-Ossola", "Vercelli"],
    "Puglia": ["Bari", "Barletta-Andria-Trani", "Brindisi", "Foggia", "Lecce", "Taranto"],
    "Sardegna": ["Cagliari", "Nuoro", "Oristano", "Sassari", "Sud Sardegna"],
    "Sicilia": ["Palermo", "Agrigento", "Caltanissetta", "Catania", "Enna", "Messina", "Ragusa", "Siracusa", "Trapani"],
    "Toscana": ["Firenze", "Arezzo", "Grosseto", "Livorno", "Lucca", "Massa-Carrara", "Pisa", "Pistoia", "Prato", "Siena"],
    "Trentino-Alto Adige": ["Bolzano", "Trento"],
    "Umbria": ["Perugia", "Terni"],
    "Valle d'Aosta": ["Aosta"],
    "Veneto": ["Venezia", "Belluno", "Padova", "Rovigo", "Treviso", "Verona", "Vicenza"]
  },
  "Holandia": {
    "Prowincje": [
      "Drenthe", "Flevoland", "Friesland", "Gelderland", "Groningen", "Limburg", 
      "Noord-Brabant", "Noord-Holland", "Overijssel", "Utrecht", "Zeeland", "Zuid-Holland"
    ]
  },
  "Belgia": {
    "Vlaanderen (Flandria)": [
      "Antwerpen", "Limburg", "Oost-Vlaanderen", "Vlaams-Brabant", "West-Vlaanderen"
    ],
    "Wallonie (Walonia)": [
      "Brabant Wallon", "Hainaut", "Liège", "Luxembourg", "Namur"
    ],
    "Bruxelles": ["Region Stołeczny Brukseli"]
  },
  "Finlandia": {
    "Uusimaa": ["Helsinki", "Loviisa", "Porvoo", "Raasepori"],
    "Varsinais-Suomi": ["Loimaa", "Salo", "Turku", "Vakka-Suomi", "Åboland-Turunmaa"],
    "Satakunta": ["Pohjois-Satakunta", "Rauma", "Pori"],
    "Kanta-Häme": ["Forssa", "Hämeenlinna", "Riihimäki"],
    "Pirkanmaa": ["Etelä-Pirkanmaa", "Lounais-Pirkanmaa", "Luoteis-Pirkanmaa", "Tampere", "Ylä-Pirkanmaa"],
    "Päijät-Häme": ["Lahti"],
    "Kymenlaakso": ["Kotka-Hamina", "Kouvola"],
    "Etelä-Karjala": ["Imatra", "Lappeenranta"],
    "Etelä-Savo": ["Mikkeli", "Pieksämäki", "Savonlinna"],
    "Pohjois-Savo": ["Koillis-Savo", "Kuopio", "Sisä-Savo", "Varkaus", "Ylä-Savo"],
    "Pohjois-Karjala": ["Joensuu", "Keski-Karjala", "Pielisen Karjala"],
    "Keski-Suomi": ["Joutsa", "Jyväskylä", "Jämsä", "Keuruu", "Saarijärvi-Viitasaari", "Äänekoski"],
    "Etelä-Pohjanmaa": ["Järviseutu", "Kuusiokunnat", "Seinäjoki", "Suupohja"],
    "Pohjanmaa": ["Pietarsaari", "Suupohjan rannikkoseutu", "Vaasa", "Kyrönmaa"],
    "Keski-Pohjanmaa": ["Kaustinen", "Kokkola"],
    "Pohjois-Pohjanmaa": ["Haapavesi-Siikalatva", "Koillismaa", "Nivala-Haapajärvi", "Oulu", "Oulunkaari", "Raahe", "Siikalatva"],
    "Kainuu": ["Kajaani", "Kehys-Kainuu"],
    "Lappi": ["Itä-Lappi", "Kemi-Tornio", "Pohjois-Lappi", "Rovaniemi", "Torniolaakso", "Tunturi-Lappi"],
    "Ahvenanmaa": ["Ålands landsbygd", "Ålands skärgård", "Mariehamn"]
  },
  "Francja": {
    "Auvergne-Rhône-Alpes": ["Ain", "Allier", "Ardèche", "Cantal", "Drôme", "Isère", "Loire", "Haute-Loire", "Puy-de-Dôme", "Rhône", "Savoie", "Haute-Savoie"],
    "Bourgogne-Franche-Comté": ["Côte-d'Or", "Doubs", "Jura", "Nièvre", "Haute-Saône", "Saône-et-Loire", "Yonne", "Territoire de Belfort"],
    "Bretagne": ["Côtes-d'Armor", "Finistère", "Ille-et-Vilaine", "Morbihan"],
    "Centre-Val de Loire": ["Cher", "Eure-et-Loir", "Indre", "Indre-et-Loire", "Loir-et-Cher", "Loiret"],
    "Grand Est": ["Ardennes", "Aube", "Marne", "Haute-Marne", "Meurthe-et-Moselle", "Meuse", "Moselle", "Bas-Rhin", "Haut-Rhin", "Vosges"],
    "Hauts-de-France": ["Aisne", "Nord", "Oise", "Pas-de-Calais", "Somme"],
    "Île-de-France": ["Paris", "Seine-et-Marne", "Yvelines", "Essonne", "Hauts-de-Seine", "Seine-Saint-Denis", "Val-de-Marne", "Val-d'Oise"],
    "Normandie": ["Calvados", "Eure", "Manche", "Orne", "Seine-Maritime"],
    "Nouvelle-Aquitaine": ["Charente", "Charente-Maritime", "Corrèze", "Creuse", "Dordogne", "Gironde", "Landes", "Lot-et-Garonne", "Pyrénées-Atlantiques", "Deux-Sèvres", "Vienne", "Haute-Vienne"],
    "Occitanie": ["Ariège", "Aude", "Aveyron", "Gard", "Haute-Garonne", "Gers", "Hérault", "Lot", "Lozère", "Hautes-Pyrénées", "Pyrénées-Orientales", "Tarn", "Tarn-et-Garonne"],
    "Pays de la Loire": ["Loire-Atlantique", "Maine-et-Loire", "Mayenne", "Sarthe", "Vendée"],
    "Provence-Alpes-Côte d'Azur": ["Alpes-de-Haute-Provence", "Hautes-Alpes", "Alpes-Maritimes", "Bouches-du-Rhône", "Var", "Vaucluse"],
    "Corse": ["Corse-du-Sud", "Haute-Corse"]
  }
};

const App: React.FC = () => {
  const [country, setCountry] = useState("Polska");
  const [region, setRegion] = useState(Object.keys(LOCATION_DATA["Polska"])[0]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [query, setQuery] = useState("maszyny rolnicze");
  const [translatedQuery, setTranslatedQuery] = useState("");
  const [coords, setCoords] = useState<LocationCoords | undefined>();
  
  const [showTranslationDialog, setShowTranslationDialog] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [state, setState] = useState<SearchState>({
    loading: false,
    error: null,
    results: []
  });

  useEffect(() => {
    const availableRegions = Object.keys(LOCATION_DATA[country] || {});
    if (availableRegions.length > 0 && !availableRegions.includes(region)) {
      setRegion(availableRegions[0]);
    }
    setSelectedDistricts([]);
  }, [country]);

  useEffect(() => {
    setSelectedDistricts([]);
  }, [region]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => console.log("Geolocation blocked:", error)
      );
    }
  }, []);

  const toggleDistrict = (d: string) => {
    setSelectedDistricts(prev => 
      prev.includes(d) ? prev.filter(item => item !== d) : [...prev, d]
    );
  };

  const currentDistricts = useMemo(() => {
    return LOCATION_DATA[country]?.[region] || [];
  }, [country, region]);

  const selectAllDistricts = () => {
    setSelectedDistricts([...currentDistricts]);
  };

  const clearDistricts = () => {
    setSelectedDistricts([]);
  };

  const handleStartProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDistricts.length === 0) {
      setState(prev => ({ ...prev, error: "Wybierz przynajmniej jeden powiat lub miasto!" }));
      return;
    }

    setIsTranslating(true);
    try {
      const suggestion = await suggestTranslation(query, country);
      setTranslatedQuery(suggestion);
      setShowTranslationDialog(true);
    } catch (err) {
      setTranslatedQuery(query);
      setShowTranslationDialog(true);
    } finally {
      setIsTranslating(false);
    }
  };

  const executeSearch = async () => {
    setShowTranslationDialog(false);
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { businesses, rawText } = await searchBusinesses(translatedQuery, country, region, selectedDistricts, coords);
      setState({
        loading: false,
        error: null,
        results: businesses,
        rawResponse: rawText
      });
    } catch (err: any) {
      setState({
        loading: false,
        error: err.message || "Błąd podczas generowania bazy danych. Spróbuj ponownie.",
        results: []
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <div className="inline-block p-4 bg-emerald-100 rounded-3xl mb-4 shadow-sm">
            <i className="fas fa-layer-group text-4xl text-emerald-600"></i>
          </div>
          <h1 className="text-5xl font-black text-slate-900 mb-2 tracking-tighter">
            Agro-Lead MultiFinder
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            Grupowe pozyskiwanie baz danych z wielu obszarów (Zoptymalizowane Filtrowanie)
          </p>
        </header>

        <form onSubmit={handleStartProcess} className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kraj</label>
              <select 
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none appearance-none cursor-pointer transition-all"
              >
                {Object.keys(LOCATION_DATA).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Województwo / Region</label>
              <select 
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none appearance-none cursor-pointer transition-all"
              >
                {Object.keys(LOCATION_DATA[country] || {}).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Szukana Fraza (PL)</label>
              <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="np. maszyny rolnicze"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end px-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Wybierz obszary ({selectedDistricts.length} zaznaczonych w regionie {region})
              </label>
              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={selectAllDistricts}
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest"
                >
                  Zaznacz wszystkie
                </button>
                <button 
                  type="button" 
                  onClick={clearDistricts}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                >
                  Wyczyść
                </button>
              </div>
            </div>
            
            <div className="bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 max-h-[300px] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentDistricts.length > 0 ? currentDistricts.map(d => (
                  <label 
                    key={`${region}-${d}`} 
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedDistricts.includes(d) 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm' 
                      : 'bg-white border-transparent hover:border-slate-200 text-slate-600'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={selectedDistricts.includes(d)}
                      onChange={() => toggleDistrict(d)}
                    />
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all ${
                      selectedDistricts.includes(d) ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200'
                    }`}>
                      {selectedDistricts.includes(d) && <i className="fas fa-check text-[10px]"></i>}
                    </div>
                    <span className="text-sm font-bold truncate">{d}</span>
                  </label>
                )) : (
                  <div className="col-span-full py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                    Brak danych dla wybranego regionu
                  </div>
                )}
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={state.loading || isTranslating || selectedDistricts.length === 0}
            className="mt-10 w-full bg-slate-900 hover:bg-black text-white py-6 rounded-3xl font-black text-xl transition-all transform hover:-translate-y-1 active:translate-y-0 shadow-2xl disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-4 group"
          >
            {isTranslating ? (
              <>
                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                Przygotowanie tłumaczenia...
              </>
            ) : (
              <>
                <i className="fas fa-search-location text-emerald-400"></i>
                Uruchom analizę rynkową
              </>
            )}
          </button>
        </form>

        {showTranslationDialog && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full p-10 transform animate-scale-up border-4 border-emerald-500/20">
              <div className="text-center space-y-4 mb-8">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl">
                  <i className="fas fa-language"></i>
                </div>
                <h3 className="text-2xl font-black text-slate-800">Weryfikacja Kontrolna</h3>
                <p className="text-slate-500 font-medium">
                  Dla frazy <span className="text-slate-900 font-bold">"{query}"</span> w kraju <span className="text-slate-900 font-bold">{country}</span> sugeruję użycie terminu:
                </p>
                <div className="relative group">
                  <input 
                    type="text" 
                    value={translatedQuery} 
                    onChange={(e) => setTranslatedQuery(e.target.value)}
                    className="w-full text-center bg-slate-50 border-2 border-slate-200 rounded-2xl py-5 px-4 text-xl font-black text-emerald-600 focus:border-emerald-500 outline-none transition-all shadow-inner"
                  />
                  <div className="absolute top-0 right-4 h-full flex items-center text-slate-300">
                    <i className="fas fa-pen text-sm"></i>
                  </div>
                </div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Czy chcesz zmienić ten termin przed startem?</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowTranslationDialog(false)}
                  className="py-4 rounded-2xl border-2 border-slate-100 text-slate-400 font-black hover:bg-slate-50 transition-all uppercase tracking-widest text-xs"
                >
                  Anuluj
                </button>
                <button 
                  onClick={executeSearch}
                  className="py-4 rounded-2xl bg-emerald-500 text-white font-black hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 uppercase tracking-widest text-xs"
                >
                  Potwierdzam i szukam
                </button>
              </div>
            </div>
          </div>
        )}

        {state.error && (
          <div className="bg-red-50 border-2 border-red-100 p-6 rounded-3xl mb-12 flex items-center gap-4 animate-shake">
            <i className="fas fa-exclamation-circle text-red-500 text-2xl"></i>
            <p className="text-red-700 font-bold">{state.error}</p>
          </div>
        )}

        {state.loading ? (
          <div className="text-center py-24 space-y-8">
            <div className="relative inline-block">
              <div className="w-24 h-24 border-8 border-slate-100 border-t-emerald-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <i className="fas fa-satellite-dish text-2xl text-slate-300"></i>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800">Przeszukiwanie rynków zagranicznych...</h2>
              <p className="text-slate-400 font-medium italic">Wybrana fraza: "{translatedQuery}"</p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analiza Map Google i Wyszukiwarki</span>
              </div>
            </div>
          </div>
        ) : state.results.length > 0 ? (
          <div className="animate-fade-in">
            <BusinessTable businesses={state.results} />
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-slate-100 transition-colors hover:border-emerald-100 group">
            <i className="fas fa-map-marked-alt text-5xl text-slate-100 mb-4 group-hover:text-emerald-100 transition-colors"></i>
            <h3 className="text-slate-400 font-black text-xl">Wybierz obszary i rozpocznij przeszukiwanie</h3>
          </div>
        )}
      </div>
      
      <footer className="mt-20 text-center text-slate-300 font-bold uppercase tracking-[0.4em] text-[10px]">
        Agro-Lead Finder AI Multi-Language Edition &copy; 2025
      </footer>
    </div>
  );
};

export default App;
