#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as inquirer from 'inquirer';
import chalk from 'chalk';
import * as template from './utils/template';
import * as shell from 'shelljs';

const currentDir = process.cwd();
const choices = fs.readdirSync(path.join(__dirname, 'templates'));

export interface CliOptions {
    projectName: string
    templateName: string
    templatePath: string
    tartgetPath: string
}

const questions = [
    {
        name: 'template',
        type: 'list',
        message: 'Which template would you like to use ?',
        choices: choices
    },
    {
        name: 'projectName',
        type: 'input',
        message: 'Please input a new project name: '
    }
];

inquirer.prompt(questions).then(answers => {

    const projectChoice = answers['template'];
    const projectName = answers['projectName'];

    const templatePath = path.join(__dirname, 'templates', projectChoice);
    const tartgetPath = path.join(currentDir, projectName);

    const options: CliOptions = {
        projectName,
        templateName: projectChoice,
        templatePath,
        tartgetPath
    }

    if (!createProject(tartgetPath)) {
        return;
    }

    createDirectoryContents(templatePath, projectName, projectName, projectChoice);
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
function createDirectoryContents(templatePath: string, projectPath: string, projectName: string, projectChoice: string) {

    // Get all files/folders,1 level, from template folder
    const templateFiles = fs.readdirSync(templatePath);

    templateFiles.forEach(file => {

        const origFilePath = path.join(templatePath, file);

        const stats = fs.statSync(origFilePath);

        // skip files/folders that should not be copied
        if (skipFolders.indexOf(file) > -1) return;

        if (stats.isFile()) {

            // read file content and transform it using template engine
            let contents = fs.readFileSync(origFilePath, 'utf8');
            contents = template.render(contents, { projectName: projectPath });

            contents = updateProjectName(contents, projectName, projectChoice); // update project names

            if (file.includes('gitignore') && !file.includes('.gitignore'))         // Replace the name of gitignore with .gitignore. Since .gitignore files get's deleted when package is published
                file = file.replace('gitignore', '.gitignore')

            // copy file to destination folder
            const writePath = path.join(currentDir, projectPath, file);
            fs.writeFileSync(writePath, contents, 'utf8');

        }
        else if (stats.isDirectory()) {

            // create folder in destination folder
            fs.mkdirSync(path.join(currentDir, projectPath, file));

            // copy files/folder inside current folder recursively
            createDirectoryContents(path.join(templatePath, file), path.join(projectPath, file), projectName, projectChoice);
        }
    });

}

function updateProjectName(contents: string, projectName: string, projectChoice: string) {

    return contents.split(projectChoice).join(projectName);      // alternative to replaceAll for compatibility
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