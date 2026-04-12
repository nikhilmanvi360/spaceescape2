export interface Question {
  id: string;
  title: string;
  description: string;
  type?: 'text' | 'code';
  code?: string;
  correctAnswer?: string;
  validAnswers?: string[];
  hint: string;
}

export interface Round {
  id: number;
  name: string;
  description: string;
  questions: Question[];
}

export const GAME_DATA: Round[] = [
  {
    id: 1,
    name: "Boot Sequence",
    description: "Initialize the core systems. Basic logic and pattern recognition required.",
    questions: [
      {
        id: "1-1",
        title: "System Handshake",
        description: "The system requires a 4-digit sequence to initiate the handshake. The sequence follows a pattern: 2, 4, 8, 16, ... What is the next number?",
        type: 'text',
        correctAnswer: "32",
        hint: "Each number is double the previous one."
      },
      {
        id: "1-2",
        title: "Logic Gate Alpha",
        description: "If (A AND B) is TRUE, and A is TRUE, what must B be?",
        type: 'text',
        correctAnswer: "true",
        hint: "Think about how AND gates work. Both inputs must be true for the output to be true."
      },
      {
        id: "1-3",
        title: "Binary Pulse",
        description: "Convert the binary pulse '1011' to decimal.",
        type: 'text',
        correctAnswer: "11",
        hint: "8 + 0 + 2 + 1"
      },
      {
        id: "1-4",
        title: "Memory Address",
        description: "The memory address is stored in Hexadecimal. Convert '0xF' to decimal.",
        type: 'text',
        correctAnswer: "15",
        hint: "A=10, B=11, C=12, D=13, E=14, F=?"
      },
      {
        id: "1-5",
        title: "Parity Check",
        description: "In an even parity system, if the data is '1101', what should the parity bit be?",
        type: 'text',
        correctAnswer: "1",
        hint: "The total number of 1s (including the parity bit) must be even."
      },
      {
        id: "1-6",
        title: "Clock Cycle",
        description: "A processor completes 5 cycles in 10ms. How many cycles does it complete in 1 second?",
        type: 'text',
        correctAnswer: "500",
        hint: "1 second = 1000ms. Calculate (1000 / 10) * 5."
      }
    ]
  },
  {
    id: 2,
    name: "System Failure",
    description: "Critical systems are failing. Debug the flow and restore Oxygen, Fuel, and Navigation.",
    questions: [
      {
        id: "2-1",
        title: "Oxygen Flow Debug",
        description: "The oxygen regulator is stuck in a loop. Find the bug in this pseudo-code: 'while(oxygen < 100) { oxygen = oxygen - 1; }'. What should the operator be to increase oxygen?",
        type: 'text',
        code: "while(oxygen < 100) {\n  oxygen = oxygen - 1;\n}",
        correctAnswer: "+",
        hint: "The current code decreases oxygen, making the loop infinite or dangerous."
      },
      {
        id: "2-2",
        title: "Fuel Injection Sequence",
        description: "The fuel injectors must fire in a specific order. If the sequence is [Red, Blue, Green, Red, Blue, ...], what is the 7th color?",
        type: 'text',
        correctAnswer: "red",
        hint: "The pattern repeats every 3 colors: 1=R, 2=B, 3=G, 4=R, 5=B, 6=G, 7=?"
      },
      {
        id: "2-3",
        title: "Navigation Vector",
        description: "The ship is off course by 45 degrees. To correct it, we need to rotate by -45 degrees. If the current heading is 90, what should the new heading be?",
        type: 'text',
        correctAnswer: "45",
        hint: "90 - 45 = ?"
      },
      {
        id: "2-4",
        title: "Loop Logic",
        description: "How many times will this loop execute? 'for(int i=0; i<5; i++) { print(i); }'",
        type: 'text',
        code: "for(int i=0; i<5; i++) {\n  print(i);\n}",
        correctAnswer: "5",
        hint: "Count from 0 to 4."
      },
      {
        id: "2-5",
        title: "Array Indexing",
        description: "In a 0-indexed array [10, 20, 30, 40], what is the value at index 2?",
        type: 'text',
        correctAnswer: "30",
        hint: "Index 0 is 10, Index 1 is 20..."
      },
      {
        id: "2-6",
        title: "Boolean Logic",
        description: "What is the result of (NOT (TRUE OR FALSE))?",
        type: 'text',
        correctAnswer: "false",
        hint: "First evaluate (TRUE OR FALSE), then apply NOT."
      },
      {
        id: "2-7",
        title: "Python Loop Protocol",
        description: "Write a Python loop that prints numbers from 0 to 4 using the 'range' function.",
        type: 'code',
        validAnswers: ["for i in range(5):", "for x in range(5):", "for i in range(0, 5):"],
        hint: "Use 'for' and 'range(5)'."
      },
      {
        id: "2-8",
        title: "HTML Structure",
        description: "Write the HTML tag for a level 1 heading containing the text 'ALERT'.",
        type: 'code',
        validAnswers: ["<h1>ALERT</h1>", "<h1>alert</h1>"],
        hint: "Use the <h1> tag."
      }
    ]
  },
  {
    id: 3,
    name: "Final Override",
    description: "The core is unstable. Combine clues to generate the final override code.",
    questions: [
      {
        id: "3-1",
        title: "CSS Styling Protocol",
        description: "Write a CSS rule to set the color of all <p> elements to 'green'.",
        type: 'code',
        validAnswers: ["p { color: green; }", "p{color:green;}", "p {color: green;}"],
        hint: "Use the 'color' property inside a 'p' selector."
      },
      {
        id: "3-2",
        title: "Python Condition",
        description: "Write a Python 'if' statement that checks if a variable 'temp' is greater than 100.",
        type: 'code',
        validAnswers: ["if temp > 100:", "if (temp > 100):"],
        hint: "Use 'if temp > 100:'"
      },
      {
        id: "3-3",
        title: "Final Encryption",
        description: "The final code is the word 'OVERRIDE' shifted by 1 in the alphabet (A->B, B->C). What is the encrypted word?",
        type: 'text',
        correctAnswer: "pwfssjef",
        hint: "O->P, V->W, E->F, R->S, R->S, I->J, D->E, E->F"
      },
      {
        id: "3-4",
        title: "Core Stability Code",
        description: "The core requires a checksum of all previous answers in this round: 77 + 75. What is the final checksum?",
        type: 'text',
        correctAnswer: "152",
        hint: "Add 77 and 75."
      }
    ]
  }
];
