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

  // Development helpers toggle
  DEV_MODE: true,

  // Style test: fixed tile order toggle (false for comparing tile styles)
  SHUFFLE_TILES: false,

  // Submission Form URL (Placeholder)
  POSTER_FORM_URL: "https://docs.google.com/forms/d/e/1FAIpQLSc_JU_SFT_FQ2026_SUBMISSION_PLACEHOLDER/viewform",

  // Names for Named Puzzle Tiles (Tiles 5 to 8)
  NAMED_PUZZLE_TILES: [
    "Cipher Desk",
    "Pointer Trace",
    "Logic Gates",
    "Footer Query"
  ],

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
    puzzle_7: "medium",
    puzzle_8: "hard",
    puzzle_9: "hard",
    puzzle_10: "hard",
    puzzle_11: "hard"
  },

  // Mock answers (validated case-insensitively with whitespace trimmed)
  MOCK_ANSWERS: {
    puzzle_1: "SECRET",
    puzzle_2: "42",
    puzzle_3: "443",
    puzzle_4: "GREEN",
    puzzle_5: "HAVING",
    puzzle_6: "O(N^2)",
    puzzle_7: "64",
    puzzle_8: "^",
    puzzle_9: "2",
    puzzle_10: "15",
    puzzle_11: "CAP"
  },

  // Realistic mock puzzle prompts, what-to-do instructions, and hints for STEM teams
  PUZZLES: {
    puzzle_1: {
      id: "puzzle_1",
      title: "Cryptography: Caesar Cipher",
      category: "Information Security",
      whatToDo: "Analyze the encrypted transmission snippet below. Determine the Caesar cipher rotation offset and recover the original plaintext string.",
      prompt: "A transmission intercepted from an edge node was encoded with a standard Caesar cipher shifted by +3 positions (A -> D): \"VHFUHW\". What is the original decrypted English word?",
      hint: "Shift each character backward in the alphabet by 3 positions: V (-3) -> S, H (-3) -> E...",
      clueType: "spec",
      clue: {
        title: "Poster Typography Spec: Main Title",
        type: "spec",
        specs: [
          { label: "Component", value: "Poster Main Header" },
          { label: "Font Family", value: "IBM Plex Sans, sans-serif" },
          { label: "Font Weight", value: "700 (Bold)" },
          { label: "Font Size", value: "48px / Line Height: 56px" },
          { label: "Color", value: "#0F172A (Slate 900)" },
          { label: "Position", value: "Top Left, Margin-Bottom: 24px" }
        ]
      }
    },
    puzzle_2: {
      id: "puzzle_2",
      title: "Computer Logic: Binary to Decimal",
      category: "Computer Science",
      whatToDo: "Examine the 8-bit unsigned binary integer. Convert the active bit positions (powers of 2) into base-10 decimal format to determine the calibration value.",
      prompt: "Convert the 8-bit unsigned binary integer 00101010 into its decimal integer equivalent.",
      hint: "Sum the values of active powers of two: 2^5 (32) + 2^3 (8) + 2^1 (2).",
      clueType: "text",
      clue: {
        title: "Headline Copy Specification",
        type: "text",
        content: "Future Quest 2026: Autonomous Edge Infrastructure & Resilient Systems"
      }
    },
    puzzle_3: {
      id: "puzzle_3",
      title: "Networking: Secure Protocol Ports",
      category: "Computer Networks",
      whatToDo: "Consult standard IANA networking assignments. Identify the default TCP port number reserved for secure encrypted TLS/SSL HTTPS communications.",
      prompt: "Identify the standard IANA destination port number used for secure HTTPS web traffic over TLS/SSL.",
      hint: "Plaintext HTTP operates on port 80; the default secure equivalent is 443.",
      clueType: "image",
      clue: {
        title: "Official Event Seal Graphic",
        type: "image",
        filename: "future-quest-seal.svg",
        caption: "Official Jain University School of Future Technology Competition Emblem",
        svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="100%" height="160" style="background:#090d16; border-radius:4px;">
  <rect width="320" height="180" fill="#0d1117"/>
  <rect x="10" y="10" width="300" height="160" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="6 3"/>
  <circle cx="90" cy="90" r="45" fill="none" stroke="#388bfd" stroke-width="3"/>
  <polygon points="90,55 120,110 60,110" fill="none" stroke="#60a5fa" stroke-width="2"/>
  <circle cx="90" cy="90" r="10" fill="#388bfd"/>
  <text x="155" y="75" fill="#f0f6fc" font-family="'IBM Plex Sans', sans-serif" font-size="16" font-weight="700">JAIN UNIVERSITY</text>
  <text x="155" y="95" fill="#8b949e" font-family="'IBM Plex Sans', sans-serif" font-size="11">School of Future Technology</text>
  <text x="155" y="115" fill="#388bfd" font-family="'IBM Plex Mono', monospace" font-size="12" font-weight="600">FQ 2026 OFFICIAL SEAL</text>
  <path d="M155 125 L290 125" stroke="#30363d" stroke-width="1"/>
</svg>`
      }
    },
    puzzle_4: {
      id: "puzzle_4",
      title: "Color Science: Hexadecimal Channels",
      category: "Digital Imaging",
      whatToDo: "Inspect the 24-bit RGB hexadecimal color string (#RRGGBB). Identify which primary additive color component is saturated at value 255.",
      prompt: "In standard 24-bit RGB hexadecimal color notation #00FF00, which primary color channel is at maximum saturation (value 255)?",
      hint: "The 6 hexadecimal digits represent #RRGGBB. Look at the middle pair 'FF'.",
      clueType: "spec",
      clue: {
        title: "Brand Color Palette Specification",
        type: "spec",
        specs: [
          { label: "Primary Accent", value: "#2563EB (Cobalt Blue)" },
          { label: "Canvas Surface", value: "#0F172A (Deep Slate)" },
          { label: "Light Foundation", value: "#F8FAFC (Clean Off-White)" },
          { label: "Status Amber", value: "#F59E0B (Industrial Amber)" },
          { label: "Color Rule", value: "Use Primary Accent on max 15% of total surface area" }
        ]
      }
    },
    puzzle_5: {
      id: "puzzle_5",
      title: "Databases: SQL Aggregation Filters",
      category: "Database Systems",
      whatToDo: "Review the SQL aggregate query requirements. Determine the standard keyword used to filter aggregated result sets produced by a GROUP BY clause.",
      prompt: "In standard ANSI SQL, which keyword clause is used to filter records after aggregation by GROUP BY (e.g., when evaluating COUNT(*) > 5)?",
      hint: "The clause begins with 'H' and cannot be replaced by a WHERE clause for aggregated results.",
      clueType: "text",
      clue: {
        title: "Primary Mission Statement Copy",
        type: "text",
        content: "Hosted by Jain University - School of Future Technology. Student teams synthesize telemetry to design resilient edge monitoring interfaces."
      }
    },
    puzzle_6: {
      id: "puzzle_6",
      title: "Algorithms: Quicksort Worst Case",
      category: "Computer Science",
      whatToDo: "Trace recursive partitioning in Quicksort under worst-case pivot selections. State the asymptotic worst-case time complexity in standard Big-O notation.",
      prompt: "What is the worst-case asymptotic time complexity of standard Quicksort when the pivot is always the extreme element? (Format: O(n^2), O(n), or O(log n))",
      hint: "When unbalanced partitioning occurs at every recursion level, complexity degrades to quadratic polynomial time.",
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
      }
    },
    puzzle_7: {
      id: "puzzle_7",
      title: "Cryptography: Digest Length",
      category: "Applied Cryptography",
      whatToDo: "Calculate the output character length of a standard 256-bit SHA-256 cryptographic digest when encoded as a standard hexadecimal string.",
      prompt: "A standard SHA-256 cryptographic hash outputs a 256-bit binary digest. How many characters long is this digest when expressed as a hexadecimal string?",
      hint: "Each hexadecimal character represents 4 bits (nibble). Calculate 256 / 4.",
      clueType: "spec",
      clue: {
        title: "Poster Layout Grid Architecture",
        type: "spec",
        specs: [
          { label: "Layout Grid", value: "12-Column Modular Grid System" },
          { label: "Gutter Width", value: "24px" },
          { label: "Outer Margins", value: "36px (Left, Right, Top, Bottom)" },
          { label: "Baseline Grid", value: "8px vertical rhythm" },
          { label: "Target Dimensions", value: "A3 Portrait (297mm x 420mm @ 300 DPI)" }
        ]
      }
    },
    puzzle_8: {
      id: "puzzle_8",
      title: "Pattern Matching: Regex Anchors",
      category: "Compiler & Text Tools",
      whatToDo: "Construct a regular expression pattern to target string boundaries. Identify the single token that anchors matches strictly to the start of a line.",
      prompt: "In standard PCRE regular expressions, which single meta-character anchors a match strictly to the start of a line or string?",
      hint: "It is the caret symbol, usually mapped to Shift+6 on standard keyboards.",
      clueType: "text",
      clue: {
        title: "Technical Compliance Specification",
        type: "text",
        content: "Security Policy Requirement: All remote edge telemetry streams must be cryptographically hashed using SHA-256 before ingestion into cluster storage."
      }
    },
    puzzle_9: {
      id: "puzzle_9",
      title: "Digital Logic: Bitwise Operations",
      category: "Low-Level Computing",
      whatToDo: "Evaluate the bitwise logic expression step-by-step using binary representations and standard operator precedence to find the decimal integer.",
      prompt: "Evaluate the decimal result of the bitwise expression: (15 ^ 9) & 10. Enter the single integer result.",
      hint: "15 in binary is 1111; 9 is 1001. First calculate 1111 XOR 1001 = 0110 (decimal 6). Then perform 6 (0110) AND 10 (1010).",
      clueType: "image",
      clue: {
        title: "Institutional Sponsor & Accreditation Seal",
        type: "image",
        filename: "ju-accreditation-seal.svg",
        caption: "School of Future Technology Accreditation Mark",
        svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="100%" height="160" style="background:#090d16; border-radius:4px;">
  <rect width="320" height="180" fill="#0d1117"/>
  <rect x="20" y="20" width="280" height="140" fill="none" stroke="#238636" stroke-width="1.5"/>
  <path d="M35 40 L60 40 L60 65" stroke="#238636" stroke-width="2" fill="none"/>
  <path d="M285 40 L260 40 L260 65" stroke="#238636" stroke-width="2" fill="none"/>
  <path d="M35 140 L60 140 L60 115" stroke="#238636" stroke-width="2" fill="none"/>
  <path d="M285 140 L260 140 L260 115" stroke="#238636" stroke-width="2" fill="none"/>
  <text x="160" y="65" text-anchor="middle" fill="#3fb950" font-family="'IBM Plex Mono', monospace" font-size="12" font-weight="700">VERIFIED ACCREDITATION</text>
  <text x="160" y="90" text-anchor="middle" fill="#f0f6fc" font-family="'IBM Plex Sans', sans-serif" font-size="15" font-weight="600">JAIN UNIVERSITY - SFT</text>
  <text x="160" y="112" text-anchor="middle" fill="#8b949e" font-family="'IBM Plex Sans', sans-serif" font-size="11">Engineering Excellence & Innovation</text>
  <text x="160" y="135" text-anchor="middle" fill="#238636" font-family="'IBM Plex Mono', monospace" font-size="10">AUTH CODE: JU-SFT-ACCR-2026</text>
</svg>`
      }
    },
    puzzle_10: {
      id: "puzzle_10",
      title: "Discrete Math: Complete Graph Edges",
      category: "Discrete Mathematics",
      whatToDo: "Apply complete graph theory formulas for undirected simple graphs (K_6). Calculate the exact number of distinct pairwise edges.",
      prompt: "In an undirected complete simple graph with 6 vertices (denoted K_6), what is the total number of distinct edges?",
      hint: "Use the complete graph edge formula: E = n * (n - 1) / 2 for n = 6 vertices.",
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
      }
    },
    puzzle_11: {
      id: "puzzle_11",
      title: "Distributed Systems: Fundamental Trade-off",
      category: "Systems Architecture",
      whatToDo: "Recall fundamental distributed systems trade-offs. Name the three-letter acronym theorem governing Consistency, Availability, and Partition Tolerance.",
      prompt: "What three-letter acronym identifies the theorem stating a distributed data store can simultaneously provide at most two out of Consistency, Availability, and Partition tolerance?",
      hint: "Formulated by Eric Brewer and named after the initials of the three guarantees (C-A-P).",
      clueType: "text",
      clue: {
        title: "Official Final Verification Token",
        type: "text",
        content: "VAULT_RELEASE_TOKEN: JU-SFT-2026-OMEGA-8821-VERIFIED"
      }
    }
  }
};

/**
 * Returns the human-readable tile label for a given grid index (0 to 10).
 * - Tiles 1 to 4: "Task 1", "Task 2", "Task 3", "Task 4"
 * - Tiles 5 to 8: "Cipher Desk", "Pointer Trace", "Logic Gates", "Footer Query"
 * - Tiles 9 to 11: "Tile 09", "Tile 10", "Tile 11"
 */
export function getTileLabel(tileIndex) {
  if (tileIndex >= 0 && tileIndex < 4) {
    return `Task ${tileIndex + 1}`;
  } else if (tileIndex >= 4 && tileIndex < 8) {
    const namedIndex = tileIndex - 4;
    return CONFIG.NAMED_PUZZLE_TILES[namedIndex] || `Puzzle ${tileIndex + 1}`;
  } else if (tileIndex >= 8 && tileIndex < 11) {
    return `Tile ${String(tileIndex + 1).padStart(2, '0')}`;
  }
  return `Tile ${tileIndex + 1}`;
}
