/* Fileman web services Mocha command line tests */
/* VEN/SMH - Sam Habiel at VISTA Experise Network */

/* Example invocation: 
mocha --server=http://localhost:9999 --ac=1programmer --vc=programmer1 test-mocha.js
mocha --server=http://thebes.smh101.com --ac=1programmer --vc=asdfasdf test-mocha.js
*/

// Test stuff
var request = require('supertest');
var assert = require("assert");

// Modules
var server = 'http://localhost:9999'; // default
var ac = '1programmer';  //Access code
var vc = 'programmer1';  //Verify code

// Parse --server, --ac, --vc
process.argv.forEach(function (val, index, array) {
  if (index < 2) return;
  if (val.indexOf("server=")>0) server=val.split("--server=")[1];
  if (val.indexOf("ac=")>0) ac=val.split("--ac=")[1];
  if (val.indexOf("vc=")>0) vc=val.split("--vc=")[1];
});


//request = request('http://localhost:9999');
request = request(server);

describe('Data dictionary retrieved', function(){

    it("Single field is retrieved", function (done) {
		  request.get("/fileman/dd/.85,.01")
		  .auth(ac,vc)
		  .expect(200)
		  .end(function(err, res){
		  		if (err) throw err;
		  		assert.equal(res.body['0.85,0.01'].TITLE,'Language-Name');
				done();
		   });
	 });

    it("Multiple fields (same file) (semi-colon delimited) are retrieved", function (done) {
        request.get('/fileman/dd/.85,.01;.85,.02;.85,.03')
		.auth(ac,vc)
		.expect(200)
		.end(function(err, res){
			if (err) throw err;
			assert.equal(res.body['0.85,0.01'].TITLE,'Language-Name');
			assert.equal(res.body['0.85,0.02'].LABEL,'TWO LETTER CODE');
			assert.equal(res.body['0.85,0.03'].LABEL,'THREE LETTER CODE');
		  	done();
		});
	 });

    it("Multiple fields (same file) (range) are retrieved", function (done) {
        request.get('/fileman/dd/.85,.01:.03')
		.auth(ac,vc)
		.expect(200)
		.end(function(err, res){
			if (err) throw err;
			assert.equal(res.body['0.85,0.01'].TITLE,'Language-Name');
			assert.equal(res.body['0.85,0.02'].LABEL,'TWO LETTER CODE');
			assert.equal(res.body['0.85,0.03'].LABEL,'THREE LETTER CODE');
		  	done();
		});
	});

    it("Multiple files and fields are retrieved", function (done) {
        request.get('/fileman/dd/0.7,1;0.85,0.02')
		.auth(ac,vc)
		.expect(200)
		.end(function(err, res){
			if (err) throw err;
			assert.equal(res.body['0.7,1'].LABEL,'BREAK LOGIC');
			assert.equal(res.body['0.85,0.02'].LABEL,'TWO LETTER CODE');
		  	done();
		});
	});
	
    it("Multiple files and fields are retrieved, one includes range", function (done) {
        request.get('/fileman/dd/0.7,1;0.85,0.02:0.03')
		.auth(ac,vc)
		.expect(200)
		.end(function(err, res){
			if (err) throw err;
			assert.equal(res.body['0.7,1'].LABEL,'BREAK LOGIC');
			assert.equal(res.body['0.85,0.02'].LABEL,'TWO LETTER CODE');
			assert.equal(res.body['0.85,0.03'].LABEL,'THREE LETTER CODE');
			done();
		});
	});

});
