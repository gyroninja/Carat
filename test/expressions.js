'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;

const code = require('code');
const expect = code.expect;

const expressions = require('../lib/expressions.js');
const utils = require('../lib/utils');
const traverse = expressions.traverse;
const ast = require('../lib/ast');

const options = {

};

// 	Get ast from simple snippets of code.:
const FunctionDeclaration = 'function foo() {}';
const FunctionExpression = '(function () {})';
const IfStatement = 'if (true) {;} else {;}\nif (true);';
const ForStatement = 'for (var i = 0; i < 10; i++) {i;}';
const SequenceExpression = '1+2, 1-3, !true, a=3;';

describe('traverse', function () {
	it('#Program', function (done) {
		const program = '{}';
		let ast = traverse(options, utils.parse(program), function (scope, node) {
			expect(node).to.exist();
		});

		expect(ast.body[0]).to.deep.include({
			type: 'BlockStatement',
			body: [],
			line: 1
		});
		done();
	});

	it('#VariableDeclaration', function (done) {
		const program = 'var a = 2;\nvar b = a;';
		let tree = traverse(options, utils.parse(program), function (scope, node) {
			expect(node).to.exist();
		});

		let value = ast.l(2);

		expect(tree.body[0]).to.deep.include({
			type: 'VariableDeclaration',
			declarations: [{
				type: 'VariableDeclarator',
				id: ast.i('a'),
				init: value
			}],
			kind: 'var',
			line: 1
		});

		expect(tree.body[1]).to.deep.include({
			type: 'VariableDeclaration',
			declarations: [{
				type: 'VariableDeclarator',
				id: Object.assign(ast.i('b')),
				init: tree.scopeManager.globalScope.resolveVar('a')
			}],
			kind: 'var'
		});

		done();
	});

	it('#AssignmentExpression', function (done) {
		const program = 'a = 3;\na';
		let tree = traverse(options, utils.parse(program), function (scope, node) {
			expect(node).to.exist();
		});

		expect(tree.body[0].expression).to.deep.include({
			type: 'AssignmentExpression',
			operator: '=',
			left: ast.i('a'),
			right: ast.l(3)
		});

		expect(tree.body[1].expression).to.equal(tree.scopeManager.globalScope.resolveVar('a'));

		done();
	});

	it('#MemberExpression', function (done) {
		const program = 'a.b';
		let node = traverse(options, utils.parse(program), function (scope, node) {
			expect(node).to.exist();
		}).body[0].expression;

		expect(node).to.deep.include(ast.me('a', 'b'));
		expect(node.name).equal(program);

		done();
	});

	it('#CallExpression', function (done) {
		const program = 'var a = function (b) {b;};\na(2)';
		let tree = traverse(options, utils.parse(program), function (scope, node) {
			expect(node).to.exist();
		});

		let name = tree.body[0].declarations[0].id;
		expect(tree.body[1].expression).to.deep.include(ast.ce(name));

		done();
	});

	it('#ArrayExpression', function (done) {
		const program = '[1,2,3,4][0]';
		let node = traverse(options, utils.parse(program), function (scope, node) {
			expect(node).to.exist();
		}).body[0].expression;

		expect(node).to.deep.include(ast.l(1));
		done();
	});

	it('#ObjectExpression', function (done) {
		const program = '({a: {b: 2}, c: function () {}})';
		let tree = traverse(options, utils.parse(program), function (scope, node) {
			expect(node).to.exist();
		});

		expect(tree.body[0].expression).to.deep.include(ast.oe([
			ast.prop('a', ast.oe([
				ast.prop('b', ast.l(2))
			])),
			ast.prop('c', ast.func(null))
		]));
		done();
	});

	it('#FunctionDeclaration', function (done) {
		const program = 'function foo() {}';
		let tree = traverse(options, utils.parse(program), function (scope, node) {
			expect(node).to.exist();
		});

		expect(tree.body[0]).to.deep.include(ast.decFunc('foo', null, ast.block(), {generator: false, expression: false}));

		done();
	});
});
