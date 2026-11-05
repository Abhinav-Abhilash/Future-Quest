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

  // Competition timing
  MASTER_TIME: 7200, // 2 hours in seconds (7200 seconds)
  
  // Game rules configuration
  MAX_ATTEMPTS: 3,
  TOTAL_HINTS: 3,

  // DEV-ONLY: Development helpers & UI toggle
  DEV_MODE: true,

  // DEV-ONLY: Style test flag for fixed tile order (false = sequential 1..11, true = randomized)
  SHUFFLE_TILES: false,

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
      type: "ascii",
      title: "ASCII Quote Decoder",
      category: "Information Security",
      whatToDo: "Convert the numerical ASCII codes into characters to decode the quote. Use the reference chart if needed.",
      prompt: "Translate the 8-word quote encoded in standard ASCII numbers below.",
      data: {
        id: "puzzle_1",
        groups: ["Word 1", "Word 2", "Word 3", "Word 4", "Word 5", "Word 6", "Word 7", "Word 8"]
      }
    },
    puzzle_2: {
      id: "puzzle_2",
      type: "coords",
      title: "Coordinates Grid: Multi-Word Decoder",
      category: "Computer Science",
      whatToDo: "Locate the given (Col, Row) coordinate pairs on the 7×7 grid. Extract the letters to discover 3 core engineering principles.",
      prompt: "Read the cells at the designated coordinates to uncover the three mission keywords.",
      data: {
        id: "puzzle_2",
        groups: ["Word 1", "Word 2", "Word 3"]
      }
    },
    puzzle_3: {
      id: "puzzle_3",
      type: "bodmas",
      title: "Code The Future: BODMAS Decoder",
      category: "Computer Networks",
      whatToDo: "Evaluate each math expression using standard BODMAS/PEMDAS precedence. Map each number to its corresponding letter (1=A ... 26=Z).",
      prompt: "Calculate the 13 mathematical expressions to reveal the 3-word slogan.",
      data: {
        id: "puzzle_3",
        groups: ["Word 1", "Word 2", "Word 3"]
      }
    },
    puzzle_4: {
      id: "puzzle_4",
      type: "riddle",
      title: "The 17-Year-Old OS Riddle",
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
      type: "ascii",
      title: "Reverse-Index Cipher: WHERE HUMAN MEETS AI",
      category: "Cybernetics & Cryptography",
      whatToDo: "Decode the reverse-index numerical tokens into letters (where Z=1, Y=2, X=3 ... C=24, B=25, A=26). Type the letters to reveal the centerpiece phrase.",
      prompt: "Decrypt the 4-word centerpiece theme using reverse alphabet indexing.",
      data: {
        id: "puzzle_5",
        isAtbash: true,
        groups: ["Word 1", "Word 2", "Word 3", "Word 4"]
      }
    },
    puzzle_6: {
      id: "puzzle_6",
      type: "riddle",
      title: "Host Institution Cryptogram",
      category: "Institutional Identity",
      whatToDo: "Deduce the complete hosting department and university name. Type the letters into the keycaps.",
      prompt: "What department and school hosts this quest?",
      data: {
        id: "puzzle_6",
        categoryTag: "HOST INSTITUTION & DEPARTMENT",
        formatBadge: "6 WORDS (4 + 10 + 6 + 2 + 6 + 10 LETTERS)",
        riddleLines: [
          "What department and school hosts this quest?"
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
      data: {
        id: "puzzle_7"
      }
    },
    puzzle_8: {
      id: "puzzle_8",
      type: "riddle",
      title: "The Orbital Starman Riddle",
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
      data: {
        id: "puzzle_10",
        groups: ["Word 1", "Word 2"]
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
