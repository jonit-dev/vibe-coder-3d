/**
 * Lifecycle Parser - Extracts lifecycle method bodies from script code
 */

import { ILifecycleNode, IScriptAST } from './IScriptAST';
import { Tokenizer, TokenType, IToken } from './Tokenizer';

export interface ILifecycleParser {
  parse(code: string): IScriptAST;
}

export class LifecycleParser implements ILifecycleParser {
  private tokens: IToken[] = [];
  private position = 0;

  public parse(code: string): IScriptAST {
    try {
      const tokenizer = new Tokenizer(code);
      this.tokens = tokenizer.tokenize();
      this.position = 0;

      const lifecycles = this.extractLifecycles();

      return {
        lifecycles,
        isValid: true,
      };
    } catch (error) {
      return {
        lifecycles: [],
        isValid: false,
        parseError: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private extractLifecycles(): ILifecycleNode[] {
    const lifecycles: ILifecycleNode[] = [];
    const lifecycleNames = ['onStart', 'onUpdate', 'onDestroy', 'onEnable', 'onDisable'] as const;

    while (!this.isAtEnd()) {
      const token = this.peek();

      // Look for lifecycle function declarations
      // Pattern 1: function onStart() { ... }
      if (token.type === TokenType.Keyword && token.value === 'function') {
        const lifecycle = this.parseFunctionDeclaration();
        if (
          lifecycle &&
          lifecycleNames.includes(lifecycle.name as (typeof lifecycleNames)[number])
        ) {
          lifecycles.push(lifecycle);
        }
      }
      // Pattern 2: const onStart = () => { ... }
      // Pattern 3: onStart = () => { ... }
      else if (token.type === TokenType.Identifier || token.type === TokenType.Keyword) {
        const lifecycle = this.parseArrowFunctionAssignment();
        if (
          lifecycle &&
          lifecycleNames.includes(lifecycle.name as (typeof lifecycleNames)[number])
        ) {
          lifecycles.push(lifecycle);
        }
      } else {
        this.advance();
      }
    }

    return lifecycles;
  }

  private parseFunctionDeclaration(): ILifecycleNode | null {
    // function onStart() { ... }
    if (!this.match(TokenType.Keyword, 'function')) {
      return null;
    }

    const nameToken = this.advance();
    if (nameToken.type !== TokenType.Identifier) {
      return null;
    }

    const name = nameToken.value as ILifecycleNode['name'];

    // Skip parameters ()
    if (!this.match(TokenType.OpenParen)) {
      return null;
    }
    this.skipUntil(TokenType.CloseParen);
    if (!this.match(TokenType.CloseParen)) {
      return null;
    }

    // Optional type annotation : Type
    if (this.peek().type === TokenType.Colon) {
      this.advance(); // :
      // Skip until we find {
      while (!this.isAtEnd() && this.peek().type !== TokenType.OpenBrace) {
        this.advance();
      }
    }

    // Extract body
    if (!this.match(TokenType.OpenBrace)) {
      return null;
    }

    const body = this.extractBracedBody();

    return { name, body };
  }

  private parseArrowFunctionAssignment(): ILifecycleNode | null {
    const startPos = this.position;

    // Optional: const/let/var
    if (this.peek().type === TokenType.Keyword) {
      const keyword = this.peek().value;
      if (keyword === 'const' || keyword === 'let' || keyword === 'var') {
        this.advance();
      }
    }

    // Identifier (function name)
    const nameToken = this.peek();
    if (nameToken.type !== TokenType.Identifier) {
      this.position = startPos;
      return null;
    }

    const name = nameToken.value as ILifecycleNode['name'];
    this.advance();

    // =
    if (!this.match(TokenType.Equals)) {
      this.position = startPos;
      return null;
    }

    // ()
    if (!this.match(TokenType.OpenParen)) {
      this.position = startPos;
      return null;
    }
    this.skipUntil(TokenType.CloseParen);
    if (!this.match(TokenType.CloseParen)) {
      this.position = startPos;
      return null;
    }

    // Optional type annotation : Type
    if (this.peek().type === TokenType.Colon) {
      this.advance(); // :
      // Skip until we find =>
      while (!this.isAtEnd() && !(this.peek().type === TokenType.Arrow)) {
        this.advance();
      }
    }

    // =>
    if (!this.match(TokenType.Arrow)) {
      this.position = startPos;
      return null;
    }

    // {
    if (!this.match(TokenType.OpenBrace)) {
      this.position = startPos;
      return null;
    }

    const body = this.extractBracedBody();

    return { name, body };
  }

  private extractBracedBody(): string {
    // We're already past the opening brace
    const startPos = this.position;
    let braceDepth = 1;
    const bodyTokens: IToken[] = [];

    while (!this.isAtEnd() && braceDepth > 0) {
      const token = this.advance();

      if (token.type === TokenType.OpenBrace) {
        braceDepth++;
        bodyTokens.push(token);
      } else if (token.type === TokenType.CloseBrace) {
        braceDepth--;
        if (braceDepth > 0) {
          bodyTokens.push(token);
        }
      } else {
        bodyTokens.push(token);
      }
    }

    // Reconstruct body from tokens
    return bodyTokens.map((t) => t.value).join('');
  }

  private peek(offset = 0): IToken {
    const pos = this.position + offset;
    return pos < this.tokens.length ? this.tokens[pos] : this.tokens[this.tokens.length - 1];
  }

  private advance(): IToken {
    return this.tokens[this.position++];
  }

  private match(type: TokenType, value?: string): boolean {
    const token = this.peek();
    if (token.type !== type) {
      return false;
    }
    if (value !== undefined && token.value !== value) {
      return false;
    }
    this.advance();
    return true;
  }

  private skipUntil(type: TokenType): void {
    while (!this.isAtEnd() && this.peek().type !== type) {
      this.advance();
    }
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }
}
