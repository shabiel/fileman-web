var https = require('https');

// Auto constructor for https options
// TODO: Parameterize the hostname and port
function ops (url, method) {
    var options = {
      hostname: 'localhost',
      port: 443,
      path: url,
      method: method,
      rejectUnauthorized: false
    };

    options.agent = new https.Agent(options);
    
    return options;
}

// TODO: handle failure of https request. Now just silent failure.
describe("Data dictionary retrieved", function () {

    it("Single field is retrieved", function () {
        var options = ops('/fileman/dd/.85,.01','GET');

        var callback = jasmine.createSpy();

        var req = https.request(options, function(res) {
          expect(res.statusCode).toBe(200);
          res.setEncoding('utf8');
          res.on('data', function (chunk) {
            var json = JSON.parse(chunk);
            //console.log(JSON.stringify(json, null, ' '));
            expect(json['0.85,0.01']).not.toBeNull();
            expect(json['0.85,0.01'].TITLE).toBe('Language-Name');
            callback();
          });
        });
        
        req.on('error', function(e) {
          console.log('problem with request: ' + e.message);
          expect(false).toBeTruthy(e.message);
          callback();
        });
       
        req.end();

        waitsFor(function() {
            return callback.callCount > 0;
        });
    });
    
    it("Multiple fields (same file) (semi-colon delimited) are retrieved", function () {
        var options = ops('/fileman/dd/.85,.01;.85,.02;.85,.03','GET');

        var callback = jasmine.createSpy();

        var req = https.request(options, function(res) {
          expect(res.statusCode).toBe(200);
          res.setEncoding('utf8');
          res.on('data', function (chunk) {
            var json = JSON.parse(chunk);
            //console.log(JSON.stringify(json, null, ' '));
            expect(json['0.85,0.01']).toBeDefined();
            expect(json['0.85,0.01'].TITLE).toBe('Language-Name');
            expect(json['0.85,0.02']).toBeDefined();
            expect(json['0.85,0.02'].LABEL).toBe('TWO LETTER CODE');
            expect(json['0.85,0.03']).toBeDefined();
            expect(json['0.85,0.03'].LABEL).toBe('THREE LETTER CODE');
            callback();
          });
        });

        req.on('error', function(e) {
          console.log('problem with request: ' + e.message);
          expect(false).toBeTruthy(e.message);
          callback();
        });
       
        req.end();

        waitsFor(function() {
            return callback.callCount > 0;
        });
    });
    
    it("Multiple fields (same file) (range) are retrieved", function () {
        var options = ops('/fileman/dd/.85,.01:.03','GET');

        var callback = jasmine.createSpy();

        var req = https.request(options, function(res) {
          expect(res.statusCode).toBe(200);
          res.setEncoding('utf8');
          res.on('data', function (chunk) {
            var json = JSON.parse(chunk);
            //console.log(JSON.stringify(json, null, ' '));
            expect(json['0.85,0.01']).toBeDefined();
            expect(json['0.85,0.01'].TITLE).toBe('Language-Name');
            expect(json['0.85,0.02']).toBeDefined();
            expect(json['0.85,0.02'].LABEL).toBe('TWO LETTER CODE');
            expect(json['0.85,0.03']).toBeDefined();
            expect(json['0.85,0.03'].LABEL).toBe('THREE LETTER CODE');
            callback();
          });
        });

        req.on('error', function(e) {
          console.log('problem with request: ' + e.message);
          expect(false).toBeTruthy(e.message);
          callback();
        });
       
        req.end();

        waitsFor(function() {
            return callback.callCount > 0;
        });
    });
    
    it("Multiple files and fields are retrieved", function () {
        var options = ops('/fileman/dd/0.7,1;0.85,0.02','GET');

        var callback = jasmine.createSpy();

        var req = https.request(options, function(res) {
          expect(res.statusCode).toBe(200);
          res.setEncoding('utf8');
          res.on('data', function (chunk) {
            var json = JSON.parse(chunk);
            //console.log(JSON.stringify(json, null, ' '));
            expect(json['0.7,1']).toBeDefined();
            expect(json['0.7,1'].LABEL).toBe('BREAK LOGIC');
            expect(json['0.85,0.02']).toBeDefined();
            expect(json['0.85,0.02'].LABEL).toBe('TWO LETTER CODE');
            callback();
          });
        });

        req.on('error', function(e) {
          console.log('problem with request: ' + e.message);
          expect(false).toBeTruthy(e.message);
          callback();
        });
       
        req.end();

        waitsFor(function() {
            return callback.callCount > 0;
        });
    });

    it("Multiple files and fields are retrieved, one includes range", function () {
        var options = ops('/fileman/dd/0.7,1;0.85,0.02:0.03','GET');

        var callback = jasmine.createSpy();

        var req = https.request(options, function(res) {
          expect(res.statusCode).toBe(200);
          res.setEncoding('utf8');
          res.on('data', function (chunk) {
            var json = JSON.parse(chunk);
            //console.log(JSON.stringify(json, null, ' '));
            expect(json['0.7,1']).toBeDefined();
            expect(json['0.7,1'].LABEL).toBe('BREAK LOGIC');
            expect(json['0.85,0.02']).toBeDefined();
            expect(json['0.85,0.02'].LABEL).toBe('TWO LETTER CODE');
            expect(json['0.85,0.03']).toBeDefined();
            expect(json['0.85,0.03'].LABEL).toBe('THREE LETTER CODE');
            callback();
          });
        });

        req.on('error', function(e) {
          console.log('problem with request: ' + e.message);
          expect(false).toBeTruthy(e.message);
          callback();
        });
       
        req.end();

        waitsFor(function() {
            return callback.callCount > 0;
        });
    });

});

/*
    function(res) {
          expect(res.statusCode).toBe(200);
          res.setEncoding('utf8');
          res.on('data', function (chunk) {
            var json = JSON.parse(chunk);
            console.log(JSON.stringify(json, null, ' '));
            expect(json['0.85,0.01']).not.toBeNull();
          });
        })
*/
