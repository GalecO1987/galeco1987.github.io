const data = {
    nodes: [
        { id: "Puszysta Oaza", creationDate: "21 czerwca 2024", members: 281, boosts: 29, partnerships: [] },
        { id: "New Arctic Furries", creationDate: "12 grudnia 2024", members: 35, boosts: 0, partnerships: ["Futrzaki na Fali", "Nasze Futrzaste Grono"] },
        { id: "Kolorowa Zatoczka", creationDate: "13 września 2023", members: 92, boosts: 0, partnerships: ["Futrzaki na Fali", "Planeta Futrzaków", "New Foxing Town", "Futrzaste Miasto Pizzy", "Synowie ślimaka V2"] },
        { id: "Futrzasta Piwnica Przyjaźni", creationDate: "19 listopada 2023", members: 102, boosts: 0, partnerships: [] },
        { id: "Polski Serwer Furry 2", creationDate: "8 stycznia 2023", members: 385, boosts: 0, partnerships: ["Futrzaki na Fali", "Futrzaste Miasto Pizzy", "New Foxing Town", "Planeta Futrzaków", "Viper's Pit", "Boykissers Heaven", "FutrzakOwO", "FurryBox", "FURRYWORLD", "Furaski", "Futrzasta Centrala"] },
        { id: "Futrzaste Miasto Pizzy", creationDate: "3 maja 2021", members: 823, boosts: 9, partnerships: ["Pyrkon Furries", "Futrzasta Oceania", "Kolorowa Zatoczka", "Futrzaki na Fali", "Planeta Futrzaków", "Polski Serwer Furry 2", "Boykissers Heaven", "Futrzasta Krypta", "New Foxing Town", "Viper's Pit", "Futrzasta Serwerownia", "Strawtilla's World", "Lisi cień", "Nasze Futrzaste Grono"] },
        { id: "FurHeaven", creationDate: "17 grudnia 2018", members: 584, boosts: 0, partnerships: ["Dolina Futer", "Yutan", "Futrzasta Centrala"] },
        { id: "Parrot Cafe", creationDate: "15 kwietnia 2022", members: 527, boosts: 15, partnerships: ["New Foxing Town", "Pyrkon Furries", "BFSiP", "Boykissers Heaven"] },
        { id: "Furrasowy Hellfire", creationDate: "1 marca 2022", members: 399, boosts: 7, partnerships: ["Futrzaki na Fali", "Kolorowe Futra", "Night City Renascence", "Trójmiejskie Futra"] },
        { id: "Tajne Zgromadzenie Futrzaków", creationDate: "23 grudnia 2022", members: 1674, boosts: 28, partnerships: [] },
        { id: "Futrzasta Oceania", creationDate: "23 lipca 2021", members: 230, boosts: 0, partnerships: ["Futrzaste Miasto Pizzy", "Strawtilla's World", "Smocza Przystań", "Liliowe futerka", "Boykissers Heaven", "Futrzaki na Fali", "Lisia Norka", "Furaski"] },
        { id: "New Foxing Town", creationDate: "20 lutego 2024", members: 393, boosts: 14, partnerships: ["Planeta Futrzaków", "Pyrkon Furries", "Futrzaste Miasto Pizzy", "Viper's Pit", "Futrzaki na Fali", "Polski Serwer Furry 2", "Cs'owe Futerka", "Futrzasta Karczma", "Trójmiejskie Futra", "Parrot Cafe", "Boykissers Heaven", "Konfederacja Lisowska", "Kolorowa Zatoczka"] },
        { id: "Stacja Pandka", creationDate: "3 grudnia 2021", members: 769, boosts: 16, partnerships: ["Furasowa Republika", "Pyrkon Furries"] },
        { id: "Pyrkon Furries", creationDate: "21 października 2019", members: 806, boosts: 1, partnerships: ["Gwiazdeczki Cosmiego", "Fragonia Factory", "Tayland", "Futrzaste Miasto Pizzy", "Parrot Cafe", "New Foxing Town", "Stacja Pandka", "Lisia Norka", "Futrzasty zakątek", "Night City Renascence", "FutrzakOwO", "FurryBox", "Wylęgarnia"] },
        { id: "Konfederacja Lisowska", creationDate: "30 grudnia 2022", members: 193, boosts: 3, partnerships: ["Planeta Futrzaków", "Nasze Futrzaste Grono", "New Foxing Town"] },
        { id: "Futrzasty Zakątek", creationDate: "29 grudnia 2022", members: 44, boosts: 0, partnerships: ["Futrzasta Kawiarnia"] },
        { id: "Tajemnicze Futrzaki", creationDate: "18 czerwca 2022", members: 87, boosts: 1, partnerships: [] },
        { id: "Lisia Norka", creationDate: "4 grudnia 2019", members: 319, boosts: 2, partnerships: ["FURRYWORLD", "Pyrkon Furries", "Furrasowe Arty", "Futrzaste Plemię", "Furaski", "Futrzasta Oceania", "Dolina Futer", "Futrzasty discord", "Furry obóz RP", "Futrzaki na Fali"] },
        { id: "Lazurowe Futerka", creationDate: "29 października 2022", members: 38, boosts: 0, partnerships: [] },
        { id: "Tayland", creationDate: "17 sierpnia 2020", members: 209, boosts: 3, partnerships: ["Pyrkon Furries", "Gwiazdeczki Cosmiego", "Fragonia Factory"] },
        { id: "Futrzasta Chatka", creationDate: "20 lipca 2020", members: 190, boosts: 0, partnerships: ["Furrasowy kącik", "FurryBox", "FutrzakOwO", "Polskie Smoki", "Futrzasty obóz"] },
        { id: "Furry Night PL", creationDate: "5 listopada 2023", members: 115, boosts: 0, partnerships: ["Furasowy Las", "Futrzaki na Fali", "Kolorowe Futra"] },
        { id: "Futrzasty zakątek", creationDate: "21 kwietnia 2021", members: 342, boosts: 7, partnerships: ["Kemi's Furry Place", "Gwiazdeczki Cosmiego", "Pyrkon Furries"] },
        { id: "Furrysławia", creationDate: "8 września 2023", members: 149, boosts: 0, partnerships: [] },
        { id: "Futerkowy Las", creationDate: "9 stycznia 2021", members: 51, boosts: 0, partnerships: ["Futrzasta Krypta"] },
        { id: "Futrzaki na Fali", creationDate: "20 lipca 2021", members: 1711, boosts: 19, partnerships: ["Lisia Norka", "Trójmiejskie Futra", "Kolorowa Zatoczka", "Furry Night PL", "Furrasowy Hellfire", "Synowie ślimaka V2", "Futrzaste Miasto Pizzy", "Rzeczpospolita Furska", "Boykissers Heaven", "Smocza Przystań", "Viper's Pit", "New Foxing Town", "Futrzasty Serwer", "BFSiP", "New Arctic Furries", "Nasze Futrzaste Grono", "Liliowe futerka", "Futrzasta Oceania", "Krakersy", "Polski Serwer Furry 2"] },
        { id: "Planeta Futrzaków", creationDate: "10 sierpnia 2023", members: 497, boosts: 3, partnerships: ["Kolorowa Zatoczka", "Futrzaste Miasto Pizzy", "Boykissers Heaven", "Polski Serwer Furry 2", "New Foxing Town", "Viper's Pit", "Synowie ślimaka V2", "Futrzasta Serwerownia", "Konfederacja Lisowska", "Nasze Futrzaste Grono"] },
        { id: "Night City Renascence", creationDate: "31 stycznia 2023", members: 90, boosts: 0, partnerships: ["Pyrkon Furries", "Furrasowy Hellfire"] },
        { id: "Boykissers Heaven", creationDate: "18 czerwca 2024", members: 834, boosts: 14, partnerships: ["Futrzaki na Fali", "Planeta Futrzaków", "Rzeczpospolita Furska", "New Foxing Town", "Futrzaste Miasto Pizzy", "Viper's Pit", "BFSiP", "Nasze Futrzaste Grono", "Polski Serwer Furry 2", "Parrot Cafe", "Smocza Przystań", "Liliowe futerka", "Art Futerka", "Futrzasta Oceania"] },
        { id: "Futerkowa Przystań", creationDate: "4 lipca 2024", members: 218, boosts: 2, partnerships: [] },
        { id: "Kolorowe Futra", creationDate: "8 maja 2024", members: 147, boosts: 0, partnerships: ["Furry Night PL", "Furrasowy Hellfire", "Rzeczpospolita Furska", "Viper's Pit"] },
        { id: "Nasze Futrzaste Grono", creationDate: "28 września 2024", members: 208, boosts: 5, partnerships: ["Futrzasta Krypta", "Boykissers Heaven", "Futrzaste Miasto Pizzy", "Rzeczpospolita Furska", "Wilkowice", "Planeta Futrzaków", "Futrzana Piwnica", "New Arctic Furries", "Art Futerka", "Futrzaki na Fali", "Futrzasta Serwerownia", "Konfederacja Lisowska"] },
        { id: "Futrzana Dolina", creationDate: "31 grudnia 2023", members: 38, boosts: 0, partnerships: [] },
        { id: "Futrzasty Serwer", creationDate: "27 września 2022", members: 89, boosts: 0, partnerships: ["Futrzaki na Fali"] },
        { id: "Norka Futrzaków", creationDate: "17 czerwca 2021", members: 192, boosts: 2, partnerships: [] },
        { id: "Liliowe futerka", creationDate: "29 grudnia 2024", members: 78, boosts: 0, partnerships: ["Boykissers Heaven", "Futrzaki na Fali", "Futrzasta Oceania", "F U R Y"] },
        { id: "Dragon's Party", creationDate: "25 listopada 2024", members: 52, boosts: 2, partnerships: [] },
        { id: "Smocza Przystań", creationDate: "14 października 2023", members: 118, boosts: 7, partnerships: ["Futrzaki na Fali", "Boykissers Heaven", "Futrzasta Oceania"] },
        { id: "CyberFutrzaki 2621", creationDate: "4 października 2024", members: 90, boosts: 11, partnerships: [] },
        { id: "Futrzasta Serwerownia", creationDate: "3 lutego 2021", members: 142, boosts: 0, partnerships: ["Futrzaste Miasto Pizzy", "Futrzasta Krypta", "Nasze Futrzaste Grono", "Planeta Futrzaków"] },
        { id: "BFSiP", creationDate: "14 listopada 2019", members: 1840, boosts: 26, partnerships: ["FutrzakOwO", "Lisi cień", "World of Furries", "FURRYWORLD", "Dolina Futer", "Futrzaki na Fali", "Boykissers Heaven", "Parrot Cafe", "FurryBox", "Futrzasta Centrala", "Wylęgarnia"] },
        { id: "Futrzasta Krypta", creationDate: "7 października 2024", members: 42, boosts: 0, partnerships: ["Futrzasta Serwerownia", "Futrzaste Miasto Pizzy", "Futrzana Piwnica", "Futerkowy Las", "Nasze Futrzaste Grono"] },
        { id: "Paw Paradise", creationDate: "7 stycznia 2025", members: 54, boosts: 0, partnerships: [] },
        { id: "Art Futerka", creationDate: "28 kwietnia 2024", members: 179, boosts: 0, partnerships: ["Nasze Futrzaste Grono", "Boykissers Heaven"] },
        { id: "Futerka NSFW", creationDate: "28 maja 2022", members: 374, boosts: 1, partnerships: [] },
        { id: "Schronisko Bartisa", creationDate: "13 stycznia 2025", members: 53, boosts: 0, partnerships: [] },
        { id: "Futrzasta Norka", creationDate: "21 stycznia 2024", members: 932, boosts: 0, partnerships: [] },
        { id: "Futrzasta Sauna", creationDate: "15 sierpnia 2024", members: 49, boosts: 1, partnerships: [] },
        { id: "FURRY VR - WRLD", creationDate: "5 sierpnia 2022", members: 262, boosts: 2, partnerships: [] },
        { id: "Krakersy", creationDate: "19 lutego 2025", members: 122, boosts: 4, partnerships: ["Futrzaki na Fali"] },
        { id: "Dolina Futer", creationDate: "17 maja 2021", members: 416, boosts: 0, partnerships: ["BFSiP", "FurHeaven", "Lisi cień", "Lisia Norka", "FurryBox", "FURRYWORLD"] },
        { id: "Yutan", creationDate: "13 września 2021", members: 153, boosts: 0, partnerships: ["Futrzasty obóz", "Furrasolandia", "FurHeaven", "Lisi cień"] },
        { id: "Futrzasty obóz", creationDate: "1 września 2020", members: 27, boosts: 0, partnerships: ["Futrzasta Chatka", "Yutan", "Fragonia Factory"] },
        { id: "Viper's Pit", creationDate: "24 sierpnia 2024", members: 181, boosts: 0, partnerships: ["Futrzaki na Fali", "Planeta Futrzaków", "New Foxing Town", "Futrzaste Miasto Pizzy", "Polski Serwer Furry 2", "Boykissers Heaven", "Kolorowe Futra"] },
        { id: "Furrasolandia", creationDate: "10 lipca 2022", members: 66, boosts: 0, partnerships: ["Yutan"] },
        { id: "Strawtilla's World", creationDate: "3 listopada 2024", members: 73, boosts: 0, partnerships: ["Fox Community", "Futrzasta Oceania", "Futrzaste Miasto Pizzy"] },
        { id: "FURREN TAG", creationDate: "12 stycznia 2022", members: 81, boosts: 0, partnerships: [] },
        { id: "Cs'owe Futerka", creationDate: "25 kwietnia 2023", members: 108, boosts: 0, partnerships: ["Gwiezdne Futra", "New Foxing Town"] },
        { id: "Gwiezdne Futra", creationDate: "30 marca 2023", members: 32, boosts: 0, partnerships: ["Cs'owe Futerka"] },
        { id: "Carrie's Community", creationDate: "15 marca 2025", members: 38, boosts: 0, partnerships: [] },
        { id: "F U R Y", creationDate: "17 marca 2025", members: 25, boosts: 0, partnerships: ["Liliowe futerka"] },
        { id: "Trójmiejskie Futra", creationDate: "13 stycznia 2019", members: 125, boosts: 1, partnerships: ["Furrasowy Hellfire", "Futrzaki na Fali", "New Foxing Town"] },
        { id: "Furasowa Republika", creationDate: "14 listopada 2022", members: 323, boosts: 7, partnerships: ["Stacja Pandka"] },
        { id: "Furzasta Karczma", creationDate: "13 lipca 2022", members: 247, boosts: 6, partnerships: ["New Foxing Town"] },
        { id: "Gwiazdeczki Cosmiego", creationDate: "26 września 2023", members: 390, boosts: 4, partnerships: ["Futrzasty zakątek", "Pyrkon Furries", "Tayland"] },
        { id: "Fragonia Factory", creationDate: "16 marca 2021", members: 122, boosts: 0, partnerships: ["Pyrkon Furries", "Tayland", "FURRYWORLD", "Futrzasty obóz", "Lisi cień"] },
        { id: "Futrzasta Kawiarnia", creationDate: "8 września 2022", members: 46, boosts: 0, partnerships: ["Futrzasty Zakątek"] },
        { id: "FutrzakOwO", creationDate: "8 października 2019", members: 128, boosts: 0, partnerships: ["FURRYWORLD", "Futrzasta Centrala", "Futerkowa wysepka", "Lisi cień", "Polskie Smoki", "Pyrkon Furries", "Futrzasta Chatka", "BFSiP", "Polski Serwer Furry 2", "Wylęgarnia"] },
        { id: "FurryBox", creationDate: "23 marca 2020", members: 139, boosts: 0, partnerships: ["World of Furries", "Lisi cień", "Futrzasta Centrala", "Polski Serwer Furry 2", "Futrzaste Plemię", "Furrasowy kącik", "Dolina Futer", "Polskie Smoki", "Furry Galaxy", "Pyrkon Furries", "BFSiP", "Futrzasta Chatka"] },
        { id: "FURRYWORLD", creationDate: "11 stycznia 2019", members: 109, boosts: 0, partnerships: ["Furry Galaxy", "Futrzasta Centrala", "Lisi Lasek", "FutrzakOwO", "BFSiP", "World of Furries", "Polski Serwer Furry 2", "Lisia Norka", "Furrasowe Arty", "Dolina Futer", "Fragonia Factory"] },
        { id: "Lisi cień", creationDate: "4 lipca 2019", members: 514, boosts: 0, partnerships: ["Futrzaste Miasto Pizzy", "Yutan", "Dolina Futer", "Fragonia Factory", "FutrzakOwO", "FurryBox", "Futrzasta Centrala", "BFSiP", "Wylęgarnia"] },
        { id: "Furaski", creationDate: "10 stycznia 2021", members: 70, boosts: 0, partnerships: ["Lisia Norka", "Polski Serwer Furry 2", "Futrzasta Oceania", "Stary Londyn"] },
        { id: "Futrzasta Centrala", creationDate: "5 marca 2019", members: 206, boosts: 0, partnerships: ["FurHeaven", "Lisi cień", "BFSiP", "Polski Serwer Furry 2", "FutrzakOwO", "FurryBox", "FURRYWORLD", "Furtownia", "FUTERKOWO", "FuterkOwO"] },
        { id: "Polskie Smoki", creationDate: "17 stycznia 2018", members: 246, boosts: 0, partnerships: ["FurryBox", "Futrzasta Chatka", "FutrzakOwO"] },
        { id: "Furasowy Las", creationDate: "2 października 2023", members: 23, boosts: 0, partnerships: ["Furry Night PL"] },
        { id: "Futrzana Piwnica", creationDate: "24 marca 2023", members: 38, boosts: 0, partnerships: ["Nasze Futrzaste Grono", "Futrzasta Krypta", "Fox Community"] },
        { id: "World of Furries", creationDate: "8 maja 2020", members: 66, boosts: 0, partnerships: ["Lisi cień", "BFSiP", "FURRYWORLD", "FurryBox", "Futerkowa wysepka"] },
        { id: "Fox Community", creationDate: "3 października 2024", members: 46, boosts: 0, partnerships: ["Strawtilla's World", "Futrzana Piwnica"] },
        { id: "Futrzasta Kafejka Internetowa", creationDate: "15 stycznia 2020", members: 50, boosts: 1, partnerships: [] },
        { id: "Furry Galaxy", creationDate: "16 grudnia 2018", members: 186, boosts: 0, partnerships: ["FURRYWORLD", "FurryBox", "FUTERKOWO", "Wylęgarnia"] },
        { id: "Lisi Lasek", creationDate: "19 maja 2019", members: 48, boosts: 0, partnerships: ["FURRYWORLD"] },
        { id: "Synowie ślimaka V2", creationDate: "6 stycznia 2024", members: 64, boosts: 0, partnerships: ["Futrzaki na Fali", "Planeta Futrzaków", "Kolorowa Zatoczka"] },
        { id: "Puszyste Ogonki", creationDate: "23 maja 2023", members: 203, boosts: 0, partnerships: [] },
        { id: "Furrasowe Arty", creationDate: "4 lutego 2021", members: 36, boosts: 0, partnerships: ["Lisia Norka", "FURRYWORLD"] },
        { id: "Futrzaste Plemię", creationDate: "16 lutego 2020", members: 83, boosts: 0, partnerships: ["Lisia Norka", "FurryBox"] },
        { id: "Futrzasty discord", creationDate: "19 stycznia 2021", members: 44, boosts: 0, partnerships: ["Lisia Norka"] },
        { id: "Furry obóz RP", creationDate: "1 października 2022", members: 88, boosts: 0, partnerships: ["Lisia Norka"] },
        { id: "Rzeczpospolita Furska", creationDate: "23 grudnia 2023", members: 241, boosts: 2, partnerships: ["Nasze Futrzaste Grono", "Boykissers Heaven", "Futrzaki na Fali"] },
        { id: "Furrasowy kącik", creationDate: "11 maja 2020", members: 165, boosts: 0, partnerships: ["Futrzasta Chatka", "FurryBox"] },
        { id: "Futerkowa wysepka", creationDate: "22 czerwca 2019", members: 272, boosts: 0, partnerships: ["FutrzakOwO", "World of Furries"] },
        { id: "Kemi's Furry Place", creationDate: "9 lipca 2018", members: 40, boosts: 0, partnerships: ["Futrzasty zakątek"]},
        { id: "Wilkowice", creationDate: "1 grudnia 2024", members: 83, boosts: 2, partnerships: ["Nasze Futrzaste Grono"]},
        { id: "Stary Londyn", creationDate: "19 grudnia 2021", members: 21, boosts: 0, partnerships: ["Furaski"]},
        { id: "Furtownia", creationDate: "3 czerwca 2018", members: 340, boosts: 14, partnerships: ["FURRYWORLD", "Futrzasta Centrala"]},
        { id: "FUTERKOWO", creationDate: "20 marca 2019", members: 31, boosts: 0, partnerships: ["Furry Galaxy", "Futrzasta Centrala"]},
        { id: "FuterkOwO", creationDate: "27 kwietnia 2017", members: 38, boosts: 0, partnerships: ["Futrzasta Centrala"]},
        { id: "Futrzasta Karczma", creationDate: "13 lipca 2022", members: 247, boosts: 6, partnerships: ["New Foxing Town", "Electron's Hub"]},    // Duplicate key, keeping the first occurrence
        { id: "Electron's Hub", creationDate: "25 lipca 2023", members: 304, boosts: 7, partnerships: ["Futrzasta Karczma", "Gwiazdeczki Cosmiego"]},
        { id: "Wylęgarnia", creationDate: "29 kwietnia 2020", members: 126, boosts: 0, partnerships: ["Furry Galaxy", "FutrzakOwO", "BFSiP", "Lisi cień", "Pyrkon Furries"]},
        { id: "Night City", creationDate: "26 października 2020", members: 124, boosts: 0, partnerships: []},
        { id: "Fluffy Discord", creationDate: "12 października 2018", members: 63, boosts: 0, partnerships: []},
        { id: "Pizzeria", creationDate: "7 lutego 2021", members: 49, boosts: 0, partnerships: []},
        { id: "WolfPack", creationDate: "4 sierpnia 2019", members: 62, boosts: 0, partnerships: []},
        { id: "Furland", creationDate: "14 grudnia 2022", members: 52, boosts: 0, partnerships: []},
        { id: "Futrzanka", creationDate: "12 marca 2023", members: 46, boosts: 0, partnerships: []},
        { id: "Furry Cafe :3", creationDate: "23 marca 2025", members: 38, boosts: 8, partnerships: []}
    ],
    links: []
};
