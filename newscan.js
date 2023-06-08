// BEN GRIDLEY / SECURE SOFTWARE ENGINEERING

var fs = require('fs');
var esprima = require('esprima');

var filename = process.argv[2];
console.log('Processing file: ', filename);
var ast = esprima.parse(fs.readFileSync(filename).toString());

// start at the highest level, and traverse down.
// if has children / can be traversed through, call pass on it
function passThrough(node) {
    if (node.type == 'Program') {
        pass(node.body)
    } else if (node.expression) { // contains a call expression

        // ensure that these properties exist to avoid errors

        var exp = node.expression.type != 'AwaitExpression' ? node.expression : node.expression.argument

        if (exp.callee && exp.callee.property) {
            var name = exp.callee.property.name;

            // found a statement where .query or .execute is called
            if (name == 'query' || name == 'execute') {
                // perform scanThrough to collect all identifiers
                idList = scanThrough(node)

                if (idList.length > 0) {
                    console.log('Found potentially unescaped identifiers: ', idList)
                }

            } else if (name == 'createConnection') {
                var val = exp

                for(var i = 0; i < val.arguments[0].properties.length; i++) {
                    var prop = val.arguments[0].properties[i]

                    if(prop.key.name == 'multipleStatements' && (prop.value.value == true || prop.value.value == 'true')) {
                        console.log('Found multiple statements vulnerability')
                    }
                }
            } else {
                pass(node.expression.arguments)
            }
        }
    } else if (node.type == 'ArrowFunctionExpression' || node.type == 'AsyncArrowFunctionExpreession' || node.type == 'FunctionExpression' || node.type == 'AsyncFunctionExpression') {
        passThrough(node.body)
    } else if (node.type == 'BlockStatement') {
        pass(node.body)
    } else if (node.type == 'IfStatement') {
        if (node.consequent) {
            pass(node.consequent.body)
        }

        if (node.alternate) {
            pass(node.alternate.body)
        }
    } else if (node.type == 'TryStatement') {
        pass(node.block.body)
    }

    function pass(child) {
        if (Array.isArray(child)) {
            // first scan through all of the children, analyze their types, and then come up with a list of identifiers at this scope

            var list = []
            for (var c in child) {

                if (!createsNewScope(child[c]) && !declaratorScope(child[c])) {
                    // extremely important that these var lists are created, and that parent is assigned
                    // allows for traversal to higher scopes
                    child[c].parent = node
                    list.push(child[c])
                }
            }

            for (var c in child) {
                if (createsNewScope(child[c])) {
                    child[c].vars = list;

                    // continue traversing down if this child will create a new node
                    passThrough(child[c], list)
                } else if(declaratorScope(child[c])) {

                    // sort of a hack, but this works
                    // passThrough will treat the variableDeclaration as if it is an expression statement
                    child[c].declarations[0].expression = child[c].declarations[0].init
                    child[c].declarations[0].vars = list;

                    passThrough(child[c].declarations[0], list)
                }
            }
        }
    }
}

function declaratorScope(node) {
    return (node.type == 'VariableDeclaration' && node.declarations && (node.declarations[0].init.type == 'CallExpression' || node.declarations[0].init.type == 'AwaitExpression'))
}

// create a list, starting at the entry point (which is the first argument of an execute or query call)
function scanThrough(node, list) {
    // remove the escaped identifiers from the main list at the end
    escaped = []
    list = []
    // a final bit of processing after the node is passed through from passThrough
    if (node.expression && (node.expression.type == 'CallExpression' || node.expression.type == 'AwaitExpression')) {

        var type = node.expression.type

        
        var arg1 = type == 'CallExpression' ? node.expression.arguments[0] : node.expression.argument.arguments[0]

        arg1.parent = node

        // recursively delve into collect
        collect(arg1, list)

        list = list.filter(item => !escaped.includes(item));

        return list;
    }

    // self explanatory

    function collect(n, l) {
        if (n.type == 'Identifier') {
            l.push(n.name)
        } else if (n.type == 'BinaryExpression') {
            collect(n.left, l)
            collect(n.right, l)
        } else if (n.type == 'TemplateLiteral') {
            for (var i = 0; i < n.expressions.length; i++) {
                var exp = n.expressions[i]

                // dealing with weird esprima stuff here.
                // this just adds all of the template literals in a string to the list

                if (exp.type != 'MemberExpression') {
                    if (!l.includes(exp.name))
                        l.push(exp.name)
                } else {
                    if (!l.includes(exp.property.name))
                        l.push(exp.property.name)
                }
            }
        } else if (n.type == 'CallExpression') {

            // if we find a call expression here, then
            // we have potentially found an escape function, so add to list of escaped identifiers
            if (n.callee.property.name == 'escape') {
                escaped.push(n.leftSide)
            }
        }

        function traverseVars(e, l) {
            if (e.parent && e.parent.vars) {
                // traverse upwards, not downwards, from the point of current scope
                for (var v = e.parent.vars.length - 1; v >= 0; v--) {

                    var dec = e.parent.vars[v]

                    if (dec.type == 'VariableDeclaration') {
                        for (var d in dec.declarations) {
                            var declarator = dec.declarations[d]

                            if (l.includes(declarator.id.name)) {
                                declarator.init.leftSide = declarator.id.name
                                collect(declarator.init, l)
                            }
                        }
                        if (v == 0) {
                            // reached the very last variable declaration, so, call this function again recursively on the
                            // found declaration, which will in turn take its parent and begin traversing through the 
                            // vars at that level
                            // nice way to scan upwards until the end of the function

                            traverseVars(dec, l)
                        }
                    }
                }
            }
        }

        // ensure that we traverse through the variables here and collect as well. this is so that we don't miss any vars
        // at the current level
        // and also, by recursively traversingVars upwards, we will hit all of the variables
        // that are in a higher scope than the current variables

        traverseVars(n, l)
    }
}

// if the node is any of these
// then the node creates a new scope and 
// should be traversed downwards / parent assignments to any children should be made

function createsNewScope(node) {
    return node.type == 'FunctionDeclaration' ||
        node.type == 'FunctionExpression' ||
        node.type == 'ArrowFunctionExpression' ||
        node.type == 'Program' ||
        node.type == 'ExpressionStatement' ||
        node.type == 'IfStatement' || node.type == 'TryStatement';
}

// begin passing through the AST acquired through esprima
passThrough(ast)