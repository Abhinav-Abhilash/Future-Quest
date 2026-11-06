/**
 * Future Quest 2026 - Configuration
 * Jain University, School of Future Technology
 * 
 * Central configuration object for contest parameters, timing, and client routing.
 * NOTE: All puzzle answers, solutions, hints, clues, and difficulty levels
 * are strictly held on the server (server/puzzles/definitions.js).
 */

export const CONFIG = {
  // Backend API base endpoint
  API_BASE_URL: (typeof window === 'undefined' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3001/api'
    : '/api',

  // Official Google Form submission portal for final poster submission
  POSTER_FORM_URL: 'https://forms.gle/38P9x5TpBw4URK2N8',

  // Competition timing
  MASTER_TIME: 7200, // 2 hours in seconds (7200 seconds)
  TOTAL_TIME_MINUTES: 120,
  
  // Game rules configuration
  MAX_ATTEMPTS: null, // Unlimited attempts (teams can try as much as needed)
  TOTAL_HINTS: 3,

  // DEV-ONLY: Development helpers & UI toggle
  DEV_MODE: false,

  // DEV-ONLY: Style test flag for fixed tile order (false = sequential 1..10, true = randomized)
  SHUFFLE_TILES: false,

  // Food difficulty badges (circle in square: green=easy, yellow=medium, red=hard)
  // Time allocated per puzzle hardness
  DIFFICULTY_TIME: {
    easy: 600,     // 10 minutes (600s)
    medium: 900,   // 15 minutes (900s)
    hard: 1200,    // 20 minutes (1200s)
  },

  TILE_DIFFICULTY: {
    puzzle_1: "easy",
    puzzle_2: "easy",
    puzzle_3: "medium",
    puzzle_4: "medium",
    puzzle_5: "medium",
    puzzle_6: "medium",
    puzzle_7: "hard",
    puzzle_8: "medium",
    puzzle_9: "hard",
    puzzle_10: "medium"
  },

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
    format: "10 puzzles + submission",
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
    lanternHero: true,
    prizeCountUp: true,
    routePathDraw: true,
    gridPreviewFlip: true,
    tileMotion: true,
    cluePouch: true,
    keyAttempts: true,
    solveBurst: true,
    timerBars: true
  },

  // Client puzzle manifests: answers, solutions, hints, clues, and time limits
  // are omitted and loaded exclusively from the server on demand.
  PUZZLES: {
    puzzle_1: {
      id: "puzzle_1",
      timeLimit: 600,
      type: "ascii",
      difficulty: "easy",
      title: "ASCII Decoder",
      category: "Information Security",
      whatToDo: "Convert the numerical ASCII codes into characters to decode the quote. Use the reference chart if needed.",
      prompt: "Translate the 8-word quote encoded in standard ASCII numbers below.",
      data: {
        id: "puzzle_1",
        groups: ["Word 1", "Word 2", "Word 3", "Word 4", "Word 5", "Word 6", "Word 7", "Word 8"],
        words: [
          { codes: [84, 111, 109, 111, 114, 114, 111, 119] },
          { codes: [115, 116, 97, 114, 116, 115] },
          { codes: [119, 105, 116, 104] },
          { codes: [116, 104, 101] },
          { codes: [99, 111, 100, 101] },
          { codes: [121, 111, 117] },
          { codes: [119, 114, 105, 116, 101] },
          { codes: [116, 111, 100, 97, 121] },
        ],
      }
    },
    puzzle_2: {
      id: "puzzle_2",
      timeLimit: 600,
      type: "coords",
      difficulty: "easy",
      title: "Coordinates Grid",
      category: "Computer Science",
      whatToDo: "Locate the given (Col, Row) coordinate pairs on the 7×7 grid. Extract the letters to discover 3 core engineering principles.",
      prompt: "Read the cells at the designated coordinates to uncover the three mission keywords.",
      data: {
        id: "puzzle_2",
        groups: ["Word 1", "Word 2", "Word 3"],
        grid: [
          ["Q", "L", "V", "J", "C", "U", "N"],
          ["C", "S", "A", "P", "P", "K", "F"],
          ["H", "M", "T", "B", "O", "J", "E"],
          ["Q", "N", "X", "B", "Z", "L", "Z"],
          ["R", "H", "D", "X", "M", "K", "I"],
          ["M", "L", "F", "O", "O", "A", "Z"],
          ["Z", "S", "N", "E", "R", "X", "D"],
        ],
        groupedChips: [
          { name: "Word 1", coords: [[2, 1], [7, 3], [3, 2], [1, 5], [2, 4]] },
          { name: "Word 2", coords: [[4, 3], [6, 1], [7, 5], [6, 4], [3, 5]] },
          { name: "Word 3", coords: [[2, 6], [4, 7], [6, 6], [7, 7]] },
        ],
      }
    },
    puzzle_3: {
      id: "puzzle_3",
      timeLimit: 900,
      type: "bodmas",
      difficulty: "medium",
      title: "BODMAS Decoder",
      category: "Computer Networks",
      whatToDo: "Evaluate each math expression using standard BODMAS/PEMDAS precedence. Map each number to its corresponding letter (1=A ... 26=Z).",
      prompt: "Calculate the 13 mathematical expressions to reveal the 3-word slogan.",
      data: {
        id: "puzzle_3",
        groups: ["Word 1", "Word 2", "Word 3"],
        groupedEquations: [
          {
            name: "Word 1",
            equations: [
              { expr: "20 - 4 * 5 + 3", display: "20 - 4 * 5 + 3" },
              { expr: "3^2 + 18 / 3", display: "3^2 + 18 / 3" },
              { expr: "24 / (2 * 3)", display: "24 / (2 * 3)" },
              { expr: "2 + 3 * (9 - 7) - 3", display: "2 + 3 * (9 - 7) - 3" },
            ],
          },
          {
            name: "Word 2",
            equations: [
              { expr: "4^2 + 12 / 3", display: "4^2 + 12 / 3" },
              { expr: "2^3 + 6 - 3 * 2", display: "2^3 + 6 - 3 * 2" },
              { expr: "(10 - 4) * 2 - 7", display: "(10 - 4) * 2 - 7" },
            ],
          },
          {
            name: "Word 3",
            equations: [
              { expr: "3 * (4 + 4) / 4", display: "3 * (4 + 4) / 4" },
              { expr: "5^2 - 12 / 3", display: "5^2 - 12 / 3" },
              { expr: "100 / (2 * 5) * 2", display: "100 / (2 * 5) * 2" },
              { expr: "6 + 3 * 5", display: "6 + 3 * 5" },
              { expr: "(12 - 3) * 4 / 2", display: "(12 - 3) * 4 / 2" },
              { expr: "4^2 / 2 - 3", display: "4^2 / 2 - 3" },
            ],
          },
        ],
      }
    },
    puzzle_4: {
      id: "puzzle_4",
      timeLimit: 900,
      type: "riddle",
      difficulty: "medium",
      title: "System Riddle",
      category: "Operating Systems & Hardware",
      whatToDo: "Decrypt the identity riddle: read the cryptic clues about the legendary 17-year-old operating system's nickname, and type the letter keycaps.",
      prompt: "Identify the 17-year-old mobile OS with sweet, spiced roots.",
      data: {
        id: "puzzle_4",
        categoryTag: "OPERATING SYSTEMS & HARDWARE",
        formatBadge: "2 WORDS (8 + 3 LETTERS)",
        riddleLines: [
          "My age is 17. I'm the one who helps your software coordinate with hardware.",
          "I'm very popular, might look like that cliché alien, but don't worry—",
          "I'm sweet, but have a spice in my name. What confection am I?"
        ],
        words: [
          { name: "Word 1", length: 8 },
          { name: "Word 2", length: 3 }
        ]
      }
    },
    puzzle_5: {
      id: "puzzle_5",
      timeLimit: 900,
      type: "ascii",
      difficulty: "medium",
      title: "Reverse-Index Cipher",
      category: "Cybernetics & Cryptography",
      whatToDo: "Decode the reverse-index numerical tokens into letters (where Z=1, Y=2, X=3 ... C=24, B=25, A=26). Type the letters to reveal the centerpiece phrase.",
      prompt: "Decrypt the 4-word centerpiece theme using reverse alphabet indexing.",
      data: {
        id: "puzzle_5",
        isAtbash: true,
        groups: ["Word 1", "Word 2", "Word 3", "Word 4"],
        words: [
          { codes: [4, 19, 22, 9, 22] },
          { codes: [19, 6, 14, 26, 13] },
          { codes: [14, 22, 22, 7, 8] },
          { codes: [26, 18] },
        ],
      }
    },
    puzzle_6: {
      id: "puzzle_6",
      timeLimit: 900,
      type: "riddle",
      difficulty: "medium",
      title: "Visual Cryptogram",
      category: "Visual Deduction",
      whatToDo: "Analyze the symbolic motifs in the artwork to decipher the hidden 6-word phrase. Type the letters into the keycaps.",
      prompt: "Examine the visual clues in the artwork to deduce the 6-word phrase.",
      data: {
        id: "puzzle_6",
        categoryTag: "SYMBOLIC VISUAL CIPHER",
        formatBadge: "6 WORDS (4 + 10 + 6 + 2 + 6 + 10 LETTERS)",
        imageUrl: "assets/jain_future_tech.jpg",
        riddleLines: [
          "Decipher the 6 words encoded across the symbols of this cosmic artwork:",
          "• Word 1 (4 letters): The serene spiritual figure seated in meditative padmasana at the radiant center.",
          "• Word 2 (10 letters): The illuminated open tome resting at the base, shining with universal knowledge.",
          "• Word 3 & 4 (6 + 2 letters): The sacred sanctuary of higher study.",
          "• Word 5 (6 letters): The celestial vista—galaxies, orbital planets, and soaring spires of tomorrow.",
          "• Word 6 (10 letters): The synthesis of neural brains, cybernetic circuits, and robotic automation."
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
      timeLimit: 1200,
      type: "wordsearch",
      difficulty: "hard",
      title: "Word Search",
      category: "Applied Cryptography",
      whatToDo: "Locate all 20 tech terms from the word list in the 15×15 matrix. Words can go in any of 8 directions (horizontal, vertical, diagonal, forward, or backward).",
      prompt: "Find the 20 technology words listed in the checklist below.",
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
          ['G','X','C','B','X','N','O','T','Y','E','C','U','J','P','B'],
        ],
        words: [
          'AROUND', 'ARTIFICIAL', 'CENTERED', 'COMPUTING', 'DAILY',
          'DATA', 'EDGE', 'FUTURE', 'INNOVATIONS', 'INTEGRATION',
          'LIFE', 'QUANTUM', 'RAPID', 'REALITY', 'RESHAPE',
          'ROBOTICS', 'SCIENCE', 'SUSTAINABLE', 'TECHNOLOGY', 'VIRTUAL',
        ],
      }
    },
    puzzle_8: {
      id: "puzzle_8",
      timeLimit: 900,
      type: "riddle",
      difficulty: "medium",
      title: "Aerospace Riddle",
      category: "Automotive & Aerospace",
      whatToDo: "Deduce the vehicle described in the cosmic riddle. Type the 8-letter model name into the tactile keycaps.",
      prompt: "Solve the riddle of the spacefaring convertible piloted by Starman.",
      data: {
        id: "puzzle_8",
        categoryTag: "AEROSPACE & AUTOMOTIVE TELEMETRY",
        formatBadge: "1 WORD (8 LETTERS)",
        riddleLines: [
          "Born on asphalt, now sailing through space,",
          "Drop my roof to feel wind in your face.",
          "With Starman at the wheel, what car am I?"
        ],
        words: [
          { name: "Word 1", length: 8 }
        ]
      }
    },
    puzzle_9: {
      id: "puzzle_9",
      timeLimit: 1200,
      type: "riddle",
      difficulty: "hard",
      title: "Color Palette Riddle",
      category: "Colorimetry & Graphic Design",
      whatToDo: "Deduce the two background colors from the poetic colorimetry riddle. Type the color names into the keycaps.",
      prompt: "Identify the two complementary colors that form the poster canvas background.",
      data: {
        id: "puzzle_9",
        categoryTag: "POSTER PALETTE SPECIFICATION",
        formatBadge: "6 WORDS (4 + 4 + 3 + 5 + 5 + 4 LETTERS)",
        riddleLines: [
          "The pitch black shade of night - COLOR 1 (PART 1)",
          "Color of the deep ocean - COLOR 1 (PART 2)",
          "CONJUNCTION",
          "Pale, has lot of illumination - COLOR 2 (PART 1)",
          "Super tough iron alloy - COLOR 2 (PART 2)",
          "The base hue again - COLOR 2 (PART 3)"
        ],
        words: [
          { name: "Word 1", length: 4 },
          { name: "Word 2", length: 4 },
          { name: "Word 3", length: 3 },
          { name: "Word 4", length: 5 },
          { name: "Word 5", length: 5 },
          { name: "Word 6", length: 4 }
        ]
      }
    },
    puzzle_10: {
      id: "puzzle_10",
      timeLimit: 900,
      type: "coords",
      difficulty: "medium",
      title: "Cartesian Coordinates Grid",
      category: "Design Systems & Event Geometry",
      whatToDo: "Locate the given (Col, Row) coordinate pairs on the 7×7 grid. Extract the letters to discover the 2-word competition theme.",
      prompt: "Read the cells at the designated coordinates to uncover the event title.",
      data: {
        id: "puzzle_10",
        groups: ["Word 1", "Word 2"],
        grid: [
          ['M', 'P', 'F', 'I', 'X', 'B', 'K'],
          ['J', 'L', 'W', 'D', 'N', 'U', 'E'],
          ['A', 'N', 'G', 'R', 'C', 'P', 'Z'],
          ['O', 'T', 'Y', 'L', 'V', 'D', 'H'],
          ['U', 'B', 'S', 'M', 'K', 'A', 'U'],
          ['H', 'X', 'K', 'Q', 'E', 'W', 'N'],
          ['Z', 'C', 'P', 'L', 'R', 'T', 'O'],
        ],
        groupedChips: [
          {
            name: 'Word 1',
            coords: [
              [3, 1],
              [6, 2],
              [2, 4],
              [7, 5],
              [4, 3],
              [5, 6],
            ],
          },
          {
            name: 'Word 2',
            coords: [
              [4, 6],
              [1, 5],
              [7, 2],
              [3, 5],
              [6, 7],
            ],
          },
        ],
      }
    }
  }
};

/**
 * Returns the human-readable tile label for a given grid index (0 to 9).
 * All 10 puzzle tiles use "Task N" (where N is 1 to 10).
 */
export function getTileLabel(tileIndex) {
  return `Task ${tileIndex + 1}`;
}

export const TILE_DIFFICULTY = CONFIG.TILE_DIFFICULTY;

