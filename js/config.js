/**
 * Future Quest 2026 - Configuration
 * Jain University, School of Future Technology
 * 
 * Central configuration object for contest parameters, timing, puzzle definitions,
 * mock answers, clues, and external submission endpoints.
 */

export const CONFIG = {
  // Competition timing
  MASTER_TIME: 7200, // 2 hours in seconds (7200 seconds)
  
  // Per-difficulty puzzle time limits in seconds
  // NOTE: Server must enforce these limits in production to prevent client tampering via DevTools.
  DIFFICULTY_TIME: {
    easy: 600,     // 10 minutes (600 seconds)
    medium: 900,   // 15 minutes (900 seconds)
    hard: 1200     // 20 minutes (1200 seconds)
  },

  // Game rules configuration
  MAX_ATTEMPTS: 3,
  TOTAL_HINTS: 3,

  // DEV-ONLY: Development helpers & UI toggle
  DEV_MODE: true,

  // DEV-ONLY: Style test flag for fixed tile order (false = sequential 1..11, true = randomized)
  SHUFFLE_TILES: false,

  // DEV-ONLY: Submission Form URL placeholder
  POSTER_FORM_URL: "https://docs.google.com/forms/d/e/1FAIpQLSc_JU_SFT_FQ2026_SUBMISSION_PLACEHOLDER/viewform",

  // Event branding and promotional content configuration
  EVENT: {
    institution: "JAIN (Deemed-to-be University) Kochi",
    school: "School of Future",
    fullName: "JAIN (Deemed-to-be University) Kochi, School of Future",
    poweredBy: "Powered by JAIN School of Future",
    title: "Future Quest '26",
    paragraph: "A tech treasure hunt for Higher Secondary students. Solve puzzles, collect clues and unlock secret submission specs.",
    tagline: "Curiosity, logic and a little code. Bring your whole team.",
    prizes: {
      winner: "₹50,000",
      winnerAmount: 50000,
      runnerUp: "₹25,000",
      runnerUpAmount: 25000
    },
    perks: [
      {
        id: "online-treasure-hunt",
        title: "Online treasure hunt",
        desc: "Solve tech puzzles, decode hidden clues, and assemble the secret submission."
      },
      {
        id: "ai-bootcamp",
        title: "Free AI Bootcamp",
        desc: "Hands-on masterclass in future technologies and artificial intelligence."
      },
      {
        id: "campus-finale",
        title: "Campus finale at JAIN Kochi",
        desc: "Grand on-campus final round showcase with awards and direct mentoring."
      }
    ],
    teamSize: "Teams of 3 to 5",
    registrationFree: "Registration free",
    eligibility: "Higher Secondary Students (Grades 11 & 12)",
    duration: "2 hours",
    format: "11 puzzles + submission",
    website: "www.jainsoft.co.in",
    websiteUrl: "https://www.jainsoft.co.in",
    queriesPhone: "7034065252",
    registrationUrl: "https://docs.google.com/forms/d/e/1FAIpQLSc_JU_SFT_FQ2026_REGISTRATION_PLACEHOLDER/viewform"
  },

  // Playful landing clue-card riddles (cosmetic one-liners for interactive card flip)
  LANDING_RIDDLES: [
    "I have cities without houses, forests without trees, and rivers without water. (A map!)",
    "I have no voice, but I speak to you; I have no brain, but I solve things too. (A computer!)",
    "I have a ring but no fingers, and I can be broken without touch. (A secret code!)",
    "The more you take from me, the bigger I get. (A treasure hole!)",
    "I run constantly without legs, have a face without eyes, and count your time. (A clock!)",
    "I have teeth but cannot bite, yet I unlock the deepest mysteries of the night. (A key!)",
    "Light as a feather, yet the strongest thinker cannot hold me for long. (Your breath!)",
    "Feed me and I live, give me a drink and I perish. (A lantern spark!)",
    "I have billions of branches and nodes, yet no trunk or leaves. (The web!)",
    "Turn me on my side and I am everything; cut me in half and I am nothing. (The number 8!)",
    "I wear a dial but have no telephone, pointing to true north all on my own. (A compass!)",
    "I hold ancient secrets without moving an inch, guarded by a lock that won't flinch. (A chest!)"
  ],

  // Granular animation & interaction feature toggles
  EFFECTS: {
    lanternHero: true,      // Spotlight torch and secret glyphs discovery
    prizeCountUp: true,     // Animated count-up for prize figures
    routePathDraw: true,    // Self-drawing dotted progress route
    gridPreviewFlip: true,  // 3D tilt and preview card flip
    tileMotion: true,       // Game tile hover lift, press feedback, and shine sweep
    cluePouch: true,        // Top clue pouch slot tracker strip
    keyAttempts: true,      // Key break animations & lantern extinguish on attempts/hints
    solveBurst: true,       // 16-piece CSS particle burst on puzzle solve
    timerBars: true         // ScaleX timer progress bars for master & puzzle clocks
  },

  /**
   * NOTE: In production, puzzle difficulty levels and time limits must come
   * from the server later (e.g. issued when a puzzle tile is opened), since
   * anything embedded in client code or configuration can be inspected using DevTools.
   * 
   * Difficulty is a mystery: the grid and navbar never hint at difficulty or time limits.
   * 
   * Current mock mapping: 2 easy, 5 medium, 4 hard (11 puzzles total).
   * The mix can be easily modified by updating the values below.
   */
  TILE_DIFFICULTY: {
    puzzle_1: "easy",
    puzzle_2: "easy",
    puzzle_3: "medium",
    puzzle_4: "medium",
    puzzle_5: "medium",
    puzzle_6: "medium",
    puzzle_7: "hard",
    puzzle_8: "hard",
    puzzle_9: "hard",
    puzzle_10: "hard",
    puzzle_11: "medium"
  },

  // Mock answers (validated case-insensitively with whitespace trimmed)
  MOCK_ANSWERS: {
    puzzle_1: "Tomorrow starts with the code you write today",
    puzzle_2: "LEARN BUILD LEAD",
    puzzle_3: "CODE THE FUTURE",
    puzzle_4: "CINNAMON BUN",
    puzzle_5: "HAVING",
    puzzle_6: "O(N^2)",
    puzzle_7: "AROUND",
    puzzle_8: "ROADSTER",
    puzzle_9: "2",
    puzzle_10: "15",
    puzzle_11: "CAP"
  },

  // Interactive puzzle configurations with type, prompt, data, and technical clues
  PUZZLES: {
        puzzle_1: {
      id: "puzzle_1",
      type: "ascii",
      title: "ASCII Quote Decoder",
      category: "Information Security",
      whatToDo: "Convert the numerical ASCII codes into characters to decode the quote. Use the reference chart if needed.",
      prompt: "Translate the 8-word quote encoded in standard ASCII numbers below.",
      hint: "Look up the standard ASCII decimal value for each number: 84 is 'T', 111 is 'o', 109 is 'm'...",
      clueType: "spec",
      clue: {
        title: "Clue Fragment 6: Required Quote",
        type: "spec",
        specs: [
          { label: "Fragment", value: "Fragment 6" },
          { label: "Quote to Add", value: '"Tomorrow starts with the code you write today"' },
          { label: "Font", value: "Arial" },
          { label: "Size", value: "14" },
          { label: "Style", value: "Italics" },
          { label: "Color", value: "Black" },
          { label: "Position", value: "Center, below FUTURE" }
        ]
      },
      data: {
        id: "puzzle_1",
        groups: ["Word 1", "Word 2", "Word 3", "Word 4", "Word 5", "Word 6", "Word 7", "Word 8"],
        groupSolutions: ["Tomorrow", "starts", "with", "the", "code", "you", "write", "today"],
        words: [
          { expectedText: "Tomorrow", codes: [84, 111, 109, 111, 114, 114, 111, 119], expectedChars: ['T','o','m','o','r','r','o','w'] },
          { expectedText: "starts", codes: [115, 116, 97, 114, 116, 115], expectedChars: ['s','t','a','r','t','s'] },
          { expectedText: "with", codes: [119, 105, 116, 104], expectedChars: ['w','i','t','h'] },
          { expectedText: "the", codes: [116, 104, 101], expectedChars: ['t','h','e'] },
          { expectedText: "code", codes: [99, 111, 100, 101], expectedChars: ['c','o','d','e'] },
          { expectedText: "you", codes: [121, 111, 117], expectedChars: ['y','o','u'] },
          { expectedText: "write", codes: [119, 114, 105, 116, 101], expectedChars: ['w','r','i','t','e'] },
          { expectedText: "today", codes: [116, 111, 100, 97, 121], expectedChars: ['t','o','d','a','y'] }
        ]
      }
    },
        puzzle_2: {
      id: "puzzle_2",
      type: "coords",
      title: "Coordinates Grid: Multi-Word Decoder",
      category: "Computer Science",
      whatToDo: "Locate the given (Col, Row) coordinate pairs on the 7×7 grid. Extract the letters to discover 3 core engineering principles.",
      prompt: "Read the cells at the designated coordinates to uncover the three mission keywords.",
      hint: "In (Col, Row), the first number is the horizontal column (1-7), and the second is the vertical row (1-7 from top).",
      clueType: "spec",
      clue: {
        title: "Clue Fragment 9: Required Motto (LEARN – BUILD – LEAD)",
        type: "spec",
        specs: [
          { label: "Fragment", value: "Fragment 9" },
          { label: "Motto to Add", value: "LEARN — BUILD — LEAD (Uppercase with dashes)" },
          { label: "Color Rules", value: "LEARN: Green, BUILD: Blue, LEAD: Red" },
          { label: "Position", value: "Lower-center, directly below the body paragraph" }
        ]
      },
      data: {
        id: "puzzle_2",
        groups: ["Word 1", "Word 2", "Word 3"],
        groupSolutions: ["LEARN", "BUILD", "LEAD"],
        grid: [
          ['Q', 'L', 'V', 'J', 'C', 'U', 'N'],
          ['C', 'S', 'A', 'P', 'P', 'K', 'F'],
          ['H', 'M', 'T', 'B', 'O', 'J', 'E'],
          ['Q', 'N', 'X', 'B', 'Z', 'L', 'Z'],
          ['R', 'H', 'D', 'X', 'M', 'K', 'I'],
          ['M', 'L', 'F', 'O', 'O', 'A', 'Z'],
          ['Z', 'S', 'N', 'E', 'R', 'X', 'D']
        ],
        groupedChips: [
          { name: "LEARN", coords: [[2,1,'L'], [7,3,'E'], [3,2,'A'], [1,5,'R'], [2,4,'N']] },
          { name: "BUILD", coords: [[4,3,'B'], [6,1,'U'], [7,5,'I'], [6,4,'L'], [3,5,'D']] },
          { name: "LEAD", coords: [[2,6,'L'], [4,7,'E'], [6,6,'A'], [7,7,'D']] }
        ]
      }
    },
        puzzle_3: {
      id: "puzzle_3",
      type: "bodmas",
      title: "Code The Future: BODMAS Decoder",
      category: "Computer Networks",
      whatToDo: "Evaluate each math expression using standard BODMAS/PEMDAS precedence. Map each number to its corresponding letter (1=A ... 26=Z).",
      prompt: "Calculate the 13 mathematical expressions to reveal the 3-word slogan.",
      hint: "Remember precedence: Brackets, Orders (powers), Division & Multiplication, Addition & Subtraction. 1=A, 2=B...",
      clueType: "spec",
      clue: {
        title: "Clue Fragment 5: Required Title (CODE THE FUTURE)",
        type: "spec",
        specs: [
          { label: "Fragment", value: "Fragment 5" },
          { label: "Title to Add", value: "CODE THE (line 1) / FUTURE (line 2)" },
          { label: "Font", value: "Arial Black (Bold display)" },
          { label: "Size", value: "CODE THE: 20, FUTURE: 24" },
          { label: "Color", value: "Yellow" },
          { label: "Position", value: "Upper-center, below FUTURE QUEST 2026" }
        ]
      },
      data: {
        id: "puzzle_3",
        groups: ["Word 1", "Word 2", "Word 3"],
        groupSolutions: ["CODE", "THE", "FUTURE"],
        groupedEquations: [
          {
            name: "CODE",
            solution: "CODE",
            equations: [
              { expr: "20 - 4 * 5 + 3", display: "20 - 4 * 5 + 3", expected: 3, letter: "C" },
              { expr: "3^2 + 18 / 3", display: "3^2 + 18 / 3", expected: 15, letter: "O" },
              { expr: "24 / (2 * 3)", display: "24 / (2 * 3)", expected: 4, letter: "D" },
              { expr: "2 + 3 * (9 - 7) - 3", display: "2 + 3 * (9 - 7) - 3", expected: 5, letter: "E" }
            ]
          },
          {
            name: "THE",
            solution: "THE",
            equations: [
              { expr: "4^2 + 12 / 3", display: "4^2 + 12 / 3", expected: 20, letter: "T" },
              { expr: "2^3 + 6 - 3 * 2", display: "2^3 + 6 - 3 * 2", expected: 8, letter: "H" },
              { expr: "(10 - 4) * 2 - 7", display: "(10 - 4) * 2 - 7", expected: 5, letter: "E" }
            ]
          },
          {
            name: "FUTURE",
            solution: "FUTURE",
            equations: [
              { expr: "3 * (4 + 4) / 4", display: "3 * (4 + 4) / 4", expected: 6, letter: "F" },
              { expr: "5^2 - 12 / 3", display: "5^2 - 12 / 3", expected: 21, letter: "U" },
              { expr: "100 / (2 * 5) * 2", display: "100 / (2 * 5) * 2", expected: 20, letter: "T" },
              { expr: "6 + 3 * 5", display: "6 + 3 * 5", expected: 21, letter: "U" },
              { expr: "(12 - 3) * 4 / 2", display: "(12 - 3) * 4 / 2", expected: 18, letter: "R" },
              { expr: "4^2 / 2 - 3", display: "4^2 / 2 - 3", expected: 5, letter: "E" }
            ]
          }
        ]
      }
    },
    puzzle_4: {
      id: "puzzle_4",
      type: "riddle",
      title: "The 17-Year-Old OS Riddle",
      category: "Operating Systems & Hardware",
      whatToDo: "Decrypt the identity riddle: read the cryptic clues about the legendary 17-year-old operating system's nickname, and type the letter keycaps.",
      prompt: "Identify the 17-year-old mobile OS with sweet, spiced roots.",
      hint: "Android was launched in 2008 (~17 years ago), sports a green alien mascot, and used confectionery code-names with aromatic spices.",
      clueType: "spec",
      clue: {
        title: "Clue Fragment 4: System Architecture & Palette",
        type: "spec",
        specs: [
          { label: "Fragment", value: "Fragment 4" },
          { label: "OS Foundation", value: "Linux Kernel 2.6+ / AOSP" },
          { label: "Accent Palette", value: "#F59E0B (Spiced Amber)" },
          { label: "Display Typography", value: "Space Grotesk / Arial Black" },
          { label: "Alignment Directive", value: "All telemetry feeds aligned to monospace grid" }
        ]
      },
      data: {
        id: "puzzle_4",
        categoryTag: "OPERATING SYSTEMS & HARDWARE",
        formatBadge: "2 WORDS (8 + 3 LETTERS)",
        riddleLines: [
          "My age is 17. I'm the one who helps your software coordinate with hardware.",
          "I'm very popular, might look like that cliché alien, but don't worry—",
          "I'm sweet, but have a spice in my name. What confection am I?"
        ],
        solution: "CINNAMON BUN",
        acceptedSolutions: ["CINNAMON BUN", "CINNAMON ROLL"],
        words: [
          { name: "Word 1", length: 8 },
          { name: "Word 2", length: 3 }
        ]
      }
    },
    puzzle_5: {
      id: "puzzle_5",
      type: "bodmas",
      title: "BODMAS Anagram: QUEST",
      category: "Database Systems",
      whatToDo: "Solve the 5 math equations to obtain numbers. Map them to letters (1=A ... 26=Z), then unscramble the letters in the tray to form a 5-letter word.",
      prompt: "Calculate the numbers for the 5 equations, unlock the letter tiles, and assemble them into the correct word.",
      hint: "The 5 numbers evaluate to 5 (E), 20 (T), 17 (Q), 19 (S), and 21 (U). Unscramble them to form the event's name.",
      clueType: "text",
      clue: {
        title: "Primary Mission Statement Copy",
        type: "text",
        content: "Hosted by JAIN (Deemed-to-be University) Kochi, School of Future. Student teams synthesize telemetry to design resilient edge monitoring interfaces."
      },
      data: {
        id: "puzzle_5",
        hasAnagramTray: true,
        groups: ["Target Word"],
        groupSolutions: ["QUEST"],
        equations: [
          { expr: "15 - 2 * 5", display: "15 - 2 * 5", expected: 5, letter: "E" },
          { expr: "5 * (7 - 3)", display: "5 * (7 - 3)", expected: 20, letter: "T" },
          { expr: "2 + 3 * 5", display: "2 + 3 * 5", expected: 17, letter: "Q" },
          { expr: "4^2 + 9 / 3", display: "4^2 + 9 / 3", expected: 19, letter: "S" },
          { expr: "(4 + 3) * 3", display: "(4 + 3) * 3", expected: 21, letter: "U" }
        ]
      }
    },
    puzzle_6: {
      id: "puzzle_6",
      type: "coords",
      title: "Route Tracer: BYTE",
      category: "Computer Science",
      whatToDo: "Follow the step-by-step route directions across the 7×7 grid starting from (1, 7). Tap each destination point to spell out the keyword.",
      prompt: "Trace the navigation legs starting at coordinate (1, 7) [B] through the grid.",
      hint: "Start at (1, 7). Step 1 goes 6 steps East to (7, 7). Step 2 goes 2 North, 5 West to (2, 5). Step 3 goes 1 North, 4 East to (6, 4).",
      clueType: "image",
      clue: {
        title: "Edge Network Topology Diagram",
        type: "image",
        filename: "edge-network-topology.svg",
        caption: "Architectural Schematic: 4-Node Sensor Mesh",
        svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="100%" height="160" style="background:#090d16; border-radius:4px;">
  <rect width="320" height="180" fill="#0d1117"/>
  <line x1="80" y1="50" x2="240" y2="50" stroke="#30363d" stroke-width="2"/>
  <line x1="80" y1="130" x2="240" y2="130" stroke="#30363d" stroke-width="2"/>
  <line x1="80" y1="50" x2="80" y2="130" stroke="#30363d" stroke-width="2"/>
  <line x1="240" y1="50" x2="240" y2="130" stroke="#30363d" stroke-width="2"/>
  <line x1="80" y1="50" x2="240" y2="130" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="4 2"/>
  <rect x="60" y="35" width="40" height="30" rx="3" fill="#161b22" stroke="#388bfd" stroke-width="1.5"/>
  <text x="73" y="54" fill="#388bfd" font-family="'IBM Plex Mono', monospace" font-size="11" font-weight="700">N1</text>
  <rect x="220" y="35" width="40" height="30" rx="3" fill="#161b22" stroke="#388bfd" stroke-width="1.5"/>
  <text x="233" y="54" fill="#388bfd" font-family="'IBM Plex Mono', monospace" font-size="11" font-weight="700">N2</text>
  <rect x="60" y="115" width="40" height="30" rx="3" fill="#161b22" stroke="#388bfd" stroke-width="1.5"/>
  <text x="73" y="134" fill="#388bfd" font-family="'IBM Plex Mono', monospace" font-size="11" font-weight="700">N3</text>
  <rect x="220" y="115" width="40" height="30" rx="3" fill="#161b22" stroke="#388bfd" stroke-width="1.5"/>
  <text x="233" y="134" fill="#388bfd" font-family="'IBM Plex Mono', monospace" font-size="11" font-weight="700">N4</text>
  <text x="160" y="95" text-anchor="middle" fill="#8b949e" font-family="'IBM Plex Mono', monospace" font-size="10">SYNCHRONIZED MESH</text>
</svg>`
      },
      data: {
        id: "puzzle_6",
        isRouteTracer: true,
        groups: ["Route Word"],
        groupSolutions: ["BYTE"],
        grid: [
          ['S', 'K', 'A', 'T', 'E', 'R', 'X'],
          ['M', 'N', 'O', 'P', 'Q', 'U', 'H'],
          ['F', 'L', 'D', 'G', 'B', 'I', 'W'],
          ['C', 'Y', 'Z', 'V', 'J', 'E', 'R'],
          ['A', 'T', 'H', 'S', 'N', 'O', 'K'],
          ['P', 'Q', 'U', 'D', 'M', 'L', 'F'],
          ['B', 'G', 'X', 'I', 'Z', 'V', 'Y']
        ],
        legs: [
          { desc: "From (1,7), travel 6 steps East (Right)", targetCol: 7, targetRow: 7, letter: "Y" },
          { desc: "From (7,7), travel 2 steps North (Up) and 5 steps West (Left)", targetCol: 2, targetRow: 5, letter: "T" },
          { desc: "From (2,5), travel 1 step North (Up) and 4 steps East (Right)", targetCol: 6, targetRow: 4, letter: "E" }
        ]
      }
    },
        puzzle_7: {
      id: "puzzle_7",
      type: "wordsearch",
      title: "Treasure Hunt Word Search",
      category: "Applied Cryptography",
      whatToDo: "Locate all 20 tech terms from the word list in the 15×15 matrix. Words can go in any of 8 directions (horizontal, vertical, diagonal, forward, or backward).",
      prompt: "Find the 20 technology words listed in the checklist below.",
      hint: "Look for AROUND starting at [5,0] going up, ARTIFICIAL at [0,7] going down, FUTURE at [7,8] going down...",
      clueType: "spec",
      clue: {
        title: "Clue Fragment 8: Required Word Bank (Submission Paragraph)",
        type: "spec",
        specs: [
          { label: "Fragment", value: "Fragment 8" },
          { label: "Found Words", value: "AROUND, ARTIFICIAL, CENTERED, COMPUTING, DAILY, DATA, EDGE, FUTURE, INNOVATIONS, INTEGRATION, LIFE, QUANTUM, RAPID, REALITY, RESHAPE, ROBOTICS, SCIENCE, SUSTAINABLE, TECHNOLOGY, VIRTUAL" },
          { label: "Font", value: "Calibri" },
          { label: "Size", value: "12" },
          { label: "Style", value: "Italics" },
          { label: "Color", value: "Black" },
          { label: "Position", value: "Lower-center, below the centerpiece image" },
          { label: "Paragraph Rule", value: "Write your submission paragraph using these 20 words." }
        ]
      },
      data: {
        id: "puzzle_7",
        grid: [
          ['D','P','Y','M','A','F','A','A','R','S','P','V','O','M','J'],
          ['N','X','G','E','N','S','L','R','E','U','M','E','F','I','L'],
          ['U','K','O','D','E','N','K','T','S','S','A','K','Y','K','M'],
          ['O','A','L','D','C','O','G','I','H','T','W','A','X','C','J'],
          ['R','T','O','E','N','I','I','F','A','A','L','C','Y','E','M'],
          ['A','A','N','G','E','T','M','I','P','I','S','R','T','N','C'],
          ['L','D','H','D','I','A','N','C','E','N','G','O','I','T','Q'],
          ['Y','I','C','E','C','V','B','I','F','A','N','B','L','E','U'],
          ['I','D','E','B','S','O','V','A','U','B','I','O','A','R','A'],
          ['J','U','T','E','H','N','I','L','T','L','T','T','E','E','N'],
          ['D','I','P','A','R','N','N','Q','U','E','U','I','R','D','T'],
          ['D','A','I','L','Y','I','K','G','R','Y','P','C','L','Z','U'],
          ['V','I','R','T','U','A','L','N','E','A','M','S','Z','Y','M'],
          ['U','I','N','T','E','G','R','A','T','I','O','N','M','R','R'],
          ['G','X','C','B','X','N','O','T','Y','E','C','U','J','P','B']
        ],
        words: [
          "AROUND", "ARTIFICIAL", "CENTERED", "COMPUTING", "DAILY",
          "DATA", "EDGE", "FUTURE", "INNOVATIONS", "INTEGRATION",
          "LIFE", "QUANTUM", "RAPID", "REALITY", "RESHAPE",
          "ROBOTICS", "SCIENCE", "SUSTAINABLE", "TECHNOLOGY", "VIRTUAL"
        ]
      }
    },
    puzzle_8: {
      id: "puzzle_8",
      type: "riddle",
      title: "The Orbital Starman Riddle",
      category: "Automotive & Aerospace",
      whatToDo: "Deduce the vehicle described in the cosmic riddle. Type the 8-letter model name into the tactile keycaps.",
      prompt: "Solve the riddle of the spacefaring convertible piloted by Starman.",
      hint: "In February 2018, Falcon Heavy launched Elon Musk's cherry electric convertible into heliocentric orbit carrying a dummy in a spacesuit.",
      clueType: "spec",
      clue: {
        title: "Clue Fragment 7: Aerospace Telemetry & Specs",
        type: "spec",
        specs: [
          { label: "Fragment", value: "Fragment 7" },
          { label: "Payload Vehicle", value: "Midnight Cherry Roadster + Starman" },
          { label: "Orbital Speed", value: "22,000 km/h (Heliocentric)" },
          { label: "Telemetry Carrier", value: "Deep Space Network S-Band" },
          { label: "Security Directive", value: "Verify SHA-256 cryptographic hashes on all telemetry frames" }
        ]
      },
      data: {
        id: "puzzle_8",
        categoryTag: "AEROSPACE & AUTOMOTIVE TELEMETRY",
        formatBadge: "1 WORD (8 LETTERS)",
        riddleLines: [
          "Born on asphalt, now sailing through space,",
          "Drop my roof to feel wind in your face.",
          "With Starman at the wheel, what car am I?"
        ],
        solution: "ROADSTER",
        acceptedSolutions: ["ROADSTER"],
        words: [
          { name: "Vehicle Model", length: 8 }
        ]
      }
    },
    puzzle_9: {
      id: "puzzle_9",
      type: "bodmas",
      title: "Slotted BODMAS: SIGNAL",
      category: "Low-Level Computing",
      whatToDo: "Evaluate the 6 scrambled math equations using BODMAS. Map each answer to a letter (1=A ... 26=Z) and place it in its designated slot #1 to #6.",
      prompt: "Solve each equation and observe its slot number to assemble the 6-letter keyword.",
      hint: "Equation for Slot 1 evaluates to 19 (S), Slot 2 to 9 (I), Slot 3 to 7 (G), Slot 4 to 14 (N), Slot 5 to 1 (A), Slot 6 to 12 (L).",
      clueType: "image",
      clue: {
        title: "Institutional Sponsor & Accreditation Seal",
        type: "image",
        filename: "ju-accreditation-seal.svg",
        caption: "JAIN (Deemed-to-be University) Kochi, School of Future Accreditation Mark",
        svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="100%" height="160" style="background:#090d16; border-radius:4px;">
  <rect width="320" height="180" fill="#0d1117"/>
  <rect x="20" y="20" width="280" height="140" fill="none" stroke="#238636" stroke-width="1.5"/>
  <path d="M35 40 L60 40 L60 65" stroke="#238636" stroke-width="2" fill="none"/>
  <path d="M285 40 L260 40 L260 65" stroke="#238636" stroke-width="2" fill="none"/>
  <path d="M35 140 L60 140 L60 115" stroke="#238636" stroke-width="2" fill="none"/>
  <path d="M285 140 L260 140 L260 115" stroke="#238636" stroke-width="2" fill="none"/>
  <text x="160" y="65" text-anchor="middle" fill="#3fb950" font-family="'IBM Plex Mono', monospace" font-size="12" font-weight="700">VERIFIED ACCREDITATION</text>
  <text x="160" y="90" text-anchor="middle" fill="#f0f6fc" font-family="'IBM Plex Sans', sans-serif" font-size="14" font-weight="600">JAIN UNIVERSITY KOCHI - SOF</text>
  <text x="160" y="112" text-anchor="middle" fill="#8b949e" font-family="'IBM Plex Sans', sans-serif" font-size="11">Engineering Excellence & Innovation</text>
  <text x="160" y="135" text-anchor="middle" fill="#238636" font-family="'IBM Plex Mono', monospace" font-size="10">AUTH CODE: JU-SFT-ACCR-2026</text>
</svg>`
      },
      data: {
        id: "puzzle_9",
        groups: ["Keyword"],
        groupSolutions: ["SIGNAL"],
        finalWord: "SIGNAL",
        equations: [
          { slot: 3, expr: "2 * (3^2 - 2 * 3) + 1", display: "2 * (3^2 - 2 * 3) + 1", expected: 7, letter: "G" },
          { slot: 6, expr: "3 * (2 + 2)^2 / 4", display: "3 * (2 + 2)^2 / 4", expected: 12, letter: "L" },
          { slot: 1, expr: "(3 + 2)^2 - 12 / 2", display: "(3 + 2)^2 - 12 / 2", expected: 19, letter: "S" },
          { slot: 5, expr: "5^2 - 4 * (3 + 3)", display: "5^2 - 4 * (3 + 3)", expected: 1, letter: "A" },
          { slot: 2, expr: "100 / (2 * 5) - 2^3 + 7", display: "100 / (2 * 5) - 2^3 + 7", expected: 9, letter: "I" },
          { slot: 4, expr: "(18 - 4) / 2 * 2", display: "(18 - 4) / 2 * 2", expected: 14, letter: "N" }
        ]
      }
    },
    puzzle_10: {
      id: "puzzle_10",
      type: "coords",
      title: "Cartesian Coordinates: CYBER",
      category: "Discrete Mathematics",
      whatToDo: "Attention: This 7×7 grid is Cartesian! Row 1 is at the bottom, Row 7 is at the top. Solve the math expressions for (Col, Row) and retrieve each letter.",
      prompt: "Evaluate the coordinate formulas to find the grid coordinates (Col, Row), noting that Row 1 is at the bottom.",
      hint: "Row 1 is at the very bottom. (10/2, 3^2-4) = (5, 5) -> C; (2^2, 12/3) = (4, 4) -> Y; (8-6, 9/3) = (2, 3) -> B...",
      clueType: "spec",
      clue: {
        title: "Footer & Legal Typography Specification",
        type: "spec",
        specs: [
          { label: "Component", value: "Poster Metadata Footer" },
          { label: "Font Family", value: "IBM Plex Mono, monospace" },
          { label: "Font Size", value: "11px / Line Height: 15px" },
          { label: "Font Weight", value: "400 (Regular)" },
          { label: "Color", value: "#64748B (Slate 500)" },
          { label: "Alignment", value: "Left Aligned, Bottom Anchor" }
        ]
      },
      data: {
        id: "puzzle_10",
        isBottomUp: true,
        groups: ["Target Word"],
        groupSolutions: ["CYBER"],
        finalWord: "CYBER",
        grid: [
          ['M', 'Q', 'F', 'U', 'X', 'B', 'A'],
          ['J', 'L', 'W', 'D', 'S', 'K', 'E'],
          ['V', 'N', 'H', 'R', 'C', 'P', 'I'],
          ['T', 'G', 'O', 'Y', 'Z', 'A', 'L'],
          ['D', 'B', 'S', 'I', 'M', 'F', 'U'],
          ['R', 'X', 'K', 'Q', 'E', 'W', 'N'],
          ['Z', 'H', 'P', 'L', 'V', 'J', 'G']
        ],
        mathCoords: [
          { expr: "(10 ÷ 2, 3² - 4)", col: 5, row: 5, letter: "C" },
          { expr: "(2², 12 ÷ 3)", col: 4, row: 4, letter: "Y" },
          { expr: "(8 - 6, 9 ÷ 3)", col: 2, row: 3, letter: "B" },
          { expr: "(3 + 2, 6 ÷ 3)", col: 5, row: 2, letter: "E" },
          { expr: "(2 × 2, 15 ÷ 3)", col: 4, row: 5, letter: "R" }
        ]
      }
    },
    puzzle_11: {
      id: "puzzle_11",
      type: "wordsearch",
      title: "Clue Word Search: 8 Tech Frontiers",
      category: "Systems Architecture",
      whatToDo: "Solve each definition clue in the list, then search for and select its keyword in the 12×12 matrix.",
      prompt: "Find the 8 frontier technology words matching the clues in the sidebar.",
      hint: "Clues correspond to NETWORK, CIPHER, KERNEL, BINARY, MATRIX, PACKET, SENSOR, MEMORY.",
      clueType: "text",
      clue: {
        title: "Official Final Verification Token",
        type: "text",
        content: "VAULT_RELEASE_TOKEN: JU-SFT-2026-OMEGA-8821-VERIFIED"
      },
      data: {
        id: "puzzle_11",
        isClueMode: true,
        grid: [
          ['K','A','J','F','G','E','T','A','A','H','S','F'],
          ['M','N','E','T','W','O','R','K','S','F','N','K'],
          ['M','Z','H','J','E','V','G','Q','H','R','S','Q'],
          ['M','C','E','K','E','R','N','E','L','Y','E','R'],
          ['E','I','Y','N','C','X','V','L','P','G','N','B'],
          ['M','P','G','B','I','N','A','R','Y','G','S','J'],
          ['O','H','M','F','U','Q','P','T','C','T','O','Q'],
          ['R','E','H','M','A','T','R','I','X','B','R','W'],
          ['Y','R','S','C','W','R','D','B','Q','S','X','Z'],
          ['C','T','E','P','A','C','K','E','T','V','A','Q'],
          ['G','D','T','W','P','Y','Z','S','R','B','X','F'],
          ['P','R','E','W','J','W','J','K','T','M','E','D']
        ],
        words: [
          { word: "NETWORK", clue: "Interconnected computing nodes and telemetry mesh" },
          { word: "CIPHER", clue: "Algorithm for encryption or secret data conversion" },
          { word: "KERNEL", clue: "Core central module of an operating system" },
          { word: "BINARY", clue: "Base-2 numeral system of bits (0 and 1)" },
          { word: "MATRIX", clue: "Rectangular array of data values or mathematical grid" },
          { word: "PACKET", clue: "Formatted unit of data carried across a network" },
          { word: "SENSOR", clue: "Edge device detecting physical input and signals" },
          { word: "MEMORY", clue: "Hardware subsystem for runtime data storage" }
        ]
      }
    }
  }
};

/**
 * Returns the human-readable tile label for a given grid index (0 to 10).
 * All 11 puzzle tiles use "Task N" (where N is 1 to 11).
 */
export function getTileLabel(tileIndex) {
  return `Task ${tileIndex + 1}`;
}
