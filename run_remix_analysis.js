#!/usr/bin/env node

'use strict'

var StaticAnalysisRunner = require('remix-solidity').CodeAnalysis
var fs = require('fs')
const { spawn } = require( 'child_process' )

const secuMods = [0, 3, 6, 7, 8, 9, 11] //index of security analysis moduls
const gasMods = [1, 2]
const miscMods = [4, 5, 10, 12]

function parseLocation(str){
    if(str == undefined)
        return undefined;

    var tokens = str.split(':')
    return {
        start: parseInt(tokens[0]),
        length: parseInt(tokens[1]),
        file: tokens[2],
    }
}

function positionToLineNum(content, pos){
    var line = 1;
    for(var i = 0; i < pos; ++i){
        if(content[i] == '\r')
            line++;
        else if(content[i] == '\n' && i > 0 && content[i-1] != '\r')
            line++;

    }
    return line;
}

function analyze(compileOutput, content, isStatOnly){

    if(!compileOutput){
        console.log('No compiled AST available');
        return;
    }

    var runner = new StaticAnalysisRunner()
    runner.run(compileOutput, secuMods, function (results) {
        results.map(function (result, i) {
            console.log(result.name + result.report.length)

            if(isStatOnly)
                return;

            //detail information
            result.report.map(function (item, j) {
                if(j == 0)
                    console.log(' ====================================');
                else
                    console.log(' ------------------------------------');

                var prefix = ` ${result.name}[${j}]`;

                console.log(` ${prefix} warning: ${item.warning}`);
                console.log(` ${prefix} more: ${item.more}`);

                var loc = parseLocation(item.location);
                if(loc == undefined)
                    console.log(` ${prefix} location: NA`);
                else{
                    console.log(` ${prefix} location: line ${positionToLineNum(content, loc.start)}`)
                    var code = content.substring(loc.start, loc.start + loc.length);
                    console.log(` ${prefix} code: ${code}`);
                }

            })
            console.log('');
        })
    })
}

function genCompileSettings(content){

    var obj = {
        "language": "Solidity",
        "sources": {
            srcFile: {
                "content": content
            }
        },
        "settings": {
            "optimizer": {
                "enabled": false,
                "runs": 200
            },
            "outputSelection": {
                "*": {
                    "": [ "legacyAST" ],
                    "*": [ "abi", "metadata", "devdoc", "userdoc", "evm.legacyAssembly", "evm.bytecode", "evm.deployedBytecode", "evm.methodIdentifiers", "evm.gasEstimates" ]
                }
            }
        }
    }

    return obj
}

function doCmd(cmd, args, settings, callback){

    var proc = spawn(cmd, ['--standard-json'])

    var stdout = ''
    proc.stdout.on('data', function (data) {
        stdout += data
    });

    var stderr = ''
    proc.stderr.on('data', function (data) {
        stderr += data
    });

    proc.on('exit', function (code) {
        callback(code, stderr, stdout);
    });

    // feed input
    proc.stdin.write(settings)   //settings is inputed from STDIN
    proc.stdin.end()
}

function CompileException(code, message) {
    this.code = code;
    this.message = message;
    this.toString = function(){
        return this.code + ": " + this.message;
    }
}

function compile(content, analyzer){

    var settings = genCompileSettings(content)

    var solc = doCmd('solc', ['--standard-json'], JSON.stringify(settings), (code, stderr, stdout) => {

        if(code != 0 || stderr){
            console.log(`run solc error (${code}): ${stderr}`);
            throw new CompileException(code, stderr);
        }

        var compileResult = JSON.parse(stdout)

        //analyze
        analyzer(compileResult);
    })
}
 
function indexOf(arr, val){
    for(var i = 0; i < arr.length; ++i){
        if(arr[i] == val)
            return i;
    }
    return -1;
}

function extractBoolArg(argv, optName){
    var idx = indexOf(argv, optName);
    if(idx < 0)
        return false;
    else{
        argv.splice(idx, 1);
        return true;
    }
}

function extractArgAtPos(argv, pos){
    if(pos < 0)
        pos += argv.length;

    var arg = argv[pos];
    argv.splice(pos, 1);
    return arg;
}
 
function main(argv){

    var isStatOnly = extractBoolArg(argv, '--stat-only');

    // get optoins
    if(argv.length != 3){  // [0]: node, [1]: the js file, [2]: src file
        console.log("usage: node run_remix_analysis.js [--stat-only] <sol>")
        return 1
    }

    var srcFile = extractArgAtPos(argv, -1);
    var content = fs.readFileSync(srcFile, 'utf8');

    compile(content, (compileResult) => analyze(compileResult, content, isStatOnly));
}

main(process.argv);

