#!/usr/bin/env python3
"""
Spotrac Roster Scraper
Scrapes NFL player roster data (including ages) from Spotrac.com for all 32 teams
This gets ALL players, including those without contracts (free agents)
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import os
import re
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict


@dataclass
class Player:
    """NFL Player Data"""
    player_name: str
    position: str
    age: Optional[int]


class SpotracRosterScraper:
    """Scrapes roster data from Spotrac"""

    BASE_URL = "https://www.spotrac.com"

    # NFL team slugs (Spotrac format)
    TEAMS = {
        "arizona-cardinals": "ARI",
        "atlanta-falcons": "ATL",
        "baltimore-ravens": "BAL",
        "buffalo-bills": "BUF",
        "carolina-panthers": "CAR",
        "chicago-bears": "CHI",
        "cincinnati-bengals": "CIN",
        "cleveland-browns": "CLE",
        "dallas-cowboys": "DAL",
        "denver-broncos": "DEN",
        "detroit-lions": "DET",
        "green-bay-packers": "GB",
        "houston-texans": "HOU",
        "indianapolis-colts": "IND",
        "jacksonville-jaguars": "JAX",
        "kansas-city-chiefs": "KC",
        "las-vegas-raiders": "LV",
        "los-angeles-chargers": "LAC",
        "los-angeles-rams": "LAR",
        "miami-dolphins": "MIA",
        "minnesota-vikings": "MIN",
        "new-england-patriots": "NE",
        "new-orleans-saints": "NO",
        "new-york-giants": "NYG",
        "new-york-jets": "NYJ",
        "philadelphia-eagles": "PHI",
        "pittsburgh-steelers": "PIT",
        "san-francisco-49ers": "SF",
        "seattle-seahawks": "SEA",
        "tampa-bay-buccaneers": "TB",
        "tennessee-titans": "TEN",
        "washington-commanders": "WAS"
    }

    def __init__(self, rate_limit: float = 1.0):
        """
        Initialize scraper

        Args:
            rate_limit: Seconds to wait between requests (be respectful!)
        """
        self.rate_limit = rate_limit
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })

    def parse_age(self, age_str: str) -> Optional[int]:
        """Extract age from string"""
        if not age_str or age_str == '-':
            return None

        # Extract first number found
        match = re.search(r'\d+', age_str)
        return int(match.group()) if match else None

    def scrape_team_roster(self, team_slug: str) -> List[Player]:
        """
        Scrape roster for a single team

        Args:
            team_slug: Team URL slug (e.g., 'kansas-city-chiefs')

        Returns:
            List of Player objects
        """
        url = f"{self.BASE_URL}/nfl/{team_slug}/roster/"
        team_abbr = self.TEAMS.get(team_slug, "UNK")

        print(f"\n📋 Scraping {team_abbr} ({team_slug})...")

        try:
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')

            players = []

            # Find the main roster table
            table = soup.find('table', {'class': 'team-roster'})

            if not table:
                print(f"   ⚠️  Roster table not found for {team_abbr}")
                return []

            rows = table.find_all('tr')[1:]  # Skip header row

            for row in rows:
                cols = row.find_all('td')
                if len(cols) < 3:
                    continue

                try:
                    # Extract player name (clean up any extra text)
                    name_elem = cols[1].find('a')
                    player_name = name_elem.text.strip() if name_elem else cols[1].text.strip()

                    # Skip if no name
                    if not player_name or player_name == '-':
                        continue

                    # Position
                    position = cols[2].text.strip()

                    # Age (usually in column 4 or 5)
                    age = None
                    for col in cols[3:6]:  # Check a few columns for age
                        age_text = col.text.strip()
                        parsed_age = self.parse_age(age_text)
                        if parsed_age and 18 <= parsed_age <= 50:  # Reasonable age range
                            age = parsed_age
                            break

                    player = Player(
                        player_name=player_name,
                        position=position,
                        age=age
                    )

                    players.append(player)

                except Exception as e:
                    print(f"   ⚠️  Error parsing row: {e}")
                    continue

            print(f"   ✅ Found {len(players)} players")
            return players

        except requests.RequestException as e:
            print(f"   ❌ Request failed: {e}")
            return []
        except Exception as e:
            print(f"   ❌ Unexpected error: {e}")
            return []

    def scrape_all_teams(self) -> Dict[str, List[Player]]:
        """
        Scrape rosters for all 32 NFL teams

        Returns:
            Dictionary mapping team_slug -> list of players
        """
        print("\n" + "="*60)
        print("🏈  SPOTRAC ROSTER SCRAPER")
        print("="*60)

        all_players = {}

        for idx, (team_slug, team_abbr) in enumerate(self.TEAMS.items(), 1):
            print(f"\n[{idx}/32] {team_abbr}...")

            players = self.scrape_team_roster(team_slug)
            all_players[team_slug] = players

            # Rate limiting
            if idx < 32:  # Don't wait after last team
                time.sleep(self.rate_limit)

        # Summary
        total_players = sum(len(players) for players in all_players.values())
        print("\n" + "="*60)
        print(f"✅ COMPLETE")
        print(f"   Teams: 32")
        print(f"   Total Players: {total_players}")
        print("="*60 + "\n")

        return all_players

    def export_to_json(self, players_by_team: Dict[str, List[Player]],
                      output_dir: str = "./spotrac_data/rosters"):
        """
        Export roster data to JSON files (one per team)

        Args:
            players_by_team: Dictionary of team -> players
            output_dir: Output directory path
        """
        os.makedirs(output_dir, exist_ok=True)

        print(f"💾 Exporting to {output_dir}...")

        for team_slug, players in players_by_team.items():
            team_abbr = self.TEAMS[team_slug]

            output_data = {
                "team_slug": team_slug,
                "team_abbr": team_abbr,
                "player_count": len(players),
                "players": [asdict(p) for p in players]
            }

            filename = f"{team_abbr.lower()}.json"
            filepath = os.path.join(output_dir, filename)

            with open(filepath, 'w') as f:
                json.dump(output_data, f, indent=2)

            print(f"   ✅ {filename} ({len(players)} players)")

        # Create summary file
        summary = {
            "total_teams": len(players_by_team),
            "total_players": sum(len(p) for p in players_by_team.values()),
            "teams": {
                team_slug: {
                    "abbr": self.TEAMS[team_slug],
                    "player_count": len(players)
                }
                for team_slug, players in players_by_team.items()
            }
        }

        summary_path = os.path.join(output_dir, "_summary.json")
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)

        print(f"\n   📊 Summary: {summary_path}")


def main():
    """Main execution"""
    scraper = SpotracRosterScraper(rate_limit=1.5)  # Be respectful - 1.5s between requests

    # Test with one team first
    print("\n🧪 TEST MODE: Scraping Kansas City Chiefs...")
    test_players = scraper.scrape_team_roster("kansas-city-chiefs")

    if not test_players:
        print("\n❌ Test failed - check the scraper")
        return

    print(f"\n✅ Test successful! Found {len(test_players)} players")

    # Show sample
    if test_players:
        sample = test_players[0]
        print(f"\n📋 Sample Player:")
        print(f"   Name: {sample.player_name}")
        print(f"   Position: {sample.position}")
        print(f"   Age: {sample.age}")

    # Ask to continue
    print("\n" + "="*60)
    response = input("\n⚡ Scrape all 32 teams? (y/n): ").strip().lower()

    if response != 'y':
        print("Cancelled.")
        return

    # Scrape all teams
    all_players = scraper.scrape_all_teams()

    # Export
    scraper.export_to_json(all_players)

    print("\n🎉 Done! Roster data saved to ./spotrac_data/rosters/")


if __name__ == "__main__":
    main()
