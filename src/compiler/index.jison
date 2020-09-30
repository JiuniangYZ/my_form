%lex
%%

\/\/.*?\n                         /*skip*/;
\s+                               /*skip*/;
\$[a-z]                           return 'COL'  //return yy.helper.colBuilder(yytext);
\@[1-9][0-9]*                     return 'ROW'  //return yy.helper.rowBuilder(yytext);
\#[a-z][1-9][0-9]*                return 'CELL' //return yy.helper.cellBuilder(yytext);
"("                               return '(';
")"                               return ')';
"+"                               return '+'; 
"-"                               return '-'; 
"*"                               return '*'; 
"/"                               return '/';
"<-"                              return 'ASSIGN';
[A-Za-z]+                         return 'NAME';
(([1-9][0-9]*)|0)(\.[0-9]+)?      return 'NUMBER';
<<EOF>>                           return 'EOF';
.                                 return 'INVALID';


/lex
%left '+' '-'
%left '*' '/'
%start calc

%%
calc
  : position_ref ASSIGN exp EOF { return yy.helper.calcBuilder($1, $3)}
  ;

exp 
  : "(" exp ")"  {return $2}
  | eval {$$ = $1}
  | func_call {$$ = $1}
  | position_ref {$$ = $1}
  | NUMBER { $$ = {type:"number", val:Number($1)} }
  ;

position_ref
  : ROW {$$ = yy.helper.rowBuilder($1)}
  | COL {$$ = yy.helper.colBuilder($1)}
  | CELL {$$ = yy.helper.cellBuilder($1)}
  ;

eval
  : exp '+' exp { $$ = yy.helper.evalBuilder($1, $2, $3) }
  | exp '-' exp { $$ = yy.helper.evalBuilder($1, $2, $3) }
  | exp '*' exp { $$ = yy.helper.evalBuilder($1, $2, $3) }
  | exp '/' exp { $$ = yy.helper.evalBuilder($1, $2, $3) }
  ;

func_call
  : NAME '(' exp ')' { $$ = yy.helper.funcCallBuilder($1, $3) }
  ;

num_op
  : '+' {$$=$1;}
  | '-' {$$=$1;}
  | '*' {$$=$1;}
  | '/' {$$=$1;}
  ;



