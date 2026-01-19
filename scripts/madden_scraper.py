#!/usr/bin/env python3
"""
Madden Player Data Scraper - FINAL WORKING VERSION
Fixed based on actual HTML structure analysis
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import re
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict


@dataclass
class Player:
    """Player base information"""
    first_name: str
    last_name: str
    position: str
    age: int = 25
    college: str = ""
    draft_year: Optional[int] = None
    draft_round: Optional[int] = None
    draft_pick: Optional[int] = None
    years_pro: int = 0
    height: Optional[int] = None
    weight: Optional[int] = None
    photo_url: str = ""
    handedness: str = "right"


@dataclass
class PlayerAttributes:
    """Player attributes"""
    overall: int = 70
    potential: int = 75
    injury_prone: int = 50
    morale: int = 75
    confidence: int = 75
    development_trait: str = "normal"
    speed: int = 70
    strength: int = 70
    stamina: int = 80
    awareness: int = 70
    accuracy: Optional[int] = None
    arm_strength: Optional[int] = None
    throw_power: Optional[int] = None
    pocket_presence: Optional[int] = None
    hands: Optional[int] = None
    route_running: Optional[int] = None
    catching: Optional[int] = None
    elusiveness: Optional[int] = None
    pass_block: Optional[int] = None
    run_block: Optional[int] = None
    pass_rush: Optional[int] = None
    run_stop: Optional[int] = None
    tackling: Optional[int] = None
    coverage: Optional[int] = None
    jumping: Optional[int] = None
    play_recognition: Optional[int] = None
    kick_power: Optional[int] = None
    kick_accuracy: Optional[int] = None


class MaddenScraperWorking:
    """Working scraper with correct HTML parsing"""
    
    BASE_URL = "https://www.maddenratings.com"
    
    TEAMS = {
        "arizona-cardinals": "ARI", "atlanta-falcons": "ATL",
        "baltimore-ravens": "BAL", "buffalo-bills": "BUF",
        "carolina-panthers": "CAR", "chicago-bears": "CHI",
        "cincinnati-bengals": "CIN", "cleveland-browns": "CLE",
        "dallas-cowboys": "DAL", "denver-broncos": "DEN",
        "detroit-lions": "DET", "green-bay-packers": "GB",
        "houston-texans": "HOU", "indianapolis-colts": "IND",
        "jacksonville-jaguars": "JAX", "kansas-city-chiefs": "KC",
        "las-vegas-raiders": "LV", "los-angeles-chargers": "LAC",
        "los-angeles-rams": "LAR", "miami-dolphins": "MIA",
        "minnesota-vikings": "MIN", "new-england-patriots": "NE",
        "new-orleans-saints": "NO", "new-york-giants": "NYG",
        "new-york-jets": "NYJ", "philadelphia-eagles": "PHI",
        "pittsburgh-steelers": "PIT", "san-francisco-49ers": "SF",
        "seattle-seahawks": "SEA", "tampa-bay-buccaneers": "TB",
        "tennessee-titans": "TEN", "washington-commanders": "WAS"
    }
    
    POSITION_MAP = {
        'QB': 'QB', 'HB': 'RB', 'FB': 'RB', 'WR': 'WR', 'TE': 'TE',
        'LT': 'OL', 'LG': 'OL', 'C': 'OL', 'RG': 'OL', 'RT': 'OL',
        'LEDG': 'DL', 'REDG': 'DL', 'DT': 'DL',
        'MIKE': 'LB', 'SAM': 'LB', 'WILL': 'LB',
        'CB': 'CB', 'FS': 'S', 'SS': 'S',
        'K': 'K', 'P': 'P', 'LS': 'P'
    }
    
    def __init__(self, rate_limit: float = 0.5):
        self.rate_limit = rate_limit
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
    
    def scrape_team_roster(self, team_slug: str) -> List[Tuple[Player, PlayerAttributes, str]]:
        """Scrape team roster - WORKING VERSION"""
        url = f"{self.BASE_URL}/teams/{team_slug}"
        print(f"\n📋 Scraping {team_slug}...")
        
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            players = []
            team_abbr = self.TEAMS.get(team_slug, "UNK")
            
            table = soup.find('table')
            if not table:
                print(f"  ⚠️  No table found")
                return players
            
            rows = table.find_all('tr')
            
            for row in rows:
                cells = row.find_all('td')
                
                if len(cells) < 3:
                    continue
                
                try:
                    # FIXED: Cell 1 contains multiple links
                    # Link 0: Photo (empty text)
                    # Link 1: Player name
                    # Link 2: Position
                    # Link 3: Archetype
                    
                    player_cell = cells[1]
                    links = player_cell.find_all('a')
                    
                    if len(links) < 3:
                        continue
                    
                    # Link 1 has player name
                    name_link = links[1]
                    full_name = name_link.get_text(strip=True)
                    player_url = name_link.get('href', '')
                    
                    # Link 2 has position
                    position_link = links[2]
                    madden_position = position_link.get_text(strip=True)
                    
                    # Cell 2 has overall rating
                    overall_cell = cells[2]
                    overall_text = overall_cell.get_text(strip=True)
                    overall_match = re.search(r'\d+', overall_text)
                    overall = int(overall_match.group()) if overall_match else 70
                    
                    print(f"  📥 {full_name} ({madden_position}, {overall} OVR)")
                    
                    # Create player objects
                    player, attributes = self._create_player_objects(
                        full_name, madden_position, overall
                    )
                    
                    players.append((player, attributes, team_abbr))
                    
                except Exception as e:
                    continue
            
            print(f"  ✅ Found {len(players)} players")
            return players
            
        except Exception as e:
            print(f"  ❌ Error: {e}")
            return []
    
    def _create_player_objects(self, full_name: str, madden_position: str, 
                              overall: int) -> Tuple[Player, PlayerAttributes]:
        """Create player objects from scraped data"""
        
        name_parts = full_name.strip().split()
        first_name = name_parts[0] if name_parts else "Unknown"
        last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ""
        
        position = self.POSITION_MAP.get(madden_position, madden_position)
        
        player = Player(
            first_name=first_name,
            last_name=last_name,
            position=position
        )
        
        attributes = PlayerAttributes(
            overall=overall,
            potential=min(overall + 5, 99),
            development_trait=self._get_dev_trait(overall)
        )
        
        return player, attributes
    
    def _get_dev_trait(self, overall: int) -> str:
        """Determine development trait"""
        if overall >= 90:
            return 'superstar'
        elif overall >= 80:
            return 'star'
        elif overall >= 70:
            return 'normal'
        else:
            return 'slow'
    
    def scrape_all_teams(self, limit: Optional[int] = None) -> List[Tuple[Player, PlayerAttributes, str]]:
        """Scrape all teams"""
        all_players = []
        teams = list(self.TEAMS.keys())
        
        if limit:
            teams = teams[:limit]
        
        for idx, team_slug in enumerate(teams, 1):
            print(f"\n[{idx}/{len(teams)}]", end=" ")
            players = self.scrape_team_roster(team_slug)
            all_players.extend(players)
            
            if players:
                time.sleep(self.rate_limit)
        
        print(f"\n\n{'='*60}")
        print(f"🎉 Scraping Complete!")
        print(f"📊 Total players: {len(all_players)}")
        print(f"{'='*60}\n")
        
        return all_players
    
    def export_to_json(self, players_data: List[Tuple[Player, PlayerAttributes, str]], 
                      output_dir: str = "./madden_data"):
        """Export to JSON files"""
        import os
        
        os.makedirs(output_dir, exist_ok=True)
        
        players_json = []
        attributes_json = []
        
        for idx, (player, attributes, team_abbr) in enumerate(players_data):
            player_id = f"player_{idx:04d}"
            
            player_dict = asdict(player)
            player_dict['id'] = player_id
            player_dict['team'] = team_abbr
            
            attr_dict = asdict(attributes)
            attr_dict['player_id'] = player_id
            
            players_json.append(player_dict)
            attributes_json.append(attr_dict)
        
        players_file = os.path.join(output_dir, "players.json")
        attributes_file = os.path.join(output_dir, "player_attributes.json")
        
        with open(players_file, 'w') as f:
            json.dump(players_json, f, indent=2)
        
        with open(attributes_file, 'w') as f:
            json.dump(attributes_json, f, indent=2)
        
        print(f"💾 Data exported:")
        print(f"   📄 {players_file} ({len(players_json)} players)")
        print(f"   📄 {attributes_file} ({len(attributes_json)} attributes)")
        
        # Show sample
        if players_json:
            print(f"\n📋 Sample Player:")
            sample = players_json[0]
            print(f"   Name: {sample['first_name']} {sample['last_name']}")
            print(f"   Position: {sample['position']}")
            print(f"   Team: {sample['team']}")
            print(f"   Overall: {attributes_json[0]['overall']}")
        
        return players_file, attributes_file


def main():
    """Main execution"""
    print("\n" + "="*60)
    print("🏈  MADDEN PLAYER DATA SCRAPER - WORKING VERSION")
    print("="*60)
    
    scraper = MaddenScraperWorking(rate_limit=0.5)
    
    # Test first
    print("\n🧪 Testing with Kansas City Chiefs...")
    test_players = scraper.scrape_team_roster("kansas-city-chiefs")
    
    if not test_players:
        print("\n❌ Test failed")
        return
    
    print(f"\n✅ Test successful! Found {len(test_players)} players")
    
    # Show sample
    if test_players:
        player, attrs, team = test_players[0]
        print(f"\n📋 Sample Player:")
        print(f"   Name: {player.first_name} {player.last_name}")
        print(f"   Position: {player.position}")
        print(f"   Overall: {attrs.overall}")
        print(f"   Team: {team}")
    
    # Ask to continue
    print("\n" + "="*60)
    response = input("\n⚡ Scrape all 32 teams? (y/n): ")
    
    if response.lower() != 'y':
        print("\n👋 Cancelled")
        return
    
    print("\n🚀 Starting full scrape...\n")
    all_players = scraper.scrape_all_teams()
    
    scraper.export_to_json(all_players)
    
    print("\n✨ All done! Ready to import to database.")


if __name__ == "__main__":
    main()