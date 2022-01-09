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
        templateReferences: Reference[]
    ) {
        const rootAst = this.parse(document.getText());

        this.inCall(rootAst, position);
        const treeAst = this.getCalls();

        const lastAst = treeAst[treeAst.length - 1];

        if (!this.isString(lastAst)) {
            return false;
        }

        const callAst = treeAst[treeAst.length - 2];

        if (!this.isCall(callAst)) {
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

        const callPosition = this.locationToVsCodePosition(callIdentifierLoc.start);


        const callClasses = await this.resolveReference(document, callPosition);


        if (callClasses === null || callClasses.length === 0) {
            return false;
        }

        if (callAst.arguments.length < 1) {
            return false;
        }

        const argumentNumber = callAst.arguments.findIndex((argument) => {
            if (argument.loc === null) {
                return false;
            }

            if (!this.isString(argument)) {
                return false;
            }

            return this.inRanger(argument, position);
        });

        if (argumentNumber === -1) {
            return false;
        }

        const methodName = callIdentifier.name;

        return templateReferences.some((templateReference) => {
            for (let index = 0; index < callClasses.length; index++) {
                const callClass = callClasses[index];

                if (
                    templateReference.class === callClass
                    && methodName === templateReference.method
                    && argumentNumber === templateReference.argumentNumber
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

        for (let index = 0; index < definitions.length; index++) {
            const definition = definitions[index];

            const documentSymbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>('vscode.executeDocumentSymbolProvider', definition.targetUri);
            let namespace = '';

            for (let j = 0; j < documentSymbols.length; j++) {
                const documentSymbol = documentSymbols[j];

                if (documentSymbol.kind === vscode.SymbolKind.Namespace) {
                    namespace = documentSymbol.name;
                    namespace += namespace ? "\\" : "";
                }

                if (documentSymbol.kind === vscode.SymbolKind.Class) {
                    classes.push(namespace + documentSymbol.name);
                }
            }
        }

        return classes;
    }


    private calls: phpParser.Node[] = [];
    private parse(code: string): phpParser.Program {
        return parser.parseEval(code.replace("<?php", ""));
    }

    private getCalls(): phpParser.Node[] {
        return this.calls;
    }

    private inCall(ast: phpParser.Node, position: vscode.Position) {
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

        const range = new vscode.Range(
            this.locationToVsCodePosition(astLocation.start),
            this.locationToVsCodePosition(astLocation.end)
        );

        return range.contains(position);
    }

    public locationToVsCodePosition(position: phpParser.Position): vscode.Position {
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
