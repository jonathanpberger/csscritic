/*
 * Roll-your-own PhantomJS test runner.
 *
 * All other runners out there are loading tests inside a PhantomJS page,
 * but we need to run our tests in the privileged context.
 */
"use strict";

var port = 8000;
window.localserver = "http://localhost:" + port;

function loadJasmine() {
    phantom.injectJs("./boot-jasmine-for-phantom.js");
}

function loadCode() {
    phantom.injectJs("./test/csscritic-cli.js");
}

function loadTests() {
    phantom.injectJs("./test/helpers.js");
    phantom.injectJs("./test/testHelper.js");

    phantom.injectJs("./test/specs/shared/storagePluginSpecs.js");

    phantom.injectJs("./test/specs/cli/FileStorageSpec.js");
    phantom.injectJs("./test/specs/cli/PhantomJSRendererSpec.js");
    phantom.injectJs("./test/specs/cli/HtmlFileReporterSpec.js");
    phantom.injectJs("./test/specs/cli/TerminalReporterSpec.js");
    phantom.injectJs("./test/specs/cli/SignOffReporterUtilSpec.js");
    phantom.injectJs("./test/specs/cli/SignOffReporterSpec.js");

    phantom.injectJs("./test/specs/RegressionSpec.js");
    phantom.injectJs("./test/specs/ReportingSpec.js");
}

function startWebserver() {

    var fs = require('fs'),
        server = require('webserver').create();

    var launched = server.listen(port, function(request, response) {
        var localPath = '.' + request.url;

        if (fs.isReadable(localPath)) {
            response.statusCode = 200;
            response.write(fs.read(localPath));
        } else {
            response.statusCode = 404;
            response.write("");
        }
        response.close();
    });

    if (!launched) {
        window.console.log("Error: Unable to start internal web server on port", port);
        phantom.exit(1);
    }

}

loadJasmine();
loadCode();

loadTests();

startWebserver();

// Provided by jasmineBootForPhantom.js
executeJasmine();

