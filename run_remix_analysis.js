#!/usr/bin/env node

'use strict'

var StaticAnalysisRunner = require('remix-solidity').CodeAnalysis
var fs = require('fs')
const { spawn } = require( 'child_process' )

const secuMods = [0, 3, 6, 7, 8, 9, 11] //index of security analysis moduls
const gasMods = [1, 2]
const miscMods = [4, 5, 10, 12]

function analyze(compileOutput, isStatOly){
    if(compileOutput){
        var runner = new StaticAnalysisRunner()
        runner.run(compileOutput, secuMods, function (results) {
            results.map(function (result, i) {
                console.log(result.name + result.report.length)
                //each location
                if(!isStatOly){
                    result.report.map(function (item, i) {
                        console.log(`  [${i}] location: ${item.location}`);
                        console.log(`  [${i}] more: ${item.more}`);
                        console.log(`  [${i}] warning: ${item.warning}`);
                    })
                }
            /*
            if (item.location !== undefined) {
                var split = item.location.split(':')
                    var file = split[2]
                    location = {
                        start: parseInt(split[0]),
                        length: parseInt(split[1])
                    }
                location = self.appAPI.offsetToLineColumn(location, file)
                    location = Object.keys(self.lastCompilationResult.contracts)[file] + ':' + (location.start.line + 1) + ':' + (location.start.column + 1) + ':'
            }
            */
            })
        })
    } else {
        console.log('No compiled AST available')
    }
}

function getCompileInput(srcFile){

    var content = fs.readFileSync(srcFile, 'utf8')
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

function doCmd(cmd, args, stdin, callback){

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
    proc.stdin.write(stdin)
    proc.stdin.end()
}
 
// get optoins
var isStatOly
var srcFile
if(process.argv.length == 3){
    isStatOly = false
    srcFile = process.argv[2]
}
else if(process.argv.length == 4 && process.argv[2] == '--stat-only'){
    isStatOly = true
    srcFile = process.argv[3]
}
else{
    console.log("usage: node run_remix_analysis.js [--stat-only] <sol>")
    return 1
}

var compileInput = getCompileInput(srcFile)

var solc = doCmd('solc', ['--standard-json'], JSON.stringify(compileInput), (code, stderr, stdout) => {

    if(code != 0 || stderr){
        console.log(`run solc error (${code}): ${stderr}`)
        return;
    }
    //get compile output
    var compileOutput = JSON.parse(stdout)
    //analyze
    analyze(compileOutput, isStatOly)
})

//run
/*
var solc = exec('solc --standard-json', {maxBuffer: 1024 * 1024 * 2}, (err, stdout, stderr) => {
      if (err) {
          console.log("run solc error: " + err)
          return
      }
      //get compile output
      var compileOutput = JSON.parse(stdout)
      //analyze
      analyze(compileOutput, isStatOly)
})
solc.stdin.write(JSON.stringify(compileInput))
solc.stdin.end()
*/
