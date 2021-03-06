module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
	  //pass in options to plugins,references to files etc.  responsive_images: {
      dev: {
        options: {
          engine: 'gm',
          sizes: [{
            width: 400,
            suffix: '_small',
            quality: 30
          },{
            width: 650,
            suffix: '_medium',
            quality: 30
          },{
            width: 800,
            suffix: '_large',
            quality: 30
          }]
        },
        files: [{
          expand: true,
          src: ['*.{jpg,png}'],
          cwd: 'img/',
          dest: 'images/'
        }]
      }
    },
     /* Clear out the images directory if it exists */
    clean: {
      dev: {
        src: ['images'],
      },
	  
	  /* Copy the "fixed" images that don't go through processing into the images/directory */
    copy: {
      dev: {
        files: [{
          expand: true,
          src: ['images_src/fixed/*.{jpg,png}'],
          dest: 'images/',
          flatten: true,
        }]
      },
    },
    },
	
	/* Generate the images directory if it is missing */
    mkdir: {
      dev: {
        options: {
          create: ['images']
        },
      },
    },
	
	  
	   });
//Load plugins
	   
grunt.loadNpmTasks('grunt-responsive-images');
grunt.loadNpmTasks('grunt-contrib-clean');
grunt.loadNpmTasks('grunt-contrib-copy');
grunt.loadNpmTasks('grunt-mkdir');
grunt.loadNpmTasks('grunt-mkdir');
	   //Register Tasks
grunt.registerTask('default',['clean','mkdir', 'copy', 'responsive_images']);
		 
	  
	   };