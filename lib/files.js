var fs = require('fs');
var path = require('path');
var inquirer    = require('inquirer');
var $q          = require('q');
var CLI         = require('clui');
var Spinner     = CLI.Spinner;
var touch       = require('touch');

module.exports = {
  getCurrentDirectoryBase : function() {
    return path.basename(process.cwd());
  },
  createGitignore: function(fileList){
    var deferred = $q.defer();
    if (fileList.length){
    inquirer.prompt(
      [
        {
          type: 'checkbox',
          name: 'ignore',
          message: 'Select the files and/or folders you wish to ignore:',
          choices: fileList,
          default: ['node_modules', 'bower_components']
        }
      ]
    ).then(function( answers ) {
        if (answers.ignore.length) {
          fs.writeFileSync( '.gitignore', answers.ignore.join( '\n' ) );
          deferred.resolve(answers.ignore);
        } else {
          touch( '.gitignore' );
          deferred.resolve({});
        }
      }, function(error){
          console.log('error', error); 
       }); 
    }else{
      touch( '.gitignore' );
      deferred.resolve({});
    }
       return deferred.promise;
  },
  directoryExists : function(filePath) {
    try {
      return fs.statSync(filePath).isDirectory();
    } catch (err) {
      return false;
    }
  }
};