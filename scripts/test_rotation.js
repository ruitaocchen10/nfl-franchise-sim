// Test rotation formula
const DIVISION_NAMES = ["East", "West", "North", "South"];

for (let year = 2026; year <= 2028; year++) {
  console.log(`\nYear ${year} (mod 3 = ${year % 3}):`);

  const pairs = new Set();
  for (let i = 0; i < 4; i++) {
    const opponent = (i + (year % 3) + 1) % 4;
    const div1 = DIVISION_NAMES[i];
    const div2 = DIVISION_NAMES[opponent];
    const pair = [div1, div2].sort().join("-");
    pairs.add(pair);
    console.log(`  ${div1} → ${div2}`);
  }

  console.log(`  Unique pairs: ${Array.from(pairs).join(", ")}`);
  console.log(`  Count: ${pairs.size} (expected: 2)`);
}
