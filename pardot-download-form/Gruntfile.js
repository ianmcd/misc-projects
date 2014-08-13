'use strict';

module.exports = function(grunt) {
	//	loads grunt tasks automatically
	require('load-grunt-tasks')(grunt);

	//	times tasks for better optimization
	require('time-grunt')(grunt);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		//	js concatenation
		concat: {
			dev: {
				src: ['http/dev/js/lib/jquery.2.0.3.min.js', 'http/dev/js/lib/**/*.js', 'http/dev/js/**/*.js', '!http/dev/js/production.js', '!http/dev/js/production.min.js' ],
				dest: 'http/dev/js/production.js',
			},
		},

		//	grunt server
		connect: {
			server: {
				options: {
					port: 4444,
					base: 'http/dev',
					hostname: 'localhost',
					open: true,
					livereload: 35729
				},
			},
		},

		//	html minification
		htmlmin: {
			dist: {
				options: {
					collapseWhitespace: true,
					collapseBooleanAttributes: true,
					removeComments: true,
				},
				files: [{
					expand: true,
					cwd: 'http/dev/',
					src: '**/*.html',
					dest: 'http/dist',
				}],
			},
		},

		//	image minification
		imagemin: {
			dynamic: {
				files: [{
					expand: true,
					cwd: 'http/dev/',
					src: ['**/*.{png,jpg,gif,svg}'],
					dest: 'http/dist',
				}],
			},
		},

		//	basic error checking for js files
		jshint: {
			options: {
				jshintrc: '.jshintrc',
				reporter: require('jshint-stylish')
			},
			beforeconcat: ['Gruntfile.js', 'http/dev/js/**/*.js', '!http/dev/js/lib/**/*.js', '!http/dev/js/production.js', '!http/dev/js/production.min.js'],
		},

		//	sass
		sass: {
			options: {
				style: 'compressed',
				compass: 'true',
				require: 'susy'
		    },
			dev: {
		        files: {
			        'http/dev/css/system.css': 'http/dev/sass/system.scss',
		        },
	        },
	        dist: {
		        files: {
			        'http/dist/css/system.css': 'http/dev/sass/system.scss',
		        },
	        },
		},

		//	js minification
		uglify: {
			options: {
				mangle: false,
			},
	        dev: {
		        src: 'http/dev/js/production.js',
		        dest: 'http/dev/js/production.min.js',
	        },
	        dist: {
		        src: 'http/dev/js/production.js',
		        dest: 'http/dist/js/production.min.js',
	        },
		},

		//	watches files / runs tasks as needed
		watch: {
			js: {
				files: ['http/dev/js/*.js'],
		        tasks: ['jshint:beforeconcat', 'concat', 'uglify'],
			},
	        css: {
		        files: ['http/dev/sass/**/*.scss'],
		        tasks: ['sass:dev'],
	        },
	        livereload: {
		        options: {
		        	livereload: true,
		        },
		        files: [
		        	'http/dev/**/*.html',
		        	'http/dev/**/*.css',
							'http/dev/**/*.js',
		        ],
	        }
		},

		copy: {
			dist: {
				files: [{
					expand: true,
					cwd: 'http/dev/',
					src: '*.{txt,ico}',
					dest: 'http/dist/',
				}],
			},
		},
	});

	//	TASKS

	grunt.registerTask('serve', [
		'concat',
		'uglify:dev',
		'sass:dev',
		'connect',
		'watch',
	]);

	grunt.registerTask('build', [
		'concat',
		'uglify:dist',
		'sass:dist',
		'htmlmin',
		'imagemin',
		'copy',
	]);

	grunt.registerTask('default', [
		'build',
		'serve',
	]);
};
