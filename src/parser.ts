const engine = require("php-parser");
import * as vscode from 'vscode';
import { Call } from "php-parser";
import * as phpParser from 'php-parser';

const parser = new phpParser.Engine({
    parser: {
        extractDoc: true,
        php7: true,
    },
    ast: {
        withPositions: true,
        withSource: true,
    },
});

export default class ReferenceParser {
    private calls: phpParser.Node[] = [];
    public parse(code: string): phpParser.Program {
        return parser.parseEval(code.replace("<?php", ""));
    }

    public getCalls(): phpParser.Node[] {
        return this.calls;
    }
    public inCall(ast: phpParser.Node, position: vscode.Position) {

        if (this.inRanger(ast, position)) {
            try {
                this.calls.push(ast);
            } catch (err) {
                console.error(ast);
            }
        }

        try {
            Object.entries(ast).forEach(([_, node]) => {
                if (node instanceof Object) {
                    try {
                        this.inCall(node, position);
                    } catch (err) { }
                }
            });
        } catch (err) { }
    }

    public isCall(node: phpParser.Node): node is phpParser.Call {
        return node.kind === 'call';
    }

    public inRanger(ast: phpParser.Node, position: vscode.Position): boolean {
        const astLocation = ast.loc;

        if (!astLocation) {
            return false;
        }

        const range =new vscode.Range(
            this.locationToVsCodePosition(astLocation.start),
            this.locationToVsCodePosition(astLocation.end)
        );

        return range.contains(position);
    }

    public locationToVsCodePosition(position : phpParser.Position): vscode.Position
    {
        return new vscode.Position(position.line - 1, position.column);
    }

    public isPropertyLookup(node: phpParser.Node): node is phpParser.PropertyLookup {
        return node.kind === 'propertylookup';
    }

    public isIdentifier(node: phpParser.Node): node is phpParser.Identifier {
        return node.kind === 'identifier';
    }

    public isString(node: phpParser.Node): node is phpParser.String {
        return node.kind === 'string';
    }
}
