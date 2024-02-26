#!/usr/bin/env node

const process = require('process');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

//======================================================================
// Global variables
//======================================================================
const OUT = 'out';
const INKSCAPE = (process.platform === 'win32') ? 'inkscapecom.com' : 'inkscape';
const SCALE = 0.92;
let debug = false;

//======================================================================
// Helper Routine
//======================================================================
const debug_log = (obj) => {
    if (!!debug) {
        if ((typeof(obj) === 'object') && !Array.isArray(obj)) {
            console.log(JSON.stringify(obj, null, 4));
        } else {
            console.log(obj);
        }
    }
}

//======================================================================
// Shell Emulation Routines
//======================================================================
const directories = [];
const pushd = (dir) => {
    directories.push(process.cwd());
    process.chdir(dir);
};
const popd = () => {
    let dir = directories.pop();
    if (dir) {
        process.chdir(dir);
    }
};

// https://stackoverflow.com/a/31104898/19336104
const termSync = (commandLine) => {
    debug_log(`> ${commandLine}`);
    cp.execSync(commandLine, {stdio: 'inherit'});
};

// Equivalent to `mkdir -p`
const mkdirSync = (dir) => {
    const cwd = process.cwd();
    dir.split(path.sep).forEach((subdir) => {
        if (!fs.existsSync(subdir)) {
            fs.mkdirSync(subdir);
        }
        process.chdir(subdir);
    });
    process.chdir(cwd);
};

const where = (command) => {
    try {
        if (process.platform === 'win32') {
            return cp.execSync(`where ${command}`, {stdio: 'pipe'});
        }
        return cp.execSync(`command -v ${command}`, {stdio: 'pipe'});
    } catch (err) {
        // ignore error
    }
    return undefined;
};

const cmdExist = (command) => {
    return !!where(command);
};

//======================================================================
// Package Manager Handler
//======================================================================
class Pacman {
    constructor() {
        this.name = this.#getPacman();

        // https://www.digitalocean.com/community/tutorials/nodejs-npm-yarn-cheatsheet
        if (this.name === 'yarn') {
            this.cmdMap = {
                'install': 'install',
                'add': 'add'
            };
        } else {
            this.cmdMap = {
                'install': 'install',
                'add': 'install'
            };
        }
    }

    #getPacman = () => {
        // Preference order of package manager:
        // - pnpm
        // - yarn
        // - npm
        // NOTE: Parent process can be queried by using process.env.npm_execpath - to derive package manager.
        //       However, only `npm` defined `npm_command`, need to check if behavior is the same for pnpm.
        // https://stackoverflow.com/a/51793644
        const exec = path.basename(process.env.npm_execpath ?? "", ".exe");

        switch (exec) {
            case "yarn.js":
                return "yarn";
            case "pnpm":
                return "pnpm";
            case "npm-cli.js":
                return "npm";
            default:
                const yarnExist = cmdExist("yarn");
                const pnpmExist = cmdExist("pnpm");
                return fs.existsSync("pnpm-lock.yaml") && pnpmExist
                    ? "pnpm"
                    : fs.existsSync("yarn.lock") && yarnExist
                    ? "yarn"
                    : pnpmExist
                    ? "pnpm"
                    : yarnExist
                    ? "yarn"
                    : "npm";
        }
    };

    install = () => {
        termSync(`${this.name} ${this.cmdMap['install']}`);
    };

    add = (dependency) => {
        termSync(`${this.name} ${this.cmdMap['add']} ${dependency}`);
    };
}

//======================================================================
// Script Entry
//======================================================================
const script = path.basename(__filename);
const timed = `Total time for ${script}`;
console.time(timed);
pushd(__dirname);

// Check dependencies
if (!cmdExist(INKSCAPE)) {
    console.log(`"${INKSCAPE}" is not installed!`);
    console.log('Output will only be in SVG...');
    // process.exit(1);
}

// Prepare default package.json, variable cannot use package as name
let project = {
    name: `${path.basename(script, path.extname(script))}`,
    version: '1.0.0',
    description: 'Primitive single-script (JavaScript) to annotate name into SVG image',
    main: `${script}`,
    scripts: {
        start: 'node .',
    },
    author: `${process.env.USERNAME}`,
    license: 'MIT',
};

// Select package manager
const pacman = new Pacman();

// Prepare new package.json
const packageExist = fs.existsSync('package.json');
if (packageExist) {
    project = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
} else {
    fs.writeFileSync('package.json', JSON.stringify(project, null, 4));
}

// Make sure dependencies are added, whether its new or started from single file.
const addDependencies = !project.hasOwnProperty('dependencies');
if (addDependencies || !project.dependencies.hasOwnProperty('jsdom')) {
    pacman.add('jsdom');
}
if (addDependencies || !project.dependencies.hasOwnProperty('yargs')) {
    pacman.add('yargs');
}

