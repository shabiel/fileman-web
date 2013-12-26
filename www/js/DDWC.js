DHCP = {};  //VISTA home
DHCP.DI = {} ; //Fileman home

// Call /fileman/dd/ webservice to get DD's in JSON
// @file -> file number
// @field -> field number; field range (:); fields (;)
//        -> E.g. 0.01; 0.01:9999; 0.01;0.02
DHCP.DI.dd = function (file, field) {
    // Remove all children first! So sad!
    $('form[name="form"]').empty();
    var request = new XMLHttpRequest();
    request.open("GET","/fileman/dd/" + file + "," + field);
    request.onload = function (file,field) {
        return function() {
            
            var fields = JSON.parse(this.responseText);

            for (var i in fields) 
            {
                var fielddata = fields[i];

                if (fielddata instanceof Array) continue; //Multiple!!!

                var file = i.split(",")[0];
                var field = i.split(",")[1];

                DHCP.DI.createField(fielddata,file,field);
            }
            DHCP.DI.createSubmit();
        }
    }(file,field);
    request.send(null);
}

// Create an individual field
// @json -> dd definition from Fileman WS
// @file -> file number
// @field -> fieldnumber
DHCP.DI.createField = function (json,file,field) {
    var name = "F" + file + "D" + field;
    name.replace(".","_","g"); // replace dots for _
    
    // Get attributes in a JS computable format!
    var attrs = DHCP.DI.fieldCharacteristics(json);

    var label = document.createElement("label");
    label.setAttribute("for",name);
    label.appendChild(document.createTextNode(attrs.label));

    /*
    function createDiv(show)
    {
        var div = document.getElementById("info");
        div.innerHTML = attrs.description;
        document.form.appendChild(div);
    }

    label.addEventListener("mouseenter",createDiv(true),false);
    label.addEventListener("mouseleave",createDiv(false),false);
    */

    var input = document.createElement("input");

    input.setAttribute("name",name);
    input.setAttribute("id",name);
    input.setAttribute("placeholder",attrs.help_prompt);

    input.dataset.file = file;
    input.dataset.field = field;
    input.dataset.ien = "+1,";
    
    // TODO: Fix:hardcoded field type
    input.setAttribute("type","text"); //hardcoded
    input.setAttribute("title",attrs.description);
    input.setAttribute("maxlength",attrs.field_length);

    input.addEventListener("change", DHCP.DI.validateField, false);

    var br = document.createElement("br");

    var small = document.createElement("small");
    
    small.classList.add("error");
    small.style.display = "none";
    //input.classList.add("error");
    //label.classList.add("error");

    document.form.appendChild(label);
    document.form.appendChild(input);
    document.form.appendChild(small);
    document.form.appendChild(br);
};

DHCP.DI.applyErrors = function(errorsArray) {
    //{"errors":[{"0.85,0.01":"701^The value '^^^' for field NAME in file LANGUAGE is not valid."},{"0.85,0.01":"744^Field NAME is part of Key 'A', but the field has not been assigned a value."}]} 
    // error property of input nulled out in the validator
    for (var i in errorsArray)
    {
        // Extract Error
        var error = errorsArray[i]; //position in array
        var ff;                     //file field index
        for (ff in error) break; // get the JSON "subject" (i.e. the file,field index here)
        var file = ff.split(',')[0]; // 
        var field = ff.split(',')[1]; //
        var errMsg = error[ff];       // Get the actual error message
        
        // Get actual field in the document
        var selector = 'input[data-file="' + file + '"]' + '[data-field="' + field + '"]';
        var input = document.querySelectorAll(selector)[0]; // the first one
        input.dataset.error = (input.dataset.error || '') + errMsg + ';'  // append errors semi-colon delimited
    }
    
    // Grab all fields with errors in them.
    var errorneousInputs = document.querySelectorAll('input[data-error]');

    // Label them (don't use for each b/c of sub props on obj)
    for (var i=0; i < errorneousInputs.length; i++)
    {
        var input = errorneousInputs[i]; // short hand
        var errorString = input.dataset.error;
        if (!errorString) continue;
        input.setCustomValidity(errorString);
        input.checkValidity(); // is this needed?

        var small = input.nextSibling // error string
        small.appendChild(document.createTextNode(errorString));
        small.style.display = "block";
        input.classList.add("error");
    }
}

DHCP.DI.createSubmit = function()
{
    var input = document.createElement("input");
    input.setAttribute("type","submit");
    input.setAttribute("value","Submit");
    input.setAttribute("name","submit");
    input.classList.add("button");

    document.form.appendChild(input);
};

DHCP.DI.fieldCharacteristics = function (fmattrs)
{
    var x = {};
    x.audit = fmattrs['AUDIT'];
    x.audit_condition = fmattrs['AUDIT CONDITION'];
    x.compute_algorithm = fmattrs['COMPUTE ALGORITHM'];
    x.compute_fields_used = fmattrs['COMPUTED FIELDS USED'];
    x.last_edited = fmattrs['DATE FIELD LAST EDITED'];
    x.decimal_default = fmattrs['DECIMAL DEFAULT'];
    x.delete_access = fmattrs['DELETE ACCESS'];
    x.description = 
        typeof fmattrs['DESCRIPTION'] === 'object' ? fmattrs['DESCRIPTION'].join(' ')
            : fmattrs['DESCRIPTION'];
    x.field_length = fmattrs['FIELD LENGTH'];
    x.global_subscript_location = fmattrs['GLOBAL SUBSCRIPT LOCATION'];
    x.help_prompt = fmattrs['HELP-PROMPT'];
    x.input_transform = fmattrs['INPUT TRANSFORM'];
    x.label= fmattrs['LABEL'];
    x.multiple_value = fmattrs['MULTIPLE-VALUED'];
    x.output_transform = fmattrs['OUTPUT TRANSFORM'];
    x.pointer = fmattrs['POINTER'];
    x.read_access = fmattrs['READ ACCESS'];
    x.source = fmattrs['SOURCE'];
    x.specifier = fmattrs['SPECIFIER'];
    x.technical_description = 
        typeof fmattrs['TECHNICAL DESCRIPTION'] === 'object' ? fmattrs['TECHNICAL DESCRIPTION'].join(' ')
                : fmattrs['TECHNICAL DESCRIPTION'];
    x.title = fmattrs['TITLE'];
    x.type = fmattrs['TYPE'];
    x.write_access = fmattrs['WRITE ACCESS'];
    x.xecutable_help = fmattrs['XECUTABLE HELP'];
    return x;
};

