esprima = require('esprima');
const fs = require('fs')
const readlineSync = require('readline-sync');

// Get user input for the file path
const filePath = readlineSync.question('Enter the file path: ');

// used to take identifiers found in functions through scan(), and determine whether or not they are using connection.escape() to break strings,
// and also to find any other identifiers that are being concatenated that may not be handled properly

// keeps track of which function is which
const functionBodies = new Map();
funcId = 0

// read in file, see if exists
try {
    fs.accessSync(filePath, fs.constants.F_OK);
    const data = fs.readFileSync(filePath, 'utf-8').toString();

    parsed = esprima.parseScript(data)
    console.log('File exists.');
    traverse(parsed, -1)
} catch (err) {
    console.error('Error reading file:', err);
}

function analyze(val, curFunc) {
    // FIND ALL IDENTIFIERS ASSOCIATED WITH SINGLE QUERY CALL
    var all_identifiers = []

    function scan(node) {
        if (node.type == 'Literal') {

            //console.log('Literal: ' + node.value)

            const regex = /\${(.*?)}/g;
            const matches = node.raw.match(regex);

            if (matches) {
                const identifiers = matches.map(match => match.substring(2, match.length - 1));

                all_identifiers = all_identifiers.concat(identifiers)
            }
        } else if (node.type == 'Identifier') {
            //console.log('Identifier Name: ' + node.name + " | curFunc: " + curFunc)
            all_identifiers.push(node.name)
        } else if (node.type == 'BinaryExpression') {
            //console.log('BinaryExpression: ')
            scan(node.left)
            scan(node.right)
        } else if (node.type == 'CallExpression') {
            if (node.callee.property && val.callee.property.type == 'Identifier') {
                if (node.callee.property.name != 'escape') {
                    all_identifiers.push(node.arguments[0].name)
                } else {
                    if (node.arguments[0].type == 'Identifier') {
                        console.log('Found escaped:', node.arguments[0].name)

                        all_identifiers = all_identifiers.filter(e => e !== node.arguments[0].name); // remove instances of escaped identifiers
                    } else if (node.arguments[0].type == 'MemberExpression' && node.arguments[0].property) {
                        console.log('Found escaped:', node.arguments[0].property.name)
                    }
                }
            } else if (node.arguments[0]) {
                all_identifiers.push(node.arguments[0].name)
            }
        } else if (node.type == 'TemplateLiteral') {
            //console.log(node)
            for (var i = 0; i < node.expressions.length; i++) {
                var exp = node.expressions[i]

                if (exp.type != 'MemberExpression') {
                    if (!all_identifiers.includes(exp.name))
                        all_identifiers.push(exp.name)

                } else {
                    if (!all_identifiers.includes(exp.property.name))
                        all_identifiers.push(exp.property.name)
                }
            }
        }
    }

    if (val.type == 'CallExpression') {
        if (val.callee.property && val.callee.property.type == 'Identifier') {
            var name = val.callee.property.name;

            if (name == 'execute' || name == 'query') {
                scan(val.arguments[0])
            } else if (name == 'createConnection') {
                for (var i = 0; i < val.arguments[0].properties.length; i++) {
                    var prop = val.arguments[0].properties[i]

                    if (prop.key.name == 'multipleStatements' && (prop.value.value == true || prop.value.value == 'true')) {
                        console.log("VULNERABILITY FOUND: Multiple statements is enabled.\n")
                    }
                }
            }
        }
    }

    if (all_identifiers.length != 0) {
        name = ''
        if (all_identifiers.length == 1) name = all_identifiers[0]

        console.log(`Found a query statement ${name}`)

        if (functionBodies.has(curFunc)) {
            var body = functionBodies.get(curFunc).body

            function parseBody(body) {
                if (!body) return;
                for (var i = body.length - 1; i >= 0; i--) {
                    var elem = body[i]

                    if (elem.type == 'VariableDeclaration') {

                        //console.log(elem.type)
                        for (var id in all_identifiers) {
                            var iden = all_identifiers[id]

                            if (iden == elem.declarations[0].id.name) {
                                scan(elem.declarations[0].init)
                            }
                        }
                    } else if (elem.type == 'IfStatement') {
                        parseBody(elem.consequent.body)
                    }
                }
            }
            parseBody(body)
        }

        if (all_identifiers.length > 1) {
            console.log('The following identifiers have not been escaped:')
            console.log(all_identifiers.slice(1), "\n")
        } else {
            console.log("No issues found")
        }
    }
}


function traverse(node, curFunc = -1) {

    for (var key in node) {
        if (node.hasOwnProperty(key)) {
            var child = node[key];
            if (typeof child === 'object' && child !== null) {
                if (Array.isArray(child)) {
                    child.forEach(function (node) {
                        if (node.type == 'FunctionExpression' || node.type == 'ArrowFunctionExpression') {
                            if (curFunc == -1) {

                                functionBodies.set(funcId, node.body)
                                curFunc = funcId
                                funcId++
                            }
                        }

                        analyze(child, curFunc)
                        traverse(node, curFunc);
                    });
                } else {
                    analyze(child, curFunc)
                    traverse(child, curFunc);
                }
            }
        }
    }
}