// Load package.json if it exist originally
if (packageExist) {
    pacman.install();
}

//======================================================================
// Parse args
//======================================================================
// Ignore first 2 arguments <node exetubale> and <script>
const argv = require('yargs')(process.argv.slice(2))
    .usage('Usage: node $0 -n [name] -t [template]')
    .alias('v', 'version')
    .example('node $0 -n "Misaka Mikoto"', 'Annotates template.svg (default template SVG) with "Misaka Mikoto"')
    // Name(s)
    .default('n', 'names.txt')
    .alias('n', 'name')
    .nargs('n', 1)
    .describe('n', 'Load a name or a file')
    // Template SVG
    .default('t', 'template.svg')
    .alias('t', 'template')
    .nargs('t', 1)
    .describe('t', 'template SVG file to be annotated')
    // Font
    .default('font-style', 'cmmi10')
    .nargs('font-style', 1)
    .describe('font-style', 'Font style for the name(s), need to make sure inkscape recognize this')
    .default('font-size', 14)
    .nargs('font-size', 1)
    .describe('font-size', 'Font size for the name(s)')
    .default('font-scale', 0.92)
    .nargs('font-scale', 1)
    .describe('font-scale', 'Font scale for the name(s)')
    .hide('font-scale')
    // debug
    .boolean('debug')
    .alias('d', 'debug')
    // help
    .help('h')
    .alias('h', 'help')
    .argv;

debug = !!argv.debug;
const template = argv.template;
const name = argv.name;
if (path.extname(name) && !fs.existsSync(name)) {
    console.log(`${name} does not exist!`);
    process.exit(2);
}
const names = fs.existsSync(name) ?
    fs.readFileSync('names.txt', 'utf-8').replace('\r', '\n').replace('\n\n', '\n').split('\n') :
    [name];

debug_log(pacman);
debug_log(argv);

// Install dependencies
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const annotate = (name, data) => {
    // Convert file to DOM and get elements for modifications
    const dom = new JSDOM(data, { contentType: 'image/svg+xml' });

    // Get svg selector
    let svg = dom.window.document.querySelector('svg');
    svg = dom.window.document.getElementById(svg.id);
    const width = svg.getAttribute('width');
    const height = svg.getAttribute('height');

    // Create text selector
    // https://stackoverflow.com/a/13229110/19336104
    const text = dom.window.document.createElement('text', '');

    // Populate text selector
    let id = 'text';
    {
        let i = 0;
        do {
            i++;
            id = `text${i}`;
        } while (!!dom.window.document.getElementById(`${id}`));
        text.setAttribute('id', id);
        text.setAttribute('xml:space', 'preserve');
        text.setAttribute('style', `font-style:normal;font-weight:normal;font-size:${argv.fontSize}px;line-height:1.25;font-family:${argv.fontStyle};letter-spacing:0px;word-spacing:4px;fill:#000000;fill-opacity:1;stroke:none;stroke-width:0.75094575`);
        text.setAttribute('y', '214.18192');

        // Lastly approximate x position
        const x = (Number(width) - (name.length * argv.fontSize * argv.fontScale)) / 2;
        text.setAttribute('x', `${x}`);
    }

    // Update Text Content
    text.textContent = name;

    svg.appendChild(text);

    // Modify filename
    const file = name.replace(/\s/g, '').replace('\&', '');
    const svg_file = file + '.svg';
    svg.setAttribute('sodipodi:docname', svg_file);

    // Write to file
    // Strangely, xmlns attribute will be automatically added after appendChild, remove it before writing to file.
    console.log(`Anotating "${name}" to ${template}`);
    fs.writeFileSync(path.join(OUT, svg_file), dom.serialize().replace(' xmlns=""', ''), 'utf8');

    // Use inkscape to convert to PNG
    if (cmdExist(INKSCAPE)) {
        ///@todo need to check for inkscape version, older versions does not have --actions
        //       or if argument options exists in --help
        // inkscape action guide
        // https://graphicdesign.stackexchange.com/a/161009
        // https://inkscape.org/forums/beyond/inkscape-12-actions-list/
        termSync(`${INKSCAPE} --actions="select-by-id:${id};object-align:hcenter page;export-filename:${path.join(OUT, svg_file)};export-do" ${path.join(OUT, svg_file)}`);

        // export to PNG
        termSync(`${INKSCAPE} ${path.join(OUT, svg_file)} --export-type=png --export-filename=${path.join(OUT, file + '.png')}`);
    }
};

// Make output directory
mkdirSync(OUT);

// Anotate names into SVG
const data = fs.readFileSync(template, 'utf8');
names.forEach((name) => {
    if (!name.startsWith('#')) {
        annotate(name, data);
    }
});

popd();

console.timeEnd(timed);

process.exit(0);