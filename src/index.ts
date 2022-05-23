#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as inquirer from 'inquirer';
import chalk from 'chalk';
import * as template from './utils/template';
import * as shell from 'shelljs';

const CURRENT_DIR = process.cwd();
const CHOICES = fs.readdirSync(path.join(__dirname, 'templates'));
const DEFAULT_USER_NAME = 'afraj-attar';

export interface CliOptions {
    projectName: string;
    projectPath: string;
    templateName: string;
    templatePath: string;
    tartgetPath: string;
    userName: string;
}

const questions = [
    {
        name: 'template',
        type: 'list',
        message: 'Which template would you like to use ?',
        choices: CHOICES
    },
    {
        name: 'projectName',
        type: 'input',
        message: 'Please input a new project name: '
    },
    {
        name: 'userName',
        type: 'input',
        message: 'Please enter your github user name(Used for Publishing): '
    }
];

inquirer.prompt(questions).then(answers => {

    const projectChoice = answers['template'];
    const projectName = answers['projectName'];
    const userName = answers['userName'];

    const templatePath = path.join(__dirname, 'templates', projectChoice);
    const tartgetPath = path.join(CURRENT_DIR, projectName);

    const options: CliOptions = {
        projectName,
        userName,
        templatePath,
        tartgetPath,
        projectPath: projectName,
        templateName: projectChoice,
    }

    if (!createProject(tartgetPath)) {
        return;
    }

    createDirectoryContents(options);
    postProcess(options);

});

function createProject(projectPath: string) {
    if (fs.existsSync(projectPath)) {
        console.log(chalk.red(`Folder ${projectPath} exists. Delete or use another name.`));
        return false;
    }
    fs.mkdirSync(projectPath);

    return true;
}

const skipFolders = ['node_modules'];
function createDirectoryContents(options: CliOptions) {

    // Get all files/folders,1 level, from template folder
    const templateFiles = fs.readdirSync(options.templatePath);

    templateFiles.forEach(file => {

        const origFilePath = path.join(options.templatePath, file);

        const stats = fs.statSync(origFilePath);

        // skip files/folders that should not be copied
        if (skipFolders.indexOf(file) > -1) return;

        if (stats.isFile()) {

            // read file content and transform it using template engine
            let contents = fs.readFileSync(origFilePath, 'utf8');
            contents = template.render(contents, { projectName: options.projectPath });

            if (contents.includes(options.templateName))
                contents = replaceAll(contents, options.templateName, options.projectName); // update project names

            if (contents.includes(DEFAULT_USER_NAME))
                contents = replaceAll(contents, DEFAULT_USER_NAME, options.userName); // update user name

            if (file.includes('gitignore') && !file.includes('.gitignore'))         // Replace the name of gitignore with .gitignore. Since .gitignore files get's deleted when package is published
                file = file.replace('gitignore', '.gitignore')

            // copy file to destination folder
            const writePath = path.join(CURRENT_DIR, options.projectPath, file);
            fs.writeFileSync(writePath, contents, 'utf8');

        }
        else if (stats.isDirectory()) {

            // create folder in destination folder
            fs.mkdirSync(path.join(CURRENT_DIR, options.projectPath, file));

            const newOptions: CliOptions = {
                ...options,
                templatePath: path.join(options.templatePath, file),
                projectPath: path.join(options.projectPath, file),
            }

            // copy files/folder inside current folder recursively
            createDirectoryContents(newOptions);
        }
    });

}

function replaceAll(contents: string, searchValue: string, replaceValue: string) {

    return contents.split(searchValue).join(replaceValue);      // alternative to replaceAll for compatibility
}

function postProcess(options: CliOptions) {
    const isNode = fs.existsSync(path.join(options.templatePath, 'package.json'));
    if (isNode) {
        shell.cd(options.tartgetPath);
        const result = shell.exec('npm install');
        if (result.code !== 0) {
            return false;
        }
    }

    return true;
}