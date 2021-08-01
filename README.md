## ansi-to-html

CLI tool to convert ANSI colored text to an HTML file, with a few extra features to support my team's use-case.

We use it to generate pretty reports of subsets of automated CI tasks.  Although CI servers are good at recording and
visualizing build logs, sometimes it is helpful to upload the output of a single command separately as a build artifact
for easier review.

### Features

There are other tools like this one.  This tool has a few features they may not have:

* 277 color themes, so you do not need to specify an array of color values manually.
* "Open in new tab" link in the HTML, useful when CI systems show the HTML embedded in an iframe and you want to easily
pop into a new tab.
* Link to a specific line in a log, `#L123`-style like Github.  Click any line, JS adds that line-number to the URL, you can copy a link to it.

### Usage

```
❯ ansi-to-html --help
```

```
Render ANSI console formatting into HTML

━━━ Usage ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$ ansi-to-html [input] [output]

━━━ Options ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  --theme #0                Specify color theme by name.  Use --list-themes to see a list of all themes. Themes come from https://windowsterminalthemes.dev/ Default: MonokaiDimmed
  --open-in-new-tab-link    Add a link to the top of the page which will open the same file in a new browser tab.  Useful when you know the report will be rendered in an iframe and you want to offer an easy way to link to it directly.
  --no-per-line-anchors     Add clickable anchors so you can click any line in the file and get a link to that line number.  Useful for sharing a link to a specific line number in the log.
  --list-themes             Lists the names of all themes, then exits.

━━━ Examples ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Render from file to file
  $ ansi-to-html command-log.txt command-log.html

Render from stdin to stdout
  $ complex-command | ansi-to-html > output.html
```

### Examples

[Here is the output of `git status`](https://cspotcode.github.io/ansi-to-html/examples/git-status.html) while I was working on this project:

```
❯ git -c color.status=always status | ansi-to-html > examples/git-status.html
```
