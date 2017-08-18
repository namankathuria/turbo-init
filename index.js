#!/usr/bin/env node

var inquirer    = require('inquirer');
var chalk       = require('chalk');
var clear       = require('clear');
var CLI         = require('clui');
var figlet      = require('figlet');
var Preferences = require('preferences');
var Spinner     = CLI.Spinner;
var GitHubApi   = require('github');
var _           = require('lodash');
var git         = require('simple-git')();
var touch       = require('touch');
var fs          = require('fs');
var bitbucket = require('bitbucketjs');

var files = require('./lib/files');
var vendors = require('./lib/vendors');
var prefs = new Preferences('turbo-init');

clear();
console.log(
  chalk.yellow(
    figlet.textSync('Turbo-Init', { horizontalLayout: 'full', font: 'Slant' })
    )
);

if (files.directoryExists('.git')) {
  console.log(chalk.red('Already a git repository!'));
  process.exit();
}
var status = new Spinner('Authenticating you, please wait...');

if (prefs.credentials) {
    status.start();
    vendors.connect(status, prefs.credentials).then(function(bb){
        console.log(bb);
    },function(error){
          console.log('error', error); 
     });
}else{
    vendors.getCredentials(status).then(function(params){
        vendors.connect(status, params).then(function(bb){
            var createStatus = new Spinner('Creating Repo.....');
            vendors.createRepoOnline(params.username, bb, createStatus).then(function(repo){
                var fileList = _.without(fs.readdirSync('.'), '.git', '.gitignore');
                files.createGitignore(fileList).then(function(){
                    git
                    .init()
                    .add('.gitignore')
                    .add('./*')
                    .commit('Initial commit')
                    .addRemote('origin', repo.links.clone[1].href)
                    .push('origin', 'master')
                    .exec(function(){
                      status.stop();
                        console.log(chalk.green('Your repository is created successfully. You can begin with MAGIC.....'));
                    });
                },function(error){
                      console.log('error', error); 
                 });
            }, function(error){
                  console.log('error', error); 
             });
        }, function(error){
              console.log('error', error); 
         });
    }, function(error){
          console.log('error', error); 
     });
}

