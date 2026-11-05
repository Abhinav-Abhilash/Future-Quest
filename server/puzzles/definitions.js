/**
 * Server-Side Puzzle Definitions & Answer Source of Truth
 * Future Quest 2026 - Server Backend
 *
 * NON-NEGOTIABLE SECURITY RULE:
 * This file lives ONLY on the server.
 * Puzzle solutions, answers, hints, and difficulties are NEVER exposed
 * to the client until authorized by explicit server endpoints.
 */

export const DIFFICULTY_TIME = {
  easy: 600,     // 10 minutes (600s)
  medium: 900,   // 15 minutes (900s)
  hard: 1200,    // 20 minutes (1200s)
};

export const MASTER_TIME_LIMIT_MS = 7200 * 1000; // 2 hours (7,200,000 ms)

export const PUZZLES = {
  puzzle_1: {
    id: 'puzzle_1',
    type: 'ascii',
    title: 'ASCII Decoder',
    category: 'Information Security',
    difficulty: 'easy',
    timeLimit: 600,
    whatToDo: 'Convert the numerical ASCII codes into characters to decode the quote. Use the reference chart if needed.',
    prompt: 'Translate the 8-word quote encoded in standard ASCII numbers below.',
    hint: "Open the ASCII Table reference drawer. Lowercase letters start at 97 ('a') through 122 ('z'), while uppercase letters range from 65 ('A') to 90 ('Z').",
    clue: {
      title: 'Clue Fragment 6: Required Quote',
      type: 'spec',
      specs: [
        { label: 'Fragment', value: 'Fragment 6' },
        { label: 'Quote to Add', value: '"Tomorrow starts with the code you write today"' },
        { label: 'Font', value: 'Arial' },
        { label: 'Size', value: '14' },
        { label: 'Style', value: 'Italics' },
        { label: 'Color', value: 'Black' },
        { label: 'Position', value: 'Center, below FUTURE' },
      ],
    },
    // Sanitized client data - NO solutions
    clientData: {
      id: 'puzzle_1',
      groups: ['Word 1', 'Word 2', 'Word 3', 'Word 4', 'Word 5', 'Word 6', 'Word 7', 'Word 8'],
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
    },
    acceptedAnswers: ['TOMORROW STARTS WITH THE CODE YOU WRITE TODAY'],
  },

  puzzle_2: {
    id: 'puzzle_2',
    type: 'coords',
    title: 'Coordinates Grid',
    category: 'Computer Science',
    difficulty: 'easy',
    timeLimit: 600,
    whatToDo: 'Locate the given (Col, Row) coordinate pairs on the 7×7 grid. Extract the letters to discover 3 core engineering principles.',
    prompt: 'Read the cells at the designated coordinates to uncover the three mission keywords.',
    hint: 'Read each coordinate pair as (Column, Row). Count columns from left to right (1–7) and rows from top to bottom (1–7) to find the intersecting letter.',
    clue: {
      title: 'Clue Fragment 9: Required Motto (LEARN – BUILD – LEAD)',
      type: 'spec',
      specs: [
        { label: 'Fragment', value: 'Fragment 9' },
        { label: 'Motto to Add', value: 'LEARN — BUILD — LEAD (Uppercase with dashes)' },
        { label: 'Color Rules', value: 'LEARN: Green, BUILD: Blue, LEAD: Red' },
        { label: 'Position', value: 'Lower-center, directly below the body paragraph' },
      ],
    },
    clientData: {
      id: 'puzzle_2',
      groups: ['Word 1', 'Word 2', 'Word 3'],
      grid: [
        ['Q', 'L', 'V', 'J', 'C', 'U', 'N'],
        ['C', 'S', 'A', 'P', 'P', 'K', 'F'],
        ['H', 'M', 'T', 'B', 'O', 'J', 'E'],
        ['Q', 'N', 'X', 'B', 'Z', 'L', 'Z'],
        ['R', 'H', 'D', 'X', 'M', 'K', 'I'],
        ['M', 'L', 'F', 'O', 'O', 'A', 'Z'],
        ['Z', 'S', 'N', 'E', 'R', 'X', 'D'],
      ],
      groupedChips: [
        { name: 'Word 1', coords: [[2, 1], [7, 3], [3, 2], [1, 5], [2, 4]] },
        { name: 'Word 2', coords: [[4, 3], [6, 1], [7, 5], [6, 4], [3, 5]] },
        { name: 'Word 3', coords: [[2, 6], [4, 7], [6, 6], [7, 7]] },
      ],
    },
    acceptedAnswers: ['LEARN BUILD LEAD'],
  },

  puzzle_3: {
    id: 'puzzle_3',
    type: 'bodmas',
    title: 'BODMAS Decoder',
    category: 'Computer Networks',
    difficulty: 'medium',
    timeLimit: 900,
    whatToDo: 'Evaluate each math expression using standard BODMAS/PEMDAS precedence. Map each number to its corresponding letter (1=A ... 26=Z).',
    prompt: 'Calculate the 13 mathematical expressions to reveal the 3-word slogan.',
    hint: 'Evaluate operations inside brackets first, then division and multiplication before addition and subtraction. Convert resulting numbers into alphabetical order (1=A, 2=B...).',
    clue: {
      title: 'Clue Fragment 5: Required Title (CODE THE FUTURE)',
      type: 'spec',
      specs: [
        { label: 'Fragment', value: 'Fragment 5' },
        { label: 'Title to Add', value: 'CODE THE (line 1) / FUTURE (line 2)' },
        { label: 'Font', value: 'Arial Black (Bold display)' },
        { label: 'Size', value: 'CODE THE: 20, FUTURE: 24' },
        { label: 'Color', value: 'Yellow' },
        { label: 'Position', value: 'Upper-center, below FUTURE QUEST 2026' },
      ],
    },
    clientData: {
      id: 'puzzle_3',
      groups: ['Word 1', 'Word 2', 'Word 3'],
      groupedEquations: [
        {
          name: 'Word 1',
          equations: [
            { expr: '20 - 4 * 5 + 3', display: '20 - 4 * 5 + 3' },
            { expr: '3^2 + 18 / 3', display: '3^2 + 18 / 3' },
            { expr: '24 / (2 * 3)', display: '24 / (2 * 3)' },
            { expr: '2 + 3 * (9 - 7) - 3', display: '2 + 3 * (9 - 7) - 3' },
          ],
        },
        {
          name: 'Word 2',
          equations: [
            { expr: '4^2 + 12 / 3', display: '4^2 + 12 / 3' },
            { expr: '2^3 + 6 - 3 * 2', display: '2^3 + 6 - 3 * 2' },
            { expr: '(10 - 4) * 2 - 7', display: '(10 - 4) * 2 - 7' },
          ],
        },
        {
          name: 'Word 3',
          equations: [
            { expr: '3 * (4 + 4) / 4', display: '3 * (4 + 4) / 4' },
            { expr: '5^2 - 12 / 3', display: '5^2 - 12 / 3' },
            { expr: '100 / (2 * 5) * 2', display: '100 / (2 * 5) * 2' },
            { expr: '6 + 3 * 5', display: '6 + 3 * 5' },
            { expr: '(12 - 3) * 4 / 2', display: '(12 - 3) * 4 / 2' },
            { expr: '4^2 / 2 - 3', display: '4^2 / 2 - 3' },
          ],
        },
      ],
    },
    acceptedAnswers: ['CODE THE FUTURE'],
  },

  puzzle_4: {
    id: 'puzzle_4',
    type: 'riddle',
    title: 'System Riddle',
    category: 'Operating Systems & Hardware',
    difficulty: 'medium',
    timeLimit: 900,
    whatToDo: "Decrypt the identity riddle: read the cryptic clues about the legendary 17-year-old operating system's nickname, and type the letter keycaps.",
    prompt: 'Identify the 17-year-old mobile OS with sweet, spiced roots.',
    hint: "Think of the world's most popular mobile operating system. Before switching strictly to numbers, each major release was nicknamed after a beloved dessert or sweet baked treat.",
    clue: {
      title: 'Clue Fragment 4: System Architecture & Palette',
      type: 'spec',
      specs: [
        { label: 'Fragment', value: 'Fragment 4' },
        { label: 'OS Foundation', value: 'Linux Kernel 2.6+ / AOSP' },
        { label: 'Accent Palette', value: '#F59E0B (Spiced Amber)' },
        { label: 'Display Typography', value: 'Space Grotesk / Arial Black' },
        { label: 'Alignment Directive', value: 'All telemetry feeds aligned to monospace grid' },
      ],
    },
    clientData: {
      id: 'puzzle_4',
      categoryTag: 'OPERATING SYSTEMS & HARDWARE',
      formatBadge: '2 WORDS (8 + 3 LETTERS)',
      riddleLines: [
        "My age is 17. I'm the one who helps your software coordinate with hardware.",
        "I'm very popular, might look like that cliché alien, but don't worry—",
        "I'm sweet, but have a spice in my name. What confection am I?",
      ],
      words: [
        { name: 'Word 1', length: 8 },
        { name: 'Word 2', length: 3 },
      ],
    },
    acceptedAnswers: ['CINNAMON BUN', 'CINNAMON ROLL'],
  },

  puzzle_5: {
    id: 'puzzle_5',
    type: 'ascii',
    title: 'Reverse-Index Cipher',
    category: 'Cybernetics & Cryptography',
    difficulty: 'medium',
    timeLimit: 900,
    whatToDo: 'Decode the reverse-index numerical tokens into letters (where Z=1, Y=2, X=3 ... C=24, B=25, A=26). Type the letters to reveal the centerpiece phrase.',
    prompt: 'Decrypt the 4-word centerpiece theme using reverse alphabet indexing.',
    hint: 'This cipher inverts the alphabet (Z=1, Y=2, A=26). Subtract each given number from 27 to find its standard alphabetical position. Open the reference drawer for assistance.',
    clue: {
      title: 'Clue Fragment 3: Centerpiece Graphic (Where Human Meets AI)',
      type: 'image',
      imageUrl: 'assets/human_meets_ai.png',
      filename: 'human_meets_ai.png',
      caption: 'Centerpiece Graphic Asset: Robotic Hand & Human Hand Touching',
    },
    clientData: {
      id: 'puzzle_5',
      isAtbash: true,
      groups: ['Word 1', 'Word 2', 'Word 3', 'Word 4'],
      words: [
        { codes: [4, 19, 22, 9, 22] },
        { codes: [19, 6, 14, 26, 13] },
        { codes: [14, 22, 22, 7, 8] },
        { codes: [26, 18] },
      ],
    },
    acceptedAnswers: ['WHERE HUMAN MEETS AI'],
  },

  puzzle_6: {
    id: 'puzzle_6',
    type: 'riddle',
    title: 'Visual Cryptogram',
    category: 'Visual Deduction',
    difficulty: 'medium',
    timeLimit: 900,
    whatToDo: 'Analyze the symbolic motifs in the artwork to decipher the hidden 6-word phrase. Type the letters into the keycaps.',
    prompt: 'Examine the visual clues in the artwork to deduce the 6-word phrase.',
    hint: 'Observe the distinct visual cues in the image: the serene figure in meditation at center (4 letters), the radiant open book of knowledge (10 letters), the academy of learning (6 letters), the connecting link (2 letters), the realm of tomorrow (6 letters), and the neural cybernetics with robotic arm (10 letters).',
    clue: {
      title: 'Clue Fragment 2: Primary Identity & Header Spec',
      type: 'spec',
      specs: [
        { label: 'Fragment', value: 'Fragment 2' },
        { label: 'Institution Logo', value: 'JGi JAIN (Deemed-to-be University) Kochi' },
        { label: 'Primary Header', value: 'JAIN UNIVERSITY.' },
        { label: 'Secondary Subhead', value: 'SCHOOL OF FUTURE TECHNOLOGY' },
        { label: 'Position', value: 'Top-left corner of the poster canvas' },
        { label: 'Font / Weight', value: 'Helvetica / Arial Bold, uppercase' },
      ],
    },
    clientData: {
      id: 'puzzle_6',
      categoryTag: 'SYMBOLIC VISUAL CIPHER',
      formatBadge: '6 WORDS (4 + 10 + 6 + 2 + 6 + 10 LETTERS)',
      imageUrl: 'assets/jain_future_tech.jpg',
      riddleLines: [
        'Decipher the 6 words encoded across the symbols of this cosmic artwork:',
        '• Word 1 (4 letters): The serene spiritual figure seated in meditative padmasana at the radiant center.',
        '• Word 2 (10 letters): The illuminated open tome resting at the base, shining with universal knowledge.',
        '• Word 3 & 4 (6 + 2 letters): The sacred sanctuary of higher study.',
        '• Word 5 (6 letters): The celestial vista—galaxies, orbital planets, and soaring spires of tomorrow.',
        '• Word 6 (10 letters): The synthesis of neural brains, cybernetic circuits, and robotic automation.',
      ],
      words: [
        { name: 'Word 1', length: 4 },
        { name: 'Word 2', length: 10 },
        { name: 'Word 3', length: 6 },
        { name: 'Word 4', length: 2 },
        { name: 'Word 5', length: 6 },
        { name: 'Word 6', length: 10 },
      ],
    },
    acceptedAnswers: [
      'JAIN UNIVERSITY SCHOOL OF FUTURE TECHNOLOGY',
      'SCHOOL OF FUTURE TECHNOLOGY',
      'JAIN UNIVERSITY SCHOOL OF FUTURE TECH',
      'JAIN UNIVERSITY',
    ],
  },

  puzzle_7: {
    id: 'puzzle_7',
    type: 'wordsearch',
    title: 'Word Search',
    category: 'Applied Cryptography',
    difficulty: 'hard',
    timeLimit: 1200,
    whatToDo: 'Locate all 20 tech terms from the word list in the 15×15 matrix. Words can go in any of 8 directions (horizontal, vertical, diagonal, forward, or backward).',
    prompt: 'Find the 20 technology words listed in the checklist below.',
    hint: "Scan the matrix in all 8 directions—words can run horizontally, vertically, or diagonally. Try searching for uncommon letters like 'Q' in Quantum, 'Z', or distinctive double-letter clusters.",
    clue: {
      title: 'Clue Fragment 8: Required Word Bank (Submission Paragraph)',
      type: 'spec',
      specs: [
        { label: 'Fragment', value: 'Fragment 8' },
        { label: 'Found Words', value: 'AROUND, ARTIFICIAL, CENTERED, COMPUTING, DAILY, DATA, EDGE, FUTURE, INNOVATIONS, INTEGRATION, LIFE, QUANTUM, RAPID, REALITY, RESHAPE, ROBOTICS, SCIENCE, SUSTAINABLE, TECHNOLOGY, VIRTUAL' },
        { label: 'Font', value: 'Calibri' },
        { label: 'Size', value: '12' },
        { label: 'Style', value: 'Italics' },
        { label: 'Color', value: 'Black' },
        { label: 'Position', value: 'Lower-center, below the centerpiece image' },
        { label: 'Paragraph Rule', value: 'Write your submission paragraph using these 20 words.' },
      ],
    },
    clientData: {
      id: 'puzzle_7',
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
    },
    acceptedAnswers: [
      'AROUND',
      '20',
      'ALL',
      'DONE',
      'COMPLETED',
    ],
    targetWordList: [
      'AROUND', 'ARTIFICIAL', 'CENTERED', 'COMPUTING', 'DAILY',
      'DATA', 'EDGE', 'FUTURE', 'INNOVATIONS', 'INTEGRATION',
      'LIFE', 'QUANTUM', 'RAPID', 'REALITY', 'RESHAPE',
      'ROBOTICS', 'SCIENCE', 'SUSTAINABLE', 'TECHNOLOGY', 'VIRTUAL',
    ],
  },

  puzzle_8: {
    id: 'puzzle_8',
    type: 'riddle',
    title: 'Aerospace Riddle',
    category: 'Automotive & Aerospace',
    difficulty: 'hard',
    timeLimit: 1200,
    whatToDo: 'Deduce the vehicle described in the cosmic riddle. Type the 8-letter model name into the tactile keycaps.',
    prompt: 'Solve the riddle of the spacefaring convertible piloted by Starman.',
    hint: 'A pioneer electric vehicle manufacturer launched their iconic two-door open-top sports car into deep orbit as the test payload on a heavy-lift rocket.',
    clue: {
      title: 'Clue Fragment 7: Aerospace Telemetry & Specs',
      type: 'spec',
      specs: [
        { label: 'Fragment', value: 'Fragment 7' },
        { label: 'Payload Vehicle', value: 'Midnight Cherry Roadster + Starman' },
        { label: 'Orbital Speed', value: '22,000 km/h (Heliocentric)' },
        { label: 'Telemetry Carrier', value: 'Deep Space Network S-Band' },
        { label: 'Security Directive', value: 'Verify SHA-256 cryptographic hashes on all telemetry frames' },
      ],
    },
    clientData: {
      id: 'puzzle_8',
      categoryTag: 'AEROSPACE & AUTOMOTIVE TELEMETRY',
      formatBadge: '1 WORD (8 LETTERS)',
      riddleLines: [
        'Born on asphalt, now sailing through space,',
        'Drop my roof to feel wind in your face.',
        'With Starman at the wheel, what car am I?',
      ],
      words: [{ name: 'Word 1', length: 8 }],
    },
    acceptedAnswers: ['ROADSTER'],
  },

  puzzle_9: {
    id: 'puzzle_9',
    type: 'riddle',
    title: 'Color Palette Riddle',
    category: 'Colorimetry & Graphic Design',
    difficulty: 'hard',
    timeLimit: 1200,
    whatToDo: 'Deduce the two background colors from the poetic colorimetry riddle. Type the color names into the keycaps.',
    prompt: 'Identify the two complementary colors that form the poster canvas background.',
    hint: 'Both colors belong to the same cool color family. One is deep and shadowy, while the other is an airy pastel named after an industrial metallic alloy.',
    clue: {
      title: 'Clue Fragment 1: Official Canvas Background Specification',
      type: 'image',
      imageUrl: 'assets/poster_background_palette.png',
      filename: 'poster_background_palette.png',
      caption: 'Canvas Asset: Dark Blue to Light Steel Blue Gradient with Concentric Circular Alignment Lines',
    },
    clientData: {
      id: 'puzzle_9',
      categoryTag: 'POSTER PALETTE SPECIFICATION',
      formatBadge: '6 WORDS (4 + 4 + 3 + 5 + 5 + 4 LETTERS)',
      riddleLines: [
        'We are born of the exact same race.',
        'One of us is full of dark humor with a solid character.',
        'The other has a very light mind, but a heart as hard as steel.',
        'What two colors are we?',
      ],
      words: [
        { name: 'Word 1', length: 4 },
        { name: 'Word 2', length: 4 },
        { name: 'Word 3', length: 3 },
        { name: 'Word 4', length: 5 },
        { name: 'Word 5', length: 5 },
        { name: 'Word 6', length: 4 },
      ],
    },
    acceptedAnswers: [
      'DARK BLUE AND LIGHT STEEL BLUE',
      'DARK BLUE LIGHT STEEL BLUE',
      'DARK BLUE & LIGHT STEEL BLUE',
    ],
  },

  puzzle_10: {
    id: 'puzzle_10',
    type: 'coords',
    title: 'Cartesian Coordinates Grid',
    category: 'Design Systems & Event Geometry',
    difficulty: 'medium',
    timeLimit: 900,
    whatToDo: 'Locate the given (Col, Row) coordinate pairs on the 7×7 grid. Extract the letters to discover the 2-word competition theme.',
    prompt: 'Read the cells at the designated coordinates to uncover the event title.',
    hint: 'Read each coordinate pair as (Column, Row). Count columns from left to right (1–7) and rows from top to bottom (1–7) to find each letter.',
    clue: {
      title: 'Clue Fragment 10: Geometric Grid Alignment Specification',
      type: 'spec',
      specs: [
        { label: 'Fragment', value: 'Fragment 10' },
        { label: 'Concentric Circles', value: 'Two concentric guide circles centered at (50%, 48%)' },
        { label: 'Outer Circle Radius', value: '42% canvas width with 0.8px translucent guide stroke' },
        { label: 'Inner Circle Radius', value: '28% canvas width' },
        { label: 'Rule of Thirds', value: 'Vertical & horizontal 3×3 guidelines separating header, centerpiece, and body text' },
      ],
    },
    clientData: {
      id: 'puzzle_10',
      groups: ['Word 1', 'Word 2'],
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
    },
    acceptedAnswers: ['FUTURE QUEST'],
  },
};

