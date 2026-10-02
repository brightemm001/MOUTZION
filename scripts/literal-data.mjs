import ts from 'typescript';

/** Read literal website data without executing JavaScript (node:vm is not a sandbox). */
export function readLiteralData(source, name, assignment = false) {
  if (typeof source !== 'string' || source.length > 8 * 1024 * 1024) throw new Error('Website data source is too large.');
  const ast = ts.createSourceFile('website-data.js', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  if (ast.parseDiagnostics.length) throw new Error('Website data source has invalid syntax.');
  let nodes = 0;
  function literal(node, depth = 0) {
    if (++nodes > 100000 || depth > 20) throw new Error('Website data exceeds the import limits.');
    if (ts.isParenthesizedExpression(node)) return literal(node.expression, depth + 1);
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isNumericLiteral(node)) {
      const value = Number(node.text);
      if (!Number.isFinite(value)) throw new Error('Invalid number in website data.');
      return value;
    }
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (node.kind === ts.SyntaxKind.NullKeyword) return null;
    if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)
      && [ts.SyntaxKind.MinusToken, ts.SyntaxKind.PlusToken].includes(node.operator)) {
      return (node.operator === ts.SyntaxKind.MinusToken ? -1 : 1) * literal(node.operand, depth + 1);
    }
    if (ts.isArrayLiteralExpression(node)) {
      if (node.elements.length > 10000) throw new Error('Website array is too large.');
      return node.elements.map(item => literal(item, depth + 1));
    }
    if (ts.isObjectLiteralExpression(node)) {
      const result = Object.create(null);
      if (node.properties.length > 10000) throw new Error('Website object is too large.');
      for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property) || !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name) || ts.isNumericLiteral(property.name))) throw new Error('Only literal properties may be imported.');
        const key = property.name.text;
        if (['__proto__', 'prototype', 'constructor'].includes(key) || Object.hasOwn(result, key)) throw new Error('Unsafe or duplicate website property.');
        result[key] = literal(property.initializer, depth + 1);
      }
      return result;
    }
    throw new Error('Executable JavaScript cannot be imported as church data.');
  }
  for (const statement of ast.statements) {
    if (!assignment && ts.isVariableStatement(statement)) {
      const node = statement.declarationList.declarations.find(d => ts.isIdentifier(d.name) && d.name.text === name);
      if (node?.initializer) return literal(node.initializer);
    }
    if (assignment && ts.isExpressionStatement(statement) && ts.isBinaryExpression(statement.expression)
      && statement.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken
      && ts.isPropertyAccessExpression(statement.expression.left)
      && statement.expression.left.expression.getText(ast) === 'window' && statement.expression.left.name.text === name) {
      return literal(statement.expression.right);
    }
  }
  throw new Error('The requested website data was not found.');
}
