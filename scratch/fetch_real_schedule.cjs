const https = require('https');
const fs = require('fs');

const flags = {
  "Algeria": "🇩🇿", "Argentina": "🇦🇷", "Australia": "🇦🇺", "Austria": "🇦🇹",
  "Belgium": "🇧🇪", "Bosnia and Herzegovina": "🇧🇦", "Brazil": "🇧🇷", "Cabo Verde": "🇨🇻",
  "Canada": "🇨🇦", "Colombia": "🇨🇴", "Congo DR": "🇨🇩", "Côte d'Ivoire": "🇨🇮",
  "Croatia": "🇭🇷", "Curaçao": "🇨🇼", "Czech Republic": "🇨🇿", "Ecuador": "🇪🇨",
  "Egypt": "🇪🇬", "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "France": "🇫🇷", "Germany": "🇩🇪",
  "Ghana": "🇬🇭", "Haiti": "🇭🇹", "IR Iran": "🇮🇷", "Iraq": "🇮🇶", "Japan": "🇯🇵",
  "Jordan": "🇯🇴", "South Korea": "🇰🇷", "Mexico": "🇲🇽", "Morocco": "🇲🇦",
  "Netherlands": "🇳🇱", "New Zealand": "🇳🇿", "Norway": "🇳🇴", "Panama": "🇵🇦",
  "Paraguay": "🇵🇾", "Portugal": "🇵🇹", "Qatar": "🇶🇦", "Saudi Arabia": "🇸🇦",
  "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Senegal": "🇸🇳", "South Africa": "🇿🇦", "Spain": "🇪🇸",
  "Sweden": "🇸🇪", "Switzerland": "🇨🇭", "Tunisia": "🇹🇳", "Türkiye": "🇹🇷",
  "Uruguay": "🇺🇾", "USA": "🇺🇸", "Uzbekistan": "🇺🇿", "TBC": "🏳️"
};

https.get('https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    let matchId = 1;
    const fixtures = json.matches.map(m => {
      // Parse date/time
      // m.date: "2026-06-11", m.time: "13:00 UTC-6"
      // or "15:00 UTC-4"
      let dateIso = new Date().toISOString();
      if (m.date && m.time) {
        const timeMatch = m.time.match(/(\d{2}:\d{2})\s+UTC([+-]\d+)/);
        if (timeMatch) {
          const time = timeMatch[1];
          let offset = parseInt(timeMatch[2], 10);
          const sign = offset >= 0 ? '+' : '-';
          offset = Math.abs(offset);
          const offsetStr = sign + String(offset).padStart(2, '0') + ':00';
          dateIso = new Date(`${m.date}T${time}:00${offsetStr}`).toISOString();
        }
      }

      let stage = "Group Stage";
      if (m.round.includes("Round of 32") || m.round.includes("Round of 16") || 
          m.round.includes("Quarter") || m.round.includes("Semi") || m.round.includes("Final")) {
        stage = m.round;
      }

      const homeTeam = m.team1 || "TBC";
      const awayTeam = m.team2 || "TBC";

      return {
        id: matchId++,
        homeTeam: homeTeam,
        homeFlag: flags[homeTeam] || "🏳️",
        awayTeam: awayTeam,
        awayFlag: flags[awayTeam] || "🏳️",
        group: m.group || "Knockout",
        date: dateIso,
        venue: m.ground || "TBC",
        status: "scheduled",
        homeScore: null,
        awayScore: null,
        stage: stage
      };
    });

    fs.writeFileSync('d:/fifa/public/api/fixtures.json', JSON.stringify(fixtures, null, 2));
    console.log('Successfully generated ' + fixtures.length + ' matches!');
  });
}).on('error', err => console.log(err.message));
