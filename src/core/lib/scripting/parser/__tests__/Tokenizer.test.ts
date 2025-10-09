import { describe, it, expect } from 'vitest';
import { Tokenizer, TokenType } from '../Tokenizer';

describe('Tokenizer', () => {
  describe('Basic tokens', () => {
    it('should tokenize identifiers', () => {
      const tokenizer = new Tokenizer('onStart onUpdate');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]).toMatchObject({
        type: TokenType.Identifier,
        value: 'onStart',
      });
      expect(tokens[1]).toMatchObject({
        type: TokenType.Identifier,
        value: 'onUpdate',
      });
    });

    it('should tokenize keywords', () => {
      const tokenizer = new Tokenizer('function const let var');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].type).toBe(TokenType.Keyword);
      expect(tokens[1].type).toBe(TokenType.Keyword);
      expect(tokens[2].type).toBe(TokenType.Keyword);
      expect(tokens[3].type).toBe(TokenType.Keyword);
    });

    it('should tokenize numbers', () => {
      const tokenizer = new Tokenizer('42 3.14 -2.5');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]).toMatchObject({
        type: TokenType.Number,
        value: '42',
      });
      expect(tokens[1]).toMatchObject({
        type: TokenType.Number,
        value: '3.14',
      });
    });

    it('should tokenize strings', () => {
      const tokenizer = new Tokenizer('"hello" \'world\' `test`');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]).toMatchObject({
        type: TokenType.String,
        value: '"hello"',
      });
      expect(tokens[1]).toMatchObject({
        type: TokenType.String,
        value: "'world'",
      });
      expect(tokens[2]).toMatchObject({
        type: TokenType.String,
        value: '`test`',
      });
    });
  });

  describe('Operators and punctuation', () => {
    it('should tokenize braces', () => {
      const tokenizer = new Tokenizer('{}');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].type).toBe(TokenType.OpenBrace);
      expect(tokens[1].type).toBe(TokenType.CloseBrace);
    });

    it('should tokenize parentheses', () => {
      const tokenizer = new Tokenizer('()');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].type).toBe(TokenType.OpenParen);
      expect(tokens[1].type).toBe(TokenType.CloseParen);
    });

    it('should tokenize arrow function', () => {
      const tokenizer = new Tokenizer('=>');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]).toMatchObject({
        type: TokenType.Arrow,
        value: '=>',
      });
    });

    it('should tokenize equals', () => {
      const tokenizer = new Tokenizer('=');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].type).toBe(TokenType.Equals);
    });
  });

  describe('Comments', () => {
    it('should skip line comments', () => {
      const tokenizer = new Tokenizer('test // comment\nvalue');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].value).toBe('test');
      expect(tokens[1].value).toBe('value');
      expect(tokens.some((t) => t.type === TokenType.Comment)).toBe(false);
    });

    it('should skip block comments', () => {
      const tokenizer = new Tokenizer('test /* comment */ value');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].value).toBe('test');
      expect(tokens[1].value).toBe('value');
      expect(tokens.some((t) => t.type === TokenType.Comment)).toBe(false);
    });

    it('should handle multi-line block comments', () => {
      const tokenizer = new Tokenizer('test /* multi\nline\ncomment */ value');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].value).toBe('test');
      expect(tokens[1].value).toBe('value');
    });
  });

  describe('String escaping', () => {
    it('should handle escaped quotes in strings', () => {
      const tokenizer = new Tokenizer('"hello \\"world\\""');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]).toMatchObject({
        type: TokenType.String,
        value: '"hello \\"world\\""',
      });
    });
  });

  describe('Line and column tracking', () => {
    it('should track line numbers', () => {
      const tokenizer = new Tokenizer('line1\nline2\nline3');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].line).toBe(1);
      expect(tokens[1].line).toBe(2);
      expect(tokens[2].line).toBe(3);
    });

    it('should track columns', () => {
      const tokenizer = new Tokenizer('a bc def');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].column).toBe(1);
      expect(tokens[1].column).toBe(3);
      expect(tokens[2].column).toBe(6);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty input', () => {
      const tokenizer = new Tokenizer('');
      const tokens = tokenizer.tokenize();

      expect(tokens.length).toBe(1);
      expect(tokens[0].type).toBe(TokenType.EOF);
    });

    it('should handle only whitespace', () => {
      const tokenizer = new Tokenizer('   \n\t  ');
      const tokens = tokenizer.tokenize();

      expect(tokens.length).toBe(1);
      expect(tokens[0].type).toBe(TokenType.EOF);
    });

    it('should handle unclosed strings', () => {
      const tokenizer = new Tokenizer('"unclosed');
      const tokens = tokenizer.tokenize();

      expect(tokens[0].type).toBe(TokenType.String);
      expect(tokens[0].value).toBe('"unclosed');
    });

    it('should handle unclosed block comments', () => {
      const tokenizer = new Tokenizer('/* unclosed');
      const tokens = tokenizer.tokenize();

      expect(tokens.length).toBe(1);
      expect(tokens[0].type).toBe(TokenType.EOF);
    });
  });

  describe('Complex scripts', () => {
    it('should tokenize function declaration', () => {
      const code = 'function onStart() { console.log("hello"); }';
      const tokenizer = new Tokenizer(code);
      const tokens = tokenizer.tokenize();

      const tokenTypes = tokens.map((t) => t.type);
      expect(tokenTypes).toContain(TokenType.Keyword); // function
      expect(tokenTypes).toContain(TokenType.Identifier); // onStart
      expect(tokenTypes).toContain(TokenType.OpenParen);
      expect(tokenTypes).toContain(TokenType.CloseParen);
      expect(tokenTypes).toContain(TokenType.OpenBrace);
      expect(tokenTypes).toContain(TokenType.CloseBrace);
    });

    it('should tokenize arrow function', () => {
      const code = 'const onUpdate = () => { entity.position.x = 5; }';
      const tokenizer = new Tokenizer(code);
      const tokens = tokenizer.tokenize();

      const tokenTypes = tokens.map((t) => t.type);
      expect(tokenTypes).toContain(TokenType.Keyword); // const
      expect(tokenTypes).toContain(TokenType.Arrow);
      expect(tokenTypes).toContain(TokenType.Equals);
    });
  });
});
