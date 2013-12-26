/* Fileman web services Mocha command line tests */
/* VEN/SMH - Sam Habiel at VISTA Experise Network */

/* Requires node.js module supertest
   > npm install -g supertest
*/

/* Example invocation: 
mocha --server=http://localhost:9999 --ac=1programmer --vc=programmer1 DDWC-test-mocha.js
mocha --server=http://thebes.smh101.com --ac=1programmer --vc=asdfasdf DDWC-test-mocha.js
*/

// Test stuff
var request = require('supertest');
var assert = require("assert");

// Modules
var server = 'http://localhost:9999'; // default
var ac = '1programmer';  //Access code
var vc = 'programmer1';  //Verify code

// Parse --server, --ac, --vc from command line
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
		  		assert(res.body['0.85,0.01'].TITLE.indexOf('Language')>-1);
				done();
		   });
	});

	it("Non-existent fields return 404", function (done) {
		  request.get("/fileman/dd/.85,999999")
		  .auth(ac,vc)
		  .expect(404)
		  .end(function(err, res){
		  	done();
		  });
	});

    it("Multiple fields (same file) (semi-colon delimited) are retrieved", function (done) {
        request.get('/fileman/dd/.85,.01;.85,10.1;.85,10.2')
		.auth(ac,vc)
		.expect(200)
		.end(function(err, res){
			if (err) throw err;
			assert(res.body['0.85,0.01'].TITLE.indexOf('Language')>-1);
			assert.equal(res.body['0.85,10.1'].LABEL,'ORDINAL NUMBER FORMAT');
			assert.equal(res.body['0.85,10.2'].LABEL,'DATE/TIME FORMAT');
		  	done();
		});
	 });

    it("Multiple fields (same file) (range) are retrieved", function (done) {
        request.get('/fileman/dd/.85,.01:999')
		.auth(ac,vc)
		.expect(200)
		.end(function(err, res){
			if (err) throw err;
			assert(res.body['0.85,0.01'].TITLE.indexOf('Language')>-1);
			assert.equal(res.body['0.85,10.1'].LABEL,'ORDINAL NUMBER FORMAT');
			assert.equal(res.body['0.85,10.2'].LABEL,'DATE/TIME FORMAT');
		  	done();
		});
	});

    it("Multiple files and fields are retrieved", function (done) {
        request.get('/fileman/dd/0.7,1;0.85,10.1')
		.auth(ac,vc)
		.expect(200)
		.end(function(err, res){
			if (err) throw err;
			assert.equal(res.body['0.7,1'].LABEL,'BREAK LOGIC');
			assert.equal(res.body['0.85,10.1'].LABEL,'ORDINAL NUMBER FORMAT');
		  	done();
		});
	});
	
    it("Multiple files and fields are retrieved, one includes range", function (done) {
        request.get('/fileman/dd/0.7,1;0.85,10.1:10.2')
		.auth(ac,vc)
		.expect(200)
		.end(function(err, res){
			if (err) throw err;
			assert.equal(res.body['0.7,1'].LABEL,'BREAK LOGIC');
			assert.equal(res.body['0.85,10.1'].LABEL,'ORDINAL NUMBER FORMAT');
			assert.equal(res.body['0.85,10.2'].LABEL,'DATE/TIME FORMAT');
			done();
		});
	});

});

