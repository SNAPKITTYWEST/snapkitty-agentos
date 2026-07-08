//! AXIOM Syntax Parser
//! Parses .axiom files into Term AST

use crate::kernel::checker::Term;

/// Token types
#[derive(Debug, Clone, PartialEq)]
pub enum Token {
    Keyword(String),     // def, theorem, inductive, where, end
    Ident(String),       // variable names
    Number(u64),         // numeric literals
    Colon,               // :
    Arrow,               // →
    Pi,                  // Π
    Lambda,              // λ
    Sigma,               // Σ
    Forall,              // ∀
    LParen,              // (
    RParen,              // )
    LBrace,              // {
    RBrace,              // }
    Comma,               // ,
    Dot,                 // .
    Equals,              // =
    Pipe,                // |
    Newline,
    Eof,
}

/// Lexer: tokenize input
pub struct Lexer {
    input: Vec<char>,
    pos: usize,
}

impl Lexer {
    pub fn new(input: &str) -> Self {
        Lexer {
            input: input.chars().collect(),
            pos: 0,
        }
    }

    pub fn tokenize(&mut self) -> Vec<Token> {
        let mut tokens = Vec::new();

        while self.pos < self.input.len() {
            self.skip_whitespace();
            if self.pos >= self.input.len() {
                break;
            }

            let ch = self.input[self.pos];

            match ch {
                ':' => { tokens.push(Token::Colon); self.pos += 1; }
                '→' => { tokens.push(Token::Arrow); self.pos += 1; }
                'Π' => { tokens.push(Token::Pi); self.pos += 1; }
                'λ' => { tokens.push(Token::Lambda); self.pos += 1; }
                'Σ' => { tokens.push(Token::Sigma); self.pos += 1; }
                '∀' => { tokens.push(Token::Forall); self.pos += 1; }
                '(' => { tokens.push(Token::LParen); self.pos += 1; }
                ')' => { tokens.push(Token::RParen); self.pos += 1; }
                '{' => { tokens.push(Token::LBrace); self.pos += 1; }
                '}' => { tokens.push(Token::RBrace); self.pos += 1; }
                ',' => { tokens.push(Token::Comma); self.pos += 1; }
                '.' => { tokens.push(Token::Dot); self.pos += 1; }
                '=' => { tokens.push(Token::Equals); self.pos += 1; }
                '|' => { tokens.push(Token::Pipe); self.pos += 1; }
                '\n' => { tokens.push(Token::Newline); self.pos += 1; }
                '-' if self.peek() == Some('-') => self.skip_line_comment(),
                _ if ch.is_alphabetic() || ch == '_' => {
                    let ident = self.read_ident();
                    match ident.as_str() {
                        "def" | "theorem" | "inductive" | "where" | "end" | "Type" => {
                            tokens.push(Token::Keyword(ident));
                        }
                        _ => tokens.push(Token::Ident(ident)),
                    }
                }
                _ if ch.is_numeric() => {
                    tokens.push(Token::Number(self.read_number()));
                }
                _ => { self.pos += 1; } // skip unknown
            }
        }

        tokens.push(Token::Eof);
        tokens
    }

    fn skip_whitespace(&mut self) {
        while self.pos < self.input.len() {
            let ch = self.input[self.pos];
            if ch == ' ' || ch == '\t' || ch == '\r' {
                self.pos += 1;
            } else {
                break;
            }
        }
    }

    fn skip_line_comment(&mut self) {
        while self.pos < self.input.len() && self.input[self.pos] != '\n' {
            self.pos += 1;
        }
    }

    fn peek(&self) -> Option<char> {
        if self.pos + 1 < self.input.len() {
            Some(self.input[self.pos + 1])
        } else {
            None
        }
    }

    fn read_ident(&mut self) -> String {
        let start = self.pos;
        while self.pos < self.input.len() {
            let ch = self.input[self.pos];
            if ch.is_alphanumeric() || ch == '_' {
                self.pos += 1;
            } else {
                break;
            }
        }
        self.input[start..self.pos].iter().collect()
    }

    fn read_number(&mut self) -> u64 {
        let start = self.pos;
        while self.pos < self.input.len() && self.input[self.pos].is_numeric() {
            self.pos += 1;
        }
        let s: String = self.input[start..self.pos].iter().collect();
        s.parse().unwrap_or(0)
    }
}

/// Parse .axiom source into declarations
pub fn parse(source: &str) -> Vec<Declaration> {
    let mut lexer = Lexer::new(source);
    let tokens = lexer.tokenize();
    let mut parser = Parser::new(tokens);
    parser.parse_declarations()
}

/// Declaration types
#[derive(Debug)]
pub enum Declaration {
    Def { name: String, typ: Term, body: Term },
    Theorem { name: String, typ: Term, proof: Term },
    Inductive { name: String, universe: u32, constructors: Vec<(String, Term)> },
}

/// Parser
struct Parser {
    tokens: Vec<Token>,
    pos: usize,
}

impl Parser {
    fn new(tokens: Vec<Token>) -> Self {
        Parser { tokens, pos: 0 }
    }

    fn parse_declarations(&mut self) -> Vec<Declaration> {
        let mut decls = Vec::new();
        while !self.at_end() {
            self.skip_newlines();
            if self.at_end() { break; }
            if let Some(decl) = self.parse_declaration() {
                decls.push(decl);
            }
        }
        decls
    }

