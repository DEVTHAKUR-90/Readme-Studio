/**
 * Curated supplement of popular programming languages.
 *
 * `simple-icons` is brand-icons-only, so it ships e.g. `openjdk` but not
 * "Java" the language, `c` but not "C++", `apachegroovy` but not "Groovy",
 * etc. Shields.io, however, accepts most common language names as the
 * `logo` parameter via its built-in icon set. This file fills the gap.
 *
 * Each entry produces a badge by the same pipeline as simple-icons entries;
 * the classifier always bumps these into the "languages" category.
 *
 * To add a language: pick a display name, a slug that shields.io recognizes
 * (try lowercasing the name first), and the official/community brand hex.
 */

export interface CuratedLang {
  name: string;
  logo: string;   // shields.io icon slug
  hex: string;    // 6-char hex, no leading #
  logoColor: "white" | "black";
  aliases?: string[];
}

export const CURATED_LANGUAGES: CuratedLang[] = [
  // Tier 1 — household-name languages users absolutely expect to find
  { name: "Java",          logo: "openjdk",        hex: "ED8B00", logoColor: "white", aliases: ["jvm"] },
  { name: "C",             logo: "c",              hex: "A8B9CC", logoColor: "black" },
  { name: "C++",           logo: "cplusplus",      hex: "00599C", logoColor: "white", aliases: ["cpp", "c plus plus"] },
  { name: "C#",            logo: "csharp",         hex: "239120", logoColor: "white", aliases: ["csharp"] },
  { name: "Go",            logo: "go",             hex: "00ADD8", logoColor: "white", aliases: ["golang"] },
  { name: "Rust",          logo: "rust",           hex: "000000", logoColor: "white" },
  { name: "Python",        logo: "python",         hex: "3776AB", logoColor: "white", aliases: ["py"] },
  { name: "JavaScript",    logo: "javascript",     hex: "F7DF1E", logoColor: "black", aliases: ["js", "ecmascript"] },
  { name: "TypeScript",    logo: "typescript",     hex: "3178C6", logoColor: "white", aliases: ["ts"] },
  { name: "Ruby",          logo: "ruby",           hex: "CC342D", logoColor: "white" },
  { name: "PHP",           logo: "php",            hex: "777BB4", logoColor: "white" },
  { name: "Swift",         logo: "swift",          hex: "FA7343", logoColor: "white" },
  { name: "Kotlin",        logo: "kotlin",         hex: "7F52FF", logoColor: "white" },
  { name: "Dart",          logo: "dart",           hex: "0175C2", logoColor: "white" },
  { name: "Scala",         logo: "scala",          hex: "DC322F", logoColor: "white" },
  { name: "R",             logo: "r",              hex: "276DC3", logoColor: "white", aliases: ["rlang"] },
  { name: "Lua",           logo: "lua",            hex: "2C2D72", logoColor: "white" },
  { name: "Perl",          logo: "perl",           hex: "39457E", logoColor: "white" },
  { name: "Haskell",       logo: "haskell",        hex: "5D4F85", logoColor: "white" },
  { name: "Elixir",        logo: "elixir",         hex: "4B275F", logoColor: "white" },
  { name: "Erlang",        logo: "erlang",         hex: "A90533", logoColor: "white" },
  { name: "Clojure",       logo: "clojure",        hex: "5881D8", logoColor: "white" },
  { name: "OCaml",         logo: "ocaml",          hex: "EC6813", logoColor: "white" },
  { name: "F#",            logo: "fsharp",         hex: "378BBA", logoColor: "white", aliases: ["fsharp"] },
  { name: "Julia",         logo: "julia",          hex: "9558B2", logoColor: "white" },
  { name: "Zig",           logo: "zig",            hex: "F7A41D", logoColor: "black" },
  { name: "Nim",           logo: "nim",            hex: "FFE953", logoColor: "black" },
  { name: "Crystal",       logo: "crystal",        hex: "000000", logoColor: "white" },
  { name: "Groovy",        logo: "apachegroovy",   hex: "4298B8", logoColor: "white" },
  { name: "Assembly",      logo: "assemblyscript", hex: "6E4CBB", logoColor: "white", aliases: ["asm"] },
  { name: "Solidity",      logo: "solidity",       hex: "363636", logoColor: "white" },
  { name: "Objective-C",   logo: "apple",          hex: "438EFF", logoColor: "white", aliases: ["objc"] },
  { name: "MATLAB",        logo: "mathworks",      hex: "0076A8", logoColor: "white" },
  { name: "Fortran",       logo: "fortran",        hex: "734F96", logoColor: "white" },
  { name: "COBOL",         logo: "ibm",            hex: "005691", logoColor: "white" },
  { name: "Pascal",        logo: "delphi",         hex: "EE1F35", logoColor: "white" },
  { name: "Ada",           logo: "ada",            hex: "02569B", logoColor: "white" },
  { name: "Visual Basic",  logo: "visualbasic",    hex: "512BD4", logoColor: "white", aliases: ["vb", "vbnet", "vb.net"] },
  { name: "VBA",           logo: "visualbasic",    hex: "512BD4", logoColor: "white" },
  { name: "ABAP",          logo: "sap",            hex: "1F72B8", logoColor: "white" },
  { name: "Apex",          logo: "salesforce",     hex: "00A1E0", logoColor: "white" },

  // Scripting / shell / automation
  { name: "Bash",          logo: "gnubash",        hex: "4EAA25", logoColor: "white", aliases: ["shell", "sh"] },
  { name: "PowerShell",    logo: "powershell",     hex: "5391FE", logoColor: "white" },
  { name: "Zsh",           logo: "gnubash",        hex: "1BA81B", logoColor: "white" },
  { name: "Fish",          logo: "gnubash",        hex: "34C3FF", logoColor: "black" },
  { name: "Tcl",           logo: "tcl",            hex: "E4CD45", logoColor: "black" },
  { name: "AWK",           logo: "gnubash",        hex: "1F4B82", logoColor: "white" },

  // Data / stats / scientific
  { name: "SQL",           logo: "postgresql",     hex: "4479A1", logoColor: "white", aliases: ["structuredquery"] },
  { name: "PL/SQL",        logo: "oracle",         hex: "F80000", logoColor: "white", aliases: ["plsql"] },
  { name: "T-SQL",         logo: "microsoftsqlserver", hex: "CC2927", logoColor: "white", aliases: ["tsql"] },
  { name: "SAS",           logo: "sas",            hex: "005CAA", logoColor: "white" },
  { name: "SPSS",          logo: "ibm",            hex: "052FAD", logoColor: "white" },
  { name: "Stata",         logo: "stata",          hex: "1A5F91", logoColor: "white" },
  { name: "Mathematica",   logo: "wolframmathematica", hex: "DD1100", logoColor: "white" },
  { name: "Octave",        logo: "octave",         hex: "0790C0", logoColor: "white" },

  // Functional / ML family
  { name: "Scheme",        logo: "scheme",         hex: "A3243B", logoColor: "white" },
  { name: "Racket",        logo: "racket",         hex: "9F1D20", logoColor: "white" },
  { name: "Common Lisp",   logo: "commonlisp",     hex: "3FB68B", logoColor: "white", aliases: ["lisp"] },
  { name: "Elm",           logo: "elm",            hex: "1293D8", logoColor: "white" },
  { name: "PureScript",    logo: "purescript",     hex: "14161A", logoColor: "white" },
  { name: "ReScript",      logo: "rescript",       hex: "E6484F", logoColor: "white" },
  { name: "ReasonML",      logo: "reason",         hex: "DD4B39", logoColor: "white", aliases: ["reason"] },

  // Modern / web-native
  { name: "CoffeeScript",  logo: "coffeescript",   hex: "2F2625", logoColor: "white" },
  { name: "Vala",          logo: "vala",           hex: "A56DE2", logoColor: "white" },
  { name: "D",             logo: "d",              hex: "B03931", logoColor: "white", aliases: ["dlang"] },
  { name: "V",             logo: "v",              hex: "5D87BF", logoColor: "white", aliases: ["vlang"] },
  { name: "Haxe",          logo: "haxe",           hex: "EA8220", logoColor: "black" },
  { name: "Gleam",         logo: "gleam",          hex: "FFAFF3", logoColor: "black" },
  { name: "Odin",          logo: "odin",           hex: "3882D2", logoColor: "white" },
  { name: "Mojo",          logo: "modular",        hex: "FF6F00", logoColor: "white" },

  // Embedded / systems
  { name: "Verilog",       logo: "verilog",        hex: "B42B23", logoColor: "white" },
  { name: "VHDL",          logo: "vhdl",           hex: "543978", logoColor: "white" },
  { name: "Cuda",          logo: "nvidia",         hex: "76B900", logoColor: "black" },
  { name: "OpenCL",        logo: "khronosgroup",   hex: "EE3F27", logoColor: "white" },

  // Markup / config (people include these in stacks)
  { name: "HTML5",         logo: "html5",          hex: "E34F26", logoColor: "white", aliases: ["html"] },
  { name: "CSS3",          logo: "css3",           hex: "1572B6", logoColor: "white", aliases: ["css"] },
  { name: "Sass",          logo: "sass",           hex: "CC6699", logoColor: "white", aliases: ["scss"] },
  { name: "Markdown",      logo: "markdown",       hex: "000000", logoColor: "white", aliases: ["md"] },
  { name: "LaTeX",         logo: "latex",          hex: "008080", logoColor: "white", aliases: ["tex"] },
  { name: "YAML",          logo: "yaml",           hex: "CB171E", logoColor: "white" },
  { name: "JSON",          logo: "json",           hex: "000000", logoColor: "white" },
  { name: "XML",           logo: "xml",            hex: "005A9C", logoColor: "white" },
  { name: "TOML",          logo: "toml",           hex: "9C4121", logoColor: "white" },
  { name: "GraphQL",       logo: "graphql",        hex: "E10098", logoColor: "white" },

  // Legacy / niche but still googled
  { name: "Lisp",          logo: "commonlisp",     hex: "3FB68B", logoColor: "white" },
  { name: "Smalltalk",     logo: "smalltalk",      hex: "596C7F", logoColor: "white" },
  { name: "Prolog",        logo: "prolog",         hex: "74283C", logoColor: "white" },
  { name: "Delphi",        logo: "delphi",         hex: "EE1F35", logoColor: "white" },
  { name: "ActionScript",  logo: "adobe",          hex: "FF0000", logoColor: "white" },
  { name: "ColdFusion",    logo: "adobe",          hex: "ED2224", logoColor: "white", aliases: ["cfml"] },
];
