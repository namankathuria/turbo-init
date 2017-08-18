var inquirer    = require('inquirer');
var bitbucket   = require('bitbucketjs');
var Preferences = require('preferences');
var chalk       = require('chalk');
var $q          = require('q');
var slug        = require('slug');
var prefs       = new Preferences('easy-init');
var files       = require('./files');
var self        = {};
var prefs = new Preferences('turbo-init');


// ask for the repo credentials
self.getCredentials  = function(status) {
    var deferred = $q.defer();
    var questions = [{
        name: 'username',
        type: 'input',
        message: 'Enter your Bitbucket username or email:',
        validate: function(value){
            if (value.length) {
                return true;
            }else{
                return 'Please enter your username or email';
            }
        }
    },
    {
        name: 'password',
        type: 'password',
        message: 'Enter your password:',
        validate: function(value) {
            if (value.length) {
                return true;
            }else{
                return 'please enter your password';
            }
        }
    }];
    inquirer.prompt(questions).then(function (params) {
        prefs.credentials = params;
        status.start();
        deferred.resolve(params);
    }, function(error){
          console.log('error', error); 
     });
    return deferred.promise;
};

// connect to the bitbucket
self.connect = function(status, params){
    var deferred = $q.defer();
    var bitbbucketClient  = new BBClient({username: params.username, password:params.password});
    bitbbucketClient.bb.user.fetch(params.username).then(function(user){
        status.stop();
        console.log(chalk.green('You are Logged In. Kindly create the repo.'));
        deferred.resolve(bitbbucketClient.bb);
    }, function(error){
        if (error.status === 401 || error.status === 403){
            status.stop();
            console.log(chalk.red('Incorrect Username or Password. Kindly run "easy-init" and try again.'), chalk.bgYellow.blue('Just press the up arrow and hit enter.'));
        }
     }).catch(function (error) {
         console.log('error', error);
     });
    return deferred.promise;
};

// get the repo params
self.getRepoParams = function(createStatus){
    var argv = require('minimist')(process.argv.slice(2));
    var deferred = $q.defer();
    var questions = [{
        name: 'name',
        type: 'input',
        message: 'Enter repostory\'s name:',
        default: argv._[0] || files.getCurrentDirectoryBase(),
        validate: function(value){
            if (value.length) {
                return true;
            }else{
                return 'Enter repostory name:';
            }
        }
    },
    {
        name: 'description',
        type: 'input',
        message: 'Enter Description of the repository:',
        default: argv._[1] || 'Discribe you repo here.',
        validate: function(value) {
            if (value.length) {
                return true;
            }else{
                return 'please enter your password';
            }
        }
    },
    {
      type: 'list',
      name: 'type',
      message: 'Git or SCM:',
      choices: [ 'git', 'scm' ],
      default: 'git'
    },
    {
      type: 'list',
      name: 'forkPolicy',
      message: 'Fork Policy:',
      choices: [ 'allow_forks', 'no_piblic_forks', 'no_forks' ],
      default: 'no_forks'
    },
    {
      type: 'confirm',
      name: 'hasWiki',
      message: 'Wiil it have a WIKI Section:',
      default: false
    },
    {
      type: 'confirm',
      name: 'isPrivate',
      message: 'Wiil it be a private repository:',
      default: true
    },
    {
      type: 'confirm',
      name: 'hasIssues',
      message: 'Wiil it list issues as well:',
      default: true
    }];
    inquirer.prompt(questions).then(function (repoParams) {
        createStatus.start();
        deferred.resolve(repoParams);
    }, function(error){
          console.log('error', error); 
     });
    return deferred.promise;
}

//create a repo online 
self.createRepoOnline = function (username, bb, createStatus){
    var deferred = $q.defer();
    var options = {};
    self.getRepoParams(createStatus).then(function(repoParams){
        options.scm         = repoParams.type ;
        options.has_wiki    = repoParams.hasWiki ;
        options.fork_policy = repoParams.forkPolicy ;
        options.name        = repoParams.name ;
        options.description = repoParams.description ;
        options.has_issues  = repoParams.hasIssues ;
        options.is_private  = repoParams.isPrivate ;
        var repoSlug = slug(repoParams.name, '_').toLowerCase();
        var repoName  = username + '/' + repoSlug;
        bb.repo.create(repoName, options).then(function(repo){
            createStatus.stop();
            deferred.resolve(repo);
        },function(error){
            createStatus.stop();
              console.log('error', error);
         })
    }, function(error){
        createStatus.stop();
          console.log('error', error); 
     });
    return deferred.promise;
}

// create bitbucket prototype
function BBClient(params) {
    this.bb = bitbucket(params);
}

module.exports = self;