import * as vscode from 'vscode';
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

export interface Reference {
    class: string;
    method: string;
    argumentNumber: number;
};

export class ReferenceParser {
    public async isInPositionForCompletion(
        document: vscode.TextDocument,
        position: vscode.Position,
        autocompleteReferences: Reference[]
    ) {
        const callAst = this.getLastCall(this.parse(document.getText()), position);

        if (!callAst) {
            return false;
        }

        const callWhat = callAst.what;

        if (!this.isPropertyLookup(callWhat)) {
            return false;
        }

        const callIdentifier = callWhat.offset;

        if (!this.isIdentifier(callIdentifier)) {
            return false;
        }

        const callIdentifierLoc = callIdentifier.loc;

        if (!callIdentifierLoc) {
            return false;
        }

        const callPosition = this.phpParserLocationToVsCodePosition(callIdentifierLoc.start);
        const callClasses = await this.resolveReference(document, callPosition);

        if (callClasses === null || callClasses.length === 0) {
            return false;
        }

        const argumentNumber = callAst.arguments.findIndex((argument) => {
            if (argument.loc === null) {
                return false;
            }

            if (!this.isString(argument)) {
                return false;
            }

            return this.vsCodePositionInPhpParserNode(argument, position);
        });

        if (argumentNumber === -1) {
            return false;
        }

        const methodName = callIdentifier.name;

        return autocompleteReferences.some((autocompleteReference) => {
            for (let index = 0; index < callClasses.length; index++) {
                const callClass = callClasses[index];

                if (
                    autocompleteReference.class === callClass
                    && methodName === autocompleteReference.method
                    && argumentNumber === autocompleteReference.argumentNumber
                ) {
                    return true;
                }
            }

            return false;
        });
    }

    private async resolveReference(document: vscode.TextDocument, callPosition: vscode.Position): Promise<string[] | null> {
        const definitions = await vscode.commands.executeCommand<vscode.LocationLink[]>(
            'vscode.executeDefinitionProvider',
            document.uri,
            callPosition
        );

        if (definitions.length === 0) {
            return null;
        }

        const classes = [];

        for (let i = 0; i < definitions.length; i++) {
            const definition = definitions[i];
            const documentSymbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                definition.targetUri
            );
            let namespace = '';

            for (let j = 0; j < documentSymbols.length; j++) {
                const documentSymbol = documentSymbols[j];

                if (documentSymbol.kind === vscode.SymbolKind.Namespace) {
                    namespace = documentSymbol.name;
                    namespace += namespace ? "\\" : "";
                }

                if (
                    documentSymbol.kind === vscode.SymbolKind.Class
                    && documentSymbol.range.contains(definition.targetRange)
                ) {

                    classes.push(namespace + documentSymbol.name);
                }
            }
        }

        return classes;
    }

    private parse(code: string): phpParser.Program {
        return parser.parseEval(code.replace("<?php", ""));
    }

    private getLastCall(ast: phpParser.Node, position: vscode.Position): phpParser.Call | null {
        let lastCallAst: phpParser.Call | null = null;

        const lastAstCallFinder = (node: phpParser.Node) => {
            if (this.vsCodePositionInPhpParserNode(node, position) && this.isCall(node)) {
                try {
                    lastCallAst = node;
                } catch (err) {
                    console.error(node);
                }
            }

            try {
                Object.entries(node).forEach(([_, childNode]) => {
                    if (node instanceof Object) {
                        try {
                            lastAstCallFinder(childNode);
                        } catch (err) { }
                    }
                });
            } catch (err) { }
        };

        lastAstCallFinder(ast);

        return lastCallAst;
    }

    public vsCodePositionInPhpParserNode(ast: phpParser.Node, position: vscode.Position): boolean {
        const astLocation = ast.loc;

        if (!astLocation) {
            return false;
        }

        const range = new vscode.Range(
            this.phpParserLocationToVsCodePosition(astLocation.start),
            this.phpParserLocationToVsCodePosition(astLocation.end)
        );

        return range.contains(position);
    }

    public phpParserLocationToVsCodePosition(position: phpParser.Position): vscode.Position {
        return new vscode.Position(position.line - 1, position.column);
    }

    public isPropertyLookup(node: phpParser.Node): node is phpParser.PropertyLookup {
        return node.kind === 'propertylookup';
    }

    public isIdentifier(node: phpParser.Node): node is phpParser.Identifier {
        return node.kind === 'identifier';
    }

    public isCall(node: phpParser.Node): node is phpParser.Call {
        return node.kind === 'call';
    }

    public isString(node: phpParser.Node): node is phpParser.String {
        return node.kind === 'string';
    }
}
