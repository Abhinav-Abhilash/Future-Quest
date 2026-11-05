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

  // Per-puzzle custom time limits in seconds (overrides DIFFICULTY_TIME)
  PUZZLE_TIME_OVERRIDE: {
    puzzle_11: 480 // 8 minutes (480 seconds)
  },

  // Puzzles where hints are disallowed
  NO_HINT_PUZZLES: ['puzzle_11'],

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
    puzzle_10: "medium",
    puzzle_11: "hard"
  },

  // Mock answers (validated case-insensitively with whitespace trimmed)
  MOCK_ANSWERS: {
    puzzle_1: "Tomorrow starts with the code you write today",
    puzzle_2: "LEARN BUILD LEAD",
    puzzle_3: "CODE THE FUTURE",
    puzzle_4: "CINNAMON BUN",
    puzzle_5: "WHERE HUMAN MEETS AI",
    puzzle_6: "JAIN UNIVERSITY SCHOOL OF FUTURE TECHNOLOGY",
    puzzle_7: "AROUND",
    puzzle_8: "ROADSTER",
    puzzle_9: "DARK BLUE AND LIGHT STEEL BLUE",
    puzzle_10: "FUTURE QUEST",
    puzzle_11: "ROADSTER"
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
      hint: "Open the ASCII Table reference drawer. Lowercase letters start at 97 ('a') through 122 ('z'), while uppercase letters range from 65 ('A') to 90 ('Z').",
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
      hint: "Read each coordinate pair as (Column, Row). Count columns from left to right (1–7) and rows from top to bottom (1–7) to find the intersecting letter.",
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
      hint: "Evaluate operations inside brackets first, then division and multiplication before addition and subtraction. Convert resulting numbers into alphabetical order (1=A, 2=B...).",
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
      hint: "Think of the world's most popular mobile operating system. Before switching strictly to numbers, each major release was nicknamed after a beloved dessert or sweet baked treat.",
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
      type: "ascii",
      title: "Reverse-Index Cipher: WHERE HUMAN MEETS AI",
      category: "Cybernetics & Cryptography",
      whatToDo: "Decode the reverse-index numerical tokens into letters (where Z=1, Y=2, X=3 ... C=24, B=25, A=26). Type the letters to reveal the centerpiece phrase.",
      prompt: "Decrypt the 4-word centerpiece theme using reverse alphabet indexing.",
      hint: "This cipher inverts the alphabet (Z=1, Y=2, A=26). Subtract each given number from 27 to find its standard alphabetical position. Open the reference drawer for assistance.",
      clueType: "image",
      clue: {
        title: "Clue Fragment 3: Centerpiece Graphic (Where Human Meets AI)",
        type: "image",
        imageUrl: "assets/human_meets_ai.png",
        filename: "human_meets_ai.png",
        caption: "Centerpiece Graphic Asset: Robotic Hand & Human Hand Touching"
      },
      data: {
        id: "puzzle_5",
        isAtbash: true,
        groups: ["Word 1", "Word 2", "Word 3", "Word 4"],
        groupSolutions: ["WHERE", "HUMAN", "MEETS", "AI"],
        words: [
          { expectedText: "WHERE", codes: [4, 19, 22, 9, 22], expectedChars: ['W','H','E','R','E'] },
          { expectedText: "HUMAN", codes: [19, 6, 14, 26, 13], expectedChars: ['H','U','M','A','N'] },
          { expectedText: "MEETS", codes: [14, 22, 22, 7, 8], expectedChars: ['M','E','E','T','S'] },
          { expectedText: "AI", codes: [26, 18], expectedChars: ['A','I'] }
        ]
      }
    },
    puzzle_6: {
      id: "puzzle_6",
      type: "riddle",
      title: "Host Institution Cryptogram",
      category: "Institutional Identity",
      whatToDo: "Deduce the complete hosting department and university name. Type the letters into the keycaps.",
      prompt: "What department and school hosts this quest?",
      hint: "Look at the official header at the top of the event branding. It combines the university name and its specialized technology division.",
      clueType: "spec",
      clue: {
        title: "Clue Fragment 2: Institution Branding & Logo Spec",
        type: "spec",
        specs: [
          { label: "Fragment", value: "Fragment 2" },
          { label: "Institution Logo", value: "JGi JAIN (Deemed-to-be University) Kochi" },
          { label: "Primary Header", value: "JAIN UNIVERSITY." },
          { label: "Secondary Subhead", value: "SCHOOL OF FUTURE TECHNOLOGY" },
          { label: "Position", value: "Top-left corner of the poster canvas" },
          { label: "Font / Weight", value: "Helvetica / Arial Bold, uppercase" }
        ]
      },
      data: {
        id: "puzzle_6",
        categoryTag: "HOST INSTITUTION & DEPARTMENT",
        formatBadge: "6 WORDS (4 + 10 + 6 + 2 + 6 + 10 LETTERS)",
        riddleLines: [
          "What department and school hosts this quest?"
        ],
        solution: "JAIN UNIVERSITY SCHOOL OF FUTURE TECHNOLOGY",
        acceptedSolutions: [
          "JAIN UNIVERSITY SCHOOL OF FUTURE TECHNOLOGY",
          "SCHOOL OF FUTURE TECHNOLOGY",
          "JAIN UNIVERSITY SCHOOL OF FUTURE TECH"
        ],
        words: [
          { name: "Word 1", length: 4 },
          { name: "Word 2", length: 10 },
          { name: "Word 3", length: 6 },
          { name: "Word 4", length: 2 },
          { name: "Word 5", length: 6 },
          { name: "Word 6", length: 10 }
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
      hint: "Scan the matrix in all 8 directions—words can run horizontally, vertically, or diagonally. Try searching for uncommon letters like 'Q' in Quantum, 'Z', or distinctive double-letter clusters.",
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
      hint: "A pioneer electric vehicle manufacturer launched their iconic two-door open-top sports car into deep orbit as the test payload on a heavy-lift rocket.",
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
      type: "riddle",
      title: "The Dual Color Palette Riddle",
      category: "Colorimetry & Graphic Design",
      whatToDo: "Deduce the two background colors from the poetic colorimetry riddle. Type the color names into the keycaps.",
      prompt: "Identify the two complementary colors that form the poster canvas background.",
      hint: "Both colors belong to the same cool color family. One is deep and shadowy, while the other is an airy pastel named after an industrial metallic alloy.",
      clueType: "image",
      clue: {
        title: "Clue Fragment 1: Official Canvas Background Specification",
        type: "image",
        imageUrl: "assets/poster_background_palette.png",
        filename: "poster_background_palette.png",
        caption: "Canvas Asset: Dark Blue to Light Steel Blue Gradient with Concentric Circular Alignment Lines"
      },
      data: {
        id: "puzzle_9",
        categoryTag: "POSTER PALETTE SPECIFICATION",
        formatBadge: "6 WORDS (4 + 4 + 3 + 5 + 5 + 4 LETTERS)",
        riddleLines: [
          "We are born of the exact same race.",
          "One of us is full of dark humor with a solid character.",
          "The other has a very light mind, but a heart as hard as steel.",
          "What two colors are we?"
        ],
        solution: "DARK BLUE AND LIGHT STEEL BLUE",
        acceptedSolutions: [
          "DARK BLUE AND LIGHT STEEL BLUE",
          "DARK BLUE LIGHT STEEL BLUE",
          "DARK BLUE & LIGHT STEEL BLUE"
        ],
        words: [
          { name: "Color 1 (Part 1)", length: 4 },
          { name: "Color 1 (Part 2)", length: 4 },
          { name: "Conjunction", length: 3 },
          { name: "Color 2 (Part 1)", length: 5 },
          { name: "Color 2 (Part 2)", length: 5 },
          { name: "Color 2 (Part 3)", length: 4 }
        ]
      }
    },
    puzzle_10: {
      id: "puzzle_10",
      type: "coords",
      title: "Coordinates Grid: FUTURE QUEST",
      category: "Design Systems & Event Geometry",
      whatToDo: "Locate the given (Col, Row) coordinate pairs on the 7×7 grid. Extract the letters to discover the 2-word competition theme.",
      prompt: "Read the cells at the designated coordinates to uncover the event title.",
      hint: "Read each coordinate pair as (Column, Row). Count columns from left to right (1–7) and rows from top to bottom (1–7) to find each letter.",
      clueType: "spec",
      clue: {
        title: "Clue Fragment 10: Geometric Grid Alignment Specification",
        type: "spec",
        specs: [
          { label: "Fragment", value: "Fragment 10" },
          { label: "Concentric Circles", value: "Two concentric guide circles centered at (50%, 48%)" },
          { label: "Outer Circle Radius", value: "42% canvas width with 0.8px translucent guide stroke" },
          { label: "Inner Circle Radius", value: "28% canvas width" },
          { label: "Rule of Thirds", value: "Vertical & horizontal 3×3 guidelines separating header, centerpiece, and body text" }
        ]
      },
      data: {
        id: "puzzle_10",
        groups: ["Word 1", "Word 2"],
        groupSolutions: ["FUTURE", "QUEST"],
        finalWord: "FUTURE QUEST",
        grid: [
          ['M', 'P', 'F', 'I', 'X', 'B', 'K'],
          ['J', 'L', 'W', 'D', 'N', 'U', 'E'],
          ['A', 'N', 'G', 'R', 'C', 'P', 'Z'],
          ['O', 'T', 'Y', 'L', 'V', 'D', 'H'],
          ['U', 'B', 'S', 'M', 'K', 'A', 'U'],
          ['H', 'X', 'K', 'Q', 'E', 'W', 'N'],
          ['Z', 'C', 'P', 'L', 'R', 'T', 'O']
        ],
        groupedChips: [
          {
            name: "FUTURE",
            coords: [
              [3, 1, 'F'],
              [6, 2, 'U'],
              [2, 4, 'T'],
              [7, 5, 'U'],
              [4, 3, 'R'],
              [5, 6, 'E']
            ]
          },
          {
            name: "QUEST",
            coords: [
              [4, 6, 'Q'],
              [1, 5, 'U'],
              [7, 2, 'E'],
              [3, 5, 'S'],
              [6, 7, 'T']
            ]
          }
        ]
      }
    },
    puzzle_11: {
      id: "puzzle_11",
      type: "snake",
      title: "Apple Eats Snake",
      category: "Reverse Arcade Dynamics",
      whatToDo: "Guide the apple to eat the snake's segments in the right order to spell the secret word.",
      prompt: "Guide the hungry red apple to consume the wandering snake's body segments in the exact sequence of the secret word.",
      clueType: "text",
      clue: {
        title: "Word for your poster",
        label: "Word for your poster",
        type: "text",
        content: "ROADSTER"
      },
      data: {
        id: "puzzle_11",
        targetWord: "ROADSTER",
        gridSize: 15
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
