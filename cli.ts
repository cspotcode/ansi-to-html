#!/usr/bin/env node
import AnsiUp from 'ansi_up';
import {Command, Cli, Builtins, Usage, Option} from 'clipanion';
import { writeFileSync, readFileSync } from 'fs';
import * as assert from 'assert';
import * as getStdin from 'get-stdin';
import {outdent} from 'outdent';

const binaryName = 'ansi-to-html';

// came from https://windowsterminalthemes.dev/
import * as allThemesJson from './themes.json';
const defaultThemeName = 'DimmedMonokai';

function o(strings: TemplateStringsArray, ...values: Array<any>) {
    return outdent(strings, ...values).replace(/\n/g, ' ');
}

class ConvertAnsiToHtml extends Command {
    static paths = [Command.Default];
    static usage: Usage = {
        description: 'Render ANSI console formatting into HTML',
        examples: [
            [
                `Render from file to file`,
                `${binaryName} command-log.txt command-log.html`
            ],
            [
                `Render from stdin to stdout`,
                `complex-command | ${binaryName} > output.html`
            ]
        ]
    }

    input = Option.String({required: false});
    output = Option.String({required: false});
    themeName = Option.String('--theme', {
        required: false,
        description: o `
            Specify color theme by name.  Use --list-themes to see a list of all themes.
            Themes come from https://windowsterminalthemes.dev/
            Default: MonokaiDimmed
        `
    });
    openInNewTabLink = Option.Boolean('--open-in-new-tab-link', {
        description: o `
            Add a link to the top of the page which will open the same file in a new browser tab.  Useful when
            you know the report will be rendered in an iframe and you want to offer an easy way to link to it directly.`
    });
    disablePerLineAnchors = Option.Boolean('--no-per-line-anchors', {
        description: o `
            Add clickable anchors so you can click any line in the file and get a link to that line number.  Useful for
            sharing a link to a specific line number in the log.
        `
    });
    listThemes = Option.Boolean('--list-themes', {
        description: o `
            Lists the names of all themes, then exits.
        `
    });

    async execute() {
        if(this.listThemes) {
            console.log([...themes.values()].map(t => t.name).join('\n'));
            return;
        }
        const inputText = this.input === undefined ? await getStdin() : readFileSync(this.input, 'utf8');
        this.themeName = this.themeName ?? defaultThemeName;
        const theme = themes.get(this.themeName);
        assert(theme, `No such theme ${ this.themeName }`);
        const formatter = new AnsiUp();
        formatter.use_classes = true;
        // format every line in isolation, allowing us to wrap each line in extra markup if necessary
        let formatted = inputText.split('\n').map((line, i) => {
            let formattedLine = formatter.ansi_to_html(line);
            if(!this.disablePerLineAnchors) {
                formattedLine = `<div class="line-wrapper" id="L${i + 1}">${formattedLine}</div>`;
            }
            return formattedLine;
        }).join(this.disablePerLineAnchors ? '\n' : '');
        const openInNewTabHtml = this.openInNewTabLink ? outdent `
            <p class="new-tab-link-wrap"><a id="open-in-new-tab-link" target="_blank">Open in new tab</a></p>
            <script type="text/javascript">
                document.getElementById('open-in-new-tab-link').setAttribute('href', window.location.href);
            </script>
        ` : ``;
        const outputText = `
        <html>
            <head>
                <style type="text/css">
                body {
                    margin: 0;
                    padding: 0;
                }
                .new-tab-link-wrap {
                    margin: 0;
                    padding: 15px;
                }
                .output {
                    margin: 0;
                    padding: 15px;
                    padding: 15px;
                    font-family: monaco, "Courier New", Courier, monospace;
                    /*line-height: 1.3;*/
                    line-height: 20px;
                    font-size: 14px;
                }
                .highlighted {
                    background: rgba(255, 255, 255, 0.2);
                }

                ${ themeToCss(theme) }
                </style>
                <script
                    src="https://code.jquery.com/jquery-3.6.0.slim.min.js"
                    integrity="sha256-u7e5khyithlIdTpu22PHhENmPcRdFiHRjhAuHcs05RI="
                    crossorigin="anonymous"></script>
            </head>
            <body class="${ themeToCssClassName(theme) }">
                ${ openInNewTabHtml }
                <pre class="output"><code>${ formatted }</code></pre>
                <script type="text/javascript">
                    highlightLinkedLine();
                    $(document).on('click', '.line-wrapper', evt => {
                        window.location.hash = evt.currentTarget.getAttribute('id');
                        highlightLinkedLine();
                    });
                    function highlightLinkedLine() {
                        const line = parseInt(window.location.hash.replace(/^#/, '').replace(/^L/, ''));
                        if(line > 0) {
                            $('.highlighted').removeClass('highlighted');
                            $('#L' + line).addClass('highlighted');
                        }
                    }
                </script>
            </body>
        </html>
        `;
        if(this.output === undefined) {
            this.context.stdout.write(outputText);
        } else {
            writeFileSync(this.output, outputText);
        }
    }
}

type Theme = typeof allThemesJson[0];
allThemesJson;
const themes = new Map((allThemesJson as Theme[]).map(theme => [theme.name, theme]));

function themeToCssClassName(theme: Theme) {
    return theme.name.replace(/ /g, '-');
}
function themeToCss(theme: Theme) {
    let acc = '';
    const className = themeToCssClassName(theme);
    // default foreground and background
    acc += `
        .${ className } .output {
            background: ${theme.background};
        }
        .${ className } .output code {
            color: ${theme.foreground};
            background-color: ${theme.background};
        }
    `;
    for(const [name, color] of Object.entries(theme)) {
        if(['name', 'selectionBackground', 'cursorColor', 'foreground', 'background'].includes(name)) continue;
        acc += `
            .${ className } .ansi-${ name.replace(/bright(.)/, ($0, $1) => `bright-${$1.toLowerCase()}`) }-bg { background-color: ${color}; }
            .${ className } .ansi-${ name.replace(/bright(.)/, ($0, $1) => `bright-${$1.toLowerCase()}`) }-fg { color: ${color}; }
        `;
    }
    return acc;
}

const cli = new Cli({
    binaryLabel: binaryName,
    binaryName,
    binaryVersion: require('./package').version
});
cli.register(ConvertAnsiToHtml);
cli.register(Builtins.HelpCommand);
cli.register(Builtins.VersionCommand);
cli.runExit(process.argv.slice(2), Cli.defaultContext);