    fn parse_declaration(&mut self) -> Option<Declaration> {
        match self.peek() {
            Some(Token::Keyword(kw)) => {
                match kw.as_str() {
                    "def" => self.parse_def(),
                    "theorem" => self.parse_theorem(),
                    "inductive" => self.parse_inductive(),
                    _ => { self.advance(); None }
                }
            }
            _ => { self.advance(); None }
        }
    }

    fn parse_def(&mut self) -> Option<Declaration> {
        self.expect_keyword("def")?;
        let name = self.expect_ident()?;
        self.expect(Token::Colon)?;
        let typ = self.parse_term()?;
        self.expect(Token::Equals)?;
        let body = self.parse_term()?;
        Some(Declaration::Def { name, typ, body })
    }

    fn parse_theorem(&mut self) -> Option<Declaration> {
        self.expect_keyword("theorem")?;
        let name = self.expect_ident()?;
        self.expect(Token::Colon)?;
        let typ = self.parse_term()?;
        self.expect(Token::Equals)?;
        let proof = self.parse_term()?;
        Some(Declaration::Theorem { name, typ, proof })
    }

    fn parse_inductive(&mut self) -> Option<Declaration> {
        self.expect_keyword("inductive")?;
        let name = self.expect_ident()?;
        self.expect(Token::Colon)?;
        self.expect_keyword("Type")?;
        let universe = 0;
        self.expect_keyword("where")?;
        
        let mut constructors = Vec::new();
        loop {
            self.skip_newlines();
            if self.peek() == Some(&Token::Pipe) {
                self.advance();
            }
            if let Some(ctor_name) = self.try_ident() {
                self.expect(Token::Colon)?;
                let typ = self.parse_term()?;
                constructors.push((ctor_name, typ));
            } else {
                break;
            }
        }

        Some(Declaration::Inductive { name, universe, constructors })
    }

    fn parse_term(&mut self) -> Option<Term> {
        self.parse_arrow()
    }

    fn parse_arrow(&mut self) -> Option<Term> {
        let mut left = self.parse_app()?;
        while self.peek() == Some(&Token::Arrow) {
            self.advance();
            let right = self.parse_app()?;
            left = Term::Pi("_".to_string(), Box::new(left), Box::new(right));
        }
        Some(left)
    }

    fn parse_app(&mut self) -> Option<Term> {
        let mut func = self.parse_atom()?;
        while let Some(arg) = self.try_atom() {
            func = Term::App(Box::new(func), Box::new(arg));
        }
        Some(func)
    }

    fn parse_atom(&mut self) -> Option<Term> {
        match self.peek()?.clone() {
            Token::Ident(name) => {
                self.advance();
                Some(Term::Var(name))
            }
            Token::Keyword(kw) if kw == "Type" => {
                self.advance();
                Some(Term::Type(0))
            }
            Token::LParen => {
                self.advance();
                let t = self.parse_term()?;
                self.expect(Token::RParen)?;
                Some(t)
            }
            Token::Forall => {
                self.advance();
                self.expect(Token::LParen)?;
                let name = self.expect_ident()?;
                self.expect(Token::Colon)?;
                let typ = self.parse_term()?;
                self.expect(Token::RParen)?;
                self.expect(Token::Comma)?;
                let body = self.parse_term()?;
                Some(Term::Pi(name, Box::new(typ), Box::new(body)))
            }
            Token::Lambda => {
                self.advance();
                let name = self.expect_ident()?;
                self.expect(Token::Dot)?;
                let body = self.parse_term()?;
                // Lambda needs type annotation, use Type 0 as placeholder
                Some(Term::Lam(name, Box::new(Term::Type(0)), Box::new(body)))
            }
            Token::Number(n) => {
                self.advance();
                Some(Term::Constructor(format!("{}", n), Box::new(Term::Inductive("Nat".to_string(), 0))))
            }
            _ => None,
        }
    }

    fn try_atom(&mut self) -> Option<Term> {
        match self.peek()? {
            Token::Ident(_) | Token::LParen | Token::Number(_) => self.parse_atom(),
            _ => None,
        }
    }

    fn try_ident(&mut self) -> Option<String> {
        if let Some(Token::Ident(name)) = self.peek() {
            let name = name.clone();
            self.advance();
            Some(name)
        } else {
            None
        }
    }

    fn expect_ident(&mut self) -> Option<String> {
        if let Some(Token::Ident(name)) = self.peek() {
            let name = name.clone();
            self.advance();
            Some(name)
        } else {
            None
        }
    }

    fn expect_keyword(&mut self, kw: &str) -> Option<()> {
        if let Some(Token::Keyword(k)) = self.peek() {
            if k == kw {
                self.advance();
                return Some(());
            }
        }
        None
    }

    fn expect(&mut self, token: Token) -> Option<()> {
        if self.peek() == Some(&token) {
            self.advance();
            Some(())
        } else {
            None
        }
    }

    fn peek(&self) -> Option<&Token> {
        self.tokens.get(self.pos)
    }

    fn advance(&mut self) {
        self.pos += 1;
    }

    fn skip_newlines(&mut self) {
        while self.peek() == Some(&Token::Newline) {
            self.advance();
        }
    }

    fn at_end(&self) -> bool {
        self.pos >= self.tokens.len() || self.peek() == Some(&Token::Eof)
    }
}
