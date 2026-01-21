#!/usr/bin/env python3
"""
Spotrac Contract Scraper
Scrapes NFL player contracts from Spotrac.com for all 32 teams
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
class Contract:
    """NFL Player Contract"""
    player_name: str
    position: str
    age: Optional[int]
    base_salary_2025: int
    cap_hit_2025: int
    total_value: int
    years: int
    avg_salary: int
    guaranteed: int
    signing_bonus: int


class SpotracScraper:
    """Scrapes contract data from Spotrac"""
    
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
    
    def parse_money(self, money_str: str) -> int:
        """Convert money string to integer cents"""
        if not money_str or money_str == '-' or money_str == 'N/A':
            return 0
        
        # Remove $, commas, and whitespace
        cleaned = money_str.replace('$', '').replace(',', '').strip()
        
        try:
            # Handle millions/thousands notation
            if 'M' in cleaned.upper():
                value = float(cleaned.upper().replace('M', ''))
                return int(value * 1_000_000)
            elif 'K' in cleaned.upper():
                value = float(cleaned.upper().replace('K', ''))
                return int(value * 1_000)
            else:
                return int(float(cleaned))
        except (ValueError, AttributeError):
            return 0
    
    def parse_age(self, age_str: str) -> Optional[int]:
        """Extract age from string"""
        if not age_str or age_str == '-':
            return None
        
        # Extract first number found
        match = re.search(r'\d+', age_str)
        return int(match.group()) if match else None
    
    def scrape_team_contracts(self, team_slug: str) -> List[Contract]:
        """
        Scrape contracts for a single team
        
        Args:
            team_slug: Team URL slug (e.g., 'kansas-city-chiefs')
            
        Returns:
            List of Contract objects
        """
        url = f"{self.BASE_URL}/nfl/{team_slug}/cap/2025/"
        team_abbr = self.TEAMS.get(team_slug, "UNK")
        
        print(f"\n📋 Scraping {team_abbr} ({team_slug})...")
        
        try:
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            contracts = []
            
            # Find the main roster table (active + injured reserve)
            tables = []
            for table_id in ['table_active', 'table_injured']:
                table = soup.find('table', id=table_id)
                if table:
                    tables.append(table)

            if not tables:
                print(f"   ⚠️  Tables not found for {team_abbr}")
                return []

            rows = []
            for table in tables:
                rows.extend(table.find_all('tr')[1:])  # Skip header row
            
            for row in rows:
                cols = row.find_all('td')
                if len(cols) < 4:
                    continue

                try:
                    # Extract player name (clean up any extra text)
                    name_elem = cols[0].find('a')
                    player_name = name_elem.text.strip() if name_elem else cols[0].text.strip()

                    # Skip if no name
                    if not player_name or player_name == '-':
                        continue

                    # Position
                    position = cols[1].text.strip()

                    # Age
                    age = self.parse_age(cols[2].text.strip())

                    # 2025 Cap Hit (column 3)
                    cap_hit = self.parse_money(cols[3].text)

                    # 2025 Base Salary (column 6 - "Base P5 Salary")
                    base_salary = self.parse_money(cols[6].text) if len(cols) > 6 else cap_hit

                    # Signing Bonus Proration (column 7)
                    signing_bonus = self.parse_money(cols[7].text) if len(cols) > 7 else 0

                    # Roster Bonus (column 9)
                    roster_bonus = self.parse_money(cols[9].text) if len(cols) > 9 else 0

                    # Total signing bonus includes roster bonus
                    total_signing_bonus = signing_bonus + roster_bonus

                    # Estimate total contract value from cap hit
                    # For most players, cap hit is a good proxy for annual value
                    # We'll use a simple heuristic: assume 3-year average contract
                    years = 3
                    total_value = cap_hit * years

                    # Calculate average salary
                    avg_salary = cap_hit

                    # Guaranteed money estimate (signing bonus + portion of base)
                    guaranteed = total_signing_bonus + int(base_salary * 0.5)
                    
                    contract = Contract(
                        player_name=player_name,
                        position=position,
                        age=age,
                        base_salary_2025=base_salary,
                        cap_hit_2025=cap_hit,
                        total_value=total_value if total_value > 0 else cap_hit,
                        years=years,
                        avg_salary=avg_salary,
                        guaranteed=guaranteed,
                        signing_bonus=total_signing_bonus
                    )
                    
                    contracts.append(contract)
                    
                except Exception as e:
                    print(f"   ⚠️  Error parsing row: {e}")
                    continue
            
            print(f"   ✅ Found {len(contracts)} contracts")
            return contracts
            
        except requests.RequestException as e:
            print(f"   ❌ Request failed: {e}")
            return []
        except Exception as e:
            print(f"   ❌ Unexpected error: {e}")
            return []
    
    def scrape_all_teams(self) -> Dict[str, List[Contract]]:
        """
        Scrape contracts for all 32 NFL teams
        
        Returns:
            Dictionary mapping team_slug -> list of contracts
        """
        print("\n" + "="*60)
        print("🏈  SPOTRAC CONTRACT SCRAPER")
        print("="*60)
        
        all_contracts = {}
        
        for idx, (team_slug, team_abbr) in enumerate(self.TEAMS.items(), 1):
            print(f"\n[{idx}/32] {team_abbr}...")
            
            contracts = self.scrape_team_contracts(team_slug)
            all_contracts[team_slug] = contracts
            
            # Rate limiting
            if idx < 32:  # Don't wait after last team
                time.sleep(self.rate_limit)
        
        # Summary
        total_contracts = sum(len(contracts) for contracts in all_contracts.values())
        print("\n" + "="*60)
        print(f"✅ COMPLETE")
        print(f"   Teams: 32")
        print(f"   Total Contracts: {total_contracts}")
        print("="*60 + "\n")
        
        return all_contracts
    
    def export_to_json(self, contracts_by_team: Dict[str, List[Contract]], 
                      output_dir: str = "./spotrac_data/contracts"):
        """
        Export contracts to JSON files (one per team)
        
        Args:
            contracts_by_team: Dictionary of team -> contracts
            output_dir: Output directory path
        """
        os.makedirs(output_dir, exist_ok=True)
        
        print(f"💾 Exporting to {output_dir}...")
        
        for team_slug, contracts in contracts_by_team.items():
            team_abbr = self.TEAMS[team_slug]
            
            output_data = {
                "team_slug": team_slug,
                "team_abbr": team_abbr,
                "contract_count": len(contracts),
                "contracts": [asdict(c) for c in contracts]
            }
            
            filename = f"{team_abbr.lower()}.json"
            filepath = os.path.join(output_dir, filename)
            
            with open(filepath, 'w') as f:
                json.dump(output_data, f, indent=2)
            
            print(f"   ✅ {filename} ({len(contracts)} contracts)")
        
        # Create summary file
        summary = {
            "total_teams": len(contracts_by_team),
            "total_contracts": sum(len(c) for c in contracts_by_team.values()),
            "teams": {
                team_slug: {
                    "abbr": self.TEAMS[team_slug],
                    "contract_count": len(contracts)
                }
                for team_slug, contracts in contracts_by_team.items()
            }
        }
        
        summary_path = os.path.join(output_dir, "_summary.json")
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"\n   📊 Summary: {summary_path}")


def main():
    """Main execution"""
    scraper = SpotracScraper(rate_limit=1.5)  # Be respectful - 1.5s between requests
    
    # Test with one team first
    print("\n🧪 TEST MODE: Scraping Kansas City Chiefs...")
    test_contracts = scraper.scrape_team_contracts("kansas-city-chiefs")
    
    if not test_contracts:
        print("\n❌ Test failed - check the scraper")
        return
    
    print(f"\n✅ Test successful! Found {len(test_contracts)} contracts")
    
    # Show sample
    if test_contracts:
        sample = test_contracts[0]
        print(f"\n📋 Sample Contract:")
        print(f"   Player: {sample.player_name}")
        print(f"   Position: {sample.position}")
        print(f"   Cap Hit (2025): ${sample.cap_hit_2025:,}")
        print(f"   Total Value: ${sample.total_value:,}")
        print(f"   Years: {sample.years}")
    
    # Ask to continue
    print("\n" + "="*60)
    response = input("\n⚡ Scrape all 32 teams? (y/n): ").strip().lower()
    
    if response != 'y':
        print("Cancelled.")
        return
    
    # Scrape all teams
    all_contracts = scraper.scrape_all_teams()
    
    # Export
    scraper.export_to_json(all_contracts)
    
    print("\n🎉 Done! Contract data saved to ./spotrac_data/contracts/")


if __name__ == "__main__":
    main()