DHCP.DI.validateField = function () {
    // Clear error indicators
    var small = this.nextSibling; // error string
    if (small.firstChild) small.removeChild(small.firstChild); //remove text
    small.style.display = "none";
    this.classList.remove("error");
    this.dataset.error = '';

    // Get the stuff for the validator
    var value = this.value;
    var file  = this.dataset.file;
    var field = this.dataset.field;
    var ien   = this.dataset.ien;

    // Construct JSON
    var JSONval = {};
    JSONval[file] = [];        

    var oneField = {};
    oneField.dd = field;
    oneField.ien = ien;
    oneField.value = value;

    JSONval[file].push(oneField);

    var request = new XMLHttpRequest();
    request.open("POST","/fileman/vals");
    request.onload = function (input) {
        return function () {
            console.log(this.responseText);
            var valedJSON = JSON.parse(this.responseText);
            if (valedJSON.errors) { // error array present!!
                //console.log (valedJSON.errors);
                DHCP.DI.applyErrors(valedJSON.errors);
            }
            else {
               input.setCustomValidity(''); 
            }
        }
    }(this);

    request.send(JSON.stringify(JSONval));
}

DHCP.DI.validate = function() {
    
    var JSONval = {};
    
    try {

        var inputs = document.querySelectorAll("form > input");

        //Collect the fields...
        for (var i = 0; i < inputs.length; i ++)
        {
            var input = inputs[i];
            if (input.name === 'submit') continue;
            var file = input.dataset.file;
            var field = input.dataset.field;
            var value = input.value;

            if (!JSONval[file]) JSONval[file] = [];

            var oneField = {};
            oneField.dd = field;
            oneField.ien = "+1,";
            oneField.value = value;

            JSONval[file].push(oneField);

            console.log(file,field);
            console.log(JSONval);
        }

        var request = new XMLHttpRequest();
        request.open("POST","/fileman/vals");
        request.onload = function () {
            console.log(this.responseText);
        };
        request.send(JSON.stringify(JSONval));
    }

    catch (e) {
        throw e;
    }

    finally {
        return false;
    }
    
};

// Transform the lister's response to something usable
// by Typeahead
// This will change in the future as I settle on a format.
DHCP.DI.listerTypeaheadTransfromer = function (parsedResponse) {
    var rtnJSON = [];
    for (var i in parsedResponse) 
    {
        if (!parsedResponse.hasOwnProperty(i)) continue;
        var item = {};
        item.tokens = [];
        item.ids = [];
        item.headers = [];
        for (var j in parsedResponse[i])
        {
            if (!parsedResponse[i].hasOwnProperty(j)) continue;
            if (j.indexOf('IEN') > -1) item.ien = parsedResponse[i][j];
            if (j.indexOf('INDEX VALUE 1') > -1) {
                item.tokens.push(parsedResponse[i][j].toString())
                item.value = parsedResponse[i][j]
                };
            if (j.charAt(0) == '#') {
                item.ids.push(parsedResponse[i][j]); // identifiers
                item.headers.push(j);
                };
        }

        rtnJSON.push(item);
    }
    console.log(rtnJSON);
    return rtnJSON;
}
    
// Initialize the form
DHCP.DI.initialize = function () {
    
    function cb2(e, datum)
    {
        var file = DHCP.DI.file;
        var ien = datum.ien;
    }
    
    // Call back function when we make a selection
    function cb(e, datum)
    {
        var file = datum.ien;
        var fn = datum.value;
        DHCP.DI.file = file;
        DHCP.DI.fileName = fn;
        DHCP.DI.typeaheadPopulate(file, '#entries')
    }

    DHCP.DI.typeaheadPopulate(1, '#FOF', cb);
}

DHCP.DI.typeaheadPopulate = function (file, jQuerySelector, cb) {
    $(jQuerySelector).typeahead({
        name: file,
        prefetch: {
            url: '/fileman/' + file + '/B/',
            filter: DHCP.DI.listerTypeaheadTransfromer,
            ttl: 0  //bad idea, but prevents caching for now
            },

        template: [ '<p style="display: inline"><strong>{{value}}</strong></p>',
                    '<table style="display: inline-table">',
                    '<tr>',
                    '{{#headers}}<th>{{.}}</th>{{/headers}}',
                    '</tr>',
                    '<tr>',
                    '{{#ids}}<td>{{.}}</td>{{/ids}}',
                    '</tr>',
                    '</table>',
                  ].join(''),
        engine: Hogan,
        limit: 10
    }).on('typeahead:selected', function (obj, datum) {
        if (cb) cb(obj,datum);
        else console.log(obj,datum);
    });
}

document.addEventListener("DOMContentLoaded",DHCP.DI.initialize(), false);