describe('Validation functions properly', function() {
	it("Invalid single field validation works", function (done) {
		// Construct JSON
		var JSONval = {};
		JSONval[0.85] = [];        

		var oneField = {};
		oneField.dd = 10.4
		oneField.ien = '+1,';
		oneField.value = 'KKKSSS';

		JSONval[0.85].push(oneField);

		//{"errors":[{"0.85,10.4":"701^The value \'KKKSSS\' for field UPPERCASE CONVERSION in file LANGUAGE is not valid."}]}
        request
		.post('/fileman/vals')
		.auth(ac,vc)
		.set('Content-Type', 'application/json')
		.send(JSON.stringify(JSONval))
		.expect(200)
		.end(function(err, res){
			if (err) throw err;
			assert(res.body.errors[0]['0.85,10.4']);
			assert(!res.body.fda);
			done();
		});
	});
	
	it("Valid single field validation works", function (done) {
		// Construct JSON
		var JSONval = {};
		JSONval[0.85] = [];        

		var oneField = {};
		oneField.dd = 10.4
		oneField.ien = '+1,';
		oneField.value = 'K X';

		JSONval[0.85].push(oneField);
		
		// { fda: [ { 'DDFOUT(.85,"+1,",10.4)': 'K X' } ] }
        request
		.post('/fileman/vals')
		.auth(ac,vc)
		.set('Content-Type', 'application/json')
		.send(JSON.stringify(JSONval))
		.expect(200)
		.end(function(err, res){
			if (err) throw err;
			assert(res.body.fda);
			done();
		});
	});
	
	it("Invalid field in a set causes an error", function (done) {
		// Construct JSON
		var JSONval = {};
		JSONval[0.85] = [];        

		var oneField = {};
		oneField.dd = 10.4;
		oneField.ien = '+1,';
		oneField.value = 'K X';

		JSONval[0.85].push(oneField);

		var anotherField = {};
		anotherField.dd = 10.5;
		anotherField.ien = '+1,';
		anotherField.value = 'LKSFLSKDF';
		
		JSONval[0.85].push(anotherField);
		
		// { errors: [ { '0.85,10.5': '701^The value \'LKSFLSKDF\' for field LOWERCASE CONVERSION in file LANGUAGE is not valid.' } ] }
        request
		.post('/fileman/vals')
		.auth(ac,vc)
		.set('Content-Type', 'application/json')
		.send(JSON.stringify(JSONval))
		.expect(200)
		.end(function(err, res){
			if (err) throw err;
			assert(res.body.errors[0]['0.85,10.5']);
			assert(!res.body.fda);
			done();
		});
	});


	it("Valid fields in a set return multiple items in FDA", function (done) {
		// Construct JSON
		var JSONval = {};
		JSONval[0.85] = [];        

		var oneField = {};
		oneField.dd = 10.4;
		oneField.ien = '+1,';
		oneField.value = 'K X';

		JSONval[0.85].push(oneField);

		var anotherField = {};
		anotherField.dd = 10.5;
		anotherField.ien = '+1,';
		anotherField.value = 'S X=$TR(X,"A","a")';
		
		JSONval[0.85].push(anotherField);
		
		/* fda: 
		 [ { 'DDFOUT(.85,"+1,",10.4)': 'K X' },
		   { 'DDFOUT(.85,"+1,",10.5)': 'S X=$TR(X,"A","a")' } ] }
		*/

        request
		.post('/fileman/vals')
		.auth(ac,vc)
		.set('Content-Type', 'application/json')
		.send(JSON.stringify(JSONval))
		.expect(200)
		.end(function(err, res){
			if (err) throw err;
			assert.equal(res.body.fda.length, 2);
			done();
		});
	});

	it("Multiple files are supported in vals: no error case", function (done) {
		// Construct JSON
		var JSONval = {};
		JSONval[0.85] = [];        

		var oneField = {};
		oneField.dd = 10.4;
		oneField.ien = '+1,';
		oneField.value = 'K X';

		JSONval[0.85].push(oneField);

		var anotherField = {};
		anotherField.dd = 10.5;
		anotherField.ien = '+1,';
		anotherField.value = 'S X=$TR(X,"A","a")';
		
		JSONval[0.85].push(anotherField);

		JSONval[0.7] = [];
		
		var yetAnotherField = {};
		yetAnotherField.dd = 3;
		yetAnotherField.ien = '+1,';
		yetAnotherField.value = 20000;

		JSONval[0.7].push(yetAnotherField);
		
		/*   fda: 
	   [ { 'DDFOUT(.7,"+1,",3)': 20000 },
		 { 'DDFOUT(.85,"+1,",10.4)': 'K X' },
		 { 'DDFOUT(.85,"+1,",10.5)': 'S X=$TR(X,"A","a")' } ] }
		*/	

        request
		.post('/fileman/vals')
		.auth(ac,vc)
		.set('Content-Type', 'application/json')
		.send(JSON.stringify(JSONval))
		.expect(200)
		.end(function(err, res){
			if (err) throw err;
			assert.equal(res.body.fda.length, 3);
			done();
		});
	});
	
	it("Multiple files are supported in vals: error case", function (done) {
		// Construct JSON
		var JSONval = {};
		JSONval[0.85] = [];        

		var oneField = {};
		oneField.dd = 10.4;
		oneField.ien = '+1,';
		oneField.value = 'K X'; //Mumps code

		JSONval[0.85].push(oneField);

		var anotherField = {};
		anotherField.dd = 10.5;
		anotherField.ien = '+1,';
		anotherField.value = 'LSKDJFSD'; //Mumps code
		
		JSONval[0.85].push(anotherField);

		JSONval[0.7] = [];
		
		var yetAnotherField = {};
		yetAnotherField.dd = 3;
		yetAnotherField.ien = '+1,';
		yetAnotherField.value = 'ABC'; // Must be numeric

		JSONval[0.7].push(yetAnotherField);
		
        request
		.post('/fileman/vals')
		.auth(ac,vc)
		.set('Content-Type', 'application/json')
		.send(JSON.stringify(JSONval))
		.expect(200)
		.end(function(err, res){
			if (err) throw err;
			assert.equal(res.body.errors.length, 2);
			done();
		});
	});
});