/**
 * Validate an answer submission for a given puzzle
 * @param {string} puzzleId
 * @param {any} submission - String answer or structured payload (e.g. foundWords for word search)
 * @returns {boolean}
 */
export function checkPuzzleAnswer(puzzleId, submission) {
  const puz = PUZZLES[puzzleId];
  if (!puz) return false;

  // Word search structured check
  if (puz.type === 'wordsearch' && typeof submission === 'object' && submission !== null) {
    if (Array.isArray(submission.foundWords)) {
      // Must have found all 20 target words
      const set = new Set(submission.foundWords.map((w) => String(w).toUpperCase().trim()));
      const allFound = puz.targetWordList.every((target) => set.has(target));
      if (allFound) return true;
    }
  }

  // Text string comparison
  const raw = typeof submission === 'string' ? submission : (submission?.answer || '');
  const normalized = String(raw).toUpperCase().replace(/\s+/g, ' ').trim();

  return puz.acceptedAnswers.some((ans) => {
    const cleanAns = ans.toUpperCase().replace(/\s+/g, ' ').trim();
    return cleanAns === normalized;
  });
}

/**
 * Returns safe puzzle payload sent to player ONLY when the puzzle is opened
 */
export function getClientPuzzlePayload(puzzleId) {
  const puz = PUZZLES[puzzleId];
  if (!puz) return null;

  return {
    id: puz.id,
    type: puz.type,
    title: puz.title,
    category: puz.category,
    difficulty: puz.difficulty,
    whatToDo: puz.whatToDo,
    prompt: puz.prompt,
    timeLimit: puz.timeLimit, // issued only when opened!
    data: puz.clientData,
  };
}

