/**
 * Tokenizer - Lightweight tokenizer for script parsing
 */

export enum TokenType {
  Identifier = 'Identifier',
  String = 'String',
  Number = 'Number',
  OpenBrace = 'OpenBrace',
  CloseBrace = 'CloseBrace',
  OpenParen = 'OpenParen',
  CloseParen = 'CloseParen',
  Comment = 'Comment',
  Whitespace = 'Whitespace',
  Arrow = 'Arrow',
  Equals = 'Equals',
  Keyword = 'Keyword',
  Semicolon = 'Semicolon',
  Colon = 'Colon',
  Comma = 'Comma',
  Dot = 'Dot',
  Other = 'Other',
  EOF = 'EOF',
}

export interface IToken {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

/**
 * Simple tokenizer that handles strings, comments, braces, and identifiers
 */
export class Tokenizer {
  private code: string;
  private position: number;
  private line: number;
  private column: number;

  constructor(code: string) {
    this.code = code;
    this.position = 0;
    this.line = 1;
    this.column = 1;
  }

  public tokenize(): IToken[] {
    const tokens: IToken[] = [];

    while (this.position < this.code.length) {
      const token = this.nextToken();
      if (token.type !== TokenType.Whitespace && token.type !== TokenType.Comment) {
        tokens.push(token);
      }
    }

    tokens.push({
      type: TokenType.EOF,
      value: '',
      line: this.line,
      column: this.column,
    });

    return tokens;
  }

  private nextToken(): IToken {
    const char = this.peek();

    // Whitespace
    if (/\s/.test(char)) {
      return this.scanWhitespace();
    }

    // Comments
    if (char === '/' && this.peek(1) === '/') {
      return this.scanLineComment();
    }
    if (char === '/' && this.peek(1) === '*') {
      return this.scanBlockComment();
    }

    // Strings
    if (char === '"' || char === "'" || char === '`') {
      return this.scanString(char);
    }

    // Numbers
    if (/\d/.test(char)) {
      return this.scanNumber();
    }

    // Arrow =>
    if (char === '=' && this.peek(1) === '>') {
      return this.scanArrow();
    }

    // Identifiers and keywords
    if (/[a-zA-Z_$]/.test(char)) {
      return this.scanIdentifier();
    }

    // Single character tokens
    const singleCharTokens: Record<string, TokenType> = {
      '{': TokenType.OpenBrace,
      '}': TokenType.CloseBrace,
      '(': TokenType.OpenParen,
      ')': TokenType.CloseParen,
      '=': TokenType.Equals,
      ';': TokenType.Semicolon,
      ':': TokenType.Colon,
      ',': TokenType.Comma,
      '.': TokenType.Dot,
    };

    if (singleCharTokens[char]) {
      return this.scanSingleChar(singleCharTokens[char]);
    }

    // Other
    return this.scanOther();
  }

  private peek(offset = 0): string {
    const pos = this.position + offset;
    return pos < this.code.length ? this.code[pos] : '';
  }

  private advance(): string {
    const char = this.code[this.position++];
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  private scanWhitespace(): IToken {
    const start = { line: this.line, column: this.column };
    let value = '';

    while (/\s/.test(this.peek())) {
      value += this.advance();
    }

    return {
      type: TokenType.Whitespace,
      value,
      ...start,
    };
  }

  private scanLineComment(): IToken {
    const start = { line: this.line, column: this.column };
    let value = '';

    // Skip //
    value += this.advance();
    value += this.advance();

    while (this.peek() !== '\n' && this.peek() !== '') {
      value += this.advance();
    }

    return {
      type: TokenType.Comment,
      value,
      ...start,
    };
  }

  private scanBlockComment(): IToken {
    const start = { line: this.line, column: this.column };
    let value = '';

    // Skip /*
    value += this.advance();
    value += this.advance();

    while (!(this.peek() === '*' && this.peek(1) === '/') && this.peek() !== '') {
      value += this.advance();
    }

    // Skip */
    if (this.peek() === '*') {
      value += this.advance();
      value += this.advance();
    }

    return {
      type: TokenType.Comment,
      value,
      ...start,
    };
  }

  private scanString(quote: string): IToken {
    const start = { line: this.line, column: this.column };
    let value = '';

    // Skip opening quote
    value += this.advance();

    while (this.peek() !== quote && this.peek() !== '') {
      if (this.peek() === '\\') {
        value += this.advance(); // Escape char
        if (this.peek() !== '') {
          value += this.advance(); // Escaped char
        }
      } else {
        value += this.advance();
      }
    }

    // Skip closing quote
    if (this.peek() === quote) {
      value += this.advance();
    }

    return {
      type: TokenType.String,
      value,
      ...start,
    };
  }

  private scanNumber(): IToken {
    const start = { line: this.line, column: this.column };
    let value = '';

    while (/[\d.]/.test(this.peek())) {
      value += this.advance();
    }

    return {
      type: TokenType.Number,
      value,
      ...start,
    };
  }

  private scanArrow(): IToken {
    const start = { line: this.line, column: this.column };
    const value = this.advance() + this.advance(); // =>

    return {
      type: TokenType.Arrow,
      value,
      ...start,
    };
  }

  private scanIdentifier(): IToken {
    const start = { line: this.line, column: this.column };
    let value = '';

    while (/[a-zA-Z0-9_$]/.test(this.peek())) {
      value += this.advance();
    }

    const keywords = ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while'];
    const type = keywords.includes(value) ? TokenType.Keyword : TokenType.Identifier;

    return {
      type,
      value,
      ...start,
    };
  }

  private scanSingleChar(type: TokenType): IToken {
    const start = { line: this.line, column: this.column };
    const value = this.advance();

    return {
      type,
      value,
      ...start,
    };
  }

  private scanOther(): IToken {
    const start = { line: this.line, column: this.column };
    const value = this.advance();

    return {
      type: TokenType.Other,
      value,
      ...start,
    };
  }
}
