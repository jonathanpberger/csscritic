window.csscritic = (function (module, rasterizeHTMLInline, JsSHA) {

    module.signOffReporterUtil = {};

    module.signOffReporterUtil.loadFullDocument = function (pageUrl, callback) {
        var doc = window.document.implementation.createHTMLDocument("");

        // TODO remove reference to rasterizeHTMLInline.util
        rasterizeHTMLInline.util.ajax(pageUrl, {cache: false}, function (content) {
            doc.documentElement.innerHTML = content;

            rasterizeHTMLInline.inlineReferences(doc, {baseUrl: pageUrl, cache: false}, function () {
                callback('<html>' +
                    doc.documentElement.innerHTML +
                    '</html>');
            });
        });
    };

    module.signOffReporterUtil.loadFingerprintJson = function (url, callback) {
        rasterizeHTMLInline.util.ajax(url, {cache: false}, function (content) {
            callback(JSON.parse(content));
        });
    };

    module.signOffReporterUtil.calculateFingerprint = function (content) {
        var shaObj = new JsSHA(content, "TEXT");

        return shaObj.getHash("SHA-224", "HEX");
    };

    var findPage = function (pageUrl, signedOffPages) {
        var signedOffPage = null;

        signedOffPages.forEach(function (entry) {
            if (entry.pageUrl === pageUrl) {
                signedOffPage = entry;
            }
        });

        return signedOffPage;
    };

    var acceptSignedOffPage = function (result, signedOffPages) {
        var signedOffPageEntry, actualFingerprint;

        if (result.status === "failed") {
            signedOffPageEntry = findPage(result.pageUrl, signedOffPages);

            if (signedOffPageEntry) {
                module.signOffReporterUtil.loadFullDocument(result.pageUrl, function (content) {
                    actualFingerprint = module.signOffReporterUtil.calculateFingerprint(content);

                    if (actualFingerprint === signedOffPageEntry.fingerprint) {
                        result.acceptPage();
                    }
                    console.log(result.pageUrl + ": " + actualFingerprint);
                });
                
            }
        }
    };

    module.SignOffReporter = function (signedOffPages) {
        return {
            reportComparison: function (result) {
                if (! Array.isArray(signedOffPages)) {
                    module.signOffReporterUtil.loadFingerprintJson(signedOffPages, function (json) {
                        acceptSignedOffPage(result, json);
                    });
                } else {
                    acceptSignedOffPage(result, signedOffPages);
                }
            }
        };
    };

    return module;
}(window.csscritic || {}, rasterizeHTMLInline, jsSHA));
